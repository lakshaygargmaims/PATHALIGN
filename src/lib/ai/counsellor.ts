import type { AppLanguage, ChatConversation, ChatMessage } from '@prisma/client';
import { prisma } from '@/lib/db';
import { ApiError } from '@/lib/api';
import { analyzeMessage, CONCERN_LABELS } from './classifiers';
import { getProvider, aiStatus } from './provider';
import { buildContextBlock, buildDemoReply, buildSystemPrompt } from './prompts';
import { retrieve, sourcesFromChunks } from './retrieval';
import type { AnalysisResult, LLMMessage, RetrievedChunk } from './types';

// ------------------------------------------------------------
// AI Parent Objection Analyzer — conversation orchestration
// user message → language detection → intent → concern classification
// → knowledge retrieval → response generation → persistence
// ------------------------------------------------------------

export interface SendResult {
  reply: string;
  analysis: AnalysisResult;
  sources: ReturnType<typeof sourcesFromChunks>;
  meta: { provider: string; model: string; mode: 'demo' | 'llm'; usedFallback: boolean };
}

export async function startConversation(params: {
  userId: string;
  familyId?: string | null;
  kind?: 'OBJECTION_ANALYZER' | 'GENERAL_COUNSELLING' | 'DIGITAL_TWIN' | 'MYTH_FOLLOWUP';
  language?: AppLanguage;
  title?: string;
}): Promise<ChatConversation> {
  return prisma.chatConversation.create({
    data: {
      userId: params.userId,
      familyId: params.familyId ?? undefined,
      kind: params.kind ?? 'OBJECTION_ANALYZER',
      language: params.language ?? 'EN',
      title: params.title ?? 'New conversation',
    },
  });
}

async function ensureOwnership(conversationId: string, userId: string, roles: string[]): Promise<ChatConversation> {
  const conv = await prisma.chatConversation.findUnique({ where: { id: conversationId } });
  if (!conv) throw new ApiError(404, 'Conversation not found');
  if (conv.userId !== userId && !roles.includes('ADMIN')) {
    throw new ApiError(403, 'You do not have access to this conversation');
  }
  return conv;
}

function toLLMMessages(messages: ChatMessage[]): LLMMessage[] {
  return [...messages].reverse().slice(-8).map((m) => ({
    role: m.role === 'USER' ? ('user' as const) : ('assistant' as const),
    content: m.content,
  }));
}

export function buildSummary(messages: ChatMessage[], concern: ChatMessage['concernCategory']): string {
  const userMsgs = messages.filter((m) => m.role === 'USER');
  const first = userMsgs[0]?.content.slice(0, 180);
  const concernText = concern ? CONCERN_LABELS[concern].en : 'general guidance';
  if (!first) return `Conversation about ${concernText}.`;
  return `Conversation about ${concernText}. Started with: "${first}${userMsgs[0] && userMsgs[0].content.length > 180 ? '…' : ''}" Total messages: ${messages.length}.`;
}

export async function sendAndReply(params: {
  conversationId: string;
  userId: string;
  userRole: string;
  userMessage: string;
  language?: AppLanguage;
}): Promise<SendResult> {
  const { conversationId, userId, userRole, userMessage } = params;
  const conv = await ensureOwnership(conversationId, userId, [userRole]);
  if (conv.status === 'ARCHIVED') throw new ApiError(410, 'This conversation is archived');

  const analysis = analyzeMessage(userMessage);
  const language: AppLanguage = params.language ?? conv.language ?? analysis.language;

  const chunks: RetrievedChunk[] = await retrieve(userMessage, { language, k: 5 });
  const history = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: 8,
  });

  await prisma.chatMessage.create({
    data: {
      conversationId,
      role: 'USER',
      content: userMessage,
      language,
      intent: analysis.intent,
      concernCategory: analysis.concern,
      sentiment: analysis.sentiment,
    },
  });

  const provider = getProvider();
  let reply: string;
  let mode: 'demo' | 'llm' = provider.isDemo ? 'demo' : 'llm';
  let usedFallback = false;

  if (provider.isDemo) {
    reply = buildDemoReply({ analysis, language, chunks, userMessage, userRole });
  } else {
    try {
      const result = await provider.chat(
        [
          {
            role: 'system',
            content: `${buildSystemPrompt(language, userRole)}\n\n${buildPromptContext(chunks, toLLMMessages(history))}`,
          },
          { role: 'user', content: userMessage },
        ],
        { temperature: 0.3 },
      );
      reply = result.text;
    } catch (err) {
      console.warn('[ai] LLM call failed, using grounded demo generator:', err);
      reply = buildDemoReply({ analysis, language, chunks, userMessage, userRole });
      mode = 'demo';
      usedFallback = true;
    }
  }

  const sources = sourcesFromChunks(chunks);
  await prisma.chatMessage.create({
    data: {
      conversationId,
      role: 'ASSISTANT',
      content: reply,
      language,
      concernCategory: analysis.concern,
      sentiment: analysis.sentiment,
      sources: sources.length
        ? sources.map((s) => ({
            id: s.id,
            title: s.title,
            url: s.url,
            publisher: s.publisher,
            isSynthetic: s.isSynthetic,
            verificationStatus: s.verificationStatus,
          }))
        : undefined,
    },
  });

  const total = await prisma.chatMessage.count({ where: { conversationId } });
  const summary = buildSummary(
    [...history.reverse(), { content: userMessage, role: 'USER' } as unknown as ChatMessage],
    analysis.concern,
  );

  const title =
    conv.title === 'New conversation'
      ? `${CONCERN_LABELS[analysis.concern][language === 'HI' ? 'hi' : 'en']} — ${new Date().toLocaleDateString('en-IN')}`
      : conv.title;

  await prisma.chatConversation.update({
    where: { id: conversationId },
    data: {
      language,
      concernCategory: analysis.concern,
      sentimentLabel: analysis.sentiment,
      title,
      summary: total >= 3 ? summary : conv.summary,
      updatedAt: new Date(),
    },
  });

  const status = aiStatus();
  return {
    reply,
    analysis,
    sources,
    meta: { provider: status.provider, model: status.model, mode, usedFallback },
  };
}

function buildPromptContext(chunks: RetrievedChunk[], history: LLMMessage[]): string {
  const context = buildContextBlock(chunks);
  const transcript = history.map((m) => `${m.role === 'user' ? 'Parent/Student' : 'AI'}: ${m.content}`).join('\n');
  return `${context}\n\nTRANSCRIPT SO FAR:\n${transcript || '(none)'}`;
}

/**
 * Load a conversation with its messages and linked cases, enforcing
 * ownership unless the caller is staff (ADMIN / COUNSELLOR).
 */
export async function loadConversation(id: string, userId: string, isStaff: boolean) {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      cases: { select: { id: true, status: true } },
    },
  });
  if (!conversation) throw new ApiError(404, 'Conversation not found');
  if (conversation.userId !== userId && !isStaff) throw new ApiError(403, 'No access to this conversation');
  return conversation;
}

export const SUGGESTED_QUESTIONS: Record<AppLanguage, string[]> = {
  EN: [
    'Will my child get a good salary after ITI?',
    'Is vocational education recognised for further studies?',
    'What jobs are available after a solar technician course?',
    'How can I convince our family that this career is safe?',
    'What is the fee and duration of an electrician course?',
    'Is there any government scheme that helps with training costs?',
  ],
  HI: [
    'आईटीआई के बाद मेरे बच्चे को अच्छी तनख्वाह मिलेगी?',
    'क्या वोकेशनल शिक्षा आगे की पढ़ाई के लिए मान्य है?',
    'सोलर टेक्नीशियन कोर्स के बाद कौन-कौन सी नौकरियाँ मिलती हैं?',
    'परिवार को कैसे समझाऊँ कि यह करियर सुरक्षित है?',
    'इलेक्ट्रीशियन कोर्स की फीस और अवधि क्या है?',
    'क्या ट्रेनिंग की लागत में सहायता के लिए कोई सरकारी योजना है?',
  ],
};

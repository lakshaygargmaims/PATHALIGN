'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Languages,
  ThumbsUp,
  ThumbsDown,
  MessageSquareText,
  ExternalLink,
  Loader2,
  LifeBuoy,
  Sparkles,
} from 'lucide-react';
import { apiFetch, apiJson, ApiClientError } from '@/lib/hooks';
import { useToast } from '@/components/toast';
import { useSpeechRecognition, useSpeechSynthesis } from '@/lib/speech';
import { cn } from '@/lib/utils';
import { VerificationBadge } from '@/components/ui/badges';

interface Source {
  id: string;
  title: string;
  url: string | null;
  publisher: string | null;
  isSynthetic: boolean;
  verificationStatus: string;
}

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
  sources?: Source[] | null;
  concernCategory?: string | null;
}

interface Conversation {
  id: string;
  title: string;
  language: 'EN' | 'HI';
  status: string;
  concernCategory?: string | null;
}

interface Analysis {
  language: string;
  intent: string;
  concern: string;
  concernConfidence: number;
  sentiment: string;
  wantsHuman: boolean;
}

interface SendResponse {
  reply: string;
  analysis: Analysis;
  sources: Source[];
  meta: { provider: string; model: string; mode: 'demo' | 'llm'; usedFallback: boolean };
}

const SUGGESTIONS: Record<string, string[]> = {
  EN: [
    'Will my child get a good salary after ITI?',
    'Is vocational education recognised for further studies?',
    'How can I convince my family that this career is safe?',
    'What is the fee and duration of an electrician course?',
  ],
  HI: [
    'आईटीआई के बाद मेरे बच्चे को अच्छी तनख्वाह मिलेगी?',
    'क्या वोकेशनल शिक्षा आगे की पढ़ाई के लिए मान्य है?',
    'परिवार को कैसे समझाऊँ कि यह करियर सुरक्षित है?',
    'इलेक्ट्रीशियन कोर्स की फीस और अवधि क्या है?',
  ],
};

const CONCERN_LABELS: Record<string, string> = {
  LOW_SALARY: 'Low salary concern',
  JOB_SECURITY: 'Job security concern',
  SOCIAL_STATUS: 'Social status concern',
  SAFETY: 'Safety concern',
  TRADITIONAL_DEGREE: 'Preference for traditional degree',
  FURTHER_EDUCATION: 'Further education concern',
  FINANCIAL_LIMITATION: 'Financial limitation',
  LACK_OF_AWARENESS: 'Lack of awareness',
  FAMILY_PRESSURE: 'Family pressure',
  OTHER: 'General concern',
};

export function ChatPanel({ autoEscalate = false }: { autoEscalate?: boolean }) {
  const { toast } = useToast();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<'EN' | 'HI'>('EN');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [meta, setMeta] = useState<SendResponse['meta'] | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>(SUGGESTIONS.EN!);
  const [escalating, setEscalating] = useState(false);
  const [history, setHistory] = useState<Array<{ id: string; title: string; updatedAt: string }>>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const readAloudRef = useRef(false);

  const [readAloud, setReadAloud] = useState(false);
  const tts = useSpeechSynthesis();

  const stt = useSpeechRecognition({
    lang: language === 'HI' ? 'hi-IN' : 'en-IN',
    onResult: (transcript) => setInput((prev) => (prev ? `${prev} ${transcript}` : transcript)),
  });

  const loadHistory = useCallback(() => {
    apiFetch<{ conversations: Array<{ id: string; title: string; updatedAt: string }> }>('/api/chat/conversations')
      .then((d) => setHistory(d.conversations.slice(0, 8)))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const ensureConversation = useCallback(async (): Promise<Conversation> => {
    if (conversation) return conversation;
    const res = await apiJson<{ conversation: Conversation }>('/api/chat/conversations', 'POST', {
      kind: 'OBJECTION_ANALYZER',
      language,
    });
    setConversation(res.conversation);
    return res.conversation;
  }, [conversation, language]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;
      setInput('');
      setSending(true);
      setTyping(true);
      const tempId = `tmp-${Date.now()}`;
      setMessages((prev) => [...prev, { id: tempId, role: 'USER', content: trimmed, createdAt: new Date().toISOString() }]);
      try {
        const conv = await ensureConversation();
        const res = await apiJson<SendResponse>(`/api/chat/conversations/${conv.id}/messages`, 'POST', {
          message: trimmed,
          language,
        });
        setAnalysis(res.analysis);
        setMeta(res.meta);
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'ASSISTANT',
            content: res.reply,
            createdAt: new Date().toISOString(),
            sources: res.sources,
          },
        ]);
        if (readAloudRef.current && tts.supported) tts.speak(res.reply, language === 'HI' ? 'hi-IN' : 'en-IN');
        loadHistory();
      } catch (err) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setInput(trimmed);
        toast(err instanceof ApiClientError ? err.message : 'Could not send the message. Please try again.', 'error');
      } finally {
        setSending(false);
        setTyping(false);
      }
    },
    [ensureConversation, language, sending, toast, tts, loadHistory],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const loadConversation = async (id: string) => {
    try {
      const res = await apiFetch<{ conversation: Conversation & { messages: Message[] } }>(`/api/chat/conversations/${id}`);
      setConversation({ id: res.conversation.id, title: res.conversation.title, language: res.conversation.language, status: res.conversation.status, concernCategory: res.conversation.concernCategory });
      setMessages(res.conversation.messages.map((m) => ({ ...m, role: m.role as 'USER' | 'ASSISTANT' })));
      setLanguage(res.conversation.language);
      setSuggestions(SUGGESTIONS[res.conversation.language] ?? SUGGESTIONS.EN!);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not open conversation', 'error');
    }
  };

  const newConversation = () => {
    setConversation(null);
    setMessages([]);
    setAnalysis(null);
    setMeta(null);
  };

  const sendFeedback = async (rating: 1 | 5) => {
    if (!conversation) return;
    try {
      await apiJson('/api/feedback', 'POST', { conversationId: conversation.id, rating, category: 'Chat answer' });
      toast('Thanks for the feedback!', 'success');
    } catch (err) {
      toast(err instanceof ApiClientError ? err.message : 'Could not save feedback', 'error');
    }
  };

  const escalate = async () => {
    if (!conversation || escalating) return;
    setEscalating(true);
    try {
      const concern = analysis?.concern ?? 'OTHER';
      await apiJson('/api/cases', 'POST', {
        subject: `AI counselling follow-up: ${CONCERN_LABELS[concern] ?? 'Concern'}`,
        description: `Raised from conversation "${conversation.title}".\n\nLast user message: ${messages.filter((m) => m.role === 'USER').slice(-1)[0]?.content ?? 'n/a'}`,
        category: concern,
        conversationId: conversation.id,
        shareConversation: true,
        priority: 'NORMAL',
      });
      toast('Request sent — a human counsellor will be assigned shortly.', 'success');
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          role: 'ASSISTANT',
          content:
            language === 'HI'
              ? 'आपका अनुरोर भेज दिया गया है। एक मानव परामर्शदाता आपके मामले को देखेगा और आपको सूचना मिलेगी।'
              : 'Your request has been sent. A human counsellor will review your case and you will be notified.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      toast(err instanceof ApiClientError ? err.message : 'Could not raise the request', 'error');
    } finally {
      setEscalating(false);
    }
  };

  const placeholder = language === 'HI' ? 'अपना सवाल यहाँ लिखें… या माइक दबाएँ' : 'Type your question here… or press the mic';

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      {/* Sidebar: history + new chat */}
      <aside className="card hidden h-fit p-4 lg:block">
        <button type="button" onClick={newConversation} className="btn-primary w-full">
          <MessageSquareText className="h-4 w-4" /> New conversation
        </button>
        <h2 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Recent</h2>
        <ul className="mt-2 space-y-1">
          {history.length === 0 ? <li className="text-xs text-slate-400">No conversations yet</li> : null}
          {history.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => loadConversation(h.id)}
                className={cn(
                  'w-full truncate rounded-lg px-3 py-2 text-left text-sm text-slate-600 transition-colors hover:bg-slate-100',
                  conversation?.id === h.id && 'bg-royal-50 text-royal-700',
                )}
              >
                {h.title}
              </button>
            </li>
          ))}
        </ul>

        {history.length > 0 ? (
          <div className="mt-5 rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500">
            Chats are private to your account. Sharing with a counsellor always requires your consent.
          </div>
        ) : null}
      </aside>

      {/* Chat area */}
      <div className="card flex min-h-[65vh] flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-white">
              <Bot className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-navy">PATHALIGN AI Counsellor</p>
              <p className="text-[11px] text-slate-500">
                {meta
                  ? meta.mode === 'demo'
                    ? 'Demo AI mode — rule-based answers grounded in retrieved records (configure an LLM key for generative replies)'
                    : `LLM mode — ${meta.provider}/${meta.model}`
                  : 'Detects your concern, retrieves records, answers with sources'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const next = language === 'EN' ? 'HI' : 'EN';
                setLanguage(next as 'EN' | 'HI');
                setSuggestions(SUGGESTIONS[next] ?? SUGGESTIONS.EN!);
              }}
              className="btn-secondary px-3 py-1.5 text-xs"
              aria-label="Switch language"
            >
              <Languages className="h-3.5 w-3.5" />
              {language === 'EN' ? 'English' : 'हिंदी'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (readAloud) tts.stop();
                setReadAloud((v) => !v);
                readAloudRef.current = !readAloud;
              }}
              className={cn('btn-secondary px-3 py-1.5 text-xs', readAloud && 'border-teal-300 bg-teal-50 text-teal-700')}
              aria-label="Toggle read aloud"
              title={tts.supported ? 'Read answers aloud' : 'Speech output not supported in this browser'}
            >
              {readAloud ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              Read aloud
            </button>
          </div>
        </div>

        {meta?.mode === 'demo' ? (
          <div className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-[11px] text-amber-800">
            <Sparkles className="mr-1 inline h-3 w-3" />
            Running in <strong>demo AI mode</strong>: answers are generated offline from retrieved knowledge records and
            labelled templates. Set <code>AI_PROVIDER</code> + <code>OPENAI_API_KEY</code> for LLM-generated replies.
          </div>
        ) : null}

        {/* Messages */}
        <div className="chat-scroll flex-1 space-y-4 overflow-y-auto px-4 py-5" style={{ maxHeight: '58vh' }}>
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Bot className="h-9 w-9 text-slate-300" />
              <p className="mt-3 max-w-md text-sm text-slate-500">
                Ask anything about vocational careers — in English or Hindi. I will detect your concern, look up
                available records and answer with sources. If I cannot verify something, I will say so.
              </p>
              <div className="mt-4 flex max-w-xl flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition-colors hover:border-royal-300 hover:bg-royal-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((m) => (
            <div key={m.id} className={cn('flex', m.role === 'USER' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-3 text-sm',
                  m.role === 'USER' ? 'rounded-tr-sm bg-navy text-white' : 'rounded-tl-sm bg-slate-100 text-slate-800',
                )}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>

                {m.role === 'ASSISTANT' && m.sources && m.sources.length > 0 ? (
                  <div className="mt-3 border-t border-slate-200 pt-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Sources</p>
                    <ul className="mt-1.5 space-y-1.5">
                      {m.sources.map((s) => (
                        <li key={s.id} className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                          {s.url ? (
                            <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-royal-600 hover:underline">
                              {s.title} <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span>{s.title}</span>
                          )}
                          <VerificationBadge status={s.verificationStatus} isSynthetic={s.isSynthetic} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {m.role === 'ASSISTANT' && m.sources && m.sources.length === 0 && m.id.startsWith('ai-') ? (
                  <p className="mt-2 text-[11px] text-slate-400">No source record matched this answer.</p>
                ) : null}
              </div>
            </div>
          ))}

          {typing ? (
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 text-sm text-slate-400 w-fit">
              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
              <span className="ml-1 text-xs">retrieving records…</span>
            </div>
          ) : null}

          <div ref={bottomRef} />
        </div>

        {/* Analysis strip */}
        {analysis ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-2 text-[11px] text-slate-500">
            <span className="badge bg-royal-100 text-royal-700">{CONCERN_LABELS[analysis.concern] ?? analysis.concern}</span>
            <span className="badge bg-slate-200 text-slate-600">intent: {analysis.intent.toLowerCase().replace(/_/g, ' ')}</span>
            <span className="badge bg-slate-200 text-slate-600">sentiment: {analysis.sentiment.toLowerCase()}</span>
            <span>confidence {(analysis.concernConfidence * 100).toFixed(0)}%</span>
            <span className="ml-auto flex gap-1">
              <button type="button" onClick={() => sendFeedback(5)} className="rounded p-1 hover:bg-white" aria-label="Helpful">
                <ThumbsUp className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => sendFeedback(1)} className="rounded p-1 hover:bg-white" aria-label="Not helpful">
                <ThumbsDown className="h-3.5 w-3.5" />
              </button>
            </span>
          </div>
        ) : null}

        {/* Composer */}
        <div className="border-t border-slate-100 px-4 py-3">
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={stt.listening ? stt.stop : stt.start}
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors',
                stt.listening ? 'animate-pulse bg-red-500 text-white' : 'bg-teal-500 text-white hover:bg-teal-600',
              )}
              aria-label={stt.listening ? 'Stop listening' : 'Speak your question'}
              title={stt.supported ? 'Voice input' : 'Voice input unavailable — type instead'}
            >
              {stt.listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              className="input min-h-[44px] resize-none"
              placeholder={placeholder}
              aria-label="Message"
            />

            <button type="button" onClick={() => send(input)} disabled={sending || !input.trim()} className="btn-primary h-11 px-4">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>

          {stt.error ? <p className="mt-2 text-xs text-amber-700">{stt.error}</p> : null}
          {!stt.supported ? (
            <p className="mt-2 text-xs text-slate-400">
              Voice input is not available in this browser — you can still type in English or Hindi.
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 3).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-[11px] text-slate-500 hover:border-royal-300 hover:text-royal-600"
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={escalate}
              disabled={!conversation || escalating}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-royal-600 hover:underline disabled:opacity-50"
              title={conversation ? 'Raise a human counselling request' : 'Send a message first'}
            >
              {escalating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LifeBuoy className="h-3.5 w-3.5" />}
              Talk to a human counsellor
            </button>
          </div>

          {autoEscalate ? null : null}
        </div>
      </div>
    </div>
  );
}

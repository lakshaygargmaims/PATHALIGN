import { ok, withApi, parseBody, ApiError } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { chatSendSchema } from '@/lib/validation/schemas';
import { sendAndReply } from '@/lib/ai/counsellor';
import { rateLimit, clientKey } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export const POST = withApi(async (req: Request, ctx: { params: { id: string } }) => {
  const user = await requireUser();
  if (!rateLimit(clientKey(req, 'chat'), 20, 60_000)) {
    throw new ApiError(429, 'You are sending messages too quickly. Please pause for a moment.');
  }

  const input = parseBody(chatSendSchema, await req.json());
  if (input.conversationId && input.conversationId !== ctx.params.id) {
    throw new ApiError(400, 'Conversation id mismatch');
  }

  const result = await sendAndReply({
    conversationId: ctx.params.id,
    userId: user.id,
    userRole: user.role,
    userMessage: input.message,
    language: input.language,
  });

  return ok({
    reply: result.reply,
    analysis: {
      language: result.analysis.language,
      intent: result.analysis.intent,
      concern: result.analysis.concern,
      concernConfidence: result.analysis.concernConfidence,
      sentiment: result.analysis.sentiment,
      wantsHuman: result.analysis.wantsHuman,
    },
    sources: result.sources,
    meta: result.meta,
  });
});

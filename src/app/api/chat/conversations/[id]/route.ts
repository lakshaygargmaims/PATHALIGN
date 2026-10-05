import { ok, withApi } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { SUGGESTED_QUESTIONS, loadConversation } from '@/lib/ai/counsellor';
import { aiStatus } from '@/lib/ai/provider';

export const dynamic = 'force-dynamic';

export const GET = withApi(async (_req: Request, ctx: { params: { id: string } }) => {
  const user = await requireUser();
  const isStaff = user.role === 'ADMIN' || user.role === 'COUNSELLOR';
  const conversation = await loadConversation(ctx.params.id, user.id, isStaff);
  return ok({
    conversation,
    suggested: SUGGESTED_QUESTIONS[conversation.language],
    ai: aiStatus(),
  });
});

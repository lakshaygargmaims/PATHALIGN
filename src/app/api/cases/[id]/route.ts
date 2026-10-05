import { ok, withApi, parseBody, ApiError } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { caseUpdateSchema } from '@/lib/validation/schemas';
import { getCaseForUser, updateCase } from '@/lib/services/cases';

export const dynamic = 'force-dynamic';

export const GET = withApi(async (_req: Request, ctx: { params: { id: string } }) => {
  const user = await requireUser(['STUDENT', 'PARENT', 'COUNSELLOR', 'ADMIN']);
  const record = await getCaseForUser(ctx.params.id, user);
  const canSeeConversation = record.summaryShared || user.role === 'ADMIN' || record.ownerId === user.id;
  return ok({
    case: record,
    conversation: canSeeConversation ? record.conversation : null,
  });
});

export const PATCH = withApi(async (req: Request, ctx: { params: { id: string } }) => {
  const user = await requireUser(['STUDENT', 'PARENT', 'COUNSELLOR', 'ADMIN']);
  const input = parseBody(caseUpdateSchema, await req.json());
  const updated = await updateCase(ctx.params.id, input, user);
  if (!updated) throw new ApiError(404, 'Case not found');
  return ok({ case: updated });
});

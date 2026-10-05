import { ok, withApi, parseBody, ApiError } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { caseCreateSchema } from '@/lib/validation/schemas';
import { createCase, listCases } from '@/lib/services/cases';

export const dynamic = 'force-dynamic';

export const GET = withApi(async (req: Request) => {
  const user = await requireUser(['STUDENT', 'PARENT', 'COUNSELLOR', 'ADMIN']);
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const category = url.searchParams.get('category');
  const mine = url.searchParams.get('mine') === '1';

  const cases = await listCases(
    {
      status: (status as never) ?? undefined,
      category: (category as never) ?? undefined,
      mine,
    },
    { role: user.role, userId: user.id },
  );
  return ok({ cases });
});

export const POST = withApi(async (req: Request) => {
  const user = await requireUser(['STUDENT', 'PARENT', 'ADMIN']);
  const input = parseBody(caseCreateSchema, await req.json());
  const result = await createCase(user, input);
  if (!result.assigned) {
    // still successful — queued for the next available counsellor
    return ok({ ...result, message: 'Request received. No counsellor is free right now — your case is queued as Pending.' }, { status: 201 });
  }
  return ok(result, { status: 201 });
});

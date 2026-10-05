import { ok, withApi, parseBody, ApiError } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { opportunitySearchSchema } from '@/lib/validation/schemas';
import { searchOpportunities } from '@/lib/services/opportunities';

export const dynamic = 'force-dynamic';

export const POST = withApi(async (req: Request) => {
  await requireUser();
  const input = parseBody(opportunitySearchSchema, await req.json());
  const result = await searchOpportunities(input);
  return ok(result);
});

export const GET = withApi(async () => {
  throw new ApiError(405, 'Use POST with search filters');
});

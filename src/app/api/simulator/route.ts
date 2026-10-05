import { ok, withApi, parseBody, ApiError } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { simulatorSchema, comparisonSchema } from '@/lib/validation/schemas';
import { getTradeProfile, runComparison } from '@/lib/services/simulator';

export const dynamic = 'force-dynamic';

async function handleSimulate(body: unknown) {
  const input = parseBody(simulatorSchema, body);
  const profile = await getTradeProfile(input.tradeId, {
    state: input.state,
    budget: input.budget,
    experienceLevel: input.experienceLevel,
  });
  return {
    profile,
    scenario: {
      state: input.state ?? 'All India (records in database)',
      district: input.district ?? null,
      educationLevel: input.educationLevel,
      budget: input.budget ?? null,
      experienceLevel: input.experienceLevel,
      includeSelfEmployment: input.includeSelfEmployment,
    },
    disclaimer:
      'Career Reality Simulator output is an estimate built from records in this database. It does not guarantee future earnings, placement or admission.',
  };
}

export const POST = withApi(async (req: Request) => {
  const user = await requireUser();
  const body = await req.json();
  const action = (body.action as string) ?? 'simulate';

  if (action === 'compare') {
    const input = parseBody(comparisonSchema, body);
    const comparison = await runComparison([input.tradeIds[0]!, input.tradeIds[1]!], { state: input.state });
    return ok({ comparison });
  }

  void user;
  const result = await handleSimulate(body);
  return ok(result);
});

export const GET = withApi(async () => {
  throw new ApiError(405, 'Use POST with { tradeId } to run a scenario');
});

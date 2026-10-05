import { ok, withApi, parseBody, ApiError } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { confidenceSchema } from '@/lib/validation/schemas';
import { recordConfidence, getConfidenceComparison, CONFIDENCE_DIMENSIONS } from '@/lib/services/confidence';
import { getUserFamily } from '@/lib/services/families';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const GET = withApi(async () => {
  const user = await requireUser();
  const family = await getUserFamily(user.id);
  if (!family) return ok({ comparison: null, dimensions: CONFIDENCE_DIMENSIONS });
  const comparison = await getConfidenceComparison(family.id);
  return ok({ comparison, dimensions: CONFIDENCE_DIMENSIONS });
});

export const POST = withApi(async (req: Request) => {
  const user = await requireUser(['STUDENT', 'PARENT', 'ADMIN']);
  const input = parseBody(confidenceSchema, await req.json());

  const membership = await prisma.familyMember.findFirst({
    where: { userId: user.id, familyId: input.familyId },
  });
  if (!membership && user.role !== 'ADMIN') throw new ApiError(403, 'Only family members can submit a confidence score');

  const result = await recordConfidence(input);
  const comparison = await getConfidenceComparison(input.familyId);
  return ok({ result, comparison });
});

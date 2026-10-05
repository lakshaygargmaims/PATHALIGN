import { ok, withApi, parseBody, ApiError } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { assessmentSchema } from '@/lib/validation/schemas';
import { saveAssessment, STUDENT_INTEREST_QUESTIONS, PARENT_EXPECTATION_QUESTIONS } from '@/lib/services/assessments';
import { getUserFamily } from '@/lib/services/families';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const GET = withApi(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  if (url.searchParams.get('questions') === '1') {
    return ok({
      studentInterest: STUDENT_INTEREST_QUESTIONS,
      parentExpectations: PARENT_EXPECTATION_QUESTIONS,
    });
  }
  const family = await getUserFamily(user.id);
  const assessments = await prisma.careerAssessment.findMany({
    where: family ? { OR: [{ userId: user.id }, { familyId: family.id }] } : { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  return ok({ assessments });
});

export const POST = withApi(async (req: Request) => {
  const user = await requireUser();
  const input = parseBody(assessmentSchema, await req.json());
  const family = await getUserFamily(user.id);

  if (input.kind === 'STUDENT_INTEREST' && user.role !== 'STUDENT' && user.role !== 'ADMIN') {
    throw new ApiError(403, 'Only students can complete the interest assessment');
  }
  if (input.kind === 'PARENT_EXPECTATIONS' && user.role !== 'PARENT' && user.role !== 'ADMIN') {
    throw new ApiError(403, 'Only parents can complete the expectation assessment');
  }

  const record = await saveAssessment({
    userId: user.id,
    familyId: family?.id ?? null,
    kind: input.kind,
    answers: input.answers,
  });
  return ok({ assessment: record });
});

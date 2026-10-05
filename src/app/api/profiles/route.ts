import { prisma } from '@/lib/db';
import { ok, withApi, parseBody, ApiError } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { studentProfileSchema, parentProfileSchema } from '@/lib/validation/schemas';
import { upsertStudentProfile, upsertParentProfile, getUserFamily } from '@/lib/services/families';

export const dynamic = 'force-dynamic';

export const GET = withApi(async (req: Request) => {
  const user = await requireUser();
  const type = new URL(req.url).searchParams.get('type') ?? (user.role === 'PARENT' ? 'parent' : 'student');

  if (type === 'parent') {
    const profile = await prisma.parentProfile.findUnique({ where: { userId: user.id } });
    return ok({ profile });
  }
  const profile = await prisma.studentProfile.findUnique({ where: { userId: user.id } });
  return ok({ profile });
});

export const PUT = withApi(async (req: Request) => {
  const user = await requireUser(['STUDENT', 'PARENT', 'ADMIN']);
  const body = await req.json();
  const type = (body.type as string) ?? (user.role === 'PARENT' ? 'parent' : 'student');

  if (type === 'parent') {
    const input = parseBody(parentProfileSchema, body);
    const profile = await upsertParentProfile(user.id, input);
    return ok({ profile });
  }

  const input = parseBody(studentProfileSchema, body);
  const profile = await upsertStudentProfile(user.id, input);

  // Keep career interests in sync with the profile's preferred areas
  if (input.preferredCareerAreas?.length) {
    const tradeMatches = await prisma.careerTrade.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true },
    });
    for (const [idx, area] of input.preferredCareerAreas.entries()) {
      const match = tradeMatches.find((t) => t.name.toLowerCase().includes(area.toLowerCase()));
      const existing = await prisma.careerInterest.findFirst({
        where: { userId: user.id, label: area },
      });
      if (!existing) {
        await prisma.careerInterest.create({
          data: { userId: user.id, label: area, tradeId: match?.id, rank: idx + 1, source: 'PROFILE' },
        });
      }
    }
  }

  const family = await getUserFamily(user.id);
  return ok({ profile, familyId: family?.id ?? null });
});

export const DELETE = withApi(async () => {
  const user = await requireUser();
  throw new ApiError(405, 'Account deletion must be requested from Profile → Privacy (GDPR-style deletion workflow)');
});

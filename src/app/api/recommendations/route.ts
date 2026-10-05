import { ok, withApi, parseBody, ApiError } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { twinSchema } from '@/lib/validation/schemas';
import { recommendTrades, saveRecommendations, buildDigitalTwin } from '@/lib/services/recommendations';
import { getUserFamily } from '@/lib/services/families';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const GET = withApi(async () => {
  const user = await requireUser();
  const recommendations = await prisma.careerRecommendation.findMany({
    where: { userId: user.id },
    orderBy: [{ pathway: 'asc' }, { rank: 'asc' }],
    include: { trade: { select: { id: true, name: true, slug: true, category: true } } },
    take: 30,
  });
  return ok({ recommendations });
});

export const POST = withApi(async (req: Request) => {
  const user = await requireUser();
  const body = await req.json();
  const action = (body.action as string) ?? 'generate';

  if (action === 'twin') {
    const input = parseBody(twinSchema, body);
    const twin = await buildDigitalTwin(input);
    return ok({ twin });
  }

  const profile = await prisma.studentProfile.findUnique({ where: { userId: user.id } });
  const family = await getUserFamily(user.id);

  const items = await recommendTrades({
    interests: profile?.interests ?? (body.interests as string[] | undefined) ?? [],
    skills: profile?.skills ?? [],
    areas: profile?.preferredCareerAreas ?? [],
    state: user.state,
    budget: (body.budget as number | undefined) ?? null,
    education: profile?.qualification ?? null,
    limit: 6,
  });

  if (action === 'generate' && family && profile) {
    await saveRecommendations(user.id, family.id, 'PREFERRED', items);
  }

  return ok({ recommendations: items, saved: action === 'generate' && Boolean(family && profile) });
});

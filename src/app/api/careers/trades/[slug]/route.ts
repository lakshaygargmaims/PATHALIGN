import { ok, withApi, ApiError } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const GET = withApi(async (_req: Request, ctx: { params: { slug: string } }) => {
  await requireUser();

  const trade = await prisma.careerTrade.findUnique({
    where: { slug: ctx.params.slug },
    include: {
      qualification: true,
      source: { select: { name: true, url: true, publisher: true, verificationStatus: true, isSynthetic: true } },
      salaryStats: { orderBy: { experienceLevel: 'asc' } },
      placementStats: { orderBy: { periodYear: 'desc' }, take: 5 },
      pathways: { include: { stages: { orderBy: { order: 'asc' } } }, take: 1 },
      opportunities: { take: 20 },
      courses: {
        include: {
          provider: { select: { id: true, name: true, type: true, state: true, district: true, city: true, lat: true, lng: true, verificationStatus: true, isSynthetic: true, affiliation: true } },
        },
        take: 40,
      },
      knowledgeDocs: {
        where: { docType: 'MYTH_FACT' },
        select: { id: true, title: true, chunk: true, language: true },
        take: 4,
      },
    },
  });

  if (!trade) throw new ApiError(404, 'Trade not found');

  const related = await prisma.careerTrade.findMany({
    where: { category: trade.category, id: { not: trade.id }, status: 'ACTIVE' },
    take: 4,
    select: { id: true, name: true, slug: true, durationMonths: true, nsqfLevel: true },
  });

  return ok({ trade, related });
});

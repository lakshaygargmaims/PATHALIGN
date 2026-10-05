import { prisma } from '@/lib/db';
import { ok, withApi, ApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = withApi(async (_req: Request, ctx: { params: { slug: string } }) => {
  const trade = await prisma.careerTrade.findUnique({
    where: { slug: ctx.params.slug },
    include: {
      qualification: true,
      source: { select: { name: true, url: true, publisher: true, verificationStatus: true, isSynthetic: true } },
      salaryStats: true,
      pathways: { include: { stages: { orderBy: { order: 'asc' } } }, take: 1 },
      _count: { select: { courses: true, opportunities: true } },
    },
  });
  if (!trade) throw new ApiError(404, 'Trade not found');
  return ok({ trade });
});

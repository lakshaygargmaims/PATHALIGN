import { prisma } from '@/lib/db';
import { ok, withApi } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = withApi(async (req: Request) => {
  const url = new URL(req.url);
  const search = url.searchParams.get('search')?.trim();
  const category = url.searchParams.get('category');

  const where = {
    status: 'ACTIVE',
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { category: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(category ? { category } : {}),
  };

  const trades = await prisma.careerTrade.findMany({
    where,
    orderBy: { name: 'asc' },
    take: 60,
    include: {
      salaryStats: { where: { experienceLevel: 'ENTRY' }, take: 1 },
      _count: { select: { courses: true } },
    },
  });

  const categories = await prisma.careerTrade.groupBy({ by: ['category'], _count: true, where: { status: 'ACTIVE' } });

  return ok({
    trades,
    categories: categories.map((c) => ({ name: c.category, count: c._count })),
    notice:
      'Records in this deployment include clearly-labelled synthetic demo entries. Verification status is shown on each record.',
  });
});

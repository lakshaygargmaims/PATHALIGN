import { ok, withApi } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const GET = withApi(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const search = url.searchParams.get('search')?.trim();
  const category = url.searchParams.get('category');
  const maxDuration = url.searchParams.get('maxDuration');
  const maxFee = url.searchParams.get('maxFee');
  const verification = url.searchParams.get('verification');
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const pageSize = 12;

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
    ...(maxDuration ? { durationMonths: { lte: Number(maxDuration) } } : {}),
    ...(maxFee ? { feeMax: { lte: Number(maxFee) } } : {}),
    ...(verification ? { verificationStatus: verification as never } : {}),
  };

  const [total, trades] = await Promise.all([
    prisma.careerTrade.count({ where }),
    prisma.careerTrade.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        salaryStats: { where: { experienceLevel: 'ENTRY' }, take: 1 },
        qualification: { select: { title: true, nsqfLevel: true } },
        source: { select: { name: true, verificationStatus: true, isSynthetic: true } },
        _count: { select: { courses: true, opportunities: true, pathways: true } },
      },
    }),
  ]);

  const categories = await prisma.careerTrade.groupBy({ by: ['category'], _count: true, where: { status: 'ACTIVE' } });

  return ok({
    trades,
    total,
    page,
    pageSize,
    categories: categories.map((c) => ({ name: c.category, count: c._count })),
  });
});

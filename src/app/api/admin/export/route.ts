import { ok, withApi, ApiError } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { toCsv } from '@/lib/csv';
import {
  getAdminOverview,
  getConcernBreakdown,
  getDistrictResistance,
  getSentimentDistribution,
  getPopularTrades,
  getRegistrationTrends,
} from '@/lib/services/analytics';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const GET = withApi(async (req: Request) => {
  await requireUser(['ADMIN']);
  const type = new URL(req.url).searchParams.get('type') ?? 'overview';

  switch (type) {
    case 'overview': {
      const overview = await getAdminOverview();
      const csv = toCsv(['metric', 'value'], Object.entries(overview).map(([k, v]) => ({ metric: k, value: v })));
      return csvResponse(csv, 'pathalign-overview.csv');
    }
    case 'concerns': {
      const rows = await getConcernBreakdown();
      const csv = toCsv(['category', 'label', 'labelHi', 'open', 'addressed', 'total', 'sharePercent'], rows);
      return csvResponse(csv, 'pathalign-concerns.csv');
    }
    case 'districts': {
      const rows = await getDistrictResistance();
      const csv = toCsv(['state', 'district', 'concerns', 'families', 'unresolved', 'resistanceIndex'], rows);
      return csvResponse(csv, 'pathalign-district-resistance.csv');
    }
    case 'trades': {
      const trades = await prisma.careerTrade.findMany({
        include: { source: { select: { name: true } }, salaryStats: true, _count: { select: { courses: true } } },
        orderBy: { name: 'asc' },
      });
      const csv = toCsv(
        ['name', 'slug', 'category', 'durationMonths', 'nsqfLevel', 'feeMin', 'feeMax', 'entrySalaryMin', 'entrySalaryMax', 'verificationStatus', 'source', 'providerCourses'],
        trades.map((t) => ({
          name: t.name,
          slug: t.slug,
          category: t.category,
          durationMonths: t.durationMonths,
          nsqfLevel: t.nsqfLevel ?? '',
          feeMin: t.feeMin ?? '',
          feeMax: t.feeMax ?? '',
          entrySalaryMin: t.salaryStats.find((s) => s.experienceLevel === 'ENTRY')?.monthlyMin ?? '',
          entrySalaryMax: t.salaryStats.find((s) => s.experienceLevel === 'ENTRY')?.monthlyMax ?? '',
          verificationStatus: t.verificationStatus,
          source: t.source?.name ?? '',
          providerCourses: t._count.courses,
        })),
      );
      return csvResponse(csv, 'pathalign-career-database.csv');
    }
    case 'users': {
      const users = await prisma.user.findMany({
        select: { fullName: true, email: true, role: true, state: true, district: true, preferredLanguage: true, isActive: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
      const csv = toCsv(
        ['fullName', 'email', 'role', 'state', 'district', 'language', 'isActive', 'createdAt'],
        users.map((u) => ({
          fullName: u.fullName,
          email: u.email,
          role: u.role,
          state: u.state ?? '',
          district: u.district ?? '',
          language: u.preferredLanguage,
          isActive: u.isActive,
          createdAt: u.createdAt.toISOString(),
        })),
      );
      return csvResponse(csv, 'pathalign-users.csv');
    }
    case 'trends': {
      const rows = await getRegistrationTrends(90);
      return csvResponse(toCsv(['date', 'users', 'conversations', 'concerns'], rows), 'pathalign-trends.csv');
    }
    case 'sentiment': {
      const rows = await getSentimentDistribution();
      return csvResponse(toCsv(['sentiment', 'count', 'sharePercent'], rows), 'pathalign-sentiment.csv');
    }
    case 'popular-trades': {
      const rows = await getPopularTrades(25);
      return csvResponse(toCsv(['trade', 'interestAndRecommendationCount'], rows), 'pathalign-popular-trades.csv');
    }
    default:
      throw new ApiError(400, `Unknown export type: ${type}`);
  }
});

function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
    },
  });
}

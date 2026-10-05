import { ok, withApi } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import {
  getAdminOverview,
  getConcernBreakdown,
  getDistrictResistance,
  getSentimentDistribution,
  getPopularTrades,
  getRegistrationTrends,
  getConfidenceTrend,
  getDisagreementPatterns,
  getCaseStatusBreakdown,
} from '@/lib/services/analytics';

export const dynamic = 'force-dynamic';

export const GET = withApi(async (req: Request) => {
  await requireUser(['ADMIN']);
  const url = new URL(req.url);
  const state = url.searchParams.get('state') ?? undefined;
  const days = Math.min(180, Math.max(7, Number(url.searchParams.get('days') ?? 30)));

  const [
    overview,
    concerns,
    districts,
    sentiment,
    popularTrades,
    trends,
    confidenceTrend,
    disagreements,
    caseStatus,
  ] = await Promise.all([
    getAdminOverview(),
    getConcernBreakdown(),
    getDistrictResistance(state),
    getSentimentDistribution(),
    getPopularTrades(),
    getRegistrationTrends(days),
    getConfidenceTrend(),
    getDisagreementPatterns(),
    getCaseStatusBreakdown(),
  ]);

  return ok({
    overview,
    concerns,
    districts,
    sentiment,
    popularTrades,
    trends,
    confidenceTrend,
    disagreements,
    caseStatus,
    filters: { state: state ?? null, days },
    generatedAt: new Date().toISOString(),
    demoDataNotice:
      'Figures are live database aggregates. Until real usage replaces them, they include clearly-labelled synthetic demo records created by the seed script.',
  });
});

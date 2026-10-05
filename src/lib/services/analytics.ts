import { prisma } from '@/lib/db';
import { CONCERN_LABELS } from '@/lib/ai/classifiers';

// ------------------------------------------------------------
// Government administrator analytics — all figures come from
// real database queries (no hardcoded dashboard statistics).
// ------------------------------------------------------------

export interface AdminOverview {
  totalStudents: number;
  totalParents: number;
  totalCounsellors: number;
  totalAdmins: number;
  totalFamilies: number;
  counsellingSessions: number;
  unresolvedConcerns: number;
  openCases: number;
  escalations: number;
  reportsGenerated: number;
  conversationsStarted: number;
  consentedProfiles: number;
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const [students, parents, counsellors, admins, families, sessions, unresolved, openCases, escalations, reports, conversations, consents] =
    await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'PARENT' } }),
      prisma.user.count({ where: { role: 'COUNSELLOR' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.family.count(),
      prisma.counsellingSession.count(),
      prisma.parentConcern.count({ where: { status: 'OPEN' } }),
      prisma.counsellorCase.count({ where: { status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] } } }),
      prisma.counsellorCase.count({ where: { source: 'AI_ESCALATION' } }),
      prisma.careerReport.count(),
      prisma.chatConversation.count(),
      prisma.familyMember.count({ where: { consentGranted: true } }),
    ]);
  return {
    totalStudents: students,
    totalParents: parents,
    totalCounsellors: counsellors,
    totalAdmins: admins,
    totalFamilies: families,
    counsellingSessions: sessions,
    unresolvedConcerns: unresolved,
    openCases: openCases,
    escalations,
    reportsGenerated: reports,
    conversationsStarted: conversations,
    consentedProfiles: consents,
  };
}

export interface ConcernBreakdown {
  category: string;
  label: string;
  labelHi: string;
  open: number;
  addressed: number;
  total: number;
  share: number;
}

export async function getConcernBreakdown(): Promise<ConcernBreakdown[]> {
  const grouped = await prisma.parentConcern.groupBy({ by: ['category', 'status'], _count: true });
  const totals = new Map<string, { open: number; addressed: number; total: number }>();
  for (const g of grouped) {
    const cur = totals.get(g.category) ?? { open: 0, addressed: 0, total: 0 };
    if (g.status === 'OPEN') cur.open += g._count;
    else cur.addressed += g._count;
    cur.total += g._count;
    totals.set(g.category, cur);
  }
  const grand = [...totals.values()].reduce((s, v) => s + v.total, 0) || 1;
  return [...totals.entries()]
    .map(([category, v]) => ({
      category,
      label: CONCERN_LABELS[category as keyof typeof CONCERN_LABELS]?.en ?? category,
      labelHi: CONCERN_LABELS[category as keyof typeof CONCERN_LABELS]?.hi ?? category,
      ...v,
      share: Math.round((v.total / grand) * 100),
    }))
    .sort((a, b) => b.total - a.total);
}

export interface DistrictResistanceRow {
  state: string;
  district: string;
  concerns: number;
  families: number;
  unresolved: number;
  index: number; // concerns per family, scaled ×100
}

export async function getDistrictResistance(state?: string): Promise<DistrictResistanceRow[]> {
  const concerns = await prisma.parentConcern.groupBy({
    by: ['state', 'district'],
    _count: true,
    where: state ? { state: { equals: state, mode: 'insensitive' } } : undefined,
  });
  const unresolved = await prisma.parentConcern.groupBy({
    by: ['state', 'district'],
    _count: true,
    where: {
      status: 'OPEN',
      ...(state ? { state: { equals: state, mode: 'insensitive' } } : {}),
    },
  });
  const families = await prisma.family.groupBy({
    by: ['state', 'district'],
    _count: true,
    where: state ? { state: { equals: state, mode: 'insensitive' } } : undefined,
  });

  const key = (s: string | null, d: string | null) => `${s ?? 'Unknown'}::${d ?? 'Unknown'}`;
  const map = new Map<string, DistrictResistanceRow>();
  for (const c of concerns) {
    const k = key(c.state, c.district);
    map.set(k, {
      state: c.state ?? 'Unknown',
      district: c.district ?? 'Unknown',
      concerns: c._count,
      families: 0,
      unresolved: 0,
      index: 0,
    });
  }
  for (const u of unresolved) {
    const k = key(u.state, u.district);
    const row = map.get(k);
    if (row) row.unresolved = u._count;
  }
  for (const f of families) {
    const k = key(f.state, f.district);
    const row = map.get(k) ?? {
      state: f.state ?? 'Unknown',
      district: f.district ?? 'Unknown',
      concerns: 0,
      families: f._count,
      unresolved: 0,
      index: 0,
    };
    row.families = f._count;
    map.set(k, row);
  }
  return [...map.values()]
    .map((r) => ({ ...r, index: Math.round((r.concerns / Math.max(1, r.families)) * 100) }))
    .sort((a, b) => b.index - a.index);
}

export interface SentimentRow {
  sentiment: string;
  count: number;
  share: number;
}

export async function getSentimentDistribution(): Promise<SentimentRow[]> {
  const grouped = await prisma.chatMessage.groupBy({ by: ['sentiment'], _count: true, where: { role: 'USER' } });
  const total = grouped.reduce((s, g) => s + g._count, 0) || 1;
  return grouped
    .map((g) => ({ sentiment: g.sentiment ?? 'UNKNOWN', count: g._count, share: Math.round((g._count / total) * 100) }))
    .sort((a, b) => b.count - a.count);
}

export interface PopularTradeRow {
  tradeId: string | null;
  name: string;
  count: number;
}

export async function getPopularTrades(limit = 8): Promise<PopularTradeRow[]> {
  const interests = await prisma.careerInterest.groupBy({ by: ['tradeId'], _count: true });
  const recs = await prisma.careerRecommendation.groupBy({ by: ['tradeId'], _count: true });
  const totals = new Map<string, number>();
  for (const i of interests) if (i.tradeId) totals.set(i.tradeId, (totals.get(i.tradeId) ?? 0) + i._count);
  for (const r of recs) if (r.tradeId) totals.set(r.tradeId, (totals.get(r.tradeId) ?? 0) + r._count);
  const ids = [...totals.keys()];
  const trades = ids.length ? await prisma.careerTrade.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }) : [];
  const nameById = new Map(trades.map((t) => [t.id, t.name]));
  return [...totals.entries()]
    .map(([tradeId, count]) => ({ tradeId, name: nameById.get(tradeId) ?? 'Unknown trade', count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export interface TrendPoint {
  date: string;
  users: number;
  conversations: number;
  concerns: number;
}

export async function getRegistrationTrends(days = 30): Promise<TrendPoint[]> {
  const since = new Date(Date.now() - days * 24 * 3600 * 1000);
  const rows = await prisma.$queryRaw<Array<{ date: string; users: number; conversations: number; concerns: number }>>`
    SELECT to_char(d, 'YYYY-MM-DD') AS date,
      COALESCE(u.c, 0) AS users,
      COALESCE(c.c, 0) AS conversations,
      COALESCE(pc.c, 0) AS concerns
    FROM generate_series(${since}::date, now()::date, '1 day') AS d
    LEFT JOIN (
      SELECT date_trunc('day', "createdAt") AS day, count(*) AS c FROM "User" WHERE "createdAt" >= ${since} GROUP BY 1
    ) u ON u.day = d
    LEFT JOIN (
      SELECT date_trunc('day', "createdAt") AS day, count(*) AS c FROM "ChatConversation" WHERE "createdAt" >= ${since} GROUP BY 1
    ) c ON c.day = d
    LEFT JOIN (
      SELECT date_trunc('day', "createdAt") AS day, count(*) AS c FROM "ParentConcern" WHERE "createdAt" >= ${since} GROUP BY 1
    ) pc ON pc.day = d
    ORDER BY d
  `;
  return rows.map((r) => ({
    date: r.date,
    users: Number(r.users),
    conversations: Number(r.conversations),
    concerns: Number(r.concerns),
  }));
}

export interface ConfidenceTrendPoint {
  date: string;
  averageScore: number;
  count: number;
}

export async function getConfidenceTrend(): Promise<ConfidenceTrendPoint[]> {
  const rows = await prisma.$queryRaw<Array<{ date: string; avg: number; cnt: bigint }>>`
    SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS date,
           round(avg("overallScore")) AS avg,
           count(*) AS cnt
    FROM "ConfidenceAssessment"
    GROUP BY 1
    ORDER BY 1
  `;
  return rows.map((r) => ({ date: r.date, averageScore: Number(r.avg), count: Number(r.cnt) }));
}

export interface DisagreementPattern {
  status: string;
  count: number;
}

export async function getDisagreementPatterns(): Promise<DisagreementPattern[]> {
  const grouped = await prisma.familyConsensus.groupBy({ by: ['status'], _count: true });
  return grouped.map((g) => ({ status: g.status, count: g._count })).sort((a, b) => b.count - a.count);
}

export interface CaseStatusRow {
  status: string;
  count: number;
}

export async function getCaseStatusBreakdown(): Promise<CaseStatusRow[]> {
  const grouped = await prisma.counsellorCase.groupBy({ by: ['status'], _count: true });
  return grouped.map((g) => ({ status: g.status, count: g._count }));
}

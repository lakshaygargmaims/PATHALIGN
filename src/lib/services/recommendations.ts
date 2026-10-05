import { prisma } from '@/lib/db';
import type { RecommendationPathway } from '@prisma/client';
import { tokenize } from '@/lib/ai/retrieval';
import type { TwinInput } from '@/lib/validation/schemas';

// ------------------------------------------------------------
// Rule-based, explainable recommendation engine.
// Scores the real trade catalogue against a learner's profile.
// ------------------------------------------------------------

export interface RecommendationItem {
  tradeId: string;
  name: string;
  category: string;
  rank: number;
  title: string;
  matchScore: number;
  rationale: string;
  evidence: Array<{ label: string; value: string; verificationStatus: string }>;
  durationMonths: number;
  nsqfLevel: number | null;
  feeMax: number | null;
}

export interface RecommendInput {
  interests?: string[];
  skills?: string[];
  areas?: string[];
  state?: string | null;
  budget?: number | null;
  education?: string | null;
  limit?: number;
}

type TradeRow = Awaited<ReturnType<typeof loadTrades>>[number];

async function loadTrades() {
  return prisma.careerTrade.findMany({
    where: { status: 'ACTIVE' },
    include: {
      salaryStats: true,
      source: { select: { name: true, verificationStatus: true, isSynthetic: true } },
      courses: { include: { provider: { select: { state: true } } } },
      _count: { select: { pathways: true, opportunities: true } },
    },
  });
}

function scoreTrade(trade: TradeRow, input: RecommendInput): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  const haystack = tokenize(`${trade.name} ${trade.category} ${trade.description} ${trade.ncoCode ?? ''}`);
  const userTokens = tokenize(
    [...(input.interests ?? []), ...(input.areas ?? []), ...(input.skills ?? [])].join(' '),
  );
  const uniqueUser = [...new Set(userTokens)];
  let matches = 0;
  for (const t of uniqueUser) {
    if (haystack.includes(t)) {
      matches += 1;
      score += 3;
    }
  }
  if (matches > 0) reasons.push(`Matches ${matches} of your stated interest/skill keywords`);

  if (input.state) {
    const inState = trade.courses.some((c) => c.provider.state === input.state);
    if (inState) {
      score += 6;
      reasons.push(`Training providers recorded in ${input.state}`);
    }
  }

  if (input.budget != null && trade.feeMax != null) {
    if (trade.feeMax <= input.budget) {
      score += 5;
      reasons.push('Recorded maximum fee fits your budget');
    } else {
      score -= 2;
      reasons.push('Recorded maximum fee is above your budget');
    }
  }

  if (trade.verificationStatus === 'VERIFIED') {
    score += 3;
    reasons.push('Catalogue record verified against its source');
  }

  const entry = trade.salaryStats.find((s) => s.experienceLevel === 'ENTRY');
  if (entry) {
    score += 2;
    reasons.push(`Entry earning estimate on record: ₹${entry.monthlyMin.toLocaleString('en-IN')}–₹${entry.monthlyMax.toLocaleString('en-IN')}/month`);
  }
  if (trade._count.opportunities > 0) {
    score += 2;
    reasons.push(`${trade._count.opportunities} employment pathway records`);
  }
  return { score, reasons };
}

export async function recommendTrades(input: RecommendInput): Promise<RecommendationItem[]> {
  const trades = await loadTrades();
  const scored = trades
    .map((t) => ({ trade: t, ...scoreTrade(t, input) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, input.limit ?? 6);

  const max = Math.max(1, scored[0]?.score ?? 1);
  return scored
    .filter((s) => s.score > 0)
    .map((s, idx) => {
      const entry = s.trade.salaryStats.find((x) => x.experienceLevel === 'ENTRY');
      return {
        tradeId: s.trade.id,
        name: s.trade.name,
        category: s.trade.category,
        rank: idx + 1,
        title: s.trade.name,
        matchScore: Math.max(5, Math.round((s.score / max) * 100)),
        rationale: s.reasons.join('. ') + '.',
        evidence: [
          { label: 'Duration', value: `${s.trade.durationMonths} months`, verificationStatus: s.trade.verificationStatus },
          { label: 'NSQF level', value: s.trade.nsqfLevel ? `Level ${s.trade.nsqfLevel}` : 'Not specified', verificationStatus: s.trade.verificationStatus },
          entry
            ? { label: 'Entry earning estimate', value: `₹${entry.monthlyMin.toLocaleString('en-IN')}–₹${entry.monthlyMax.toLocaleString('en-IN')}/month`, verificationStatus: entry.verificationStatus }
            : { label: 'Entry earning estimate', value: 'No record available', verificationStatus: 'UNAVAILABLE' },
          {
            label: 'Source',
            value: s.trade.source?.name ?? 'Internal demo catalogue',
            verificationStatus: s.trade.source?.verificationStatus ?? 'SYNTHETIC_DEMO',
          },
        ],
        durationMonths: s.trade.durationMonths,
        nsqfLevel: s.trade.nsqfLevel,
        feeMax: s.trade.feeMax,
      };
    });
}

export async function saveRecommendations(
  userId: string,
  familyId: string | null,
  pathway: RecommendationPathway,
  items: RecommendationItem[],
): Promise<void> {
  if (items.length === 0) return;
  await prisma.$transaction([
    prisma.careerRecommendation.deleteMany({ where: { userId, pathway, status: 'PROPOSED' } }),
    ...items.map((item, idx) =>
      prisma.careerRecommendation.create({
        data: {
          userId,
          familyId: familyId ?? undefined,
          tradeId: item.tradeId,
          pathway,
          rank: item.rank,
          title: item.title,
          rationale: item.rationale,
          matchScore: item.matchScore,
          evidence: item.evidence,
        },
      }),
    ),
  ]);
}

// ------------------------------------------------------------
// Career Digital Twin — three scenario pathways
// ------------------------------------------------------------

export interface TwinPathway {
  pathway: 'PREFERRED' | 'ALTERNATIVE' | 'LONG_TERM_GROWTH';
  title: string;
  summary: string;
  steps: Array<{ order: number; title: string; detail: string }>;
  tradeId?: string;
  tradeName?: string;
  additionalTraining: string[];
  estimatedCost: string | null;
  assumptions: string[];
}

export interface TwinResult {
  profile: { education: string; skills: string[]; interests: string[]; location: string | null; budget: number };
  pathways: TwinPathway[];
  note: string;
}

export async function buildDigitalTwin(input: TwinInput): Promise<TwinResult> {
  const recommended = await recommendTrades({
    interests: input.interests,
    skills: input.skills,
    areas: input.interests,
    preferredLocation: undefined,
    budget: input.budget || null,
    education: input.education,
    limit: 6,
  } as RecommendInput);

  const target = input.targetTradeId
    ? await prisma.careerTrade.findUnique({
        where: { id: input.targetTradeId },
        include: { pathways: { include: { stages: { orderBy: { order: 'asc' } } }, take: 1 }, salaryStats: true },
      })
    : null;

  const preferredItem = target
    ? null
    : recommended[0] ?? null;
  const alternativeItem =
    recommended.find((r) => r.category !== (preferredItem?.category ?? target?.category)) ?? recommended[1] ?? recommended[0] ?? null;
  const growthItem =
    [...recommended].sort((a, b) => b.evidence.length - a.evidence.length)[0] ?? preferredItem;

  const loadDetail = async (tradeId: string | undefined) =>
    tradeId
      ? prisma.careerTrade.findUnique({
          where: { id: tradeId },
          include: { pathways: { include: { stages: { orderBy: { order: 'asc' } } }, take: 1 }, salaryStats: true, qualification: true },
        })
      : null;

  const pathways: TwinPathway[] = [];

  // 1 — Preferred
  const pref = target ?? (await loadDetail(preferredItem?.tradeId));
  pathways.push({
    pathway: 'PREFERRED',
    title: pref ? pref.name : (preferredItem?.title ?? 'Preferred pathway — add a target trade'),
    tradeId: pref?.id,
    tradeName: pref?.name,
    summary: pref
      ? `Your stated goal. Training takes ${pref.durationMonths} months; recorded entry earning estimate is ${entryEstimate(pref.salaryStats)}.`
      : 'Choose a target trade (or complete the interest assessment) to see your preferred pathway.',
    steps: buildSteps(pref?.pathways[0]?.stages.map((s) => ({ title: s.title, detail: s.description })) ?? []),
    additionalTraining: pref ? [`Complete the ${pref.name} course`, 'Industry-recognised certification for the trade'] : [],
    estimatedCost: pref?.feeMax ? `Up to ₹${pref.feeMax.toLocaleString('en-IN')} (recorded maximum fee)` : null,
    assumptions: ['Based on catalogue records; fees vary by institute.', 'Entry earnings are estimates, not guarantees.'],
  });

  // 2 — Alternative
  const alt = await loadDetail(alternativeItem?.tradeId);
  pathways.push({
    pathway: 'ALTERNATIVE',
    title: alt ? alt.name : (alternativeItem?.title ?? 'Alternative pathway'),
    tradeId: alt?.id,
    tradeName: alt?.name,
    summary: alt
      ? `A related option if budget, location or job availability makes the preferred route difficult: ${alt.durationMonths} months training, ${alt.category} sector.`
      : 'Complete the interest assessment to receive an alternative pathway suggestion.',
    steps: buildSteps(alt?.pathways[0]?.stages.map((s) => ({ title: s.title, detail: s.description })) ?? []),
    additionalTraining: alt ? [`Short-term certification in ${alt.category}`, 'Apprenticeship where available'] : [],
    estimatedCost: alt?.feeMax ? `Up to ₹${alt.feeMax.toLocaleString('en-IN')} (recorded maximum fee)` : null,
    assumptions: ['Chosen for similarity of skill overlap, not superiority over the preferred route.'],
  });

  // 3 — Long-term growth
  const grow = await loadDetail(growthItem?.tradeId);
  const growStages = grow?.pathways[0]?.stages ?? [];
  pathways.push({
    pathway: 'LONG_TERM_GROWTH',
    title: grow ? `${grow.name} — progression view` : 'Long-term growth view',
    tradeId: grow?.id,
    tradeName: grow?.name,
    summary: growStages.length
      ? `Shows where 5–10 years of experience can lead: ${growStages[growStages.length - 1]?.title}.`
      : 'Progression stages will appear once pathway data is available for your shortlisted trade.',
    steps: buildSteps(growStages.map((s) => ({ title: s.title, detail: s.description }))),
    additionalTraining: grow
      ? [
          'Supervisory/leadership skill certification after 3+ years',
          grow.qualification?.progressionNote ?? 'Check recognised progression routes for this qualification',
        ]
      : [],
    estimatedCost: null,
    assumptions: [
      'Progression depends on employer, performance and applicable qualification rules — stages are not automatic.',
      'Scenario simulation only; this is not a validated predictive model.',
    ],
  });

  return {
    profile: {
      education: input.education,
      skills: input.skills,
      interests: input.interests,
      location: input.preferredLocation ?? null,
      budget: input.budget,
    },
    pathways,
    note: 'Career Digital Twin is a scenario-based exploration tool built from catalogue records. It is not a scientifically validated prediction model.',
  };
}

function entryEstimate(stats: Array<{ experienceLevel: string; monthlyMin: number; monthlyMax: number }>): string {
  const e = stats.find((s) => s.experienceLevel === 'ENTRY');
  return e ? `₹${e.monthlyMin.toLocaleString('en-IN')}–₹${e.monthlyMax.toLocaleString('en-IN')} per month (estimate)` : 'no earning record available';
}

function buildSteps(stages: Array<{ title: string; detail: string }>): TwinPathway['steps'] {
  if (stages.length === 0) return [];
  return stages.slice(0, 6).map((s, i) => ({ order: i + 1, title: s.title, detail: s.detail }));
}

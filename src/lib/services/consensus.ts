import { prisma, json } from '@/lib/db';
import { ApiError } from '@/lib/api';
import type { ConsensusCreateInput } from '@/lib/validation/schemas';

// ------------------------------------------------------------
// Family Consensus Engine
// Pure, explainable comparison of student and parent preferences.
// Never forces agreement — outcomes include "needs discussion".
// ------------------------------------------------------------

export interface Pick {
  tradeId?: string;
  label: string;
}

export interface ConsensusAnalysis {
  normalizedStudent: Array<{ label: string; key: string; tradeId?: string }>;
  normalizedParent: Array<{ label: string; key: string; tradeId?: string }>;
  common: Array<{ label: string; key: string; tradeId?: string }>;
  studentOnly: Array<{ label: string; key: string; tradeId?: string }>;
  parentOnly: Array<{ label: string; key: string; tradeId?: string }>;
  status: 'AGREED' | 'PARTIALLY_AGREED' | 'NEEDS_DISCUSSION';
  score: number;
  concerns: { student: string[]; parent: string[]; shared: string[] };
}

function normKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097F]+/g, ' ')
    .trim();
}

export function analyzeConsensus(
  studentPicks: Pick[],
  parentPicks: Pick[],
  studentConcerns: string[],
  parentConcerns: string[],
): ConsensusAnalysis {
  const s = studentPicks.map((p) => ({ label: p.label.trim(), key: normKey(p.label), tradeId: p.tradeId }));
  const p = parentPicks.map((p) => ({ label: p.label.trim(), key: normKey(p.label), tradeId: p.tradeId }));

  const parentKeys = new Set(p.map((x) => x.key));
  const studentKeys = new Set(s.map((x) => x.key));

  const common = s.filter((x) => parentKeys.has(x.key));
  const studentOnly = s.filter((x) => !parentKeys.has(x.key));
  const parentOnly = p.filter((x) => !studentKeys.has(x.key));

  const sSet = new Set(studentConcerns.map(normKey).filter(Boolean));
  const pSet = new Set(parentConcerns.map(normKey).filter(Boolean));
  const shared = [...sSet].filter((k) => pSet.has(k));

  const totalDistinct = new Set([...s.map((x) => x.key), ...p.map((x) => x.key)]).size || 1;
  const overlap = common.length;
  const score = Math.min(100, Math.round((overlap / totalDistinct) * 100 + (shared.length === 0 ? 5 : 0)));

  let status: ConsensusAnalysis['status'];
  if (overlap >= 1 && studentOnly.length === 0 && parentOnly.length === 0) status = 'AGREED';
  else if (overlap >= 1) status = 'PARTIALLY_AGREED';
  else status = 'NEEDS_DISCUSSION';

  return {
    normalizedStudent: s,
    normalizedParent: p,
    common,
    studentOnly,
    parentOnly,
    status,
    score,
    concerns: {
      student: studentConcerns,
      parent: parentConcerns,
      shared: [...shared],
    },
  };
}

export interface ConsensusEvidence {
  trade: string;
  durationMonths: number;
  feeRange: string | null;
  earningEstimate: string | null;
  verificationStatus: string;
  sources: string[];
}

export interface SavedConsensus {
  id: string;
  status: string;
  score: number;
  common: string[];
  studentOnly: string[];
  parentOnly: string[];
  recommendations: Array<{ title: string; rationale: string; tradeId?: string }>;
  evidence: ConsensusEvidence[];
  aiSummary: string;
}

export async function createConsensus(userId: string, input: ConsensusCreateInput): Promise<SavedConsensus> {
  const family = await prisma.family.findUnique({ where: { id: input.familyId } });
  if (!family) throw new ApiError(404, 'Family not found');
  const membership = await prisma.familyMember.findFirst({ where: { familyId: family.id, userId } });
  if (!membership) throw new ApiError(403, 'Only family members can run a consensus');

  const analysis = analyzeConsensus(input.studentPicks, input.parentPicks, input.studentConcerns, input.parentConcerns);

  // Enrich picks with real catalogue data where a trade is identified.
  const pickTradeIds = [...new Set([...input.studentPicks, ...input.parentPicks].map((p) => p.tradeId).filter(Boolean))] as string[];
  const trades = pickTradeIds.length
    ? await prisma.careerTrade.findMany({
        where: { id: { in: pickTradeIds } },
        include: { salaryStats: true, source: { select: { name: true, verificationStatus: true } } },
      })
    : [];

  const evidence: ConsensusEvidence[] = trades.map((t) => {
    const entry = t.salaryStats.find((s) => s.experienceLevel === 'ENTRY');
    return {
      trade: t.name,
      durationMonths: t.durationMonths,
      feeRange: t.feeMin && t.feeMax ? `₹${t.feeMin.toLocaleString('en-IN')}–₹${t.feeMax.toLocaleString('en-IN')}` : null,
      earningEstimate: entry ? `₹${entry.monthlyMin.toLocaleString('en-IN')}–₹${entry.monthlyMax.toLocaleString('en-IN')} / month (estimate)` : null,
      verificationStatus: t.verificationStatus,
      sources: t.source ? [t.source.name] : [],
    };
  });

  const recommendations = buildConsensusRecommendations(analysis, trades);
  const aiSummary = buildConsensusSummary(analysis, family.preferredLanguage === 'HI');

  const record = await prisma.familyConsensus.create({
    data: {
      familyId: family.id,
      status: analysis.status === 'AGREED' ? 'AGREED' : analysis.status === 'PARTIALLY_AGREED' ? 'PARTIALLY_AGREED' : 'NEEDS_DISCUSSION',
      studentPicks: json(input.studentPicks),
      parentPicks: json(input.parentPicks),
      common: json(analysis.common.map((c) => c.label)),
      disagreements: json([...analysis.studentOnly, ...analysis.parentOnly].map((c) => c.label)),
      concerns: json({ student: input.studentConcerns, parent: input.parentConcerns, shared: analysis.concerns.shared }),
      recommendations: json(recommendations),
      evidence: json(evidence),
      aiSummary,
    },
  });

  return {
    id: record.id,
    status: record.status,
    score: analysis.score,
    common: analysis.common.map((c) => c.label),
    studentOnly: analysis.studentOnly.map((c) => c.label),
    parentOnly: analysis.parentOnly.map((c) => c.label),
    recommendations,
    evidence,
    aiSummary,
  };
}

function buildConsensusRecommendations(
  analysis: ConsensusAnalysis,
  trades: Array<{ id: string; name: string; description: string; category: string; durationMonths: number; feeMax: number | null; salaryStats: Array<{ experienceLevel: string; monthlyMin: number; monthlyMax: number }> }>,
): Array<{ title: string; rationale: string; tradeId?: string }> {
  const out: Array<{ title: string; rationale: string; tradeId?: string }> = [];

  for (const c of analysis.common.slice(0, 2)) {
    const trade = trades.find((t) => t.id === c.tradeId);
    out.push({
      title: trade ? trade.name : c.label,
      tradeId: trade?.id,
      rationale:
        'Both student and parent selected this option — strongest starting point for a joint decision.' +
        (trade ? ` Recorded training duration: ${trade.durationMonths} months.` : ''),
    });
  }

  // Suggest up to two alternatives from the catalogue in the same category as a preferred pick.
  const preferredTrade = trades.find((t) => analysis.studentOnly.some((s) => s.tradeId === t.id)) ?? trades[0];
  if (preferredTrade && analysis.status !== 'AGREED') {
    out.push({
      title: `${preferredTrade.category} pathway with shorter duration`,
      rationale:
        'If cost or duration is the main disagreement, compare a shorter course in the same sector before deciding. Both participants can review the evidence together.',
    });
  }

  if (analysis.status === 'NEEDS_DISCUSSION') {
    out.push({
      title: 'Joint counselling session',
      rationale:
        'No overlapping preference was found yet. A neutral counsellor can help both sides list must-haves before re-running this consensus.',
    });
  }
  return out.slice(0, 4);
}

function buildConsensusSummary(a: ConsensusAnalysis, hi: boolean): string {
  const statusText = hi
    ? { AGREED: 'सहमति', PARTIALLY_AGREED: 'आंशिक सहमति', NEEDS_DISCUSSION: 'और चर्चा आवश्यक' }[a.status]
    : { AGREED: 'Agreed', PARTIALLY_AGREED: 'Partially agreed', NEEDS_DISCUSSION: 'Needs further discussion' }[a.status];
  if (hi) {
    return `स्थिति: ${statusText}। विद्यार्थी और अभिभावक की सामान्य पसंद: ${a.common.length}। केवल विद्यार्थी की पसंद: ${a.studentOnly.length}। केवल अभिभावक की पसंद: ${a.parentOnly.length}। यह निर्णय किसी पर थोपा नहीं गया है — दोनों स्वेच्छा से अपना निर्णय लिख सकते हैं।`;
  }
  return `Status: ${statusText}. Shared preferences: ${a.common.length}. Student-only: ${a.studentOnly.length}. Parent-only: ${a.parentOnly.length}. This outcome does not force agreement — both participants can voluntarily record their own decision.`;
}

// ------------------------------------------------------------
// Two-phase workflow: each participant saves their own picks
// independently; the analysis runs once both sides exist.
// ------------------------------------------------------------

export async function saveParticipantPicks(params: {
  userId: string;
  familyId: string;
  participant: 'STUDENT' | 'PARENT';
  picks: Pick[];
  concerns: string[];
}): Promise<{ consensusId: string; sidesReady: { student: boolean; parent: boolean } }> {
  const membership = await prisma.familyMember.findFirst({
    where: { userId: params.userId, familyId: params.familyId },
  });
  if (!membership) throw new ApiError(403, 'Only family members can contribute to a consensus');
  if (params.participant === 'STUDENT' && membership.relation !== 'STUDENT') {
    throw new ApiError(403, 'This account can only record parent picks');
  }
  if (params.participant === 'PARENT' && membership.relation === 'STUDENT') {
    throw new ApiError(403, 'This account can only record student picks');
  }

  const open = await prisma.familyConsensus.findFirst({
    where: { familyId: params.familyId, status: 'OPEN' },
    orderBy: { updatedAt: 'desc' },
  });

  const emptyStudent: Pick[] = [];
  const emptyParent: Pick[] = [];
  const current = {
    studentPicks: ((open?.studentPicks as unknown as Pick[]) ?? []) as Pick[],
    parentPicks: ((open?.parentPicks as unknown as Pick[]) ?? []) as Pick[],
    concerns: (open?.concerns as { student?: string[]; parent?: string[]; shared?: string[] } | null) ?? {},
  };

  const next = {
    studentPicks: params.participant === 'STUDENT' ? params.picks : current.studentPicks,
    parentPicks: params.participant === 'PARENT' ? params.picks : current.parentPicks,
    studentConcerns: params.participant === 'STUDENT' ? params.concerns : (current.concerns.student ?? []),
    parentConcerns: params.participant === 'PARENT' ? params.concerns : (current.concerns.parent ?? []),
  };

  const record = open
    ? await prisma.familyConsensus.update({
        where: { id: open.id },
        data: {
          studentPicks: json(next.studentPicks),
          parentPicks: json(next.parentPicks),
          concerns: json({ student: next.studentConcerns, parent: next.parentConcerns, shared: [] }),
        },
      })
    : await prisma.familyConsensus.create({
        data: {
          familyId: params.familyId,
          status: 'OPEN',
          studentPicks: json(next.studentPicks),
          parentPicks: json(next.parentPicks),
          common: json([]),
          disagreements: json([]),
          concerns: json({ student: next.studentConcerns, parent: next.parentConcerns, shared: [] }),
          recommendations: json([]),
          evidence: json([]),
        },
      });

  return {
    consensusId: record.id,
    sidesReady: {
      student: next.studentPicks.length > 0,
      parent: next.parentPicks.length > 0,
    },
  };
}

export async function analyzeStoredConsensus(userId: string, consensusId: string): Promise<SavedConsensus> {
  const record = await prisma.familyConsensus.findUnique({
    where: { id: consensusId },
    include: { family: true },
  });
  if (!record) throw new ApiError(404, 'Consensus not found');
  const membership = await prisma.familyMember.findFirst({
    where: { userId, familyId: record.familyId },
  });
  if (!membership) throw new ApiError(403, 'Only family members can run this analysis');

  const studentPicks = ((record.studentPicks as unknown as Pick[]) ?? []) as Pick[];
  const parentPicks = ((record.parentPicks as unknown as Pick[]) ?? []) as Pick[];
  if (studentPicks.length === 0 || parentPicks.length === 0) {
    throw new ApiError(400, 'Both the student and the parent must save their preferences before the analysis can run');
  }
  const concerns = (record.concerns as { student?: string[]; parent?: string[] } | null) ?? {};

  const analysis = analyzeConsensus(studentPicks, parentPicks, concerns.student ?? [], concerns.parent ?? []);

  const pickTradeIds = [...new Set([...studentPicks, ...parentPicks].map((p) => p.tradeId).filter(Boolean))] as string[];
  const trades = pickTradeIds.length
    ? await prisma.careerTrade.findMany({
        where: { id: { in: pickTradeIds } },
        include: { salaryStats: true, source: { select: { name: true, verificationStatus: true } } },
      })
    : [];

  const evidence: ConsensusEvidence[] = trades.map((t) => {
    const entry = t.salaryStats.find((s) => s.experienceLevel === 'ENTRY');
    return {
      trade: t.name,
      durationMonths: t.durationMonths,
      feeRange: t.feeMin && t.feeMax ? `₹${t.feeMin.toLocaleString('en-IN')}–₹${t.feeMax.toLocaleString('en-IN')}` : null,
      earningEstimate: entry ? `₹${entry.monthlyMin.toLocaleString('en-IN')}–₹${entry.monthlyMax.toLocaleString('en-IN')} / month (estimate)` : null,
      verificationStatus: t.verificationStatus,
      sources: t.source ? [t.source.name] : [],
    };
  });

  const recommendations = buildConsensusRecommendations(analysis, trades);
  const aiSummary = buildConsensusSummary(analysis, record.family.preferredLanguage === 'HI');

  const updated = await prisma.familyConsensus.update({
    where: { id: record.id },
    data: {
      status:
        analysis.status === 'AGREED'
          ? 'AGREED'
          : analysis.status === 'PARTIALLY_AGREED'
            ? 'PARTIALLY_AGREED'
            : 'NEEDS_DISCUSSION',
      common: json(analysis.common.map((c) => c.label)),
      disagreements: json([...analysis.studentOnly, ...analysis.parentOnly].map((c) => c.label)),
      recommendations: json(recommendations),
      evidence: json(evidence),
      aiSummary,
    },
  });

  return {
    id: updated.id,
    status: updated.status,
    score: analysis.score,
    common: analysis.common.map((c) => c.label),
    studentOnly: analysis.studentOnly.map((c) => c.label),
    parentOnly: analysis.parentOnly.map((c) => c.label),
    recommendations,
    evidence,
    aiSummary,
  };
}

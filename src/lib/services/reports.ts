import type { ReportType, AppLanguage, User } from '@prisma/client';
import { prisma, json } from '@/lib/db';
import { ApiError } from '@/lib/api';
import { CONCERN_LABELS } from '@/lib/ai/classifiers';

// ------------------------------------------------------------
// Family Career Agreement Report — structured payload assembled
// from real records. The PDF renderer consumes this payload.
// ------------------------------------------------------------

export interface ReportPayload {
  generatedAt: string;
  type: ReportType;
  language: AppLanguage;
  family: { code: string; name: string | null; state: string | null; district: string | null; areaType: string | null; members: Array<{ name: string; relation: string }> };
  student: { name: string | null; age: number | null; qualification: string | null; interests: string[]; skills: string[]; aspirations: string | null; assessment: { overall: number; dimensions: Record<string, number> } | null };
  parent: { name: string | null; expectations: string | null; financialConcerns: string | null; concerns: Array<{ category: string; label: string; detail: string; status: string; date: string }> };
  consensus: {
    status: string;
    common: string[];
    studentOnly: string[];
    parentOnly: string[];
    summary: string;
    studentDecision: string | null;
    parentDecision: string | null;
  } | null;
  recommendations: Array<{ title: string; rationale: string; matchScore: number | null; evidence: Array<{ label: string; value: string }> }>;
  earnings: Array<{ trade: string; level: string; range: string; status: string; estimate: boolean }>;
  pathways: Array<{ trade: string; stages: Array<{ order: number; title: string; qualification: string | null }> }>;
  providers: Array<{ name: string; type: string; district: string; state: string; courses: string[]; verificationStatus: string }>;
  actionPlan: string[];
  counsellingSessions: Array<{ title: string; kind: string; status: string; date: string; summary: string | null }>;
  sources: Array<{ name: string; url: string | null; status: string; synthetic: boolean }>;
  disclaimers: string[];
}

export async function buildReportPayload(params: {
  familyId: string;
  type: ReportType;
  language: AppLanguage;
  consensusId?: string;
  conversationId?: string;
}): Promise<ReportPayload> {
  const family = await prisma.family.findUnique({
    where: { id: params.familyId },
    include: {
      members: { include: { user: { select: { fullName: true, role: true } } } },
      studentProfile: true,
      parentProfile: true,
    },
  });
  if (!family) throw new ApiError(404, 'Family not found');

  const studentUser = family.members.find((m) => m.relation === 'STUDENT')?.user ?? null;
  const parentUser = family.members.find((m) => m.relation === 'PARENT')?.user ?? null;

  const [assessments, concerns, consensuses, recommendations, sessions, conversation] = await Promise.all([
    prisma.careerAssessment.findMany({ where: { familyId: family.id }, orderBy: { createdAt: 'desc' } }),
    prisma.parentConcern.findMany({ where: { familyId: family.id }, orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.familyConsensus.findMany({ where: { familyId: family.id }, orderBy: { updatedAt: 'desc' }, take: 1 }),
    prisma.careerRecommendation.findMany({ where: { familyId: family.id }, orderBy: { rank: 'asc' }, take: 8 }),
    prisma.counsellingSession.findMany({ where: { familyId: family.id }, orderBy: { createdAt: 'desc' }, take: 10 }),
    params.conversationId
      ? prisma.chatConversation.findUnique({ where: { id: params.conversationId }, include: { messages: true } })
      : Promise.resolve(null),
  ]);

  const consensusRecord =
    (params.consensusId ? consensuses.find((c) => c.id === params.consensusId) : null) ?? consensuses[0] ?? null;

  const studentAssessment = assessments.find((a) => a.kind === 'STUDENT_INTEREST');
  const studentScores = (studentAssessment?.scores ?? null) as { dimensions?: Record<string, number>; overall?: number } | null;

  const tradeIds = [...new Set(recommendations.map((r) => r.tradeId).filter(Boolean))] as string[];
  const trades = tradeIds.length
    ? await prisma.careerTrade.findMany({
        where: { id: { in: tradeIds } },
        include: {
          salaryStats: true,
          pathways: { include: { stages: { orderBy: { order: 'asc' } } }, take: 1 },
          courses: { include: { provider: true, trade: { select: { name: true } } } },
          source: { select: { name: true, url: true, verificationStatus: true, isSynthetic: true } },
        },
      })
    : [];
  const tradeById = new Map(trades.map((t) => [t.id, t]));

  const earnings: ReportPayload['earnings'] = [];
  const pathways: ReportPayload['pathways'] = [];
  const providerMap = new Map<string, ReportPayload['providers'][number]>();

  for (const t of trades) {
    for (const s of t.salaryStats) {
      earnings.push({
        trade: t.name,
        level: s.experienceLevel,
        range: `₹${s.monthlyMin.toLocaleString('en-IN')} – ₹${s.monthlyMax.toLocaleString('en-IN')} / month`,
        status: s.verificationStatus,
        estimate: s.isEstimate,
      });
    }
    const stages = t.pathways[0]?.stages ?? [];
    if (stages.length) {
      pathways.push({
        trade: t.name,
        stages: stages.map((s) => ({ order: s.order, title: s.title, qualification: s.qualification })),
      });
    }
    for (const c of t.courses) {
      const key = c.provider.id;
      const existing = providerMap.get(key);
      const courseLabel = `${c.trade.name} (${c.durationMonths} mo${c.feeMax ? `, ₹${c.feeMin ?? 0}–₹${c.feeMax}` : ''})`;
      if (existing) existing.courses.push(courseLabel);
      else
        providerMap.set(key, {
          name: c.provider.name,
          type: c.provider.type,
          district: c.provider.district,
          state: c.provider.state,
          courses: [courseLabel],
          verificationStatus: c.provider.verificationStatus,
        });
    }
  }

  const sourceMap = new Map<string, ReportPayload['sources'][number]>();
  for (const t of trades) {
    if (t.source) {
      sourceMap.set(t.source.name, {
        name: t.source.name,
        url: t.source.url,
        status: t.source.verificationStatus,
        synthetic: t.source.isSynthetic,
      });
    }
  }

  const actionPlan: string[] = [];
  if (trades.length) actionPlan.push(`Shortlist and compare ${trades.length} recommended trade(s) with the family.`);
  if (family.district) actionPlan.push(`Verify training providers in ${family.district} before paying any fee.`);
  actionPlan.push('Attend a joint student–parent counselling session to review concerns listed here.');
  actionPlan.push('Record each participant’s voluntary decision in the Consensus section.');
  actionPlan.push('Re-take the confidence questionnaire after counselling to track change.');

  const summaryText =
    consensusRecord && typeof consensusRecord.aiSummary === 'string' ? consensusRecord.aiSummary : null;

  const conversationSummary = conversation?.summary ?? null;

  return {
    generatedAt: new Date().toISOString(),
    type: params.type,
    language: params.language,
    family: {
      code: family.familyCode,
      name: family.name,
      state: family.state,
      district: family.district,
      areaType: family.areaType,
      members: family.members.map((m) => ({ name: m.user.fullName, relation: m.relation })),
    },
    student: {
      name: studentUser?.fullName ?? null,
      age: family.studentProfile?.age ?? null,
      qualification: family.studentProfile?.qualification ?? null,
      interests: family.studentProfile?.interests ?? [],
      skills: family.studentProfile?.skills ?? [],
      aspirations: family.studentProfile?.aspirations ?? null,
      assessment: studentScores?.overall != null
        ? { overall: studentScores.overall, dimensions: studentScores.dimensions ?? {} }
        : null,
    },
    parent: {
      name: parentUser?.fullName ?? null,
      expectations: family.parentProfile?.careerExpectations ?? null,
      financialConcerns: family.parentProfile?.financialConcerns ?? null,
      concerns: concerns.map((c) => ({
        category: c.category,
        label: CONCERN_LABELS[c.category]?.en ?? c.category,
        detail: c.detail,
        status: c.status,
        date: c.createdAt.toISOString().slice(0, 10),
      })),
    },
    consensus: consensusRecord
      ? {
          status: consensusRecord.status,
          common: (consensusRecord.common as string[]) ?? [],
          studentOnly: ((consensusRecord.studentPicks as Array<{ label: string }>) ?? [])
            .map((p) => p.label)
            .filter((l) => !((consensusRecord.common as string[]) ?? []).includes(l)),
          parentOnly: ((consensusRecord.parentPicks as Array<{ label: string }>) ?? [])
            .map((p) => p.label)
            .filter((l) => !((consensusRecord.common as string[]) ?? []).includes(l)),
          summary: summaryText ?? conversationSummary ?? 'No consensus summary recorded yet.',
          studentDecision: consensusRecord.studentDecision,
          parentDecision: consensusRecord.parentDecision,
        }
      : null,
    recommendations: recommendations.map((r) => {
      const trade = r.tradeId ? tradeById.get(r.tradeId) : null;
      const evidence = (r.evidence as Array<{ label: string; value: string }> | null) ?? [];
      return {
        title: r.title,
        rationale: r.rationale,
        matchScore: r.matchScore,
        evidence: evidence.length
          ? evidence
          : trade
            ? [{ label: 'Category', value: trade.category }, { label: 'Duration', value: `${trade.durationMonths} months` }]
            : [],
      };
    }),
    earnings,
    pathways,
    providers: [...providerMap.values()].slice(0, 12),
    actionPlan,
    counsellingSessions: sessions.map((s) => ({
      title: s.title,
      kind: s.kind,
      status: s.status,
      date: (s.scheduledAt ?? s.createdAt).toISOString().slice(0, 10),
      summary: s.summary,
    })),
    sources: [...sourceMap.values()],
    disclaimers: [
      'This report is generated by PATHALIGN AI from the family’s own records and this platform’s career database.',
      'Earning figures are estimates from referenced records. They are not guarantees of future income or placement.',
      'Synthetic demo records are labelled as such and must be replaced with verified official data before being treated as government information.',
      'Progression steps depend on applicable qualification rules and are not automatic.',
    ],
  };
}

export async function createReport(
  user: User,
  input: { type: ReportType; familyId?: string; language: AppLanguage; consensusId?: string; conversationId?: string },
) {
  let familyId = input.familyId;
  if (!familyId) {
    const membership = await prisma.familyMember.findFirst({ where: { userId: user.id } });
    familyId = membership?.familyId;
  }
  if (!familyId) throw new ApiError(400, 'No family group associated with this account');

  const payload = await buildReportPayload({
    familyId,
    type: input.type,
    language: input.language,
    consensusId: input.consensusId,
    conversationId: input.conversationId,
  });

  const record = await prisma.careerReport.create({
    data: {
      userId: user.id,
      familyId,
      type: input.type,
      language: input.language,
      status: 'READY',
      payload: json(payload),
    },
  });
  return { id: record.id, payload };
}

export async function listReports(user: User) {
  return prisma.careerReport.findMany({
    where: user.role === 'ADMIN' ? {} : { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, type: true, language: true, status: true, createdAt: true, familyId: true },
    take: 50,
  });
}

export async function getReportPayload(reportId: string, user: User) {
  const record = await prisma.careerReport.findUnique({ where: { id: reportId } });
  if (!record) throw new ApiError(404, 'Report not found');
  if (user.role !== 'ADMIN' && record.userId !== user.id) throw new ApiError(403, 'Not your report');
  return { id: record.id, type: record.type, language: record.language, createdAt: record.createdAt, payload: record.payload };
}

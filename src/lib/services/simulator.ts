import { prisma } from '@/lib/db';
import { ApiError } from '@/lib/api';
import type { SimulatorInput } from '@/lib/validation/schemas';

// ------------------------------------------------------------
// Career Reality Simulator
// Uses verified/published records where available; every forward
// looking number is labelled an estimate with stated assumptions.
// ------------------------------------------------------------

export interface EarningRow {
  level: string;
  label: string;
  monthlyMin: number;
  monthlyMax: number;
  isEstimate: boolean;
  verificationStatus: string;
  note?: string | null;
}

export interface TradeProfile {
  tradeId: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  ncoCode: string | null;
  nsqfLevel: number | null;
  durationMonths: number;
  eligibility: string | null;
  feeMin: number | null;
  feeMax: number | null;
  verificationStatus: string;
  isSynthetic: boolean;
  qualification: { code: string; title: string; nsqfLevel: number | null; progressionNote: string | null } | null;
  training: {
    durationMonths: number;
    feeMin: number | null;
    feeMax: number | null;
    providerCount: number;
    providersInState: number;
    withinBudget: boolean | null;
    budgetNote: string | null;
  };
  earnings: EarningRow[];
  employmentPathways: Array<{ type: string; title: string; description: string; isVacancy: boolean }>;
  progression: Array<{ order: number; title: string; description: string; qualification: string | null; salaryRange: string | null }>;
  furtherEducation: string | null;
  selfEmployment: boolean;
  placements: Array<{ year: number; rate: number | null; notes: string | null; verificationStatus: string }>;
  source: { name: string; url: string | null; verificationStatus: string; isSynthetic: boolean } | null;
  assumptions: string[];
}

const EXPERIENCE_MAP: Record<SimulatorInput['experienceLevel'], { levels: string[]; label: string }> = {
  FRESH: { levels: ['ENTRY'], label: 'Just trained / fresher' },
  '1_3_YEARS': { levels: ['ENTRY', 'MID'], label: '1–3 years experience' },
  '3_10_YEARS': { levels: ['MID'], label: '3–10 years experience' },
  '10_PLUS': { levels: ['MID', 'SENIOR'], label: '10+ years experience' },
};

const LEVEL_LABELS: Record<string, string> = {
  ENTRY: 'Entry level',
  MID: 'Experienced (3–8 yrs)',
  SENIOR: 'Senior / supervisory',
};

export async function getTradeProfile(
  tradeId: string,
  opts: { state?: string; budget?: number; experienceLevel?: SimulatorInput['experienceLevel'] } = {},
): Promise<TradeProfile> {
  const trade = await prisma.careerTrade.findUnique({
    where: { id: tradeId },
    include: {
      qualification: true,
      source: { select: { name: true, url: true, verificationStatus: true, isSynthetic: true } },
      salaryStats: true,
      placementStats: { orderBy: { periodYear: 'desc' }, take: 3 },
      pathways: { include: { stages: { orderBy: { order: 'asc' } } }, take: 1 },
      courses: { include: { provider: { select: { state: true, district: true, name: true } } } },
      opportunities: { take: 20 },
    },
  });
  if (!trade) throw new ApiError(404, 'Trade not found');

  const providerCount = trade.courses.length;
  const providersInState = opts.state ? trade.courses.filter((c) => c.provider.state === opts.state).length : 0;

  let withinBudget: boolean | null = null;
  let budgetNote: string | null = null;
  if (opts.budget !== undefined) {
    const cost = trade.feeMax ?? trade.feeMin ?? 0;
    withinBudget = cost <= opts.budget;
    if (!withinBudget) {
      budgetNote = `Estimated course fee (up to ₹${cost.toLocaleString('en-IN')}) exceeds the selected budget of ₹${opts.budget.toLocaleString('en-IN')}. Compare providers — fees vary by institute type.`;
    }
  }

  const earnings: EarningRow[] = trade.salaryStats
    .filter((s) =>
      opts.experienceLevel
        ? EXPERIENCE_MAP[opts.experienceLevel].levels.includes(s.experienceLevel)
        : s.experienceLevel === 'ENTRY',
    )
    .map((s) => ({
      level: s.experienceLevel,
      label: LEVEL_LABELS[s.experienceLevel] ?? s.experienceLevel,
      monthlyMin: s.monthlyMin,
      monthlyMax: s.monthlyMax,
      isEstimate: s.isEstimate,
      verificationStatus: s.verificationStatus,
      note: s.notes,
    }));

  const stages = trade.pathways[0]?.stages ?? [];
  const selfEmployment = stages.some((s) => /owner|self|business|entrepreneur|entrepreneurship/i.test(s.title + s.description));

  const assumptions = [
    'Earning figures are estimates drawn from the referenced salary records in this database, not guarantees.',
    opts.state ? `Provider availability filtered for ${opts.state}.` : 'Provider counts are national across all records.',
    'Placement figures, where present, are historical records for the stated year only.',
    'Future earnings depend on location, employer, skill level and market conditions.',
  ];

  return {
    tradeId: trade.id,
    name: trade.name,
    slug: trade.slug,
    category: trade.category,
    description: trade.description,
    ncoCode: trade.ncoCode,
    nsqfLevel: trade.nsqfLevel,
    durationMonths: trade.durationMonths,
    eligibility: trade.eligibility,
    feeMin: trade.feeMin,
    feeMax: trade.feeMax,
    verificationStatus: trade.verificationStatus,
    isSynthetic: trade.isSynthetic,
    qualification: trade.qualification
      ? {
          code: trade.qualification.code,
          title: trade.qualification.title,
          nsqfLevel: trade.qualification.nsqfLevel,
          progressionNote: trade.qualification.progressionNote,
        }
      : null,
    training: {
      durationMonths: trade.durationMonths,
      feeMin: trade.feeMin,
      feeMax: trade.feeMax,
      providerCount,
      providersInState,
      withinBudget,
      budgetNote,
    },
    earnings,
    employmentPathways: trade.opportunities.map((o) => ({
      type: o.employmentType,
      title: o.title,
      description: o.description,
      isVacancy: o.isVacancy,
    })),
    progression: stages.map((s) => ({
      order: s.order,
      title: s.title,
      description: s.description,
      qualification: s.qualification,
      salaryRange: s.salaryRange,
    })),
    furtherEducation: trade.qualification?.progressionNote ?? null,
    selfEmployment,
    placements: trade.placementStats.map((p) => ({
      year: p.periodYear,
      rate: p.placementRate,
      notes: p.notes,
      verificationStatus: p.verificationStatus,
    })),
    source: trade.source,
    assumptions,
  };
}

export interface ComparisonResult {
  a: TradeProfile;
  b: TradeProfile;
  rows: Array<{
    parameter: string;
    parameterHi: string;
    a: string;
    b: string;
    advantage: 'A' | 'B' | 'EQUAL' | 'NEUTRAL';
  }>;
  generatedAt: string;
}

function feeText(t: TradeProfile): string {
  if (t.feeMin && t.feeMax) return `₹${t.feeMin.toLocaleString('en-IN')} – ₹${t.feeMax.toLocaleString('en-IN')}`;
  if (t.feeMin) return `From ₹${t.feeMin.toLocaleString('en-IN')}`;
  return 'Not available';
}

function earningText(t: TradeProfile): string {
  const rows = t.earnings.length ? t.earnings : [];
  if (rows.length === 0) return 'No salary record available';
  const parts = rows.map((r) => `${r.label}: ₹${r.monthlyMin.toLocaleString('en-IN')}–₹${r.monthlyMax.toLocaleString('en-IN')}`);
  return parts.join(' | ');
}

export function compareTrades(a: TradeProfile, b: TradeProfile): ComparisonResult {
  const num = (v: number | null | undefined) => v ?? Number.MAX_SAFE_INTEGER;
  const rows: ComparisonResult['rows'] = [
    {
      parameter: 'Training duration',
      parameterHi: 'प्रशिक्षण अवधि',
      a: `${a.training.durationMonths} months`,
      b: `${b.training.durationMonths} months`,
      advantage: a.training.durationMonths === b.training.durationMonths ? 'EQUAL' : a.training.durationMonths < b.training.durationMonths ? 'A' : 'B',
    },
    {
      parameter: 'Training cost (fee range)',
      parameterHi: 'प्रशिक्षण लागत',
      a: feeText(a),
      b: feeText(b),
      advantage: num(a.feeMax) === num(b.feeMax) ? 'EQUAL' : num(a.feeMax) < num(b.feeMax) ? 'A' : 'B',
    },
    {
      parameter: 'Qualification',
      parameterHi: 'योग्यता',
      a: a.qualification ? `${a.qualification.title}${a.nsqfLevel ? ` (NSQF L${a.nsqfLevel})` : ''}` : a.nsqfLevel ? `NSQF Level ${a.nsqfLevel}` : 'Not specified',
      b: b.qualification ? `${b.qualification.title}${b.nsqfLevel ? ` (NSQF L${b.nsqfLevel})` : ''}` : b.nsqfLevel ? `NSQF Level ${b.nsqfLevel}` : 'Not specified',
      advantage: 'NEUTRAL',
    },
    {
      parameter: 'Earning potential (monthly, estimate)',
      parameterHi: 'कमाई की संभावना (मासिक, अनुमान)',
      a: earningText(a),
      b: earningText(b),
      advantage: 'NEUTRAL',
    },
    {
      parameter: 'Employment opportunities recorded',
      parameterHi: 'दर्ज रोज़गार अवसर',
      a: `${a.employmentPathways.length} pathways`,
      b: `${b.employmentPathways.length} pathways`,
      advantage: a.employmentPathways.length === b.employmentPathways.length ? 'EQUAL' : a.employmentPathways.length > b.employmentPathways.length ? 'A' : 'B',
    },
    {
      parameter: 'Career progression stages',
      parameterHi: 'करियर प्रगति चरण',
      a: `${a.progression.length} stages`,
      b: `${b.progression.length} stages`,
      advantage: a.progression.length === b.progression.length ? 'EQUAL' : a.progression.length > b.progression.length ? 'A' : 'B',
    },
    {
      parameter: 'Further education options',
      parameterHi: 'आगे की पढ़ाई के विकल्प',
      a: a.furtherEducation ?? 'Not specified in records',
      b: b.furtherEducation ?? 'Not specified in records',
      advantage: 'NEUTRAL',
    },
    {
      parameter: 'Training providers recorded',
      parameterHi: 'दर्ज प्रशिक्षण प्रदाता',
      a: `${a.training.providerCount} total`,
      b: `${b.training.providerCount} total`,
      advantage: a.training.providerCount === b.training.providerCount ? 'EQUAL' : a.training.providerCount > b.training.providerCount ? 'A' : 'B',
    },
  ];
  return { a, b, rows, generatedAt: new Date().toISOString() };
}

export async function runComparison(tradeIds: [string, string], opts: { state?: string } = {}): Promise<ComparisonResult> {
  const [a, b] = await Promise.all([getTradeProfile(tradeIds[0], opts), getTradeProfile(tradeIds[1], opts)]);
  return compareTrades(a, b);
}

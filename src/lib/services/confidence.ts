import { prisma, json } from '@/lib/db';
import { ApiError } from '@/lib/api';
import type { ConfidenceInput } from '@/lib/validation/schemas';

// ------------------------------------------------------------
// Family Career Confidence Score — explainable 0–100.
// Five dimensions × 0–4 answers → 0–20 each → sum = 0–100.
// Explicitly NOT a psychological assessment.
// ------------------------------------------------------------

export const CONFIDENCE_DIMENSIONS = [
  {
    key: 'awareness',
    label: 'Awareness of vocational education',
    labelHi: 'वोकेशनल शिक्षा की जानकारी',
    question: 'How well do you understand what vocational education includes?',
    questionHi: 'आप वोकेशनल शिक्षा में क्या-क्या शामिल है, कितनी अच्छी तरह जानते हैं?',
  },
  {
    key: 'employmentTrust',
    label: 'Trust in employment information',
    labelHi: 'रोज़गार जानकारी पर भरोसा',
    question: 'How much do you trust the employment information available to you?',
    questionHi: 'उपलब्ध रोज़गार जानकारी पर आप कितना भरोसा करते हैं?',
  },
  {
    key: 'salaryUnderstanding',
    label: 'Understanding of salary opportunities',
    labelHi: 'वेतन के अवसरों की समझ',
    question: 'How clear are you about realistic earning ranges in skilled trades?',
    questionHi: 'स्किल्ड ट्रेड में वास्तविक कमाई के दायरे की आपको कितनी स्पष्ट समझ है?',
  },
  {
    key: 'progressionAwareness',
    label: 'Awareness of career progression',
    labelHi: 'करियर प्रगति की जानकारी',
    question: 'How clearly do you see growth steps after entry-level work?',
    questionHi: 'शुरुआती काम के बाद आगे बढ़ने के चरण कितने स्पष्ट दिखते हैं?',
  },
  {
    key: 'willingness',
    label: 'Willingness to consider vocational education',
    labelHi: 'वोकेशनल शिक्षा पर विचार करने की इच्छा',
    question: 'How willing is your family to seriously consider a vocational option?',
    questionHi: 'आपका परिवार किसी वोकेशनल विकल्प को गंभीरता से विचार करने को कितना तैयार है?',
  },
] as const;

export interface ConfidenceResult {
  overallScore: number;
  dimensions: Record<string, { raw: number; score: number; label: string; labelHi: string }>;
  phase: 'PRE' | 'POST';
}

export function computeConfidenceScore(
  answers: ConfidenceInput['answers'],
  phase: 'PRE' | 'POST',
): ConfidenceResult {
  const dimensions: ConfidenceResult['dimensions'] = {};
  let total = 0;
  for (const dim of CONFIDENCE_DIMENSIONS) {
    const raw = Math.max(0, Math.min(4, Number(answers[dim.key as keyof typeof answers] ?? 0)));
    const score = Math.round((raw / 4) * 20);
    total += score;
    dimensions[dim.key] = { raw, score, label: dim.label, labelHi: dim.labelHi };
  }
  return { overallScore: total, dimensions, phase };
}

export async function recordConfidence(input: ConfidenceInput): Promise<ConfidenceResult & { id: string }> {
  const family = await prisma.family.findUnique({ where: { id: input.familyId } });
  if (!family) throw new ApiError(404, 'Family not found');
  const result = computeConfidenceScore(input.answers, input.phase);
  const record = await prisma.confidenceAssessment.create({
    data: {
      familyId: input.familyId,
      phase: input.phase,
      userId: undefined,
      answers: json(input.answers),
      dimensions: json(result.dimensions),
      overallScore: result.overallScore,
    },
  });
  return { ...result, id: record.id };
}

export interface ConfidenceHistory {
  id: string;
  phase: 'PRE' | 'POST';
  overallScore: number;
  createdAt: string;
  dimensions: Record<string, { raw: number; score: number; label: string; labelHi: string }>;
}

export interface ConfidenceComparison {
  familyId: string;
  pre: ConfidenceHistory | null;
  post: ConfidenceHistory | null;
  change: number | null;
  latestScore: number | null;
  weakestDimensions: Array<{ key: string; label: string; score: number }>;
  disclaimer: string;
}

export async function getConfidenceComparison(familyId: string): Promise<ConfidenceComparison> {
  const records = await prisma.confidenceAssessment.findMany({
    where: { familyId },
    orderBy: { createdAt: 'asc' },
  });
  const preRec = records.find((r) => r.phase === 'PRE');
  const postRec = [...records].reverse().find((r) => r.phase === 'POST');
  const toHistory = (r: NonNullable<typeof preRec>): ConfidenceHistory => ({
    id: r.id,
    phase: r.phase,
    overallScore: r.overallScore,
    createdAt: r.createdAt.toISOString(),
    dimensions: r.dimensions as ConfidenceHistory['dimensions'],
  });
  const pre = preRec ? toHistory(preRec) : null;
  const post = postRec ? toHistory(postRec) : null;
  const latest = records[records.length - 1];
  const dims = (latest?.dimensions ?? post?.dimensions ?? pre?.dimensions ?? {}) as ConfidenceHistory['dimensions'];
  const weakest = Object.entries(dims)
    .map(([key, v]) => ({ key, label: v.label, score: v.score }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 2);
  return {
    familyId,
    pre,
    post,
    change: pre && post ? post.overallScore - pre.overallScore : null,
    latestScore: latest?.overallScore ?? null,
    weakestDimensions: weakest,
    disclaimer:
      'This is a self-reported awareness score for counselling follow-up. It is not a psychological assessment and does not predict enrolment or employment.',
  };
}

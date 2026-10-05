import type { AssessmentKind } from '@prisma/client';
import { prisma, json } from '@/lib/db';

// ------------------------------------------------------------
// Structured assessment scoring. Each questionnaire is a set of
// 0–4 answers; scoring is transparent and fully deterministic.
// ------------------------------------------------------------

export const STUDENT_INTEREST_QUESTIONS = [
  { id: 'q1', text: 'How much do you enjoy working with your hands / tools?', textHi: 'क्या आपको हाथों और औज़ारों से काम करना अच्छा लगता है?' },
  { id: 'q2', text: 'How interested are you in computers and digital tools?', textHi: 'कंप्यूटर और डिजिटल उपकरणों में कितनी रुचि है?' },
  { id: 'q3', text: 'How much do you enjoy designing or making things?', textHi: 'क्या डिज़ाइन या निर्माण करना अच्छा लगता है?' },
  { id: 'q4', text: 'How comfortable are you helping and dealing with people?', textHi: 'लोगों से बात करने और मदद करने में कितना आराम है?' },
  { id: 'q5', text: 'How interested are you in starting your own work someday?', textHi: 'भविष्य में अपना काम शुरू करने में कितनी रुचि है?' },
  { id: 'q6', text: 'How much do you like science / machines / electrical work?', textHi: 'विज्ञान, मशीनें या बिजली का काम कितना पसंद है?' },
  { id: 'q7', text: 'How important is a stable, reputed job to you?', textHi: 'स्थिर और सम्मानित नौकरी आपके लिए कितनी ज़रूरी है?' },
  { id: 'q8', text: 'How eager are you to keep learning new skills?', textHi: 'नई स्किल सीखते रहने की कितनी इच्छा है?' },
] as const;

export const PARENT_EXPECTATION_QUESTIONS = [
  { id: 'p1', text: 'How important is a government / secure job for your child?', textHi: 'बच्चे के लिए सरकारी / सुरक्षित नौकरी कितनी ज़रूरी है?' },
  { id: 'p2', text: 'How important is monthly income stability?', textHi: 'हर महीने स्थिर आय कितनी ज़रूरी है?' },
  { id: 'p3', text: 'How open are you to vocational / skill-based education?', textHi: 'वोकेशनल / स्किल आधारित शिक्षा के प्रति कितने खुले हैं?' },
  { id: 'p4', text: 'How concerned are you about course fees and costs?', textHi: 'कोर्स की फीस और लागत की कितनी चिंता है?' },
  { id: 'p5', text: 'How important is social reputation in career choice?', textHi: 'करियर चुनने में समाज में प्रतिष्ठा कितनी मायने रखती है?' },
  { id: 'p6', text: 'How important is the option of further education later?', textHi: 'बाद में आगे की पढ़ाई के विकल्प कितने ज़रूरी हैं?' },
] as const;

export interface ScoredAssessment {
  kind: AssessmentKind;
  dimensions: Record<string, number>;
  overall: number;
  interpretation: string;
  interpretationHi: string;
}

function clamp4(v: unknown): number {
  const n = Number(v);
  if (Number.isNaN(n)) return 2;
  return Math.max(0, Math.min(4, n));
}

export function scoreStudentInterest(answers: Record<string, unknown>): ScoredAssessment {
  const a = clamp4(answers.q1);
  const b = clamp4(answers.q2);
  const c = clamp4(answers.q3);
  const d = clamp4(answers.q4);
  const e = clamp4(answers.q5);
  const f = clamp4(answers.q6);
  const g = clamp4(answers.q7);
  const h = clamp4(answers.q8);
  const dimensions = {
    'Hands-on & technical': Math.round(((a + f) / 8) * 100),
    'Digital & computing': Math.round((b / 4) * 100),
    'Design & creativity': Math.round((c / 4) * 100),
    'People & service': Math.round((d / 4) * 100),
    'Entrepreneurship drive': Math.round((e / 4) * 100),
    'Job stability value': Math.round((g / 4) * 100),
    'Learning motivation': Math.round((h / 4) * 100),
  };
  const overall = Math.round(
    Object.values(dimensions).reduce((s, v) => s + v, 0) / Object.values(dimensions).length,
  );
  return {
    kind: 'STUDENT_INTEREST',
    dimensions,
    overall,
    interpretation: 'Indicative interest profile — used to suggest vocational pathways, not a psychological test.',
    interpretationHi: 'संकेतात्मक रुचि प्रोफ़ाइल — वोकेशनल मार्ग सुझाने के लिए, मनोवैज्ञानिक परीक्षण नहीं।',
  };
}

export function scoreParentExpectations(answers: Record<string, unknown>): ScoredAssessment {
  const p1 = clamp4(answers.p1);
  const p2 = clamp4(answers.p2);
  const p3 = clamp4(answers.p3);
  const p4 = clamp4(answers.p4);
  const p5 = clamp4(answers.p5);
  const p6 = clamp4(answers.p6);
  const dimensions = {
    'Security priority': Math.round(((p1 + p2) / 8) * 100),
    'Openness to vocational paths': Math.round((p3 / 4) * 100),
    'Financial sensitivity': Math.round((p4 / 4) * 100),
    'Reputation sensitivity': Math.round((p5 / 4) * 100),
    'Value on further education': Math.round((p6 / 4) * 100),
  };
  const overall = Math.round(
    Object.values(dimensions).reduce((s, v) => s + v, 0) / Object.values(dimensions).length,
  );
  return {
    kind: 'PARENT_EXPECTATIONS',
    dimensions,
    overall,
    interpretation: 'Shows where parents and students may need conversation — not a judgement of parenting.',
    interpretationHi: 'यह दिखाता है कि अभिभावक और विद्यार्थी कहाँ बातचीत कर सकते हैं — अभिभावकत्व का आकलन नहीं।',
  };
}

export function scoreAssessment(kind: AssessmentKind, answers: Record<string, unknown>): ScoredAssessment {
  switch (kind) {
    case 'STUDENT_INTEREST':
      return scoreStudentInterest(answers);
    case 'PARENT_EXPECTATIONS':
      return scoreParentExpectations(answers);
    default: {
      const keys = Object.keys(answers);
      const overall = keys.length
        ? Math.round((keys.reduce((s, k) => s + clamp4(answers[k]), 0) / (keys.length * 4)) * 100)
        : 0;
      return {
        kind,
        dimensions: { Context: overall },
        overall,
        interpretation: 'Family context snapshot.',
        interpretationHi: 'पारिवारिक संदर्भ की झलक।',
      };
    }
  }
}

export async function saveAssessment(params: {
  userId: string;
  familyId?: string | null;
  kind: AssessmentKind;
  answers: Record<string, unknown>;
}) {
  const scored = scoreAssessment(params.kind, params.answers);
  return prisma.careerAssessment.create({
    data: {
      userId: params.userId,
      familyId: params.familyId ?? undefined,
      kind: params.kind,
      answers: json(params.answers),
      scores: json({ dimensions: scored.dimensions, overall: scored.overall }),
      summary: scored.interpretation,
    },
  });
}

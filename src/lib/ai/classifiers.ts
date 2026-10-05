import type { AppLanguage, ConcernCategory } from '@prisma/client';
import type { AnalysisResult, Intent, SentimentLabel } from './types';

// ------------------------------------------------------------
// Language detection (Devanagari → Hindi, otherwise English)
// ------------------------------------------------------------
export function detectLanguage(text: string): AppLanguage {
  const devanagari = text.match(/[\u0900-\u097F]/g);
  if (devanagari && devanagari.length >= 3) return 'HI';
  const hindiRoman = /\b(kya|hai|hoga|mera|mere|bachche|padhai|naukri|paise|kamai|rishtedar|samaj|kendra|sarkari|fikr|pareshan|tarika|batao|suno|samajh|kyu|kyun|nahi|achhi|zyada|behtar|bhavishya|kaunsa|kaise|hoti|hoti hai)\b/i;
  if (hindiRoman.test(text)) return 'HI';
  return 'EN';
}

// ------------------------------------------------------------
// Concern classification (parent objection analyzer)
// ------------------------------------------------------------
type KeywordSet = { en: RegExp; hi: RegExp };

const CONCERN_PATTERNS: Record<Exclude<ConcernCategory, 'OTHER'>, KeywordSet> = {
  LOW_SALARY: {
    en: /\b(salary|stipend|pay|wage|earn|income|money|paisa|low pay|earning|kitna|kamayeg[ae])\b/i,
    // Accept both nukta and non-nukta spellings: \u0924\u0928\u0916\u093c\u093e (\u0924\u0928\u0916\u093c\u093e) and
    // the far more common \u0924\u0928\u0916\u094d\u0935\u093e\u0939 (\u0924\u0928\u0916\u094d\u0935\u093e\u0939).
    hi: /(\u0915\u092e\u093e\u0908|\u0935\u0947\u0924\u0928|\u0924\u0928\u0916\u094d\u0935\u093e\u0939|\u0924\u0928\u0916\u093c\u093e|\u0915\u0930\u094d\u092e|\u092a\u0948\u0938\u0947|\u0915\u093e\u092e \u0915\u0930|\u0938\u0947\u0932\u0947\u0930\u0940|\u0935\u0947\u0924\u0928 \u0915\u093f\u0924\u0928\u093e)|\b(kamai|vetan|tankhwah)\b/i,
  },
  JOB_SECURITY: {
    en: /\b(job security|secure|guarantee|guaranteed|permanent|stable|stability|risk|unemployment|job milega|placement|future safe)\b/i,
    // "नौकरी की सुरक्षा" / "रोज़गार सुरक्षा" — the optional (?:की\s*)? keeps this from
    // being mistaken for the bare word "सुरक्षा" (SAFETY) when नौकरी is present.
    hi: /(\u0928\u094c\u0915\u0930\u0940\s*(?:\u0915\u0940\s*)?\u0938\u0941\u0930\u0915\u094d\u0937\u093e|\u0930\u094b\u091c\u093c\u0917\u093e\u0930\s*(?:\u0915\u0940\s*)?\u0938\u0941\u0930\u0915\u094d\u0937\u093e|\u092d\u0930\u094b\u0938\u0940|\u0915\u094d\u092f\u093e \u0930\u0916\u0947\u0917\u093e|\u091a\u093e\u0915\u0940|\u0938\u094d\u0925\u093f\u0930\u0940|\u0915\u093e\u092e \u092e\u093f\u0932\u0947\u0917\u093e|\u092d\u0930\u093f\u0936\u094d\u0930 \u0928\u0939\u0940\u0902)|\b(job security|sarkari naukri)\b/i,
  },
  SOCIAL_STATUS: {
    en: /\b(society|social|status|respect|izzat|log kya kahenge|reputation|prestige|shame|embarrass|neighbour|log)\b/i,
    hi: /(\u0938\u092e\u093e\u091c|\u092e\u093e\u0928\u092f\u0924\u093e|\u091c\u093e\u0928|\u092e\u093e\u0928|\u0938\u092e\u094d\u092e\u093e\u0928 \u092e\u0947\u0902|\u0932\u094b\u0917 \u0915\u094d\u092f\u093e \u0915\u0939\u0947\u0902\u0917\u0947|\u091f\u094b\u0915\u0940|\u092c\u0926\u0928\u093e\u094b\u092e\u094d\u0930\u0928)|\b(izzat|samaj me izzat)\b/i,
  },
  SAFETY: {
    en: /\b(safety|safe|danger|dangerous|injury|accident|girl|daughter|women|harass|hostel|away from home|distance)\b/i,
    hi: /(\u0938\u0941\u0930\u0915\u094d\u0937\u093e|\u0916\u0924\u0930\u093e|\u0926\u0941\u0930\u094d\u0918\u091f\u0928\u093e|\u092c\u0947\u091f\u0940|\u0932\u0921\u093c\u0940 \u0915\u0940 \u0938\u0941\u0930\u0915\u094d\u0937\u093e|\u0906\u0902\u091a\u0932 \u0915\u0940 \u091a\u093f\u0902\u0924\u093e)|\b(suraksha|ladki)\b/i,
  },
  TRADITIONAL_DEGREE: {
    en: /\b(degree|graduation|b\.?a\.?|b\.?sc|b\.?tech|bca|traditional|college|university|ba bsc|non.?vocational|superior)\b/i,
    hi: /(\u0921\u093f\u0917\u094d\u0930\u0940|\u0938\u094d\u0928\u093e\u0924\u0915 \u0921\u093f\u0917\u094d\u0930\u0940|\u092a\u0930\u0902\u092a\u093e|\u0915\u094b\u0932\u0947\u091c|\u0921\u0947\u0917\u094d\u0930\u0940 \u0939\u0940 \u091c\u094d\u092f\u093e\u0926\u093e|\u092c\u0947\u0939\u0924\u0930 \u0921\u093f\u0917\u094d\u0930\u0940)|\b(degree achhi|honors)\b/i,
  },
  FURTHER_EDUCATION: {
    en: /\b(further education|higher studies|masters|mba|m\.?tech|polytechnic diploma|b\.?tech after|study further|continue study|graduation after)\b/i,
    hi: /(\u0906\u0917\u0947 \u092a\u0922\u093c\u093e\u0908|\u0909\u0939\u0930 \u0936\u093f\u0915\u094d\u0937\u093e|\u092a\u091b\u091a\u093e \u0915\u0940 \u092a\u0922\u093c\u093e\u0908|\u0921\u093f\u092a\u094d\u0932\u094b\u092e\u093e|\u092e\u093e\u0938\u094d\u0924\u0930 \u0921\u093f\u0917\u094d\u0930\u0940)|\b(aage padhai)\b/i,
  },
  FINANCIAL_LIMITATION: {
    en: /\b(cost|fee|fees|expensive|afford|cannot afford|loan|debt|money problem|budget|poor|middle class|broke|investment)\b/i,
    hi: /(\u092b\u0940\u091c\u093c\u0915\u094b \u0924\u0915\u0932\u0940\u092b\u0940|\u092a\u0948\u0938\u0947 \u0928\u0939\u0940\u0902|\u092e\u0939\u0902\u0917\u094d\u092f\u0924\u093e|\u0928\u0941\u0915\u094d\u0938\u0928\u0940|\u0915\u0930\u094d\u091c\u0915\u0930 \u0928\u0939\u0940\u0902|\u091c\u0947\u092c \u0928\u0939\u0940\u0902|\u0909\u0928\u094d\u0939\u0947\u0902 \u092c\u091c\u0947 \u0928\u0939\u0940\u0902)|\b(fees jyada|emihan|loan lena)\b/i,
  },
  LACK_OF_AWARENESS: {
    en: /\b(don'?t know|never heard|unaware|confused|clueless|what is iti|what is vocational|awareness|information nahi|kya hota hai|samajh nahi)\b/i,
    hi: /(\u0928\u0939\u0940\u0902 \u092e\u093e\u0932\u0942\u092e|\u092a\u0924\u093e \u0928\u0939\u0940\u0902|\u0915\u094d\u092f\u093e \u0939\u094b\u0924\u093e \u0939\u0948|\u0938\u092e\u091d \u0928\u0939\u0940\u0902|\u091c\u093e\u0928\u0915\u093e\u0930\u0940 \u0928\u0939\u0940\u0902|\u092e\u093e\u0932\u0942\u092e \u0928\u0939\u0940\u0902)|\b(pata nahi|jaankari nahi)\b/i,
  },
  FAMILY_PRESSURE: {
    en: /\b(relatives|pressure|forced|insist|family says|father wants|mother wants|society pressure|no choice|shadi|marriage)\b/i,
    hi: /(\u091a\u093e\u091a\u094b\u0902 \u0915\u093e \u0926\u092c\u093e\u0935|\u092a\u0930\u093f\u0935\u093e\u0930|\u092a\u093e\u092a\u093e \u0915\u0940 \u0939\u093f\u0926\u093e\u092f\u0924|\u0918\u0930 \u0935\u093e\u0932\u0947 \u0915\u0947 \u0915\u0939\u0928\u093e|\u0926\u0941\u0938\u0930\u0940 \u0915\u093e \u0926\u092c\u093e\u0935|\u092e\u0928\u094d\u0928 \u0915\u0940 \u091a\u093e\u0939)|\b(dabav|rishtedar)\b/i,
  },
};

const INTENT_PATTERNS: Array<{ intent: Intent; re: RegExp }> = [
  { intent: 'ESCALATION_REQUEST', re: /\b(human|counsellor|counselor|advisor|talk to someone|call me|baat karao|व्यक्ति|परामर्शदाता|किसी से बात)\b/i },
  { intent: 'SALARY_QUERY', re: /\b(salary|pay|earn|income|kamai|कमाई|वेतन|कितना कमाए|stipend)\b/i },
  { intent: 'JOB_SECURITY_QUERY', re: /\b(job security|guarantee|placement|future|naukri|नौकरी|भविष्य|secure)\b/i },
  { intent: 'FURTHER_EDUCATION_QUERY', re: /\b(further education|higher study|masters|b\.?tech|graduation|degree|आगे पढ़|डिग्री|उच्च शिक्षा)\b/i },
  { intent: 'SCHEME_QUERY', re: /\b(scheme|scholarship|yojana|योजना|सरकारी मदद|pmkv|पीएमकेवाई|subsidy|stipend)\b/i },
  { intent: 'COMPARISON_QUERY', re: /\b(compare|versus|vs\b|better|behtar|तुलना|बेहतर|difference)\b/i },
  { intent: 'CAREER_INFO', re: /\b(career|trade|course|job role|iti|nsqf|training|apprentice|kriya|करियर|पाठ्यक्रम|व्यावसायिक|ट्रेड)\b/i },
  { intent: 'GREETING', re: /^\s*(hi|hello|namaste|namaskar|hii|hey|नमस्ते|नमस्कार)\b/i },
  { intent: 'FEEDBACK', re: /\b(thank|thanks|dhanyavad|धन्यवाद|helpful|good job|बहुत अच्छा)\b/i },
  { intent: 'COMPLAINT', re: /\b(useless|waste|complaint|bad service|frustrated|angry|shikayat|गलत|शिकायत)\b/i },
];

// ------------------------------------------------------------
// Sentiment (lexicon based, EN + HI) — used for aggregate analytics
// ------------------------------------------------------------
const POSITIVE_EN = ['good', 'great', 'excellent', 'happy', 'confident', 'hope', 'thanks', 'helpful', 'clear', 'better', 'trust', 'agree', 'interested', 'good idea'];
const NEGATIVE_EN = ['bad', 'worried', 'worry', 'fear', 'scared', 'risk', 'useless', 'waste', 'angry', 'confused', 'doubt', 'unsafe', 'poor', 'no future', 'regret', 'against'];
const POSITIVE_HI = ['अच्छा', 'बढ़िया', 'शुक्रिया', 'धन्यवाद', 'भरोसा', 'खुश', 'सहमत', 'उम्मीद', 'बेहतर', 'ठीक'];
const NEGATIVE_HI = ['डर', 'फिक्र', 'चिंता', 'बुरा', 'खराब', 'बेकार', 'रिस्क', 'असुरक्षित', 'गरीब', 'निराश', 'झूठ'];

export function analyzeSentiment(text: string): { label: SentimentLabel; score: number } {
  const lower = ` ${text.toLowerCase()} `;
  let score = 0;
  for (const w of POSITIVE_EN) if (lower.includes(` ${w} `)) score += 1;
  for (const w of NEGATIVE_EN) if (lower.includes(` ${w} `)) score -= 1;
  for (const w of POSITIVE_HI) if (text.includes(w)) score += 1;
  for (const w of NEGATIVE_HI) if (text.includes(w)) score -= 1;
  const normalized = Math.max(-1, Math.min(1, score / 3));
  let label: SentimentLabel = 'NEUTRAL';
  if (score >= 1) label = 'POSITIVE';
  else if (score <= -2) label = 'NEGATIVE';
  else if (score === -1) label = 'MIXED';
  return { label, score: normalized };
}

export function classifyIntent(text: string): Intent {
  for (const { intent, re } of INTENT_PATTERNS) {
    if (re.test(text)) return intent;
  }
  return 'GENERAL_QUERY';
}

export function classifyConcern(text: string): { concern: ConcernCategory; confidence: number } {
  const scores: Array<{ concern: ConcernCategory; score: number }> = [];
  for (const [key, set] of Object.entries(CONCERN_PATTERNS) as Array<
    [Exclude<ConcernCategory, 'OTHER'>, KeywordSet]
  >) {
    const enHit = set.en.test(text) ? 1 : 0;
    const hiHit = set.hi.test(text) ? 1 : 0;
    const score = enHit + hiHit * 1.2;
    if (score > 0) scores.push({ concern: key, score });
  }
  if (scores.length === 0) return { concern: 'OTHER', confidence: 0.2 };
  scores.sort((a, b) => b.score - a.score);
  const top = scores[0]!;
  const total = scores.reduce((s, x) => s + x.score, 0);
  const confidence = Math.min(0.95, 0.55 + (top.score / total) * 0.4);
  return { concern: top.concern, confidence: Number(confidence.toFixed(2)) };
}

const ESCALATION_RE = /\b(talk to a (human|person|counsellor|counselor)|human counsellor|call me back|reach me|से बात करनी है|व्यक्तिगत बात|बात कराओ)\b/i;

/** Full pipeline: language → intent → concern → sentiment. */
export function analyzeMessage(text: string): AnalysisResult {
  const language = detectLanguage(text);
  const intent = classifyIntent(text);
  const { concern, confidence } = classifyConcern(text);
  const sentiment = analyzeSentiment(text);
  return {
    language,
    intent,
    concern,
    concernConfidence: confidence,
    sentiment: sentiment.label,
    sentimentScore: sentiment.score,
    wantsHuman: ESCALATION_RE.test(text) || intent === 'ESCALATION_REQUEST',
  };
}

export const CONCERN_LABELS: Record<ConcernCategory, { en: string; hi: string }> = {
  LOW_SALARY: { en: 'Low salary concerns', hi: 'कम वेतन की चिंता' },
  JOB_SECURITY: { en: 'Job security concerns', hi: 'नौकरी की सुरक्षा की चिंता' },
  SOCIAL_STATUS: { en: 'Social status concerns', hi: 'सामाजिक प्रतिष्ठा की चिंता' },
  SAFETY: { en: 'Safety concerns', hi: 'सुरक्षा की चिंता' },
  TRADITIONAL_DEGREE: { en: 'Preference for traditional degree', hi: 'पारंपरिक डिग्री की प्राथमिकता' },
  FURTHER_EDUCATION: { en: 'Further education concerns', hi: 'आगे की पढ़ाई की चिंता' },
  FINANCIAL_LIMITATION: { en: 'Financial limitations', hi: 'आर्थिक सीमा' },
  LACK_OF_AWARENESS: { en: 'Lack of awareness', hi: 'जानकारी का अभाव' },
  FAMILY_PRESSURE: { en: 'Family / social pressure', hi: 'परिवार / समाज का दबाव' },
  OTHER: { en: 'Other concern', hi: 'अन्य चिंता' },
};

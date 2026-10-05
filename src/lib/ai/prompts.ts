import type { AppLanguage, ConcernCategory } from '@prisma/client';
import { CONCERN_LABELS } from './classifiers';
import { tokenize } from './retrieval';
import type { AnalysisResult, LLMMessage, RetrievedChunk } from './types';

// ------------------------------------------------------------
// System prompts (evidence-grounded, non-fabricating)
// ------------------------------------------------------------

export function buildSystemPrompt(language: AppLanguage, userRole: string): string {
  const langName = language === 'HI' ? 'Hindi (Devanagari script)' : 'English';
  return `You are PATHALIGN AI, a respectful vocational career counsellor for Indian students and parents.

Rules:
1. Always respond in ${langName}.
2. You are speaking to a ${userRole.toLowerCase()}. Be patient, respectful and simple in language — many users have limited digital literacy.
3. ONLY use facts from the CONTEXT block provided. Never invent salaries, placement rates, government schemes, qualification recognition or job guarantees.
4. If the context does not contain the answer, say clearly that this is not verified in your knowledge base and suggest a human counsellor.
5. When you use a number or claim from context, keep it accurate; do not round up or exaggerate.
6. Acknowledge the person's concern before explaining. Ask one clear follow-up question at the end.
7. Never pressure the student or the parent. Present options and evidence so the family can decide together.
8. If a figure is an estimate rather than an official published figure, label it as an estimate.`;
}

export function buildContextBlock(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return 'CONTEXT: (no verified documents retrieved for this question)';
  const block = chunks
    .map((c, i) => {
      const src = c.source
        ? `${c.source.name}${c.source.url ? ` (${c.source.url})` : ''} — status: ${c.source.verificationStatus}${c.source.isSynthetic ? ', synthetic demo record' : ''}`
        : 'no source attached';
      return `[${i + 1}] ${c.title} (${c.docType})\nSource: ${src}\n${c.chunk}`;
    })
    .join('\n\n');
  return `CONTEXT:\n${block}`;
}

export function buildUserPrompt(history: LLMMessage[], userMessage: string, chunks: RetrievedChunk[]): LLMMessage[] {
  const context = buildContextBlock(chunks);
  const transcript = history
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'Parent/Student' : 'AI'}: ${m.content}`)
    .join('\n');
  return [
    { role: 'system' as const, content: `${context}\n\nTRANSCRIPT SO FAR:\n${transcript || '(none)'}` },
    { role: 'user' as const, content: userMessage },
  ];
}

// ------------------------------------------------------------
// Rule-based grounded generator (demo mode — no external API)
// ------------------------------------------------------------

const OPENERS: Record<ConcernCategory, { en: string[]; hi: string[] }> = {
  LOW_SALARY: {
    en: [
      'Your concern about earnings is very common among parents, and it is fair to ask this question.',
      'It is natural to worry about whether the income will be enough for the family.',
    ],
    hi: [
      'कमाई के बारे में चिंता अधिकांश माता-पिता को होती है, यह सवाल बिल्कुल जायज है।',
      'यह सोचना स्वाभाविक है कि आय पर्याप्त होगी या नहीं।',
    ],
  },
  JOB_SECURITY: {
    en: ['Job security is one of the most important questions before choosing any course.'],
    hi: ['कोई भी कोर्स चुनने से पहले नौकरी की सुरक्षा सबसे ज़रूरी सवाल है।'],
  },
  SOCIAL_STATUS: {
    en: [
      'What society thinks matters to every family. The good news is that skilled trades now have clearly defined career ladders in many sectors.',
    ],
    hi: [
      'समाज की सोच हर परिवार के लिए मायने रखती है। अच्छी बात यह है कि कई क्षेत्रों में स्किल्ड ट्रेड के लिए स्पष्ट करियर लैडर बन चुके हैं।',
    ],
  },
  SAFETY: {
    en: ['Safety — especially of daughters and younger students — is a valid family concern.'],
    hi: ['सुरक्षा — विशेषकर बेटियों और छोटे विद्यार्थियों की — परिवार की जायज चिंता है।'],
  },
  TRADITIONAL_DEGREE: {
    en: [
      'Many parents understandably prefer a traditional degree. Both routes have value — what matters is recognition, skill and progression.',
    ],
    hi: [
      'कई माता-पिता स्वाभाविक रूप से पारंपरिक डिग्री को बेहतर मानते हैं। दोनों मार्गों का अपना महत्व है — महत्व पहचान, स्किल और प्रगति का है।',
    ],
  },
  FURTHER_EDUCATION: {
    en: ['Vocational training does not always close the door to higher education — recognition and eligibility rules decide that.'],
    hi: [
      'वोकेशनल ट्रेनिंग हमेशा उच्च शिक्षा का दरवाज़ा बंद नहीं करती — मान्यता और पात्रता नियम ही तय करते हैं।',
    ],
  },
  FINANCIAL_LIMITATION: {
    en: ['Course cost and family budget are practical concerns. Let us look at duration, fees and available support objectively.'],
    hi: ['कोर्स की फीस और परिवार का बजट व्यावहारिक चिंताएँ हैं। अवधि, फीस और उपलब्ध सहायता को वस्तुनिष्ठ रूप से देखते हैं।'],
  },
  LACK_OF_AWARENESS: {
    en: ['It is completely okay to not know about vocational pathways — most families are never told about them clearly.'],
    hi: [
      'वोकेशनल मार्गों के बारे में न जानना पूरी तरह स्वाभाविक है — अधिकांश परिवारों को इनके बारे में स्पष्ट रूप से बताया ही नहीं जाता।',
    ],
  },
  FAMILY_PRESSURE: {
    en: ['Family expectations come from a place of care. The aim is to find an option the whole family can support.'],
    hi: ['पारिवारिक अपेक्षाएँ अपने-अपने स्नेह से आती हैं। लक्ष्य वह विकल्प ढूँढना है जिसे पूरा परिवार समर्थन कर सके।'],
  },
  OTHER: {
    en: ['Thank you for sharing your concern.'],
    hi: ['आपने अपनी चिंता साझा की, धन्यवाद।'],
  },
};

const FOLLOWUPS: Record<ConcernCategory, { en: string[]; hi: string[] }> = {
  LOW_SALARY: {
    en: ['Which trade or job role were you comparing this with?', 'Would you like to see earning ranges for a specific trade?'],
    hi: ['आप किस ट्रेड या नौकरी से इसकी तुलना कर रहे थे?', 'क्या आप किसी एक ट्रेड की कमाई का अनुमान देखना चाहेंगे?'],
  },
  JOB_SECURITY: {
    en: ['Which district or state are you looking for work in?', 'Shall we look at the employment sectors that hire this trade?'],
    hi: ['आप किस ज़िले या राज्य में काम ढूँढ रहे हैं?', 'क्या हम उन क्षेत्रों को देखें जहाँ इस ट्रेड को नियुक्ति मिलती है?'],
  },
  SOCIAL_STATUS: {
    en: ['Would you like to see the progression stages — from technician to supervisor to business owner?'],
    hi: ['क्या आप प्रगति के चरण देखना चाहेंगे — तकनीशियन से सुपरवाइज़र तक, फिर स्वयं-रोज़गार तक?'],
  },
  SAFETY: {
    en: ['Which location would the student train in?', 'Would you prefer a day programme near home?'],
    hi: ['विद्यार्थी कहाँ प्रशिक्षण लेगा?', 'क्या आप घर के पास दिन का कार्यक्रम पसंद करेंगे?'],
  },
  TRADITIONAL_DEGREE: {
    en: ['Which degree are you comparing against, and what does the student enjoy most?'],
    hi: ['आप कौन-सी डिग्री से तुलना कर रहे हैं, और विद्यार्थी को सबसे ज़्यादा क्या अच्छा लगता है?'],
  },
  FURTHER_EDUCATION: {
    en: ['Would you like to see which further-education options are open after this qualification?'],
    hi: ['क्या आप देखना चाहेंगे कि इस योग्यता के बाद आगे की पढ़ाई के कौन-कौन से विकल्प हैं?'],
  },
  FINANCIAL_LIMITATION: {
    en: ['What duration and fee range is comfortable for your family?', 'Would a government or NSDC-affiliated centre help?'],
    hi: ['आपके परिवार के लिए कितनी अवधि और फीस उचित रहेगी?', 'क्या सरकारी या NSDC-संबद्ध केंद्र मददगार रहेगा?'],
  },
  LACK_OF_AWARENESS: {
    en: ['Which trade would you like me to explain step by step?', 'Should I explain NSQF levels in simple words?'],
    hi: ['कौन-सा ट्रेड मैं आपको चरण-दर-चरण समझाऊँ?', 'क्या मैं NSQF स्तर सरल शब्दों में समझाऊँ?'],
  },
  FAMILY_PRESSURE: {
    en: ['Whose opinion matters most in this decision at home?', 'Would a joint student-parent counselling session help?'],
    hi: ['इस फैसले में घर में किसकी राय सबसे ज़रूरी है?', 'क्या विद्यार्थी और अभिभावक का संयुक्त परामर्श सहायक होगा?'],
  },
  OTHER: {
    en: ['Could you tell me a little more so I can find the right information?'],
    hi: ['क्या आप थोड़ा और बता सकते हैं ताकि मैं सही जानकारी ढूँढ सकूँ?'],
  },
};

const NO_CONTEXT_MSG = {
  en: 'I could not find verified information on this specific point in my knowledge base right now. I would rather tell you this honestly than guess. A human counsellor can check the latest official information for you.',
  hi: 'इस विशेष बिंदु पर मेरे नॉलेज बेस में अभी सत्यापित जानकारी नहीं मिली। अनुमान लगाने के बजाय मैं यह ईमानदारी से बता रहा हूँ। मानव परामर्शदाता आपके लिए नवीनतम आधिकारिक जानकारी जाँच सकता है।',
};

const ESTIMATE_NOTE = {
  en: 'Note: earning figures shown are estimates based on the referenced records — not a guarantee of future income.',
  hi: 'नोट: दिखाई गई कमाई के आँकड़े संदर्भित रिकॉर्ड पर आधारित अनुमान हैं — भविष्य की आय की गारंटी नहीं हैं।',
};

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length]!;
}

function sentenceSplit(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?।])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25);
}

/** Extract the most relevant factual sentences from retrieved chunks. */
export function extractFacts(chunks: RetrievedChunk[], userMessage: string, max = 3): string[] {
  const queryTokens = new Set(tokenize(userMessage));
  const scored: Array<{ s: string; score: number }> = [];
  for (const c of chunks) {
    for (const s of sentenceSplit(c.chunk)) {
      const tokens = tokenize(s);
      let overlap = 0;
      for (const t of tokens) if (queryTokens.has(t)) overlap += 1;
      const hasNumber = /\d/.test(s) ? 0.6 : 0;
      const isSourcey = /(source|http|retrieved|updated|verified|evidence and explanation|last updated)/i.test(s) ? -0.4 : 0;
      const score = overlap + hasNumber + isSourcey;
      if (score > 0.6) scored.push({ s, score });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const { s } of scored) {
    const key = s.slice(0, 40).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

export interface DemoReplyInput {
  analysis: AnalysisResult;
  language: AppLanguage;
  chunks: RetrievedChunk[];
  userMessage: string;
  userRole: string;
}

export function buildDemoReply(input: DemoReplyInput): string {
  const { analysis, language, chunks, userMessage } = input;
  const lang = language === 'HI' ? 'hi' : 'en';
  const seed = userMessage.length + Date.parse(new Date().toISOString().slice(0, 10));
  const lines: string[] = [];

  lines.push(pick(OPENERS[analysis.concern][lang], seed));

  const facts = extractFacts(chunks, userMessage, 3);
  if (facts.length > 0) {
    const heading = lang === 'hi' ? 'संदर्भित जानकारी:' : 'What the retrieved records say:';
    lines.push(heading);
    for (const f of facts) lines.push(`• ${f}`);
    if (facts.some((f) => /\d/.test(f))) lines.push(pick([ESTIMATE_NOTE[lang]], seed));
  } else {
    lines.push(NO_CONTEXT_MSG[lang]);
  }

  const concernLabel = CONCERN_LABELS[analysis.concern][lang];
  const closing =
    lang === 'hi'
      ? `आपकी मुख्य चिंता: ${concernLabel}। अगर आप चाहें तो हम इसे मानव परामर्शदाता के पास भी ले जा सकते हैं।`
      : `Your main concern was categorised as: ${concernLabel}. If you prefer, we can also take this to a human counsellor.`;
  lines.push(closing);
  lines.push(pick(FOLLOWUPS[analysis.concern][lang], seed + 1));

  if (analysis.wantsHuman) {
    lines.push(
      lang === 'hi'
        ? 'आपके अनुरोध पर नीचे "मानव परामर्शदाता से बात करें" बटन से सहायता माँगी जा सकती है।'
        : 'As you asked, you can raise a "Talk to a human counsellor" request from the button below.',
    );
  }

  return lines.join('\n\n');
}

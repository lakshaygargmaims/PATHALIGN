import type { SeedTrade } from './trades';

export interface SeedKnowledge {
  title: string;
  chunk: string;
  docType: 'TRADE_INFO' | 'MYTH_FACT' | 'SCHEME' | 'PATHWAY' | 'FAQ' | 'PROGRESSION';
  language: 'EN' | 'HI';
  tags: string[];
  tradeSlug?: string;
  sourceKey: string;
  verificationStatus: 'VERIFIED' | 'PENDING_VERIFICATION' | 'OUTDATED' | 'UNAVAILABLE' | 'SYNTHETIC_DEMO';
}

const UPDATED = '2026-09-30';

function money(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`;
}

/** Trade-level knowledge chunks (English + Hindi) and progression notes. */
function tradeDocs(trades: SeedTrade[]): SeedKnowledge[] {
  const out: SeedKnowledge[] = [];
  for (const t of trades) {
    out.push({
      title: `${t.name} — course, fee and earning overview`,
      docType: 'TRADE_INFO',
      language: 'EN',
      tradeSlug: t.slug,
      sourceKey: 'DEMO',
      verificationStatus: 'SYNTHETIC_DEMO',
      tags: [t.name, t.category, 'fee', 'duration', 'salary', 'earning', 'course', t.slug],
      chunk: `${t.name} (${t.category}) training runs for ${t.durationMonths} months with a recorded fee range of ${money(t.feeMin)} to ${money(t.feeMax)} in this demo catalogue. Eligibility: ${t.eligibility}. The recorded entry-level earning estimate is ${money(t.salary.entry[0])}–${money(t.salary.entry[1])} per month, with ${money(t.salary.mid[0])}–${money(t.salary.mid[1])} per month at experienced level and ${money(t.salary.senior[0])}–${money(t.salary.senior[1])} per month at senior or supervisory level. These earning figures are estimates compiled for the demo dataset and must be verified against current official or employer sources before being relied upon. Last updated: ${UPDATED}.`,
    });

    out.push({
      title: `${t.name} — career progression and further study`,
      docType: 'PATHWAY',
      language: 'EN',
      tradeSlug: t.slug,
      sourceKey: 'DEMO',
      verificationStatus: 'SYNTHETIC_DEMO',
      tags: [t.name, 'progression', 'career growth', 'pathway', 'further education', t.slug],
      chunk: `${t.name} progression in this demo dataset: (1) complete the ${t.durationMonths}-month training; (2) start as ${t.stages.entryRole}; (3) after roughly 3–6 years of experience move into ${t.stages.midRole}; (4) later options include ${t.stages.seniorRole}. Further education option recorded: ${t.stages.furtherEducation}. Progression steps are not automatic — they depend on employer, performance, applicable qualification rules and recognition norms; verify current rules with the official qualification framework. Last updated: ${UPDATED}.`,
    });

    out.push({
      title: `${t.name} — जानकारी (हिंदी)`,
      docType: 'TRADE_INFO',
      language: 'HI',
      tradeSlug: t.slug,
      sourceKey: 'DEMO',
      verificationStatus: 'SYNTHETIC_DEMO',
      tags: [t.name, 'वेतन', 'फीस', 'अवधि', 'नौकरी', 'कमाई', t.slug],
      chunk: `${t.name} (${t.category}) का प्रशिक्षण ${t.durationMonths} महीने का है; इस डेमो डेटासेट में फीस ${money(t.feeMin)} से ${money(t.feeMax)} तक दर्ज है. पात्रता: ${t.eligibility}. शुरुआती कमाई का अनुमान ${money(t.salary.entry[0])}–${money(t.salary.entry[1])} प्रति महीना, अनुभव के साथ ${money(t.salary.mid[0])}–${money(t.salary.mid[1])} और वरिष्ठ स्तर पर ${money(t.salary.senior[0])}–${money(t.salary.senior[1])} प्रति महीना है. ये आँकड़े डेमो डेटा के अनुमान हैं — निर्णय से पहले आधिकारिक स्रोत से जाँच लें. अंतिम अपडेट: ${UPDATED}.`,
    });
  }
  return out;
}

const MYTHS: Array<{ title: string; myth: string; fact: string; evidence: string; tags: string[] }> = [
  {
    title: 'Myth: Vocational education has no career growth',
    myth: 'Vocational education has no career growth.',
    fact: 'Many recognised vocational qualifications provide clearly defined progression — from trainee to technician to supervisor, and in several trades to self-employment.',
    evidence:
      'Progression records in this platform show multi-stage ladders for trades such as electrician and fitter. The exact rules depend on the qualification framework and employer norms, so verify progression pathways with the official qualification records before relying on them.',
    tags: ['myth', 'growth', 'progression', 'career growth', 'vocational'],
  },
  {
    title: 'Myth: Vocational training prevents higher education',
    myth: 'Vocational training prevents higher education.',
    fact: 'Certain recognised qualifications provide pathways for additional education, subject to applicable eligibility conditions.',
    evidence:
      'Diploma and degree admission rules vary by state and institution; lateral-entry or progression routes exist for some qualifications. Always check the current prospectus or official qualification framework rather than assuming automatic admission.',
    tags: ['myth', 'higher education', 'further study', 'diploma', 'degree'],
  },
  {
    title: 'Myth: Skilled workers cannot become entrepreneurs',
    myth: 'Skilled workers cannot become entrepreneurs.',
    fact: 'Several trades offer direct self-employment and business opportunities — electrical contracting, fabrication, salons, bakeries, repair businesses and more.',
    evidence:
      'Trade records for electrician, welder, beautician, bakery and mobile repair include self-employment pathways. Business skills, licences and capital still apply — skill alone is not a guarantee of business success.',
    tags: ['myth', 'entrepreneur', 'self employment', 'business'],
  },
  {
    title: 'Myth: ITI graduates have poor salaries',
    myth: 'ITI graduates always earn very low salaries.',
    fact: 'Entry salaries in many skilled trades are modest, but recorded ranges show meaningful growth with experience and specialisation.',
    evidence:
      'Demo salary records show experienced-level ranges substantially above entry-level ranges for trades like electrician, EV technician and COPA. Figures vary widely by sector, region and employer — treat all numbers as estimates and verify locally.',
    tags: ['myth', 'salary', 'earning', 'income', 'iti'],
  },
  {
    title: 'Myth: Vocational courses are only for students who fail academics',
    myth: 'Vocational courses are only for students who fail in academics.',
    fact: 'Vocational pathways suit learners who prefer practical, hands-on work, and they coexist with academic routes.',
    evidence:
      'Many vocational programmes accept Class 10th or 12th pass students alongside peers choosing conventional streams. Suitability should be judged by interest and aptitude, not by marks alone.',
    tags: ['myth', 'academics', 'reputation', 'stream'],
  },
  {
    title: 'Myth: Government schemes will pay all training costs',
    myth: 'A government scheme will cover all training costs automatically.',
    fact: 'Support schemes exist, but eligibility, coverage and amounts vary and must be confirmed for the current year.',
    evidence:
      'Schemes such as PMKVY, NAPS and state skill missions offer support to eligible candidates; none should be assumed to cover everything without checking current guidelines on the official portal.',
    tags: ['myth', 'scheme', 'cost', 'fee', 'scholarship', 'government'],
  },
];

const SCHEMES: Array<{ title: string; chunk: string; sourceKey: string; tags: string[] }> = [
  {
    title: 'Craftsman Training Scheme (CTS) — ITI training framework',
    chunk:
      'The Craftsman Training Scheme is the framework under which Industrial Training Institutes (ITIs) offer trade training, typically of 6 months to 2 years duration. Admission norms, fees and seat availability differ by institute and state. Verify current details on the Directorate General of Training portal before applying. Source: DGT (dgt.gov.in). Status: pending verification in this deployment.',
    sourceKey: 'DGT',
    tags: ['scheme', 'iti', 'cts', 'dgt', 'training'],
  },
  {
    title: 'National Apprenticeship Promotion Scheme (NAPS)',
    chunk:
      'NAPS promotes apprenticeship training with participating establishments; apprentices receive stipends during training under applicable rules. Eligibility, stipend patterns and durations change over time — confirm the current guidelines on the Apprenticeship India portal before relying on any figure. Source: Apprenticeship India (apprenticeshipindia.gov.in). Status: pending verification in this deployment.',
    sourceKey: 'APPRENTICESHIP',
    tags: ['scheme', 'apprenticeship', 'naps', 'stipend'],
  },
  {
    title: 'Pradhan Mantri Kaushal Vikas Yojana (PMKVY)',
    chunk:
      'PMKVY is a skill training scheme offering short-term training and recognition of prior learning through approved centres. Benefits and eligibility depend on the current scheme guidelines — check the official PMKVY website or Skill India Digital Hub for the latest information. Do not assume any fixed cash benefit without checking the current guidelines. Status: pending verification in this deployment.',
    sourceKey: 'PMKVY',
    tags: ['scheme', 'pmkvy', 'skill india', 'training support'],
  },
  {
    title: 'National Career Service (NCS) — careers and counselling',
    chunk:
      'The National Career Service portal provides career information, job listings and counselling resources. It is a Government of India initiative under the Ministry of Labour and Employment. Use it to cross-check job profiles and local opportunities. Status: pending verification in this deployment.',
    sourceKey: 'NCS',
    tags: ['ncs', 'career service', 'jobs', 'counselling'],
  },
];

const FAQS: Array<{ title: string; chunk: string; language: 'EN' | 'HI'; sourceKey: string; verificationStatus: SeedKnowledge['verificationStatus']; tags: string[] }> = [
  {
    title: 'What is NSQF and why does the level number matter?',
    language: 'EN',
    sourceKey: 'NSQF',
    verificationStatus: 'PENDING_VERIFICATION',
    tags: ['nsqf', 'qualification', 'level', 'framework'],
    chunk:
      'The National Skills Qualifications Framework (NSQF) organises qualifications by level of competency, so a certificate at one level can be understood in relation to others. The NSQF level of a course affects how it relates to further study and job roles. Level mappings change over time — confirm the current level of any qualification from the official NSQF documentation before making decisions based on it. Status: pending verification in this deployment.',
  },
  {
    title: 'How do I compare two trades before deciding?',
    language: 'EN',
    sourceKey: 'DEMO',
    verificationStatus: 'SYNTHETIC_DEMO',
    tags: ['compare', 'decision', 'trade', 'guidance'],
    chunk:
      'Compare trades on four dimensions: training duration, total cost including fees, recorded earning ranges by experience level, and the number of employment pathways on record. Also check how many training providers exist near your district, because travel and relocation costs matter for families. Use the Career Reality Simulator to compare two trades side by side in PATHALIGN AI.',
  },
  {
    title: 'क्या वोकेशनल कोर्स के बाद आगे पढ़ाई रुक जाती है?',
    language: 'HI',
    sourceKey: 'NSQF',
    verificationStatus: 'PENDING_VERIFICATION',
    tags: ['आगे पढ़ाई', 'डिग्री', 'diploma', 'वोकेशनल'],
    chunk:
      'वोकेशनल कोर्स के बाद आगे की पढ़ाई पूरी तरह बंद नहीं हो जाती — कुछ मान्यता प्राप्त योग्यताओं से डिप्लोमा या उच्च पढ़ाई के विकल्प खुलते हैं, पर यह पात्रता नियमों पर निर्भर करता है. हर संस्थान और राज्य के नियम अलग हो सकते हैं — दाखिले से पहले आधिकारिक प्रॉस्पेक्टस ज़रूर जाँचें. यह जानकारी सत्यापन की प्रतीक्षा में है.',
  },
  {
    title: 'परिवार कैसे तय करे कि कौन सा कोर्स चुनें?',
    language: 'HI',
    sourceKey: 'DEMO',
    verificationStatus: 'SYNTHETIC_DEMO',
    tags: ['निर्णय', 'परिवार', 'guidance', 'faiṣla'],
    chunk:
      'परिवार के लिए चार बातें ज़रूरी हैं: कोर्स की अवधि और कुल लागत, शुरुआती और अनुभव के बाद कमाई के अनुमान, आपके ज़िले में ट्रेनिंग सेंटर की उपलब्धता, और आगे पढ़ाई या स्वयं-रोज़गार के विकलप. PATHALIGN AI का करियर सिमुलेटर ये तुलना एक साथ दिखाता है, और फैमिली कन्सेंसस इंजन दोनों पक्षों की पसंद मिलाता है.',
  },
  {
    title: 'What to verify before paying a course fee?',
    language: 'EN',
    sourceKey: 'DEMO',
    verificationStatus: 'SYNTHETIC_DEMO',
    tags: ['fee', 'verify', 'fraud', 'guidance', 'institute'],
    chunk:
      'Before paying any fee, verify the institute record, its affiliation status, the qualification you will receive, the total cost including hidden charges, and placement claims in writing. Cross-check the institute on official portals such as the DGT or state skill mission directories. Never pay based on a placement guarantee claim alone — ask for written proof and verified alumni contacts.',
  },
];

export function buildKnowledgeDocs(trades: SeedTrade[]): SeedKnowledge[] {
  const docs: SeedKnowledge[] = [
    ...tradeDocs(trades),
    ...MYTHS.flatMap((m): SeedKnowledge[] => [
      {
        title: m.title,
        docType: 'MYTH_FACT',
        language: 'EN',
        sourceKey: 'DEMO',
        verificationStatus: 'SYNTHETIC_DEMO',
        tags: m.tags,
        chunk: `Myth: "${m.myth}" Fact: ${m.fact} Evidence and explanation: ${m.evidence} Last updated: ${UPDATED}.`,
      },
      {
        title: `${m.title} (हिंदी)`,
        docType: 'MYTH_FACT',
        language: 'HI',
        sourceKey: 'DEMO',
        verificationStatus: 'SYNTHETIC_DEMO',
        tags: [...m.tags, 'मिथक', 'सच्चाई'],
        chunk: `मिथक: "${m.myth}" तथ्य: ${m.fact} व्याख्या: ${m.evidence} अंतिम अपडेट: ${UPDATED}.`,
      },
    ]),
    ...SCHEMES.map((s): SeedKnowledge => ({
      title: s.title,
      docType: 'SCHEME',
      language: 'EN',
      sourceKey: s.sourceKey,
      verificationStatus: 'PENDING_VERIFICATION',
      tags: s.tags,
      chunk: s.chunk,
    })),
    ...FAQS.map((f): SeedKnowledge => ({
      title: f.title,
      docType: 'FAQ',
      language: f.language,
      sourceKey: f.sourceKey,
      verificationStatus: f.verificationStatus,
      tags: f.tags,
      chunk: f.chunk,
    })),
  ];
  return docs;
}

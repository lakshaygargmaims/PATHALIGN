import type { PrismaClient } from '@prisma/client';

// ------------------------------------------------------------
// Synthetic demo people and interactions.
// Every account uses @pathalign.demo emails, families use the
// FA-DEMO family code, and all records are documented in README
// as seeded demo data (never presented as real government data).
// ------------------------------------------------------------

export const DEMO_FAMILY_CODE = 'FA-DEMO01';

export interface DemoUserSpec {
  email: string;
  fullName: string;
  role: 'STUDENT' | 'PARENT' | 'COUNSELLOR' | 'ADMIN';
  mobile: string;
  state: string;
  district: string;
  language: 'EN' | 'HI';
}

export const DEMO_USERS: DemoUserSpec[] = [
  { email: 'admin@pathalign.demo', fullName: 'Priyanka Verma', role: 'ADMIN', mobile: '9800000001', state: 'Maharashtra', district: 'Pune', language: 'EN' },
  { email: 'student@pathalign.demo', fullName: 'Aarav Sharma', role: 'STUDENT', mobile: '9800000002', state: 'Maharashtra', district: 'Pune', language: 'EN' },
  { email: 'parent@pathalign.demo', fullName: 'Rakesh Sharma', role: 'PARENT', mobile: '9800000003', state: 'Maharashtra', district: 'Pune', language: 'HI' },
  { email: 'counsellor@pathalign.demo', fullName: 'Dr. Meera Iyer', role: 'COUNSELLOR', mobile: '9800000004', state: 'Maharashtra', district: 'Pune', language: 'EN' },
  { email: 'sunita.parent@pathalign.demo', fullName: 'Sunita Devi', role: 'PARENT', mobile: '9800000005', state: 'Uttar Pradesh', district: 'Lucknow', language: 'HI' },
  { email: 'imran.parent@pathalign.demo', fullName: 'Imran Ansari', role: 'PARENT', mobile: '9800000006', state: 'Bihar', district: 'Patna', language: 'HI' },
  { email: 'kavita.parent@pathalign.demo', fullName: 'Kavita Rathore', role: 'PARENT', mobile: '9800000007', state: 'Rajasthan', district: 'Jaipur', language: 'EN' },
  { email: 'deepak.parent@pathalign.demo', fullName: 'Deepak Patel', role: 'PARENT', mobile: '9800000008', state: 'Madhya Pradesh', district: 'Bhopal', language: 'HI' },
  { email: 'anita.parent@pathalign.demo', fullName: 'Anita Desai', role: 'PARENT', mobile: '9800000009', state: 'Gujarat', district: 'Ahmedabad', language: 'EN' },
  { email: 'vikram.student@pathalign.demo', fullName: 'Vikram Reddy', role: 'STUDENT', mobile: '9800000010', state: 'Telangana', district: 'Hyderabad', language: 'EN' },
];

async function makeFamily(
  db: PrismaClient,
  code: string,
  opts: { state: string; district: string; areaType: 'URBAN' | 'SEMI_URBAN' | 'RURAL'; income: string; language: 'EN' | 'HI'; createdBy: string },
) {
  return db.family.upsert({
    where: { familyCode: code },
    create: {
      familyCode: code,
      state: opts.state,
      district: opts.district,
      areaType: opts.areaType,
      incomeBracket: opts.income,
      preferredLanguage: opts.language,
      createdByUserId: opts.createdBy,
    },
    update: {},
  });
}

export async function seedFamiliesAndProfiles(
  db: PrismaClient,
  userIds: Map<string, string>,
  passwordHash: string,
): Promise<Map<string, string>> {
  const familyIds = new Map<string, string>();

  // ── Main demo family (student + parent) ──────────────────
  const mainFamily = await makeFamily(db, DEMO_FAMILY_CODE, {
    state: 'Maharashtra',
    district: 'Pune',
    areaType: 'URBAN',
    income: '₹25,000 – ₹50,000 per month',
    language: 'HI',
    createdBy: userIds.get('parent@pathalign.demo')!,
  });
  familyIds.set('main', mainFamily.id);

  await db.familyMember.createMany({
    data: [
      {
        familyId: mainFamily.id,
        userId: userIds.get('student@pathalign.demo')!,
        relation: 'STUDENT',
        isMinor: true,
        consentGranted: true,
        consentAt: new Date(),
      },
      {
        familyId: mainFamily.id,
        userId: userIds.get('parent@pathalign.demo')!,
        relation: 'PARENT',
        consentGranted: true,
        consentAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  await db.studentProfile.upsert({
    where: { userId: userIds.get('student@pathalign.demo')! },
    create: {
      userId: userIds.get('student@pathalign.demo')!,
      familyId: mainFamily.id,
      age: 17,
      qualification: 'Class 10th (appeared for board exams)',
      academicBackground: 'Class 10th — Maths, Science, English',
      interests: ['Electrical work', 'Solar energy', 'Computers'],
      skills: ['Basic wiring', 'School science practicals', 'Mobile repair (hobby)'],
      preferredCareerAreas: ['Green energy', 'Electrical trades', 'IT support'],
      location: 'Pune, Maharashtra',
      aspirations: 'Work with solar and electrical systems, eventually start a small installation business.',
    },
    update: {},
  });

  await db.parentProfile.upsert({
    where: { userId: userIds.get('parent@pathalign.demo')! },
    create: {
      userId: userIds.get('parent@pathalign.demo')!,
      familyId: mainFamily.id,
      educationBackground: 'Graduate (B.Com)',
      careerExpectations: 'A stable job with a reputed organisation, or government employment.',
      financialConcerns: 'Fees must fit a monthly household income under ₹50,000; no loans if possible.',
      preferredEmploymentType: 'GOVERNMENT',
      careerConcerns: ['Job security', 'Social standing of vocational work', 'Salary in initial years'],
    },
    update: {},
  });

  // ── Other demo families (one parent each) ────────────────
  const others: Array<{ email: string; code: string; state: string; district: string; area: 'URBAN' | 'SEMI_URBAN' | 'RURAL'; income: string; language: 'EN' | 'HI' }> = [
    { email: 'sunita.parent@pathalign.demo', code: 'FA-DEMO02', state: 'Uttar Pradesh', district: 'Lucknow', area: 'SEMI_URBAN', income: '₹15,000 – ₹25,000 per month', language: 'HI' },
    { email: 'imran.parent@pathalign.demo', code: 'FA-DEMO03', state: 'Bihar', district: 'Patna', area: 'RURAL', income: 'Under ₹15,000 per month', language: 'HI' },
    { email: 'kavita.parent@pathalign.demo', code: 'FA-DEMO04', state: 'Rajasthan', district: 'Jaipur', area: 'URBAN', income: '₹50,000 – ₹1,00,000 per month', language: 'EN' },
    { email: 'deepak.parent@pathalign.demo', code: 'FA-DEMO05', state: 'Madhya Pradesh', district: 'Bhopal', area: 'SEMI_URBAN', income: '₹25,000 – ₹50,000 per month', language: 'HI' },
    { email: 'anita.parent@pathalign.demo', code: 'FA-DEMO06', state: 'Gujarat', district: 'Ahmedabad', area: 'URBAN', income: '₹50,000 – ₹1,00,000 per month', language: 'EN' },
  ];

  for (const o of others) {
    const uid = userIds.get(o.email)!;
    const fam = await makeFamily(db, o.code, {
      state: o.state,
      district: o.district,
      areaType: o.area,
      income: o.income,
      language: o.language,
      createdBy: uid,
    });
    familyIds.set(o.code, fam.id);
    await db.familyMember.createMany({
      data: [
        { familyId: fam.id, userId: uid, relation: 'PARENT', consentGranted: true, consentAt: new Date() },
      ],
      skipDuplicates: true,
    });
    await db.parentProfile.upsert({
      where: { userId: uid },
      create: {
        userId: uid,
        familyId: fam.id,
        educationBackground: o.email.includes('sunita') ? 'Class 12th pass' : 'Graduate',
        careerExpectations: 'A secure, well-paying career for my child.',
        financialConcerns: 'Training cost and daily travel expenses are the main worry.',
        preferredEmploymentType: o.email.includes('anita') ? 'PRIVATE' : 'GOVERNMENT',
        careerConcerns: ['Salary after training', 'Will the qualification be recognised?'],
      },
      update: {},
    });
  }

  // Student without a family yet (to demonstrate the join-family flow)
  await db.studentProfile.upsert({
    where: { userId: userIds.get('vikram.student@pathalign.demo')! },
    create: {
      userId: userIds.get('vikram.student@pathalign.demo')!,
      age: 18,
      qualification: 'Class 12th (Science)',
      academicBackground: 'Class 12th — Physics, Chemistry, Maths',
      interests: ['Electric vehicles', 'Computers', 'Mechanical systems'],
      skills: ['Python basics', 'Two-wheeler repair (hobby)'],
      preferredCareerAreas: ['Automobile', 'EV technology', 'IT'],
      location: 'Hyderabad, Telangana',
      aspirations: 'Work in electric vehicle service and design.',
    },
    update: {},
  });

  void passwordHash;
  return familyIds;
}

export async function seedAssessments(
  db: PrismaClient,
  userIds: Map<string, string>,
  familyIds: Map<string, string>,
): Promise<void> {
  const mainFamily = familyIds.get('main')!;

  const studentAnswers = { q1: 4, q2: 3, q3: 3, q4: 2, q5: 4, q6: 4, q7: 3, q8: 4 };
  const studentDims = {
    'Hands-on & technical': 100,
    'Digital & computing': 75,
    'Design & creativity': 75,
    'People & service': 50,
    'Entrepreneurship drive': 100,
    'Job stability value': 75,
    'Learning motivation': 100,
  };
  const studentOverall = Math.round(
    Object.values(studentDims).reduce((s, v) => s + v, 0) / Object.values(studentDims).length,
  );

  await db.careerAssessment.create({
    data: {
      userId: userIds.get('student@pathalign.demo')!,
      familyId: mainFamily,
      kind: 'STUDENT_INTEREST',
      answers: studentAnswers as object,
      scores: { dimensions: studentDims, overall: studentOverall } as object,
      summary: 'Indicative interest profile — used to suggest vocational pathways, not a psychological test.',
    },
  });

  const parentAnswers = { p1: 4, p2: 4, p3: 2, p4: 3, p5: 3, p6: 4 };
  const parentDims = {
    'Security priority': 100,
    'Openness to vocational paths': 50,
    'Financial sensitivity': 75,
    'Reputation sensitivity': 75,
    'Value on further education': 100,
  };
  const parentOverall = Math.round(
    Object.values(parentDims).reduce((s, v) => s + v, 0) / Object.values(parentDims).length,
  );

  await db.careerAssessment.create({
    data: {
      userId: userIds.get('parent@pathalign.demo')!,
      familyId: mainFamily,
      kind: 'PARENT_EXPECTATIONS',
      answers: parentAnswers as object,
      scores: { dimensions: parentDims, overall: parentOverall } as object,
      summary: 'Shows where parents and students may need conversation — not a judgement of parenting.',
    },
  });
}

interface ConcernSpec {
  email: string;
  code?: string;
  category:
    | 'LOW_SALARY'
    | 'JOB_SECURITY'
    | 'SOCIAL_STATUS'
    | 'SAFETY'
    | 'TRADITIONAL_DEGREE'
    | 'FURTHER_EDUCATION'
    | 'FINANCIAL_LIMITATION'
    | 'LACK_OF_AWARENESS'
    | 'FAMILY_PRESSURE'
    | 'OTHER';
  detail: string;
  state: string;
  district: string;
  language: 'EN' | 'HI';
  status?: 'OPEN' | 'ADDRESSED' | 'CLOSED';
}

const CONCERNS: ConcernSpec[] = [
  {
    email: 'parent@pathalign.demo',
    code: 'FA-DEMO01',
    category: 'TRADITIONAL_DEGREE',
    detail: 'ITI करने के बाद बच्चे का भविष्य क्या होगा? डिग्री ज़्यादा बेहतर नहीं है?',
    state: 'Maharashtra',
    district: 'Pune',
    language: 'HI',
  },
  {
    email: 'parent@pathalign.demo',
    code: 'FA-DEMO01',
    category: 'LOW_SALARY',
    detail: 'शुरुआत में तनख्वाह कम होगी तो घर कैसे चलेगा?',
    state: 'Maharashtra',
    district: 'Pune',
    language: 'HI',
    status: 'ADDRESSED',
  },
  {
    email: 'sunita.parent@pathalign.demo',
    code: 'FA-DEMO02',
    category: 'FINANCIAL_LIMITATION',
    detail: 'Course fees and travel cost more than our monthly budget can manage.',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    language: 'EN',
  },
  {
    email: 'imran.parent@pathalign.demo',
    code: 'FA-DEMO03',
    category: 'JOB_SECURITY',
    detail: 'प्राइवेट ट्रेनिंग के बाद नौकरी पक्की होगी या नहीं, कुछ भरोसा नहीं है.',
    state: 'Bihar',
    district: 'Patna',
    language: 'HI',
  },
  {
    email: 'kavita.parent@pathalign.demo',
    code: 'FA-DEMO04',
    category: 'SOCIAL_STATUS',
    detail: 'Relatives keep saying a regular degree has more respect than a trade certificate.',
    state: 'Rajasthan',
    district: 'Jaipur',
    language: 'EN',
  },
  {
    email: 'deepak.parent@pathalign.demo',
    code: 'FA-DEMO05',
    category: 'LACK_OF_AWARENESS',
    detail: 'वोकेशनल कोर्सों के बारे में हमें कोई जानकारी ही नहीं है, किसी ने बताया ही नहीं.',
    state: 'Madhya Pradesh',
    district: 'Bhopal',
    language: 'HI',
  },
  {
    email: 'anita.parent@pathalign.demo',
    code: 'FA-DEMO06',
    category: 'SAFETY',
    detail: 'I want to know whether training centres near us are safe for a girl student.',
    state: 'Gujarat',
    district: 'Ahmedabad',
    language: 'EN',
    status: 'OPEN',
  },
  {
    email: 'imran.parent@pathalign.demo',
    code: 'FA-DEMO03',
    category: 'FURTHER_EDUCATION',
    detail: 'क्या आईटीआई के बाद डिप्लोमा या आगे की पढ़ाई का रास्ता खुलता है?',
    state: 'Bihar',
    district: 'Patna',
    language: 'HI',
  },
];

export async function seedConcerns(
  db: PrismaClient,
  userIds: Map<string, string>,
  familyIds: Map<string, string>,
): Promise<void> {
  for (const c of CONCERNS) {
    const familyId = c.code ? familyIds.get(c.code) : undefined;
    const author = userIds.get(c.email)!;
    const existing = await db.parentConcern.findFirst({ where: { authorUserId: author, detail: c.detail } });
    if (existing) continue;
    await db.parentConcern.create({
      data: {
        authorUserId: author,
        familyId,
        category: c.category,
        detail: c.detail,
        language: c.language,
        sentimentScore: /नहीं|कम|worried|can't|no\b/i.test(c.detail) ? -0.4 : -0.1,
        status: c.status ?? 'OPEN',
        source: 'FORM',
        state: c.state,
        district: c.district,
        resolvedAt: c.status === 'ADDRESSED' ? new Date(Date.now() - 5 * 86400000) : null,
      },
    });
  }
}

export async function seedConversations(
  db: PrismaClient,
  userIds: Map<string, string>,
  familyIds: Map<string, string>,
): Promise<void> {
  const mainFamily = familyIds.get('main')!;

  // English conversation — student asking about salary
  const conv1 = await db.chatConversation.upsert({
    where: { id: 'demo-conv-1' },
    create: {
      id: 'demo-conv-1',
      userId: userIds.get('student@pathalign.demo')!,
      familyId: mainFamily,
      kind: 'OBJECTION_ANALYZER',
      title: 'Salary after solar technician course — 2 Oct',
      language: 'EN',
      concernCategory: 'LOW_SALARY',
      sentimentLabel: 'MIXED',
      summary:
        'Conversation about low salary concerns. Started with: "How much can a solar technician actually earn in the first year?" Total messages: 4.',
    },
    update: {},
  });
  await db.chatMessage.createMany({
    data: [
      {
        conversationId: conv1.id,
        role: 'USER',
        content: 'How much can a solar technician actually earn in the first year?',
        language: 'EN',
        intent: 'SALARY_QUERY',
        concernCategory: 'LOW_SALARY',
        sentiment: 'NEUTRAL',
      },
      {
        conversationId: conv1.id,
        role: 'ASSISTANT',
        content:
          'It is completely fair to ask about earnings before choosing a course.\n\nWhat the retrieved records say:\n\n• The recorded entry-level earning estimate for Solar PV Technician is ₹15,000–₹22,000 per month, rising to ₹28,000–₹45,000 at experienced level in this demo catalogue.\n• Actual pay depends on location, employer and skill — treat these as estimates, not guarantees.\n\nYour main concern was categorised as: Low salary concerns. Would you like to compare this with the electrician trade next?',
        language: 'EN',
        concernCategory: 'LOW_SALARY',
        sentiment: 'NEUTRAL',
        sources: [
          {
            id: 'seed',
            title: 'PATHALIGN demo dataset (synthetic)',
            url: null,
            publisher: 'PATHALIGN AI',
            isSynthetic: true,
            verificationStatus: 'SYNTHETIC_DEMO',
          },
        ],
      },
      {
        conversationId: conv1.id,
        role: 'USER',
        content: 'And what about growth after 5 years?',
        language: 'EN',
        intent: 'JOB_SECURITY_QUERY',
        concernCategory: 'JOB_SECURITY',
        sentiment: 'NEUTRAL',
      },
      {
        conversationId: conv1.id,
        role: 'ASSISTANT',
        content:
          'Good question — growth matters as much as the first salary.\n\nWhat the retrieved records say:\n\n• The recorded progression for Solar PV Technician is: installation technician → site supervisor → project supervisor or own solar installation business.\n• Progression is not automatic; it depends on experience, employer and applicable qualification rules.\n\nShall we open a Family Consensus so your parents can see this pathway alongside their concerns?',
        language: 'EN',
        concernCategory: 'JOB_SECURITY',
        sentiment: 'POSITIVE',
        sources: [],
      },
    ],
    skipDuplicates: true,
  });

  // Hindi conversation — parent objection (spec example)
  const conv2 = await db.chatConversation.upsert({
    where: { id: 'demo-conv-2' },
    create: {
      id: 'demo-conv-2',
      userId: userIds.get('parent@pathalign.demo')!,
      familyId: mainFamily,
      kind: 'OBJECTION_ANALYZER',
      title: 'ITI के बाद भविष्य — 1 Oct',
      language: 'HI',
      concernCategory: 'TRADITIONAL_DEGREE',
      sentimentLabel: 'NEGATIVE',
      summary:
        'Conversation about preference for traditional degree. Started with: "ITI karne ke baad mere bachche ka future kya hoga? Degree zyada achhi nahi hai?" Total messages: 4.',
    },
    update: {},
  });
  await db.chatMessage.createMany({
    data: [
      {
        conversationId: conv2.id,
        role: 'USER',
        content: 'ITI karne ke baad mere bachche ka future kya hoga? Degree zyada achhi nahi hai?',
        language: 'HI',
        intent: 'FURTHER_EDUCATION_QUERY',
        concernCategory: 'TRADITIONAL_DEGREE',
        sentiment: 'NEGATIVE',
      },
      {
        conversationId: conv2.id,
        role: 'ASSISTANT',
        content:
          'कई माता-पिता स्वाभाविक रूप से पारंपरिक डिग्री को बेहतर मानते हैं। दोनों मार्गों का अपना महत्व है — महत्व पहचान, स्किल और प्रगति का है।\n\nसंदर्भित जानकारी:\n\n• आईटीआई प्रशिक्षण आमतौर पर 6 से 24 महीने का होता है; डेटासेट में फीस रेंज ₹4,000–₹50,000 तक दर्ज है.\n• इलेक्ट्रिशियन में शुरुआती कमाई का अनुमान ₹12,000–₹18,000 प्रति महीना और अनुभव के साथ ₹25,000–₹40,000 प्रति महीना है.\n\nये आँकड़े डेमो डेटासेट के अनुमान हैं — निर्णय से पहले आधिकारिक स्रोत से जाँच लें।\n\nआपकी मुख्य चिंता: पारंपरिक डिग्री की प्राथमिकता। क्या आप डिग्री और आईटीआई की तुलना साथ में देखना चाहेंगे?',
        language: 'HI',
        concernCategory: 'TRADITIONAL_DEGREE',
        sentiment: 'NEUTRAL',
        sources: [
          {
            id: 'seed',
            title: 'PATHALIGN demo dataset (synthetic)',
            url: null,
            publisher: 'PATHALIGN AI',
            isSynthetic: true,
            verificationStatus: 'SYNTHETIC_DEMO',
          },
        ],
      },
      {
        conversationId: conv2.id,
        role: 'USER',
        content: 'अगर नौकरी नहीं लगी तो? समाज में क्या कहेंगे लोग?',
        language: 'HI',
        intent: 'JOB_SECURITY_QUERY',
        concernCategory: 'SOCIAL_STATUS',
        sentiment: 'NEGATIVE',
      },
      {
        conversationId: conv2.id,
        role: 'ASSISTANT',
        content:
          'समाज की सोच हर परिवार के लिए मायने रखती है, और नौकरी न लगने का डर भी स्वाभाविक है।\n\nसंदर्भित जानकारी:\n\n• रिकॉर्ड किए गए रोज़गार मार्गों में निजी निर्माण, सेवा केंद्र और स्वयं-रोज़गार शामिल हैं.\n• प्रगति के चरण दर्ज हैं: प्रशिक्षु → तकनीशियन → सुपरवाइज़र / अपना काम.\n\nआपकी मुख्य चिंता: नौकरी की सुरक्षा और सामाजिक प्रतिष्ठा। क्या इस बातचीत को मानव परामर्शदाता के साथ साझा करें?',
        language: 'HI',
        concernCategory: 'JOB_SECURITY',
        sentiment: 'NEUTRAL',
        sources: [],
      },
    ],
    skipDuplicates: true,
  });

  // Third conversation (escalation-related, for counsellor view)
  const conv3 = await db.chatConversation.upsert({
    where: { id: 'demo-conv-3' },
    create: {
      id: 'demo-conv-3',
      userId: userIds.get('sunita.parent@pathalign.demo')!,
      familyId: familyIds.get('FA-DEMO02')!,
      kind: 'OBJECTION_ANALYZER',
      title: 'Training cost concerns — 28 Sep',
      language: 'EN',
      concernCategory: 'FINANCIAL_LIMITATION',
      sentimentLabel: 'NEGATIVE',
      status: 'ESCALATED',
      summary: 'Conversation about financial limitations. Started with: "How can we afford this course?" Total messages: 2.',
    },
    update: {},
  });
  await db.chatMessage.createMany({
    data: [
      {
        conversationId: conv3.id,
        role: 'USER',
        content: 'How can we afford this course? Our budget is very limited.',
        language: 'EN',
        intent: 'GENERAL_QUERY',
        concernCategory: 'FINANCIAL_LIMITATION',
        sentiment: 'NEGATIVE',
      },
      {
        conversationId: conv3.id,
        role: 'ASSISTANT',
        content:
          'Course cost and family budget are practical concerns. Let us look at duration, fees and available support objectively.\n\nWhat the retrieved records say:\n\n• Recorded fee ranges in the demo catalogue start from ₹4,000 for shorter courses.\n• Support schemes exist but eligibility must be checked on the official portal for the current year.\n\nA human counsellor can help you check fee waivers and scheme eligibility for your district.',
        language: 'EN',
        concernCategory: 'FINANCIAL_LIMITATION',
        sentiment: 'NEUTRAL',
        sources: [],
      },
    ],
    skipDuplicates: true,
  });
}

export async function seedConsensusAndConfidence(
  db: PrismaClient,
  familyIds: Map<string, string>,
): Promise<void> {
  const mainFamily = familyIds.get('main')!;

  await db.familyConsensus.upsert({
    where: { id: 'demo-consensus-1' },
    create: {
      id: 'demo-consensus-1',
      familyId: mainFamily,
      status: 'PARTIALLY_AGREED',
      studentPicks: [
        { label: 'Solar PV Technician' },
        { label: 'Electrician' },
      ],
      parentPicks: [
        { label: 'Electrician' },
        { label: 'Diploma in Electrical Engineering' },
      ],
      common: ['Electrician'],
      disagreements: ['Solar PV Technician', 'Diploma in Electrical Engineering'],
      concerns: {
        student: ['Want to work in the solar/green energy sector'],
        parent: ['Job security in private sector', 'Salary in initial years'],
        shared: [],
      },
      recommendations: [
        {
          title: 'Electrician',
          rationale:
            'Both student and parent selected this option — strongest starting point for a joint decision. Recorded training duration: 24 months.',
          tradeId: null,
        },
        {
          title: 'Solar technician short course alongside electrician training',
          rationale:
            'If cost or duration is the main disagreement, compare a shorter course in the same sector before deciding. Both participants can review the evidence together.',
        },
      ],
      evidence: [
        {
          trade: 'Electrician',
          durationMonths: 24,
          feeRange: '₹10,000–₹45,000',
          earningEstimate: '₹12,000–₹18,000 / month (estimate)',
          verificationStatus: 'SYNTHETIC_DEMO',
          sources: ['PATHALIGN demo dataset (synthetic)'],
        },
      ],
      aiSummary:
        'Status: Partially agreed. Shared preferences: 1. Student-only: 1. Parent-only: 1. This outcome does not force agreement — both participants can voluntarily record their own decision.',
      studentDecision: 'I would like to train as an electrician first and add solar specialisation later.',
      parentDecision: 'We are comfortable with electrician training if the institute record is verified.',
    },
    update: {},
  });

  const preDims = {
    awareness: { raw: 2, score: 10, label: 'Awareness of vocational education', labelHi: 'वोकेशनल शिक्षा की जानकारी' },
    employmentTrust: { raw: 2, score: 10, label: 'Trust in employment information', labelHi: 'रोज़गार जानकारी पर भरोसा' },
    salaryUnderstanding: { raw: 1, score: 5, label: 'Understanding of salary opportunities', labelHi: 'वेतन के अवसरों की समझ' },
    progressionAwareness: { raw: 2, score: 10, label: 'Awareness of career progression', labelHi: 'करियर प्रगति की जानकारी' },
    willingness: { raw: 2, score: 10, label: 'Willingness to consider vocational education', labelHi: 'वोकेशनल शिक्षा पर विचार करने की इच्छा' },
  };
  const postDims = {
    awareness: { raw: 3, score: 15, label: 'Awareness of vocational education', labelHi: 'वोकेशनल शिक्षा की जानकारी' },
    employmentTrust: { raw: 3, score: 15, label: 'Trust in employment information', labelHi: 'रोज़गार जानकारी पर भरोसा' },
    salaryUnderstanding: { raw: 3, score: 15, label: 'Understanding of salary opportunities', labelHi: 'वेतन के अवसरों की समझ' },
    progressionAwareness: { raw: 3, score: 15, label: 'Awareness of career progression', labelHi: 'करियर प्रगति की जानकारी' },
    willingness: { raw: 3, score: 15, label: 'Willingness to consider vocational education', labelHi: 'वोकेशनल शिक्षा पर विचार करने की इच्छा' },
  };

  const existing = await db.confidenceAssessment.findFirst({ where: { familyId: mainFamily } });
  if (!existing) {
    await db.confidenceAssessment.createMany({
      data: [
        {
          familyId: mainFamily,
          phase: 'PRE',
          answers: { awareness: 2, employmentTrust: 2, salaryUnderstanding: 1, progressionAwareness: 2, willingness: 2 } as object,
          dimensions: preDims as object,
          overallScore: 45,
          createdAt: new Date(Date.now() - 14 * 86400000),
        },
        {
          familyId: mainFamily,
          phase: 'POST',
          answers: { awareness: 3, employmentTrust: 3, salaryUnderstanding: 3, progressionAwareness: 3, willingness: 3 } as object,
          dimensions: postDims as object,
          overallScore: 75,
          createdAt: new Date(Date.now() - 2 * 86400000),
        },
      ],
    });
  }
}

export async function seedCasesAndAppointments(
  db: PrismaClient,
  userIds: Map<string, string>,
  familyIds: Map<string, string>,
): Promise<void> {
  const counsellor = await db.counsellor.upsert({
    where: { userId: userIds.get('counsellor@pathalign.demo')! },
    create: {
      userId: userIds.get('counsellor@pathalign.demo')!,
      designation: 'Senior Career Counsellor',
      specialities: ['Vocational pathways', 'Parent engagement', 'Apprenticeships'],
      states: ['Maharashtra', 'Uttar Pradesh', 'Bihar'],
      districts: ['Pune', 'Lucknow', 'Patna'],
      maxActiveCases: 20,
    },
    update: {},
  });

  const mainFamily = familyIds.get('main')!;
  const caseCount = await db.counsellorCase.count();
  if (caseCount === 0) {
    await db.counsellorCase.create({
      data: {
        ownerId: userIds.get('parent@pathalign.demo')!,
        familyId: mainFamily,
        counsellorId: counsellor.id,
        conversationId: 'demo-conv-2',
        category: 'TRADITIONAL_DEGREE',
        subject: 'Parent prefers traditional degree over ITI',
        description:
          'Parent asked whether ITI limits the child’s future compared to a degree. Wants a side-by-side comparison of progression and recognition before deciding.',
        status: 'ASSIGNED',
        priority: 'HIGH',
        summaryShared: true,
        source: 'AI_ESCALATION',
        assignedAt: new Date(Date.now() - 3 * 86400000),
      },
    });

    await db.counsellorCase.create({
      data: {
        ownerId: userIds.get('sunita.parent@pathalign.demo')!,
        familyId: familyIds.get('FA-DEMO02')!,
        conversationId: 'demo-conv-3',
        category: 'FINANCIAL_LIMITATION',
        subject: 'Fee and travel cost concerns for training',
        description:
          'Family budget cannot accommodate the course fee and travel. Requested help identifying affordable institutes and any applicable support.',
        status: 'PENDING',
        priority: 'NORMAL',
        summaryShared: true,
        source: 'AI_ESCALATION',
      },
    });

    const resolved = await db.counsellorCase.create({
      data: {
        ownerId: userIds.get('kavita.parent@pathalign.demo')!,
        familyId: familyIds.get('FA-DEMO04')!,
        category: 'SOCIAL_STATUS',
        subject: 'Social perception of vocational routes',
        description: 'Family concerned about what relatives will say if the child chooses a trade instead of a degree.',
        status: 'RESOLVED',
        priority: 'NORMAL',
        source: 'USER_REQUEST',
        assignedAt: new Date(Date.now() - 12 * 86400000),
        resolvedAt: new Date(Date.now() - 4 * 86400000),
      },
    });
    await db.caseNote.createMany({
      data: [
        {
          caseId: resolved.id,
          authorId: userIds.get('counsellor@pathalign.demo')!,
          note: 'Shared verified progression examples and earning records with the family. Parent requested time to discuss with relatives.',
        },
        {
          caseId: resolved.id,
          authorId: userIds.get('counsellor@pathalign.demo')!,
          note: 'Follow-up call completed. Family agreed to shortlist two trades together and re-run the consensus exercise.',
        },
      ],
    });

    const firstCase = await db.counsellorCase.findFirst({ where: { conversationId: 'demo-conv-2' } });
    if (firstCase) {
      await db.caseNote.create({
        data: {
          caseId: firstCase.id,
          authorId: userIds.get('counsellor@pathalign.demo')!,
          note: 'Reviewed the Hindi conversation. Will walk the parents through qualification recognition and progression rules in the next session.',
        },
      });
      await db.appointment.create({
        data: {
          caseId: firstCase.id,
          familyId: mainFamily,
          counsellorId: counsellor.id,
          createdById: userIds.get('counsellor@pathalign.demo')!,
          scheduledAt: new Date(Date.now() + 3 * 86400000),
          durationMin: 30,
          mode: 'PHONE',
          notes: 'Joint call with student and parent — degree vs ITI comparison.',
        },
      });
    }
  }

  const sessionCount = await db.counsellingSession.count();
  if (sessionCount === 0) {
    await db.counsellingSession.createMany({
      data: [
        {
          familyId: mainFamily,
          counsellorId: counsellor.id,
          kind: 'HUMAN',
          title: 'Initial parent orientation call',
          scheduledAt: new Date(Date.now() - 6 * 86400000),
          durationMin: 30,
          status: 'COMPLETED',
          summary:
            'Explained NSQF levels and ITI recognition. Parent still compares with degree route; follow-up scheduled with progression examples.',
        },
        {
          familyId: mainFamily,
          kind: 'AI',
          title: 'AI counselling — salary & progression questions',
          scheduledAt: new Date(Date.now() - 9 * 86400000),
          durationMin: 12,
          status: 'COMPLETED',
          summary: 'Four exchanges covering entry salary estimates and growth stages for solar and electrician trades.',
        },
      ],
    });
  }
}

export async function seedInterestsRecommendationsFeedback(
  db: PrismaClient,
  userIds: Map<string, string>,
  familyIds: Map<string, string>,
  tradeIdsBySlug: Map<string, string>,
): Promise<void> {
  const mainFamily = familyIds.get('main')!;

  const interestCount = await db.careerInterest.count();
  if (interestCount === 0) {
    await db.careerInterest.createMany({
      data: [
        { userId: userIds.get('student@pathalign.demo')!, tradeId: tradeIdsBySlug.get('solar-pv-technician'), label: 'Solar PV Technician', rank: 1, source: 'SELF' },
        { userId: userIds.get('student@pathalign.demo')!, tradeId: tradeIdsBySlug.get('electrician'), label: 'Electrician', rank: 2, source: 'ASSESSMENT' },
        { userId: userIds.get('student@pathalign.demo')!, tradeId: tradeIdsBySlug.get('ev-repair-technician'), label: 'EV Repair Technician', rank: 3, source: 'SELF' },
        { userId: userIds.get('vikram.student@pathalign.demo')!, tradeId: tradeIdsBySlug.get('ev-repair-technician'), label: 'EV Repair Technician', rank: 1, source: 'SELF' },
        { userId: userIds.get('vikram.student@pathalign.demo')!, tradeId: tradeIdsBySlug.get('computer-operator-programming-assistant'), label: 'COPA', rank: 2, source: 'SELF' },
      ],
    });
  }

  const recCount = await db.careerRecommendation.count();
  if (recCount === 0) {
    await db.careerRecommendation.createMany({
      data: [
        {
          userId: userIds.get('student@pathalign.demo')!,
          familyId: mainFamily,
          tradeId: tradeIdsBySlug.get('electrician'),
          pathway: 'PREFERRED',
          rank: 1,
          title: 'Electrician',
          rationale:
            'Matches 4 of your stated interest/skill keywords. Training providers recorded in Maharashtra. Recorded maximum fee fits your budget.',
          matchScore: 100,
          evidence: [
            { label: 'Duration', value: '24 months', verificationStatus: 'SYNTHETIC_DEMO' },
            { label: 'Entry earning estimate', value: '₹12,000–₹18,000/month', verificationStatus: 'SYNTHETIC_DEMO' },
          ] as object,
        },
        {
          userId: userIds.get('student@pathalign.demo')!,
          familyId: mainFamily,
          tradeId: tradeIdsBySlug.get('solar-pv-technician'),
          pathway: 'PREFERRED',
          rank: 2,
          title: 'Solar PV Technician',
          rationale: 'Matches 3 of your stated interest/skill keywords and fits the green-energy interest you listed.',
          matchScore: 78,
          evidence: [
            { label: 'Duration', value: '6 months', verificationStatus: 'SYNTHETIC_DEMO' },
            { label: 'Entry earning estimate', value: '₹15,000–₹22,000/month', verificationStatus: 'SYNTHETIC_DEMO' },
          ] as object,
        },
        {
          userId: userIds.get('student@pathalign.demo')!,
          familyId: mainFamily,
          tradeId: tradeIdsBySlug.get('ev-repair-technician'),
          pathway: 'ALTERNATIVE',
          rank: 1,
          title: 'Electric Vehicle (EV) Repair Technician',
          rationale: 'Alternative pathway: growing sector, higher recorded entry range, related to your interest in electrical systems.',
          matchScore: 70,
          evidence: [{ label: 'Duration', value: '12 months', verificationStatus: 'SYNTHETIC_DEMO' }] as object,
        },
      ],
    });
  }

  const fbCount = await db.feedback.count();
  if (fbCount === 0) {
    await db.feedback.createMany({
      data: [
        {
          userId: userIds.get('parent@pathalign.demo')!,
          conversationId: 'demo-conv-2',
          rating: 4,
          category: 'Clarity',
          comment: 'जवाब सरल भाषा में था, पर कुछ आँकड़ों की आधिकारिक पुष्टि चाहिए.',
        },
        {
          userId: userIds.get('student@pathalign.demo')!,
          conversationId: 'demo-conv-1',
          rating: 5,
          category: 'Helpfulness',
          comment: 'The sources shown under each answer helped me verify things with my father.',
        },
      ],
    });
  }

  const noteCount = await db.notification.count();
  if (noteCount === 0) {
    await db.notification.createMany({
      data: [
        {
          userId: userIds.get('counsellor@pathalign.demo')!,
          type: 'CASE_UPDATE',
          title: 'New case assigned',
          body: 'Parent prefers traditional degree over ITI (TRADITIONAL_DEGREE)',
          link: '/counsellor/cases',
        },
        {
          userId: userIds.get('parent@pathalign.demo')!,
          type: 'CONSENSUS',
          title: 'Consensus ready to review',
          body: 'Your family consensus result is partially agreed — 1 shared preference.',
          link: '/parent/consensus',
        },
      ],
    });
  }

  const auditCount = await db.adminAuditLog.count();
  if (auditCount === 0) {
    await db.adminAuditLog.createMany({
      data: [
        {
          userId: userIds.get('admin@pathalign.demo')!,
          action: 'SEED_DEMO_DATA',
          entityType: 'System',
          details: { note: 'Initial synthetic demo dataset loaded by prisma/seed.ts' } as object,
        },
      ],
    });
  }
}

export async function seedImportBatches(db: PrismaClient, adminId: string): Promise<void> {
  const count = await db.importBatch.count();
  if (count > 0) return;
  await db.importBatch.createMany({
    data: [
      {
        filename: 'demo-trades-batch-01.csv',
        recordType: 'TRADE',
        status: 'APPROVED',
        rowCount: 18,
        acceptedRows: 18,
        payload: {
          rows: [{ name: 'Electrician', category: 'Engineering & Electrical', durationMonths: 24 }],
        } as object,
        notes: 'Initial demo catalogue import.',
        uploadedById: adminId,
        reviewedById: adminId,
        reviewedAt: new Date(Date.now() - 10 * 86400000),
      },
      {
        filename: 'state-iti-directory-extract.csv',
        recordType: 'PROVIDER',
        status: 'PENDING_REVIEW',
        rowCount: 4,
        acceptedRows: 0,
        payload: {
          rows: [
            { name: 'Awaiting official directory extract row 1' },
            { name: 'Awaiting official directory extract row 2' },
            { name: 'Awaiting official directory extract row 3' },
            { name: 'Awaiting official directory extract row 4' },
          ],
        } as object,
        notes: 'Upload a verified CSV export to replace synthetic provider records.',
        uploadedById: adminId,
      },
    ],
  });
}

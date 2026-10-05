import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth/password';
import { SEED_SOURCES } from './data/sources';
import { SEED_TRADES } from './data/trades';
import { buildSeedProviders } from './data/providers';
import { buildKnowledgeDocs } from './data/knowledge';
import {
  DEMO_USERS,
  seedAssessments,
  seedCasesAndAppointments,
  seedConcerns,
  seedConversations,
  seedConsensusAndConfidence,
  seedFamiliesAndProfiles,
  seedImportBatches,
  seedInterestsRecommendationsFeedback,
} from './data/demo';

const db = new PrismaClient();

const QUALIFICATIONS = [
  {
    code: 'CERT-6M',
    title: 'Short-term skill certificate (approx. 6 months)',
    nsqfLevel: 3,
    description: 'Short-term vocational certificate programmes.',
    progressionNote: 'Progression to higher NSQF levels is subject to applicable eligibility rules — verify current mapping.',
  },
  {
    code: 'ITI-1Y',
    title: 'ITI certificate (1-year trade qualification)',
    nsqfLevel: 4,
    description: 'One-year Craftsman Training Scheme trade certificate.',
    progressionNote: 'Further education and lateral-entry options vary by state and institution — verify before deciding.',
  },
  {
    code: 'ITI-2Y',
    title: 'ITI certificate (2-year trade qualification)',
    nsqfLevel: 5,
    description: 'Two-year Craftsman Training Scheme trade certificate.',
    progressionNote: 'Diploma progression options exist under applicable rules — confirm with the official qualification framework.',
  },
  {
    code: 'DIP-3Y',
    title: 'Diploma (3-year technical qualification)',
    nsqfLevel: 6,
    description: 'Three-year technical diploma.',
    progressionNote: 'Degree-level progression rules vary — verify current regulations.',
  },
];

const SECTOR_BY_CATEGORY: Record<string, { sector: 'GOVERNMENT' | 'PRIVATE_MANUFACTURING' | 'PRIVATE_SERVICES' | 'IT_SOFTWARE' | 'HEALTHCARE' | 'CONSTRUCTION' | 'RETAIL' | 'ENTREPRENEURSHIP' | 'FREELANCE' | 'OTHER'; employers: string }> = {
  'Engineering & Electrical': { sector: 'PRIVATE_MANUFACTURING', employers: 'manufacturing plants, facility management companies, electrical contractors, infrastructure projects' },
  'Engineering & Mechanical': { sector: 'PRIVATE_MANUFACTURING', employers: 'engineering plants, machine builders, maintenance contractors, heavy equipment service firms' },
  'Engineering & Fabrication': { sector: 'CONSTRUCTION', employers: 'fabrication workshops, construction contractors, shipbuilding and rail units' },
  'Green Energy': { sector: 'PRIVATE_SERVICES', employers: 'solar EPC companies, EV service networks, renewable energy developers' },
  'IT & Software': { sector: 'IT_SOFTWARE', employers: 'IT support teams, software firms, BPO/ITES operations, computer service centres' },
  'IT & Hardware': { sector: 'PRIVATE_SERVICES', employers: 'mobile service chains, independent repair stores, electronics service centres' },
  'Automobile': { sector: 'PRIVATE_SERVICES', employers: 'dealership workshops, transport fleets, garages, OEM service networks' },
  'Electronics': { sector: 'PRIVATE_MANUFACTURING', employers: 'electronics manufacturers, assembly lines, service and test labs' },
  'Apparel & Design': { sector: 'PRIVATE_MANUFACTURING', employers: 'garment factories, export units, boutiques and design studios' },
  'Personal Services': { sector: 'ENTREPRENEURSHIP', employers: 'salons, spas, bridal studios, freelance practice' },
  'Hospitality & Food': { sector: 'PRIVATE_SERVICES', employers: 'hotels, catering firms, restaurants, cloud kitchens, retail bakeries' },
  'Construction & Building': { sector: 'CONSTRUCTION', employers: 'construction contractors, plumbing services, interior fit-out firms' },
  'Construction & Woodworking': { sector: 'CONSTRUCTION', employers: 'furniture manufacturers, interior fit-out contractors, carpentry workshops' },
  'Healthcare Support': { sector: 'HEALTHCARE', employers: 'hospitals, nursing homes, diagnostic centres, facility management firms' },
};

const OPPORTUNITY_STATES = ['Maharashtra', 'Uttar Pradesh', 'Tamil Nadu', 'Gujarat', 'Karnataka', 'Rajasthan'];

async function wipe(db: PrismaClient): Promise<void> {
  // children first — order matters because not every relation cascades
  await db.$transaction([
    db.chatMessage.deleteMany({}),
    db.chatConversation.deleteMany({}),
    db.session.deleteMany({}),
    db.caseNote.deleteMany({}),
    db.appointment.deleteMany({}),
    db.counsellingSession.deleteMany({}),
    db.counsellorCase.deleteMany({}),
    db.counsellor.deleteMany({}),
    db.careerAssessment.deleteMany({}),
    db.careerInterest.deleteMany({}),
    db.parentConcern.deleteMany({}),
    db.familyConsensus.deleteMany({}),
    db.confidenceAssessment.deleteMany({}),
    db.careerRecommendation.deleteMany({}),
    db.careerReport.deleteMany({}),
    db.feedback.deleteMany({}),
    db.notification.deleteMany({}),
    db.adminAuditLog.deleteMany({}),
    db.consentRecord.deleteMany({}),
    db.familyMember.deleteMany({}),
    db.studentProfile.deleteMany({}),
    db.parentProfile.deleteMany({}),
    db.dataVerification.deleteMany({}),
    db.importBatch.deleteMany({}),
    db.knowledgeDocument.deleteMany({}),
    db.placementStatistic.deleteMany({}),
    db.salaryStatistic.deleteMany({}),
    db.careerPathwayStage.deleteMany({}),
    db.careerPathway.deleteMany({}),
    db.providerCourse.deleteMany({}),
    db.employmentOpportunity.deleteMany({}),
    db.trainingProvider.deleteMany({}),
    db.careerTrade.deleteMany({}),
    db.qualification.deleteMany({}),
    db.dataSource.deleteMany({}),
    db.family.deleteMany({}),
    db.user.deleteMany({}),
  ]);
}

async function main(): Promise<void> {
  console.log('[seed] resetting database…');
  await wipe(db);

  // ── Data sources ────────────────────────────────────────
  const sourceIds = new Map<string, string>();
  for (const s of SEED_SOURCES) {
    const rec = await db.dataSource.create({
      data: {
        name: s.name,
        url: s.url,
        publisher: s.publisher,
        category: s.category,
        description: s.description,
        geographicScope: s.geographicScope,
        isSynthetic: s.isSynthetic,
        verificationStatus: s.verificationStatus,
        lastVerifiedAt: null,
      },
    });
    sourceIds.set(s.key, rec.id);
  }
  console.log(`[seed] ${sourceIds.size} data sources`);

  // ── Qualifications ──────────────────────────────────────
  const qualIds = new Map<number, string>();
  for (const q of QUALIFICATIONS) {
    const rec = await db.qualification.create({
      data: {
        code: q.code,
        title: q.title,
        nsqfLevel: q.nsqfLevel,
        description: q.description,
        progressionNote: q.progressionNote,
        sourceId: sourceIds.get('NSQF'),
        verificationStatus: 'PENDING_VERIFICATION',
      },
    });
    qualIds.set(q.nsqfLevel, rec.id);
  }

  // ── Trades, salary stats, pathways ──────────────────────
  const tradeIds = new Map<string, string>();
  for (const t of SEED_TRADES) {
    const trade = await db.careerTrade.create({
      data: {
        name: t.name,
        slug: t.slug,
        category: t.category,
        description: t.description,
        durationMonths: t.durationMonths,
        nsqfLevel: t.nsqfLevel,
        eligibility: t.eligibility,
        feeMin: t.feeMin,
        feeMax: t.feeMax,
        qualificationId: t.nsqfLevel ? (qualIds.get(t.nsqfLevel) ?? null) : null,
        isSynthetic: true,
        sourceId: sourceIds.get('DEMO'),
        verificationStatus: 'SYNTHETIC_DEMO',
      },
    });
    tradeIds.set(t.slug, trade.id);

    await db.salaryStatistic.createMany({
      data: [
        {
          tradeId: trade.id,
          experienceLevel: 'ENTRY',
          monthlyMin: t.salary.entry[0],
          monthlyMax: t.salary.entry[1],
          geography: 'India (demo range)',
          isEstimate: true,
          notes: 'Illustrative demo range — verify against current official or employer sources.',
          sourceId: sourceIds.get('DEMO'),
          verificationStatus: 'SYNTHETIC_DEMO',
        },
        {
          tradeId: trade.id,
          experienceLevel: 'MID',
          monthlyMin: t.salary.mid[0],
          monthlyMax: t.salary.mid[1],
          geography: 'India (demo range)',
          isEstimate: true,
          notes: 'Illustrative demo range — verify against current official or employer sources.',
          sourceId: sourceIds.get('DEMO'),
          verificationStatus: 'SYNTHETIC_DEMO',
        },
        {
          tradeId: trade.id,
          experienceLevel: 'SENIOR',
          monthlyMin: t.salary.senior[0],
          monthlyMax: t.salary.senior[1],
          geography: 'India (demo range)',
          isEstimate: true,
          notes: 'Illustrative demo range — verify against current official or employer sources.',
          sourceId: sourceIds.get('DEMO'),
          verificationStatus: 'SYNTHETIC_DEMO',
        },
      ],
    });

    const pathway = await db.careerPathway.create({
      data: {
        tradeId: trade.id,
        title: `${t.name} — standard progression (demo)`,
        description:
          'Four-stage progression compiled for the demo dataset. Stages are not automatic; they depend on employer, experience and applicable qualification rules.',
      },
    });

    const stages = [
      {
        order: 1,
        title: `Training: ${t.name} (${t.durationMonths} months)`,
        description: `Complete the ${t.durationMonths}-month ${t.name} course. Eligibility: ${t.eligibility}. Recorded fee: ₹${t.feeMin.toLocaleString('en-IN')}–₹${t.feeMax.toLocaleString('en-IN')}.`,
        qualification: t.nsqfLevel === 3 ? 'Short-term skill certificate' : t.nsqfLevel === 4 ? 'ITI certificate (1-year)' : 'ITI certificate (2-year)',
        nsqfLevel: t.nsqfLevel,
        experienceYears: 0,
        salaryRange: `₹${t.salary.entry[0].toLocaleString('en-IN')}–₹${t.salary.entry[1].toLocaleString('en-IN')} / month (estimate)`,
        skills: ['Trade fundamentals', 'Workshop safety', 'Tool handling'],
        employmentSectors: [t.category],
        furtherEducation: null,
      },
      {
        order: 2,
        title: `Entry role: ${t.stages.entryRole}`,
        description: 'First job stage — supervised work, safety protocols and practical site experience.',
        qualification: null,
        nsqfLevel: null,
        experienceYears: 0,
        salaryRange: `₹${t.salary.entry[0].toLocaleString('en-IN')}–₹${t.salary.entry[1].toLocaleString('en-IN')} / month (estimate)`,
        skills: ['Safety procedures', 'Quality checks', 'Team coordination'],
        employmentSectors: [t.category],
        furtherEducation: null,
      },
      {
        order: 3,
        title: `Experienced stage: ${t.stages.midRole}`,
        description: 'After roughly 3–6 years of consistent work, roles expand to independent responsibility and mentoring.',
        qualification: null,
        nsqfLevel: null,
        experienceYears: 3,
        salaryRange: `₹${t.salary.mid[0].toLocaleString('en-IN')}–₹${t.salary.mid[1].toLocaleString('en-IN')} / month (estimate)`,
        skills: ['Independent execution', 'Client handling', 'Mentoring juniors'],
        employmentSectors: [t.category],
        furtherEducation: null,
      },
      {
        order: 4,
        title: `Senior stage: ${t.stages.seniorRole}`,
        description: t.selfEmployment
          ? 'Senior stage may include supervision roles or starting own work, subject to licences, capital and market conditions.'
          : 'Senior stage typically involves supervision, inspection or specialist roles.',
        qualification: null,
        nsqfLevel: null,
        experienceYears: 7,
        salaryRange: `₹${t.salary.senior[0].toLocaleString('en-IN')}–₹${t.salary.senior[1].toLocaleString('en-IN')} / month (estimate)`,
        skills: ['Team supervision', 'Estimation & planning', 'Compliance knowledge'],
        employmentSectors: [t.category],
        furtherEducation: t.stages.furtherEducation,
      },
    ];

    await db.careerPathwayStage.createMany({
      data: stages.map((s) => ({ ...s, pathwayId: pathway.id })),
    });

    // Employment opportunity descriptions (employer segments, not live vacancies)
    const sectorInfo = SECTOR_BY_CATEGORY[t.category] ?? { sector: 'OTHER' as const, employers: 'local employers' };
    const state1 = OPPORTUNITY_STATES[Math.floor(Math.random() * OPPORTUNITY_STATES.length)]!;
    const state2 = OPPORTUNITY_STATES[Math.floor(Math.random() * OPPORTUNITY_STATES.length)]!;
    await db.employmentOpportunity.createMany({
      data: [
        {
          tradeId: trade.id,
          title: `${t.name} — typical employer segments`,
          sector: sectorInfo.sector,
          employmentType: 'PRIVATE',
          state: state1,
          district: null,
          employerName: null,
          isVacancy: false,
          description: `Where ${t.name} professionals usually work: ${sectorInfo.employers}. This is a description of the employment landscape — not a current job opening. Verify live vacancies on the National Career Service portal.`,
          openPositions: null,
          sourceUrl: 'https://www.ncs.gov.in',
          isSynthetic: true,
          sourceId: sourceIds.get('NCS'),
          verificationStatus: 'PENDING_VERIFICATION',
        },
        {
          tradeId: trade.id,
          title: t.selfEmployment ? `${t.name} — self-employment pathways` : `${t.name} — public sector & apprenticeship routes`,
          sector: t.selfEmployment ? 'ENTREPRENEURSHIP' : sectorInfo.sector,
          employmentType: t.selfEmployment ? 'SELF_EMPLOYMENT' : 'APPRENTICESHIP',
          state: state2,
          district: null,
          employerName: null,
          isVacancy: false,
          description: t.selfEmployment
            ? `Skilled ${t.name} workers sometimes start independent service businesses or workshops after gaining experience and licences. Business outcomes depend on local demand and capital — this is not a guaranteed income path.`
            : `${t.name} roles also appear in government organisations, PSUs and apprenticeship programmes. Check current notifications on official portals — no vacancy is claimed here.`,
          openPositions: null,
          sourceUrl: t.selfEmployment ? null : 'https://www.apprenticeshipindia.gov.in',
          isSynthetic: true,
          sourceId: sourceIds.get(t.selfEmployment ? 'DEMO' : 'APPRENTICESHIP'),
          verificationStatus: t.selfEmployment ? 'SYNTHETIC_DEMO' : 'PENDING_VERIFICATION',
        },
      ],
    });
  }
  console.log(`[seed] ${tradeIds.size} trades + salary stats + pathways + opportunities`);

  // ── Training providers + courses ────────────────────────
  const providers = buildSeedProviders();
  for (const p of providers) {
    const provider = await db.trainingProvider.create({
      data: {
        name: p.name,
        type: p.type,
        state: p.state,
        district: p.district,
        city: p.city,
        pinCode: p.pinCode,
        lat: p.lat,
        lng: p.lng,
        affiliation: p.affiliation,
        isSynthetic: true,
        sourceId: sourceIds.get('DEMO'),
        verificationStatus: 'SYNTHETIC_DEMO',
      },
    });
    await db.providerCourse.createMany({
      data: p.courses
        .filter((c) => tradeIds.has(c.slug))
        .map((c) => ({
          providerId: provider.id,
          tradeId: tradeIds.get(c.slug)!,
          durationMonths: c.durationMonths,
          feeMin: c.feeMin,
          feeMax: c.feeMax,
          eligibility: 'Class 10th pass (verify with institute)',
          seats: c.seats,
        })),
    });
  }
  console.log(`[seed] ${providers.length} demo training providers`);

  // ── Knowledge documents (RAG corpus) ────────────────────
  const docs = buildKnowledgeDocs(SEED_TRADES);
  await db.knowledgeDocument.createMany({
    data: docs.map((d) => ({
      title: d.title,
      chunk: d.chunk,
      docType: d.docType,
      language: d.language,
      tags: d.tags,
      tradeId: d.tradeSlug ? (tradeIds.get(d.tradeSlug) ?? null) : null,
      sourceId: sourceIds.get(d.sourceKey) ?? sourceIds.get('DEMO'),
      verificationStatus: d.verificationStatus,
      lastVerifiedAt: null,
      publishedAt: new Date('2026-09-30'),
    })),
  });
  console.log(`[seed] ${docs.length} knowledge chunks`);

  // ── Demo users ──────────────────────────────────────────
  const passwords: Record<string, string> = {};
  const hashOf = async (pw: string) => (passwords[pw] ??= await hashPassword(pw));

  const userIds = new Map<string, string>();
  for (const u of DEMO_USERS) {
    const pw =
      u.role === 'ADMIN'
        ? 'Admin@123'
        : u.role === 'COUNSELLOR'
          ? 'Counsel@123'
          : u.role === 'STUDENT'
            ? 'Student@123'
            : 'Parent@123';
    const user = await db.user.create({
      data: {
        fullName: u.fullName,
        email: u.email,
        mobile: u.mobile,
        passwordHash: await hashOf(pw),
        role: u.role,
        state: u.state,
        district: u.district,
        preferredLanguage: u.language,
      },
    });
    userIds.set(u.email, user.id);
  }
  console.log(`[seed] ${userIds.size} demo users`);

  const familyIds = await seedFamiliesAndProfiles(db, userIds, await hashOf('Parent@123'));
  await seedAssessments(db, userIds, familyIds);
  await seedConcerns(db, userIds, familyIds);
  await seedConversations(db, userIds, familyIds);
  await seedConsensusAndConfidence(db, familyIds);
  await seedCasesAndAppointments(db, userIds, familyIds);
  await seedInterestsRecommendationsFeedback(db, userIds, familyIds, tradeIds);
  await seedImportBatches(db, userIds.get('admin@pathalign.demo')!);

  // ── Verification history sample ─────────────────────────
  await db.dataVerification.createMany({
    data: [
      {
        sourceId: sourceIds.get('DGT'),
        recordType: 'SOURCE',
        recordId: sourceIds.get('DGT'),
        status: 'PENDING_VERIFICATION',
        notes: 'Portal URL recorded at seed time; content not yet reviewed by an administrator.',
        verifiedById: userIds.get('admin@pathalign.demo'),
      },
      {
        sourceId: sourceIds.get('DEMO'),
        recordType: 'TRADE',
        recordId: tradeIds.get('electrician'),
        status: 'SYNTHETIC_DEMO',
        notes: 'Electrician demo record confirmed as synthetic; replace with official trade data via CSV import.',
        verifiedById: userIds.get('admin@pathalign.demo'),
      },
    ],
  });

  const [users, trades, providersCount, chunks, concerns] = await Promise.all([
    db.user.count(),
    db.careerTrade.count(),
    db.trainingProvider.count(),
    db.knowledgeDocument.count(),
    db.parentConcern.count(),
  ]);
  console.log('[seed] done:', { users, trades, providers: providersCount, chunks, concerns });
  console.log('[seed] demo logins: admin@pathalign.demo / student@pathalign.demo / parent@pathalign.demo / counsellor@pathalign.demo (see README for passwords)');
}

main()
  .catch((err) => {
    console.error('[seed] failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });

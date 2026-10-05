import { z } from 'zod';

const mobileRegex = /^[6-9]\d{9}$/;

export const languageSchema = z.enum(['EN', 'HI']);

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  mobile: z
    .string()
    .trim()
    .regex(mobileRegex, 'Enter a valid 10-digit Indian mobile number')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[a-zA-Z]/, 'Password must include a letter')
    .regex(/[0-9]/, 'Password must include a number'),
  role: z.enum(['STUDENT', 'PARENT', 'COUNSELLOR', 'ADMIN']),
  state: z.string().trim().min(2),
  district: z.string().trim().min(1),
  preferredLanguage: languageSchema.default('EN'),
  familyCode: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v.toUpperCase() : undefined)),
  isMinor: z.boolean().optional().default(false),
  guardianName: z.string().trim().max(120).optional(),
  consent: z.boolean().refine((v) => v === true, 'Consent is required'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, 'Password is required'),
});

export const studentProfileSchema = z.object({
  age: z.number().int().min(10).max(30).optional().nullable(),
  qualification: z.string().trim().max(120).optional().nullable(),
  academicBackground: z.string().trim().max(500).optional().nullable(),
  interests: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  skills: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  preferredCareerAreas: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  location: z.string().trim().max(160).optional().nullable(),
  aspirations: z.string().trim().max(1000).optional().nullable(),
});

export const parentProfileSchema = z.object({
  educationBackground: z.string().trim().max(200).optional().nullable(),
  careerExpectations: z.string().trim().max(1000).optional().nullable(),
  financialConcerns: z.string().trim().max(1000).optional().nullable(),
  preferredEmploymentType: z
    .enum(['GOVERNMENT', 'PRIVATE', 'SELF_EMPLOYMENT', 'APPRENTICESHIP', 'FREELANCE', 'FAMILY_BUSINESS'])
    .optional()
    .nullable(),
  careerConcerns: z.array(z.string().trim().min(1).max(120)).max(12).default([]),
});

export const familyContextSchema = z.object({
  areaType: z.enum(['URBAN', 'SEMI_URBAN', 'RURAL']).optional(),
  incomeBracket: z.string().trim().max(60).optional(),
  preferredLanguage: languageSchema.optional(),
});

export const familyCreateSchema = z.object({
  name: z.string().trim().max(120).optional(),
  areaType: z.enum(['URBAN', 'SEMI_URBAN', 'RURAL']).optional(),
  incomeBracket: z.string().trim().max(60).optional(),
});

export const familyJoinSchema = z.object({
  familyCode: z.string().trim().min(4).transform((v) => v.toUpperCase()),
  relation: z.enum(['STUDENT', 'PARENT', 'GUARDIAN']),
  consent: z.boolean().refine((v) => v === true, 'Consent to share within family is required'),
});

export const assessmentSchema = z.object({
  kind: z.enum(['STUDENT_INTEREST', 'PARENT_EXPECTATIONS', 'FAMILY_CONTEXT']),
  answers: z.record(z.any()),
});

export const chatSendSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().trim().min(1, 'Message cannot be empty').max(4000),
  language: languageSchema.optional(),
});

export const conversationCreateSchema = z.object({
  kind: z
    .enum(['OBJECTION_ANALYZER', 'GENERAL_COUNSELLING', 'DIGITAL_TWIN', 'MYTH_FOLLOWUP'])
    .default('OBJECTION_ANALYZER'),
  language: languageSchema.default('EN'),
  title: z.string().trim().max(160).optional(),
  familyId: z.string().optional(),
});

export const feedbackSchema = z.object({
  conversationId: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  category: z.string().trim().max(60).optional(),
  comment: z.string().trim().max(1000).optional(),
});

export const interestSchema = z.object({
  tradeId: z.string().optional(),
  label: z.string().trim().min(2).max(120),
  rank: z.number().int().min(1).max(10).default(1),
});

export const concernSchema = z.object({
  category: z.enum([
    'LOW_SALARY',
    'JOB_SECURITY',
    'SOCIAL_STATUS',
    'SAFETY',
    'TRADITIONAL_DEGREE',
    'FURTHER_EDUCATION',
    'FINANCIAL_LIMITATION',
    'LACK_OF_AWARENESS',
    'FAMILY_PRESSURE',
    'OTHER',
  ]),
  detail: z.string().trim().min(3).max(2000),
  familyId: z.string().optional(),
  language: languageSchema.default('EN'),
});

export const simulatorSchema = z.object({
  tradeId: z.string().min(1),
  state: z.string().trim().max(80).optional(),
  district: z.string().trim().max(80).optional(),
  educationLevel: z.enum(['10TH', '12TH', 'GRADUATE', 'ITI_PASS', 'DIPLOMA']).default('10TH'),
  budget: z.number().int().min(0).max(2000000).optional(),
  experienceLevel: z.enum(['FRESH', '1_3_YEARS', '3_10_YEARS', '10_PLUS']).default('FRESH'),
  includeSelfEmployment: z.boolean().default(true),
});

export const comparisonSchema = z.object({
  tradeIds: z.array(z.string().min(1)).min(2).max(2),
  state: z.string().trim().max(80).optional(),
});

export const consensusCreateSchema = z.object({
  familyId: z.string().min(1),
  studentPicks: z
    .array(z.object({ tradeId: z.string().optional(), label: z.string().trim().min(1).max(120) }))
    .min(1)
    .max(6),
  parentPicks: z
    .array(z.object({ tradeId: z.string().optional(), label: z.string().trim().min(1).max(120) }))
    .min(1)
    .max(6),
  studentConcerns: z.array(z.string().trim().min(1).max(300)).max(10).default([]),
  parentConcerns: z.array(z.string().trim().min(1).max(300)).max(10).default([]),
});

export const consensusDecisionSchema = z.object({
  consensusId: z.string().min(1),
  participant: z.enum(['STUDENT', 'PARENT']),
  decision: z.string().trim().min(2).max(600),
});

export const confidenceSchema = z.object({
  familyId: z.string().min(1),
  phase: z.enum(['PRE', 'POST']),
  answers: z.object({
    awareness: z.number().int().min(0).max(4),
    employmentTrust: z.number().int().min(0).max(4),
    salaryUnderstanding: z.number().int().min(0).max(4),
    progressionAwareness: z.number().int().min(0).max(4),
    willingness: z.number().int().min(0).max(4),
  }),
});

export const twinSchema = z.object({
  education: z.string().trim().min(2).max(200),
  skills: z.array(z.string().trim().min(1).max(80)).max(15).default([]),
  interests: z.array(z.string().trim().min(1).max(80)).max(15).default([]),
  preferredLocation: z.string().trim().max(120).optional(),
  aspirations: z.string().trim().max(800).optional(),
  budget: z.number().int().min(0).max(2000000).default(0),
  targetTradeId: z.string().optional(),
});

export const opportunitySearchSchema = z.object({
  state: z.string().trim().min(2).max(80),
  district: z.string().trim().max(80).optional(),
  pinCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/)
    .optional(),
  tradeId: z.string().optional(),
  providerType: z
    .enum([
      'ITI',
      'PRIVATE_ITI',
      'POLYTECHNIC',
      'COMMUNITY_SKILL_CENTRE',
      'NSDC_PARTNER',
      'APPRENTICESHIP_TRAINING_PROVIDER',
      'ONLINE',
    ])
    .optional(),
  maxDurationMonths: z.number().int().min(1).max(48).optional(),
  maxFee: z.number().int().min(0).optional(),
  includeVacancies: z.boolean().default(true),
  radiusKm: z.number().int().min(1).max(200).default(50),
});

export const caseCreateSchema = z.object({
  subject: z.string().trim().min(4).max(180),
  description: z.string().trim().min(10).max(4000),
  category: z.enum([
    'LOW_SALARY',
    'JOB_SECURITY',
    'SOCIAL_STATUS',
    'SAFETY',
    'TRADITIONAL_DEGREE',
    'FURTHER_EDUCATION',
    'FINANCIAL_LIMITATION',
    'LACK_OF_AWARENESS',
    'FAMILY_PRESSURE',
    'OTHER',
  ]),
  conversationId: z.string().optional(),
  shareConversation: z.boolean().default(false),
  familyId: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
});

export const caseUpdateSchema = z.object({
  status: z.enum(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  note: z.string().trim().max(2000).optional(),
  assignToMe: z.boolean().optional(),
});

export const appointmentSchema = z.object({
  caseId: z.string().optional(),
  familyId: z.string().optional(),
  counsellorId: z.string().min(1),
  scheduledAt: z.string().datetime({ offset: true }),
  durationMin: z.number().int().min(10).max(180).default(30),
  mode: z.enum(['VIDEO', 'PHONE', 'IN_PERSON']).default('PHONE'),
  notes: z.string().trim().max(1000).optional(),
});

export const reportSchema = z.object({
  type: z.enum(['FAMILY_AGREEMENT', 'COUNSELLING_SUMMARY', 'CAREER_ANALYSIS']),
  familyId: z.string().optional(),
  language: languageSchema.default('EN'),
  consensusId: z.string().optional(),
  conversationId: z.string().optional(),
});

export const tradeSchema = z.object({
  name: z.string().trim().min(3).max(140),
  category: z.string().trim().min(2).max(80),
  ncoCode: z.string().trim().max(40).optional(),
  description: z.string().trim().min(10).max(3000),
  durationMonths: z.number().int().min(1).max(60),
  nsqfLevel: z.number().int().min(1).max(10).optional(),
  eligibility: z.string().trim().max(400).optional(),
  qualificationId: z.string().optional(),
  feeMin: z.number().int().min(0).optional(),
  feeMax: z.number().int().min(0).optional(),
  sourceId: z.string().optional(),
  verificationStatus: z
    .enum(['VERIFIED', 'PENDING_VERIFICATION', 'OUTDATED', 'UNAVAILABLE', 'SYNTHETIC_DEMO'])
    .default('PENDING_VERIFICATION'),
});

export const providerSchema = z.object({
  name: z.string().trim().min(3).max(180),
  type: z.enum([
    'ITI',
    'PRIVATE_ITI',
    'POLYTECHNIC',
    'COMMUNITY_SKILL_CENTRE',
    'NSDC_PARTNER',
    'APPRENTICESHIP_TRAINING_PROVIDER',
    'ONLINE',
  ]),
  state: z.string().trim().min(2).max(80),
  district: z.string().trim().min(1).max(80),
  city: z.string().trim().max(80).optional(),
  pinCode: z.string().trim().regex(/^\d{6}$/).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  website: z.string().url().optional().or(z.literal('')),
  affiliation: z.string().trim().max(200).optional(),
  sourceId: z.string().optional(),
});

export const sourceSchema = z.object({
  name: z.string().trim().min(2).max(160),
  url: z.string().url().optional().or(z.literal('')),
  publisher: z.string().trim().max(160).optional(),
  category: z.enum(['GOVERNMENT', 'OFFICIAL_BODY', 'PSU', 'NGO', 'ACADEMIC', 'COMMERCIAL', 'INTERNAL_DEMO']),
  description: z.string().trim().max(1200).optional(),
  geographicScope: z.string().trim().max(120).optional(),
  publishedAt: z.string().datetime({ offset: true }).optional(),
  isSynthetic: z.boolean().default(false),
});

export const importBatchSchema = z.object({
  filename: z.string().trim().min(1).max(200),
  recordType: z.enum(['TRADE', 'PROVIDER', 'OPPORTUNITY', 'KNOWLEDGE']),
  csv: z.string().min(1),
});

export const importReviewSchema = z.object({
  batchId: z.string().min(1),
  decision: z.enum(['APPROVED', 'REJECTED']),
  notes: z.string().trim().max(1000).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type StudentProfileInput = z.infer<typeof studentProfileSchema>;
export type ParentProfileInput = z.infer<typeof parentProfileSchema>;
export type SimulatorInput = z.infer<typeof simulatorSchema>;
export type TwinInput = z.infer<typeof twinSchema>;
export type OpportunitySearchInput = z.infer<typeof opportunitySearchSchema>;
export type CaseCreateInput = z.infer<typeof caseCreateSchema>;
export type ConsensusCreateInput = z.infer<typeof consensusCreateSchema>;
export type ConfidenceInput = z.infer<typeof confidenceSchema>;

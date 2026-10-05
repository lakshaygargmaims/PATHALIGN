import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  familyJoinSchema,
  confidenceSchema,
  consensusCreateSchema,
  caseCreateSchema,
  appointmentSchema,
  opportunitySearchSchema,
  comparisonSchema,
  simulatorSchema,
} from '@/lib/validation/schemas';

const baseRegister = {
  fullName: 'Asha Sharma',
  email: 'asha@example.com',
  mobile: '9876543210',
  password: 'secret123',
  role: 'STUDENT',
  state: 'Maharashtra',
  district: 'Pune',
  consent: true,
};

describe('registerSchema', () => {
  it('accepts a valid registration and normalises the email', () => {
    const r = registerSchema.parse({ ...baseRegister, email: 'Asha@Example.COM ' });
    expect(r.email).toBe('asha@example.com');
    expect(r.preferredLanguage).toBe('EN');
    expect(r.isMinor).toBe(false);
  });

  it('rejects a weak password', () => {
    expect(registerSchema.safeParse({ ...baseRegister, password: 'short' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...baseRegister, password: 'onlyletters' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...baseRegister, password: '12345678' }).success).toBe(false);
  });

  it('requires explicit consent', () => {
    const r = registerSchema.safeParse({ ...baseRegister, consent: false });
    expect(r.success).toBe(false);
  });

  it('rejects a mobile number that is not a valid 10-digit Indian number', () => {
    expect(registerSchema.safeParse({ ...baseRegister, mobile: '1234567890' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...baseRegister, mobile: '98765432' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...baseRegister, mobile: '9876543210' }).success).toBe(true);
  });

  it('treats a blank mobile as absent', () => {
    const r = registerSchema.parse({ ...baseRegister, mobile: '' });
    expect(r.mobile).toBeUndefined();
  });

  it('upper-cases a supplied family code', () => {
    expect(registerSchema.parse({ ...baseRegister, familyCode: ' fa-1234 ' }).familyCode).toBe('FA-1234');
  });
});

describe('loginSchema', () => {
  it('requires an email and a password', () => {
    expect(loginSchema.safeParse({ email: 'not-an-email', password: 'x' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
  });
});

describe('familyJoinSchema', () => {
  it('normalises the family code and requires consent', () => {
    expect(familyJoinSchema.safeParse({ familyCode: 'fa-99xy', relation: 'PARENT', consent: false }).success).toBe(false);
    const r = familyJoinSchema.parse({ familyCode: ' fa-99xy ', relation: 'PARENT', consent: true });
    expect(r.familyCode).toBe('FA-99XY');
  });
});

describe('confidenceSchema', () => {
  const answers = {
    awareness: 2,
    employmentTrust: 2,
    salaryUnderstanding: 2,
    progressionAwareness: 2,
    willingness: 2,
  };

  it('accepts answers inside 0-4', () => {
    expect(confidenceSchema.safeParse({ familyId: 'f1', phase: 'PRE', answers }).success).toBe(true);
  });

  it('rejects answers outside 0-4', () => {
    expect(confidenceSchema.safeParse({ familyId: 'f1', phase: 'PRE', answers: { ...answers, awareness: 5 } }).success).toBe(false);
    expect(confidenceSchema.safeParse({ familyId: 'f1', phase: 'PRE', answers: { ...answers, awareness: -1 } }).success).toBe(false);
  });

  it('rejects non-integer answers and unknown phases', () => {
    expect(confidenceSchema.safeParse({ familyId: 'f1', phase: 'PRE', answers: { ...answers, awareness: 2.5 } }).success).toBe(false);
    expect(confidenceSchema.safeParse({ familyId: 'f1', phase: 'MID', answers }).success).toBe(false);
  });
});

describe('consensusCreateSchema', () => {
  it('requires at least one pick on each side and defaults the concern lists', () => {
    const r = consensusCreateSchema.parse({
      familyId: 'f1',
      studentPicks: [{ label: 'Electrician' }],
      parentPicks: [{ label: 'Plumber' }],
    });
    expect(r.studentConcerns).toEqual([]);
    expect(r.parentConcerns).toEqual([]);
  });

  it('rejects an empty pick list', () => {
    expect(
      consensusCreateSchema.safeParse({ familyId: 'f1', studentPicks: [], parentPicks: [{ label: 'P' }] }).success,
    ).toBe(false);
  });
});

describe('caseCreateSchema', () => {
  it('applies defaults for priority and conversation sharing', () => {
    const r = caseCreateSchema.parse({
      subject: 'Salary query',
      description: 'The parent wants to understand realistic earnings.',
      category: 'LOW_SALARY',
    });
    expect(r.priority).toBe('NORMAL');
    expect(r.shareConversation).toBe(false);
  });

  it('rejects a too-short subject or description', () => {
    const base = { subject: 'Hi', description: 'short', category: 'OTHER' };
    expect(caseCreateSchema.safeParse(base).success).toBe(false);
    expect(caseCreateSchema.safeParse({ ...base, subject: 'Salary question' }).success).toBe(false);
  });

  it('rejects an unknown concern category', () => {
    expect(
      caseCreateSchema.safeParse({
        subject: 'Salary question',
        description: 'A long enough description here.',
        category: 'NOT_A_CATEGORY',
      }).success,
    ).toBe(false);
  });
});

describe('appointmentSchema', () => {
  it('requires an ISO datetime with an offset and defaults duration and mode', () => {
    const r = appointmentSchema.parse({
      counsellorId: 'c1',
      scheduledAt: '2026-11-01T10:00:00+05:30',
    });
    expect(r.durationMin).toBe(30);
    expect(r.mode).toBe('PHONE');
  });

  it('rejects a datetime without an offset and out-of-range durations', () => {
    expect(appointmentSchema.safeParse({ counsellorId: 'c1', scheduledAt: '2026-11-01T10:00:00' }).success).toBe(false);
    expect(
      appointmentSchema.safeParse({ counsellorId: 'c1', scheduledAt: '2026-11-01T10:00:00Z', durationMin: 5 }).success,
    ).toBe(false);
  });
});

describe('opportunitySearchSchema', () => {
  it('defaults the search radius and includes vacancies', () => {
    const r = opportunitySearchSchema.parse({ state: 'Maharashtra' });
    expect(r.radiusKm).toBe(50);
    expect(r.includeVacancies).toBe(true);
  });

  it('validates a 6-digit pin code and bounds the radius', () => {
    expect(opportunitySearchSchema.safeParse({ state: 'Maharashtra', pinCode: '411001' }).success).toBe(true);
    expect(opportunitySearchSchema.safeParse({ state: 'Maharashtra', pinCode: '4110' }).success).toBe(false);
    expect(opportunitySearchSchema.safeParse({ state: 'Maharashtra', radiusKm: 500 }).success).toBe(false);
  });
});

describe('comparisonSchema', () => {
  it('requires exactly two distinct-enough trade ids', () => {
    expect(comparisonSchema.safeParse({ tradeIds: ['a', 'b'] }).success).toBe(true);
    expect(comparisonSchema.safeParse({ tradeIds: ['a'] }).success).toBe(false);
    expect(comparisonSchema.safeParse({ tradeIds: ['a', 'b', 'c'] }).success).toBe(false);
    expect(comparisonSchema.safeParse({ tradeIds: ['a', ''] }).success).toBe(false);
  });
});

describe('simulatorSchema', () => {
  it('defaults education level, experience and self-employment', () => {
    const r = simulatorSchema.parse({ tradeId: 't1' });
    expect(r.educationLevel).toBe('10TH');
    expect(r.experienceLevel).toBe('FRESH');
    expect(r.includeSelfEmployment).toBe(true);
  });

  it('rejects a negative budget', () => {
    expect(simulatorSchema.safeParse({ tradeId: 't1', budget: -1 }).success).toBe(false);
  });
});

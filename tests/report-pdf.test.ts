import { describe, it, expect } from 'vitest';
import { renderReportPdf } from '@/lib/report/pdf';
import type { ReportPayload } from '@/lib/services/reports';

/**
 * jsPDF exposes no page-text reader, so assertions read the uncompressed
 * PDF content stream — that is exactly what a recipient's viewer draws.
 */
function pdfText(payload: ReportPayload): string {
  return Buffer.from(renderReportPdf(payload).output('arraybuffer')).toString('latin1');
}

const fullPayload: ReportPayload = {
  generatedAt: '2026-01-15T09:30:00.000Z',
  type: 'FAMILY_AGREEMENT',
  language: 'EN',
  family: {
    code: 'FA-7K2M9Q',
    name: 'Sharma family',
    state: 'Maharashtra',
    district: 'Pune',
    areaType: 'URBAN',
    members: [
      { name: 'Riya Sharma', relation: 'STUDENT' },
      { name: 'Mr Sharma', relation: 'PARENT' },
    ],
  },
  student: {
    name: 'Riya Sharma',
    age: 17,
    qualification: 'Class 10',
    interests: ['Electronics', 'Design'],
    skills: ['Soldering'],
    aspirations: 'To work in automation',
    assessment: {
      overall: 72,
      dimensions: { 'Hands-on & technical': 88, 'Design & creativity': 60, 'Learning motivation': 68 },
    },
  },
  parent: {
    name: 'Mr Sharma',
    expectations: 'Government job preferred',
    financialConcerns: 'Fees are a concern',
    concerns: [
      {
        category: 'LOW_SALARY',
        label: 'Low salary concerns',
        detail: 'Starting earnings look small.',
        status: 'OPEN',
        date: '2026-01-10',
      },
    ],
  },
  consensus: {
    status: 'PARTIALLY_AGREED',
    common: ['Electrician'],
    studentOnly: ['Robotics Technician'],
    parentOnly: ['Government job'],
    summary: 'Status: Partially agreed.',
    studentDecision: 'Wants to explore robotics.',
    parentDecision: null,
  },
  recommendations: [
    {
      title: 'Electrician',
      rationale: 'Matches hands-on interest and local demand.',
      matchScore: 82,
      evidence: [
        { label: 'Duration', value: '24 months' },
        { label: 'Category', value: 'Electrical' },
      ],
    },
  ],
  earnings: [
    {
      trade: 'Electrician',
      level: 'ENTRY',
      range: '₹12,000 – ₹18,000 / month',
      status: 'PENDING_VERIFICATION',
      estimate: true,
    },
  ],
  pathways: [
    {
      trade: 'Electrician',
      stages: [
        { order: 1, title: 'ITI Electrician', qualification: 'Class 10' },
        { order: 2, title: 'Journeyman', qualification: null },
      ],
    },
  ],
  providers: [
    {
      name: 'Govt ITI Pune',
      type: 'ITI',
      district: 'Pune',
      state: 'Maharashtra',
      courses: ['Electrician (24 mo)'],
      verificationStatus: 'VERIFIED',
    },
  ],
  actionPlan: ['Compare recommendations together.', 'Verify providers before paying fees.'],
  counsellingSessions: [
    {
      title: 'Family counselling',
      kind: 'OBJECTION_ANALYZER',
      status: 'COMPLETED',
      date: '2026-01-12',
      summary: 'Discussed salary expectations.',
    },
  ],
  sources: [
    {
      name: 'NCVT ePortal',
      url: 'https://www.ncvt.gov.in',
      status: 'VERIFIED',
      synthetic: false,
    },
  ],
  disclaimers: ['Earning figures are estimates, not guarantees.'],
};

const emptyPayload: ReportPayload = {
  generatedAt: '2026-01-15T09:30:00.000Z',
  type: 'FAMILY_AGREEMENT',
  language: 'EN',
  family: { code: 'FA-000000', name: null, state: null, district: null, areaType: null, members: [] },
  student: {
    name: null,
    age: null,
    qualification: null,
    interests: [],
    skills: [],
    aspirations: null,
    assessment: null,
  },
  parent: { name: null, expectations: null, financialConcerns: null, concerns: [] },
  consensus: null,
  recommendations: [],
  earnings: [],
  pathways: [],
  providers: [],
  actionPlan: [],
  counsellingSessions: [],
  sources: [],
  disclaimers: ['No data recorded yet.'],
};

describe('renderReportPdf', () => {
  it('returns a jsPDF document', () => {
    const doc = renderReportPdf(fullPayload);
    expect(doc).toBeTruthy();
    expect(typeof doc.output).toBe('function');
  });

  it('emits a non-trivial PDF byte stream', () => {
    const bytes = renderReportPdf(fullPayload).output('arraybuffer');
    expect(bytes.byteLength).toBeGreaterThan(2000);
  });

  it('starts with the PDF magic header', () => {
    const text = renderReportPdf(fullPayload).output('datauristring');
    expect(text.startsWith('data:application/pdf')).toBe(true);
  });

  it('stamps a numbered footer on every page', () => {
    const doc = renderReportPdf(fullPayload);
    const pages = doc.getNumberOfPages();
    expect(pages).toBeGreaterThanOrEqual(1);
    const raw = pdfText(fullPayload);
    expect(raw).toContain('PATHALIGN AI');
    for (let i = 1; i <= pages; i++) {
      expect(raw).toContain(`Page ${i} of ${pages}`);
    }
  });

  it('includes the family identity and core sections', () => {
    const raw = pdfText(fullPayload);
    expect(raw).toContain('FA-7K2M9Q');
    expect(raw).toContain('Riya Sharma');
    expect(raw).toContain('Electrician');
    expect(raw).toContain('FAMILY PROFILE');
  });

  it('renders currency as readable ASCII (jsPDF fonts cannot encode the rupee sign)', () => {
    const payload = {
      ...emptyPayload,
      parent: { ...emptyPayload.parent, financialConcerns: 'Fees must fit under ₹50,000 per month.' },
      earnings: [{ trade: 'Electrician', level: 'ENTRY', range: '₹12,000 – ₹18,000 / month', status: 'VERIFIED', estimate: false }],
    };
    const raw = pdfText(payload);
    expect(raw).toContain('Rs 50,000');
    expect(raw).toContain('Rs 12,000');
    // The raw rupee sign must never reach the content stream.
    expect(raw.includes('₹')).toBe(false);
  });

  it('transliterates non-Latin-1 characters rather than emitting garbled glyphs', () => {
    // U+096C..U+096E are Devanagari digits ६ ७ ८ (6, 7, 8).
    const raw = pdfText({ ...emptyPayload, disclaimers: ['\u096C\u096D\u096E digits and \u2014dashes\u2019'] });
    expect(raw).toContain('678 digits and -dashes\'');
  });

  it('renders an empty payload without throwing', () => {
    const doc = renderReportPdf(emptyPayload);
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    expect(renderReportPdf(emptyPayload).output('arraybuffer').byteLength).toBeGreaterThan(1000);
  });

  it('breaks onto additional pages as the content grows', () => {
    const long = {
      ...emptyPayload,
      recommendations: Array.from({ length: 25 }, (_, i) => ({
        title: `Trade ${i}`,
        rationale: 'x'.repeat(200),
        matchScore: 70,
        evidence: [{ label: 'Duration', value: '24 months' }],
      })),
    };
    expect(renderReportPdf(long).getNumberOfPages()).toBeGreaterThan(renderReportPdf(emptyPayload).getNumberOfPages());
  });
});

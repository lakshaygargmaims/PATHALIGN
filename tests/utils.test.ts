import { describe, it, expect } from 'vitest';
import {
  dashboardPath,
  formatINR,
  formatDate,
  slugify,
  clamp,
  round1,
  generateFamilyCode,
  initials,
} from '@/lib/utils';

describe('dashboardPath', () => {
  it('maps each role to its dashboard root', () => {
    expect(dashboardPath('STUDENT')).toBe('/student');
    expect(dashboardPath('PARENT')).toBe('/parent');
    expect(dashboardPath('COUNSELLOR')).toBe('/counsellor');
    expect(dashboardPath('ADMIN')).toBe('/admin');
  });

  it('falls back to the landing page for an unknown role', () => {
    expect(dashboardPath('SOMETHING_ELSE')).toBe('/');
  });
});

describe('formatINR', () => {
  it('formats using the Indian numbering system', () => {
    expect(formatINR(1234567)).toMatch(/12,34,567/);
  });
});

describe('formatDate', () => {
  it('renders an em dash for missing values', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });

  it('accepts both Date and ISO strings', () => {
    expect(formatDate('2026-01-15T00:00:00.000Z')).toMatch(/2026/);
    expect(formatDate(new Date('2026-01-15T00:00:00.000Z'))).toMatch(/2026/);
  });
});

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('  Electrician Trade  ')).toBe('electrician-trade');
  });

  it('collapses punctuation and trims edge hyphens', () => {
    expect(slugify('--Fitter & Welder!!--')).toBe('fitter-welder');
  });
});

describe('clamp', () => {
  it('bounds a value on both sides', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
});

describe('round1', () => {
  it('rounds to one decimal place', () => {
    expect(round1(1.26)).toBe(1.3);
    expect(round1(1.24)).toBe(1.2);
  });
});

describe('generateFamilyCode', () => {
  it('produces a FA- prefixed six-character code from an unambiguous alphabet', () => {
    const code = generateFamilyCode();
    expect(code).toMatch(/^FA-[A-HJ-NP-Z2-9]{6}$/);
  });

  it('does not repeat itself across many calls', () => {
    const codes = new Set(Array.from({ length: 50 }, generateFamilyCode));
    expect(codes.size).toBe(50);
  });
});

describe('initials', () => {
  it('takes the first two words', () => {
    expect(initials('Asha Sharma')).toBe('AS');
    expect(initials('Asha Devi Sharma')).toBe('AD');
  });

  it('handles extra whitespace', () => {
    expect(initials('  Asha   Sharma  ')).toBe('AS');
  });
});

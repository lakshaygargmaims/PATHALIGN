import { describe, it, expect } from 'vitest';
import {
  scoreStudentInterest,
  scoreParentExpectations,
  scoreAssessment,
} from '@/lib/services/assessments';

const studentAll = (n: number) =>
  Object.fromEntries(['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8'].map((q) => [q, n]));

const parentAll = (n: number) =>
  Object.fromEntries(['p1', 'p2', 'p3', 'p4', 'p5', 'p6'].map((q) => [q, n]));

describe('scoreStudentInterest', () => {
  it('scores 100 when every answer is maxed', () => {
    const r = scoreStudentInterest(studentAll(4));
    expect(r.kind).toBe('STUDENT_INTEREST');
    expect(r.overall).toBe(100);
  });

  it('scores 0 when every answer is zero', () => {
    expect(scoreStudentInterest(studentAll(0)).overall).toBe(0);
  });

  it('averages the hands-on dimension from two questions', () => {
    const r = scoreStudentInterest({ ...studentAll(0), q1: 4, q6: 0 });
    expect(r.dimensions['Hands-on & technical']).toBe(50);
  });

  it('clamps out-of-range answers to the 0-4 scale', () => {
    const high = scoreStudentInterest({ ...studentAll(0), q2: 10 });
    const low = scoreStudentInterest({ ...studentAll(4), q2: -3 });
    expect(high.dimensions['Digital & computing']).toBe(100);
    expect(low.dimensions['Digital & computing']).toBe(0);
  });

  it('falls back to the neutral midpoint for missing or invalid answers', () => {
    const r = scoreStudentInterest({ q2: 'not-a-number' });
    expect(r.dimensions['Digital & computing']).toBe(50);
    expect(Number.isNaN(r.overall)).toBe(false);
  });

  it('always ships both English and Hindi interpretations', () => {
    const r = scoreStudentInterest(studentAll(1));
    expect(r.interpretation).toBeTruthy();
    expect(r.interpretationHi).toBeTruthy();
  });
});

describe('scoreParentExpectations', () => {
  it('scores 100 when every answer is maxed', () => {
    const r = scoreParentExpectations(parentAll(4));
    expect(r.kind).toBe('PARENT_EXPECTATIONS');
    expect(r.overall).toBe(100);
  });

  it('averages the security priority from two questions', () => {
    const r = scoreParentExpectations({ ...parentAll(0), p1: 4, p2: 0 });
    expect(r.dimensions['Security priority']).toBe(50);
  });
});

describe('scoreAssessment', () => {
  it('dispatches to the student scorer', () => {
    expect(scoreAssessment('STUDENT_INTEREST', studentAll(4)).overall).toBe(100);
  });

  it('dispatches to the parent scorer', () => {
    expect(scoreAssessment('PARENT_EXPECTATIONS', parentAll(0)).overall).toBe(0);
  });

  it('falls back to a context snapshot for other kinds', () => {
    const r = scoreAssessment('FAMILY_CONTEXT', { a: 4, b: 4, c: 4, d: 4 });
    expect(r.kind).toBe('FAMILY_CONTEXT');
    expect(r.overall).toBe(100);
  });

  it('returns 0 for an empty context snapshot', () => {
    expect(scoreAssessment('FAMILY_CONTEXT', {}).overall).toBe(0);
  });
});

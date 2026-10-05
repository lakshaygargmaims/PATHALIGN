import { describe, it, expect } from 'vitest';
import { computeConfidenceScore, CONFIDENCE_DIMENSIONS } from '@/lib/services/confidence';
import type { ConfidenceInput } from '@/lib/validation/schemas';

type Answers = ConfidenceInput['answers'];

const all = (n: number): Answers =>
  Object.fromEntries(CONFIDENCE_DIMENSIONS.map((d) => [d.key, n])) as unknown as Answers;

describe('computeConfidenceScore', () => {
  it('scores 100 when every dimension is maxed', () => {
    const r = computeConfidenceScore(all(4), 'PRE');
    expect(r.overallScore).toBe(100);
    expect(r.phase).toBe('PRE');
  });

  it('scores 0 when every dimension is zero', () => {
    expect(computeConfidenceScore(all(0), 'PRE').overallScore).toBe(0);
  });

  it('scores 50 when every dimension is mid-scale', () => {
    expect(computeConfidenceScore(all(2), 'POST').overallScore).toBe(50);
  });

  it('keeps the score within 0-100 for out-of-range answers', () => {
    const high = computeConfidenceScore({ ...all(4), awareness: 99 } as Answers, 'PRE');
    const low = computeConfidenceScore({ ...all(0), awareness: -5 } as Answers, 'PRE');
    expect(high.overallScore).toBe(100);
    expect(low.overallScore).toBe(0);
  });

  it('returns a per-dimension breakdown with labels', () => {
    const r = computeConfidenceScore(all(3), 'PRE');
    const keys = Object.keys(r.dimensions);
    expect(keys).toHaveLength(CONFIDENCE_DIMENSIONS.length);
    for (const key of keys) {
      const dim = r.dimensions[key]!;
      expect(dim.raw).toBe(3);
      expect(dim.score).toBe(15);
      expect(dim.label).toBeTruthy();
      expect(dim.labelHi).toBeTruthy();
    }
  });

  it('treats missing answers as zero rather than NaN', () => {
    const r = computeConfidenceScore({} as never, 'PRE');
    expect(r.overallScore).toBe(0);
    expect(Number.isNaN(r.overallScore)).toBe(false);
  });
});

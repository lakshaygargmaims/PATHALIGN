import { describe, it, expect } from 'vitest';
import { analyzeConsensus } from '@/lib/services/consensus';

describe('analyzeConsensus', () => {
  it('reports AGREED when both sides picked the same single option', () => {
    const r = analyzeConsensus(
      [{ label: 'Electrician', tradeId: 't1' }],
      [{ label: 'Electrician', tradeId: 't1' }],
      [],
      [],
    );
    expect(r.status).toBe('AGREED');
    expect(r.common.map((c) => c.label)).toEqual(['Electrician']);
    expect(r.studentOnly).toEqual([]);
    expect(r.parentOnly).toEqual([]);
    expect(r.score).toBe(100);
  });

  it('reports PARTIALLY_AGREED when there is overlap but also unique picks', () => {
    const r = analyzeConsensus(
      [{ label: 'Electrician' }, { label: 'Plumber' }],
      [{ label: 'Electrician' }, { label: 'Welder' }],
      [],
      [],
    );
    expect(r.status).toBe('PARTIALLY_AGREED');
    expect(r.common).toHaveLength(1);
    expect(r.studentOnly.map((c) => c.label)).toEqual(['Plumber']);
    expect(r.parentOnly.map((c) => c.label)).toEqual(['Welder']);
    expect(r.score).toBeGreaterThan(0);
    expect(r.score).toBeLessThan(100);
  });

  it('reports NEEDS_DISCUSSION when nothing overlaps', () => {
    const r = analyzeConsensus([{ label: 'Electrician' }], [{ label: 'Welder' }], [], []);
    expect(r.status).toBe('NEEDS_DISCUSSION');
    expect(r.common).toEqual([]);
  });

  it('matches picks case- and punctuation-insensitively', () => {
    const r = analyzeConsensus(
      [{ label: '  Electrician  ' }],
      [{ label: 'electrician!' }],
      [],
      [],
    );
    expect(r.status).toBe('AGREED');
    expect(r.normalizedStudent[0]!.key).toBe('electrician');
  });

  it('preserves the tradeId on common picks', () => {
    const r = analyzeConsensus([{ label: 'Plumber', tradeId: 'p9' }], [{ label: 'Plumber', tradeId: 'p9' }], [], []);
    expect(r.common[0]!.tradeId).toBe('p9');
  });

  it('detects shared concerns across both participants', () => {
    const r = analyzeConsensus(
      [{ label: 'A' }, { label: 'B' }],
      [{ label: 'A' }, { label: 'C' }],
      ['Low salary', 'Safety'],
      ['low salary'],
    );
    expect(r.concerns.shared).toEqual(['low salary']);
    expect(r.concerns.student).toEqual(['Low salary', 'Safety']);
    expect(r.concerns.parent).toEqual(['low salary']);
  });

  it('never forces a positive score when the families fully disagree', () => {
    const r = analyzeConsensus(
      [{ label: 'Electrician' }, { label: 'Plumber' }],
      [{ label: 'Welder' }, { label: 'Fitter' }],
      [],
      [],
    );
    expect(r.status).toBe('NEEDS_DISCUSSION');
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThan(50);
  });

  it('handles both sides submitting nothing', () => {
    const r = analyzeConsensus([], [], [], []);
    expect(r.status).toBe('NEEDS_DISCUSSION');
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.common).toEqual([]);
  });
});

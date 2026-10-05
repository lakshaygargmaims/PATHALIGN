import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLogger, logger, redact } from '@/lib/logger';

describe('redact', () => {
  it('masks sensitive keys at the top level', () => {
    const out = redact({ password: 'hunter2', token: 'abc', email: 'a@b.com' }) as Record<string, unknown>;
    expect(out.password).toBe('[redacted]');
    expect(out.token).toBe('[redacted]');
    expect(out.email).toBe('a@b.com');
  });

  it('masks sensitive keys nested in objects and arrays', () => {
    const out = redact({
      user: { passwordHash: 'x', name: 'Asha' },
      items: [{ apiKey: 'k1' }],
    }) as { user: Record<string, unknown>; items: Array<Record<string, unknown>> };
    expect(out.user.passwordHash).toBe('[redacted]');
    expect(out.user.name).toBe('Asha');
    expect(out.items[0]!.apiKey).toBe('[redacted]');
  });

  it('is case-insensitive on key names', () => {
    const out = redact({ Authorization: 'Bearer x', DATABASE_URL: 'postgres://x' }) as Record<string, unknown>;
    expect(out.Authorization).toBe('[redacted]');
    expect(out.DATABASE_URL).toBe('[redacted]');
  });

  it('serialises errors as name/message/stack rather than an empty object', () => {
    const out = redact({ err: new TypeError('boom') }) as { err: Record<string, unknown> };
    expect(out.err.name).toBe('TypeError');
    expect(out.err.message).toBe('boom');
  });

  it('converts dates to ISO strings', () => {
    const d = new Date('2026-01-15T00:00:00.000Z');
    expect(redact({ at: d })).toEqual({ at: '2026-01-15T00:00:00.000Z' });
  });

  it('leaves primitives untouched', () => {
    expect(redact('plain')).toBe('plain');
    expect(redact(42)).toBe(42);
    expect(redact(null)).toBe(null);
  });
});

describe('logger', () => {
  let logs: Array<[string, string]>;
  let spies: Array<{ mockRestore: () => void }>;

  beforeEach(() => {
    logs = [];
    spies = [
      { mockRestore: vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => void logs.push(['log', a.join(' ')])).mockRestore },
      { mockRestore: vi.spyOn(console, 'warn').mockImplementation((...a: unknown[]) => void logs.push(['warn', a.join(' ')])).mockRestore },
      { mockRestore: vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => void logs.push(['error', a.join(' ')])).mockRestore },
    ];
  });

  afterEach(() => {
    for (const s of spies) s.mockRestore();
    vi.unstubAllEnvs();
  });

  const parse = () => JSON.parse(logs[0]![1]) as Record<string, unknown>;

  it('emits one JSON object per line with ts/level/msg', () => {
    logger.info('case assigned', { caseId: 'c1' });
    expect(logs).toHaveLength(1);
    const rec = parse();
    expect(rec.level).toBe('info');
    expect(rec.msg).toBe('case assigned');
    expect(rec.caseId).toBe('c1');
    expect(typeof rec.ts).toBe('string');
  });

  it('sends errors to stderr and warns to stderr', () => {
    logger.error('boom');
    logger.warn('careful');
    expect(logs.map((l) => l[0])).toEqual(['error', 'warn']);
  });

  it('merges child context into every record', () => {
    createLogger({ route: '/api/cases' }).info('listed');
    expect(parse().route).toBe('/api/cases');
  });

  it('redacts secrets before they reach the log line', () => {
    logger.info('login', { password: 'hunter2' });
    expect(logs[0]![1]).not.toContain('hunter2');
    expect(parse().password).toBe('[redacted]');
  });

  it('suppresses records below the configured level', () => {
    vi.stubEnv('LOG_LEVEL', 'warn');
    logger.info('ignored');
    logger.debug('also ignored');
    expect(logs).toHaveLength(0);
    logger.warn('kept');
    expect(logs).toHaveLength(1);
  });

  it('falls back to info for an unrecognised LOG_LEVEL', () => {
    vi.stubEnv('LOG_LEVEL', 'nonsense');
    logger.info('kept');
    logger.debug('dropped');
    expect(logs).toHaveLength(1);
  });

  it('lets per-call fields override child context', () => {
    const log = createLogger({ stage: 'request' });
    log.info('done', { stage: 'response' });
    expect(parse().stage).toBe('response');
  });
});

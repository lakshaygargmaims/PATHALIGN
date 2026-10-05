import { NextResponse } from 'next/server';
import { ZodError, z } from 'zod';
import { createLogger } from '@/lib/logger';

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(status: number, message: string, details?: unknown): NextResponse {
  return NextResponse.json({ ok: false, error: { message, details } }, { status });
}

/** Wraps a route handler with uniform error handling and structured logging. */
export function withApi<T extends unknown[]>(
  fn: (...args: T) => Promise<Response>,
): (...args: T) => Promise<Response> {
  return async (...args: T) => {
    const started = Date.now();
    const request = args[0] instanceof Request ? args[0] : undefined;
    const route = request ? new URL(request.url).pathname : 'unknown';
    const method = request?.method ?? 'GET';
    const log = createLogger({ route, method });

    try {
      const res = await fn(...args);
      // 5xx from the handler itself is still worth surfacing.
      if (res.status >= 500) {
        log.error('request failed', { status: res.status, durationMs: Date.now() - started });
      } else {
        log.debug('request ok', { status: res.status, durationMs: Date.now() - started });
      }
      return res;
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status >= 500) log.error('api error', { status: err.status, message: err.message });
        else log.warn('api error', { status: err.status, message: err.message });
        return fail(err.status, err.message, err.details);
      }
      if (err instanceof ZodError) {
        log.warn('validation failed', { issues: err.issues.length });
        return fail(400, 'Validation failed', err.flatten());
      }
      log.error('unhandled error', {
        durationMs: Date.now() - started,
        error: err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : String(err),
      });
      return fail(500, 'Internal server error');
    }
  };
}

export function parseBody<S extends z.ZodTypeAny>(schema: S, body: unknown): z.infer<S> {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ApiError(400, 'Validation failed', result.error.flatten());
  }
  return result.data as z.infer<S>;
}

export function requireFields<T extends Record<string, unknown>>(obj: T, keys: (keyof T)[]): void {
  const missing = keys.filter((k) => obj[k] === undefined || obj[k] === null || obj[k] === '');
  if (missing.length) throw new ApiError(400, `Missing required fields: ${missing.join(', ')}`);
}

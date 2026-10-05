/**
 * Structured JSON logging.
 *
 * Every line is a single JSON object so log aggregators can index it
 * without regex parsing. `LOG_LEVEL` controls verbosity:
 *   debug | info | warn | error
 *
 * Secrets are redacted before serialisation — never pass raw request
 * bodies or credentials to these helpers.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const REDACTED_KEYS = [
  'password',
  'passwordhash',
  'token',
  'sessiontoken',
  'authorization',
  'cookie',
  'secret',
  'authsecret',
  'apikey',
  'api_key',
  'openai_api_key',
  'databaseurl',
  'database_url',
];

function currentLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL ?? 'info').toLowerCase();
  return (raw in LEVEL_ORDER ? raw : 'info') as LogLevel;
}

/** Redact sensitive fields at any depth so logs can be shipped safely. */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6 || value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = REDACTED_KEYS.includes(k.toLowerCase()) ? '[redacted]' : redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

export interface LogFields {
  [key: string]: unknown;
}

function emit(level: LogLevel, message: string, fields?: LogFields) {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[currentLevel()]) return;

  const record = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...(fields ? (redact(fields) as LogFields) : {}),
  };

  const line = JSON.stringify(record);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export interface Logger {
  debug: (message: string, fields?: LogFields) => void;
  info: (message: string, fields?: LogFields) => void;
  warn: (message: string, fields?: LogFields) => void;
  error: (message: string, fields?: LogFields) => void;
  child: (context: LogFields) => Logger;
}

function build(context: LogFields): Logger {
  const at = (level: LogLevel) => (message: string, fields?: LogFields) =>
    emit(level, message, { ...context, ...fields });
  return {
    debug: at('debug'),
    info: at('info'),
    warn: at('warn'),
    error: at('error'),
    child: (extra: LogFields) => build({ ...context, ...extra }),
  };
}

export const logger: Logger = build({});

export function createLogger(context: LogFields): Logger {
  return build(context);
}

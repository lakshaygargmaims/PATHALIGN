type Bucket = { hits: number[] };

const buckets = new Map<string, Bucket>();

const MAX_BUCKETS = 10000;

/**
 * Fixed-window rate limiter. Suitable for a single Node instance.
 * Documented limitation: not shared across multiple processes — see README.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) {
      if (b.hits.length === 0 || b.hits[b.hits.length - 1]! < now - windowMs) buckets.delete(k);
    }
  }
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => t > now - windowMs);
  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket);
    return false;
  }
  bucket.hits.push(now);
  buckets.set(key, bucket);
  return true;
}

export function clientKey(req: Request, scope: string): string {
  const fwd = req.headers.get('x-forwarded-for');
  const ip = fwd ? fwd.split(',')[0]!.trim() : 'local';
  return `${scope}:${ip}`;
}

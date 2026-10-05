import { prisma } from '@/lib/db';
import { aiStatus } from '@/lib/ai/provider';

export const dynamic = 'force-dynamic';

export async function GET() {
  const started = Date.now();
  let db: 'up' | 'down' = 'up';
  let tradeCount = 0;
  try {
    tradeCount = await prisma.careerTrade.count();
  } catch {
    db = 'down';
  }
  return Response.json({
    ok: db === 'up',
    db,
    latencyMs: Date.now() - started,
    ai: aiStatus(),
    trades: tradeCount,
    timestamp: new Date().toISOString(),
  });
}

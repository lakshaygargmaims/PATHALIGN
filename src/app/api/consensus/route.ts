import { ok, withApi, parseBody, ApiError } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { consensusCreateSchema, consensusDecisionSchema } from '@/lib/validation/schemas';
import { createConsensus, saveParticipantPicks, analyzeStoredConsensus } from '@/lib/services/consensus';
import { getUserFamily } from '@/lib/services/families';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export const GET = withApi(async (req: Request) => {
  const user = await requireUser();
  const familyId = new URL(req.url).searchParams.get('familyId');
  const family = familyId ? { id: familyId } : await getUserFamily(user.id);
  if (!family) return ok({ consensus: null, history: [] });

  const membership = await prisma.familyMember.findFirst({ where: { userId: user.id, familyId: family.id } });
  if (!membership) throw new ApiError(403, 'Only family members can view consensus records');
  if (!membership.consentGranted) {
    throw new ApiError(403, 'In-family sharing consent is revoked. Re-enable it from Profile → Privacy.');
  }

  const [latest, history] = await Promise.all([
    prisma.familyConsensus.findFirst({ where: { familyId: family.id }, orderBy: { updatedAt: 'desc' } }),
    prisma.familyConsensus.findMany({ where: { familyId: family.id }, orderBy: { updatedAt: 'desc' }, take: 10 }),
  ]);
  return ok({ consensus: latest, history });
});

export const POST = withApi(async (req: Request) => {
  const user = await requireUser(['STUDENT', 'PARENT', 'ADMIN']);
  const body = await req.json();
  const action = (body.action as string) ?? 'create';

  if (action === 'decision') {
    const input = parseBody(consensusDecisionSchema, body);
    const record = await prisma.familyConsensus.findUnique({ where: { id: input.consensusId } });
    if (!record) throw new ApiError(404, 'Consensus not found');
    const membership = await prisma.familyMember.findFirst({
      where: { userId: user.id, familyId: record.familyId },
    });
    if (!membership) throw new ApiError(403, 'Only family members can record a decision');
    if (input.participant === 'STUDENT' && membership.relation !== 'STUDENT') {
      throw new ApiError(403, 'You can only record the student decision');
    }
    if (input.participant === 'PARENT' && membership.relation !== 'PARENT' && membership.relation !== 'GUARDIAN') {
      throw new ApiError(403, 'You can only record the parent decision');
    }

    const updated = await prisma.familyConsensus.update({
      where: { id: record.id },
      data: input.participant === 'STUDENT' ? { studentDecision: input.decision } : { parentDecision: input.decision },
    });
    return ok({ consensus: updated });
  }

  if (action === 'savePicks') {
    const input = parseBody(
      z.object({
        familyId: z.string().min(1),
        participant: z.enum(['STUDENT', 'PARENT']),
        picks: z
          .array(z.object({ tradeId: z.string().optional(), label: z.string().trim().min(1).max(120) }))
          .min(1)
          .max(6),
        concerns: z.array(z.string().trim().min(1).max(300)).max(10).default([]),
      }),
      body,
    );
    const saved = await saveParticipantPicks({
      userId: user.id,
      familyId: input.familyId,
      participant: input.participant,
      picks: input.picks,
      concerns: input.concerns,
    });
    return ok(saved);
  }

  if (action === 'analyze') {
    const input = parseBody(z.object({ consensusId: z.string().min(1) }), body);
    const result = await analyzeStoredConsensus(user.id, input.consensusId);
    return ok({ consensus: result });
  }

  const input = parseBody(consensusCreateSchema, body);
  const result = await createConsensus(user.id, input);
  return ok({ consensus: result });
});

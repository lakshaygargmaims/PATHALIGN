import { ok, withApi, parseBody, ApiError } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { conversationCreateSchema } from '@/lib/validation/schemas';
import { startConversation, SUGGESTED_QUESTIONS } from '@/lib/ai/counsellor';
import { getUserFamily } from '@/lib/services/families';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const GET = withApi(async () => {
  const user = await requireUser();
  const conversations = await prisma.chatConversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    take: 50,
    select: {
      id: true,
      title: true,
      kind: true,
      language: true,
      status: true,
      concernCategory: true,
      sentimentLabel: true,
      summary: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  });
  return ok({ conversations, suggested: SUGGESTED_QUESTIONS[user.preferredLanguage] });
});

export const POST = withApi(async (req: Request) => {
  const user = await requireUser();
  const input = parseBody(conversationCreateSchema, await req.json());
  const family = await getUserFamily(user.id);
  const conversation = await startConversation({
    userId: user.id,
    familyId: input.familyId ?? family?.id ?? null,
    kind: input.kind,
    language: input.language,
    title: input.title,
  });
  return ok({ conversation });
});

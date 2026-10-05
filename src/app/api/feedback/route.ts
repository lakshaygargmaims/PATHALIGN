import { ok, withApi, parseBody, ApiError } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { feedbackSchema } from '@/lib/validation/schemas';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const POST = withApi(async (req: Request) => {
  const user = await requireUser();
  const input = parseBody(feedbackSchema, await req.json());
  if (input.conversationId) {
    const conv = await prisma.chatConversation.findUnique({ where: { id: input.conversationId } });
    if (!conv || (conv.userId !== user.id && user.role === 'ADMIN')) {
      if (!conv || conv.userId !== user.id) throw new ApiError(403, 'Conversation not accessible');
    }
  }
  const feedback = await prisma.feedback.create({
    data: {
      userId: user.id,
      conversationId: input.conversationId,
      rating: input.rating,
      category: input.category,
      comment: input.comment,
    },
  });
  return ok({ feedback });
});

export const GET = withApi(async () => {
  const user = await requireUser(['ADMIN', 'COUNSELLOR']);
  const feedback = await prisma.feedback.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { user: { select: { fullName: true, role: true } } },
  });
  return ok({ feedback });
});

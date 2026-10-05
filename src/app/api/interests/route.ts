import { prisma } from '@/lib/db';
import { ok, withApi, parseBody, ApiError } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { interestSchema, concernSchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

export const GET = withApi(async (req: Request) => {
  const user = await requireUser();
  const interests = await prisma.careerInterest.findMany({
    where: { userId: user.id },
    orderBy: { rank: 'asc' },
    include: { trade: { select: { id: true, name: true, slug: true, category: true } } },
  });
  const concerns = await prisma.parentConcern.findMany({
    where: { authorUserId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return ok({ interests, concerns });
});

export const POST = withApi(async (req: Request) => {
  const user = await requireUser(['STUDENT', 'PARENT', 'ADMIN']);
  const body = await req.json();
  const action = (body.action as string) ?? 'interest';

  if (action === 'concern') {
    const input = parseBody(concernSchema, body);
    const family = await prisma.familyMember.findFirst({ where: { userId: user.id } });
    const concern = await prisma.parentConcern.create({
      data: {
        authorUserId: user.id,
        familyId: input.familyId ?? family?.familyId,
        category: input.category,
        detail: input.detail,
        language: input.language,
        source: 'FORM',
        state: user.state,
        district: user.district,
      },
    });
    return ok({ concern });
  }

  const input = parseBody(interestSchema, body);
  const trade = input.tradeId ? await prisma.careerTrade.findUnique({ where: { id: input.tradeId } }) : null;
  if (input.tradeId && !trade) throw new ApiError(404, 'Trade not found');

  const interest = await prisma.careerInterest.create({
    data: {
      userId: user.id,
      tradeId: input.tradeId,
      label: input.label,
      rank: input.rank,
      source: 'SELF',
    },
  });
  return ok({ interest });
});

export const DELETE = withApi(async (req: Request) => {
  const user = await requireUser();
  const id = new URL(req.url).searchParams.get('id');
  if (!id) throw new ApiError(400, 'Missing interest id');
  await prisma.careerInterest.deleteMany({ where: { id, userId: user.id } });
  return ok({ deleted: true });
});

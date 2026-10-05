import { prisma, json } from '@/lib/db';
import { ok, withApi, parseBody, ApiError } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { tradeSchema } from '@/lib/validation/schemas';
import { slugify } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const GET = withApi(async (req: Request) => {
  await requireUser(['ADMIN']);
  const url = new URL(req.url);
  const search = url.searchParams.get('search')?.trim();
  const status = url.searchParams.get('verification');

  const trades = await prisma.careerTrade.findMany({
    where: {
      ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { category: { contains: search, mode: 'insensitive' as const } }] } : {}),
      ...(status ? { verificationStatus: status as never } : {}),
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      source: { select: { name: true, verificationStatus: true } },
      salaryStats: true,
      _count: { select: { courses: true, pathways: true, knowledgeDocs: true } },
    },
    take: 200,
  });
  return ok({ trades });
});

export const POST = withApi(async (req: Request) => {
  const admin = await requireUser(['ADMIN']);
  const input = parseBody(tradeSchema, await req.json());
  const slug = slugify(input.name);
  const existing = await prisma.careerTrade.findUnique({ where: { slug } });
  if (existing) throw new ApiError(409, 'A trade with this name already exists');

  const trade = await prisma.careerTrade.create({
    data: {
      name: input.name,
      slug,
      category: input.category,
      ncoCode: input.ncoCode,
      description: input.description,
      durationMonths: input.durationMonths,
      nsqfLevel: input.nsqfLevel,
      eligibility: input.eligibility,
      qualificationId: input.qualificationId,
      feeMin: input.feeMin,
      feeMax: input.feeMax,
      sourceId: input.sourceId,
      verificationStatus: input.verificationStatus,
      isSynthetic: input.verificationStatus === 'SYNTHETIC_DEMO',
      lastVerifiedAt: input.verificationStatus === 'VERIFIED' ? new Date() : null,
    },
  });

  await prisma.adminAuditLog.create({
    data: { userId: admin.id, action: 'TRADE_CREATE', entityType: 'CareerTrade', entityId: trade.id, details: json({ slug }) },
  });

  return ok({ trade }, { status: 201 });
});

export const PATCH = withApi(async (req: Request) => {
  const admin = await requireUser(['ADMIN']);
  const body = (await req.json()) as { id?: string; verificationStatus?: string; note?: string };
  if (!body.id) throw new ApiError(400, 'Missing trade id');

  const trade = await prisma.careerTrade.update({
    where: { id: body.id },
    data: {
      ...(body.verificationStatus
        ? {
            verificationStatus: body.verificationStatus as never,
            lastVerifiedAt: body.verificationStatus === 'VERIFIED' ? new Date() : null,
            isSynthetic: body.verificationStatus === 'SYNTHETIC_DEMO',
          }
        : {}),
    },
  });

  if (body.verificationStatus) {
    await prisma.dataVerification.create({
      data: {
        recordType: 'TRADE',
        recordId: trade.id,
        status: body.verificationStatus as never,
        notes: body.note ?? `Status set to ${body.verificationStatus}`,
        verifiedById: admin.id,
      },
    });
    await prisma.adminAuditLog.create({
      data: {
        userId: admin.id,
        action: 'TRADE_VERIFY',
        entityType: 'CareerTrade',
        entityId: trade.id,
        details: json({ status: body.verificationStatus }),
      },
    });
  }

  return ok({ trade });
});

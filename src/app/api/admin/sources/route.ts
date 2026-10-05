import { prisma, json } from '@/lib/db';
import { ok, withApi, parseBody, ApiError } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { sourceSchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

export const GET = withApi(async (req: Request) => {
  await requireUser(['ADMIN', 'COUNSELLOR']);
  const url = new URL(req.url);
  const view = url.searchParams.get('view') ?? 'sources';

  if (view === 'verifications') {
    const verifications = await prisma.dataVerification.findMany({
      orderBy: { checkedAt: 'desc' },
      take: 100,
      include: {
        source: { select: { name: true, url: true } },
        verifiedBy: { select: { fullName: true } },
      },
    });
    return ok({ verifications });
  }

  const sources = await prisma.dataSource.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { trades: true, knowledgeDocs: true, providers: true, salaryStats: true } } },
  });
  return ok({ sources });
});

export const POST = withApi(async (req: Request) => {
  const admin = await requireUser(['ADMIN']);
  const body = await req.json();
  const action = (body.action as string) ?? 'create';

  if (action === 'verify') {
    const { sourceId, status, note } = body as { sourceId?: string; status?: string; note?: string };
    if (!sourceId || !status) throw new ApiError(400, 'sourceId and status are required');
    const source = await prisma.dataSource.update({
      where: { id: sourceId },
      data: {
        verificationStatus: status as never,
        lastVerifiedAt: status === 'VERIFIED' ? new Date() : null,
      },
    });
    await prisma.dataVerification.create({
      data: {
        sourceId,
        recordType: 'SOURCE',
        recordId: sourceId,
        status: status as never,
        notes: note ?? `Source marked ${status}`,
        verifiedById: admin.id,
      },
    });
    await prisma.adminAuditLog.create({
      data: {
        userId: admin.id,
        action: 'SOURCE_VERIFY',
        entityType: 'DataSource',
        entityId: sourceId,
        details: json({ status }),
      },
    });
    return ok({ source });
  }

  const input = parseBody(sourceSchema, body);
  const source = await prisma.dataSource.create({
    data: {
      name: input.name,
      url: input.url || null,
      publisher: input.publisher,
      category: input.category,
      description: input.description,
      geographicScope: input.geographicScope,
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
      isSynthetic: input.isSynthetic,
      verificationStatus: input.isSynthetic ? 'SYNTHETIC_DEMO' : 'PENDING_VERIFICATION',
      addedById: admin.id,
    },
  });
  await prisma.adminAuditLog.create({
    data: { userId: admin.id, action: 'SOURCE_CREATE', entityType: 'DataSource', entityId: source.id },
  });
  return ok({ source }, { status: 201 });
});

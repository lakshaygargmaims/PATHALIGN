import { prisma, json } from '@/lib/db';
import { ok, withApi, parseBody, ApiError } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { providerSchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

export const GET = withApi(async (req: Request) => {
  await requireUser(['ADMIN']);
  const url = new URL(req.url);
  const state = url.searchParams.get('state');
  const search = url.searchParams.get('search')?.trim();

  const providers = await prisma.trainingProvider.findMany({
    where: {
      ...(state ? { state: { equals: state, mode: 'insensitive' as const } } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      source: { select: { name: true } },
      _count: { select: { courses: true } },
    },
    take: 200,
  });
  return ok({ providers });
});

export const POST = withApi(async (req: Request) => {
  const admin = await requireUser(['ADMIN']);
  const input = parseBody(providerSchema, await req.json());

  const provider = await prisma.trainingProvider.create({
    data: {
      name: input.name,
      type: input.type,
      state: input.state,
      district: input.district,
      city: input.city,
      pinCode: input.pinCode,
      lat: input.lat,
      lng: input.lng,
      website: input.website || null,
      affiliation: input.affiliation,
      sourceId: input.sourceId || null,
      isSynthetic: true,
      verificationStatus: 'PENDING_VERIFICATION',
    },
  });

  await prisma.adminAuditLog.create({
    data: { userId: admin.id, action: 'PROVIDER_CREATE', entityType: 'TrainingProvider', entityId: provider.id },
  });
  return ok({ provider }, { status: 201 });
});

export const PATCH = withApi(async (req: Request) => {
  const admin = await requireUser(['ADMIN']);
  const body = (await req.json()) as { id?: string; verificationStatus?: string; note?: string };
  if (!body.id) throw new ApiError(400, 'Missing provider id');
  if (!body.verificationStatus) throw new ApiError(400, 'Missing verificationStatus');

  const provider = await prisma.trainingProvider.update({
    where: { id: body.id },
    data: {
      verificationStatus: body.verificationStatus as never,
      lastVerifiedAt: body.verificationStatus === 'VERIFIED' ? new Date() : null,
      isSynthetic: body.verificationStatus === 'SYNTHETIC_DEMO',
    },
  });

  await prisma.dataVerification.create({
    data: {
      recordType: 'PROVIDER',
      recordId: provider.id,
      status: body.verificationStatus as never,
      notes: body.note ?? `Status set to ${body.verificationStatus}`,
      verifiedById: admin.id,
    },
  });
  await prisma.adminAuditLog.create({
    data: {
      userId: admin.id,
      action: 'PROVIDER_VERIFY',
      entityType: 'TrainingProvider',
      entityId: provider.id,
      details: json({ status: body.verificationStatus }),
    },
  });

  return ok({ provider });
});

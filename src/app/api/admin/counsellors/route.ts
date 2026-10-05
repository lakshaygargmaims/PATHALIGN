import { prisma, json } from '@/lib/db';
import { ok, withApi, ApiError } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';

export const dynamic = 'force-dynamic';

export const GET = withApi(async () => {
  await requireUser(['ADMIN', 'COUNSELLOR']);
  const counsellors = await prisma.counsellor.findMany({
    include: {
      user: { select: { id: true, fullName: true, email: true, isActive: true } },
      _count: { select: { cases: true, appointments: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  return ok({
    counsellors: counsellors.map((c) => ({
      id: c.id,
      userId: c.userId,
      name: c.user.fullName,
      email: c.user.email,
      isActive: c.user.isActive && c.isActive,
      designation: c.designation,
      specialities: c.specialities,
      states: c.states,
      maxActiveCases: c.maxActiveCases,
      openCases: c._count.cases,
      appointments: c._count.appointments,
    })),
  });
});

export const POST = withApi(async (req: Request) => {
  const admin = await requireUser(['ADMIN']);
  const body = (await req.json()) as { email?: string; designation?: string; states?: string[] };
  if (!body.email) throw new ApiError(400, 'email is required');

  const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
  if (!user) throw new ApiError(404, 'No account with that email — ask the person to register first');
  if (user.role !== 'COUNSELLOR') {
    await prisma.user.update({ where: { id: user.id }, data: { role: 'COUNSELLOR' } });
  }

  const profile = await prisma.counsellor.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      designation: body.designation ?? 'Career Counsellor',
      states: body.states ?? [],
    },
    update: {
      designation: body.designation ?? undefined,
      ...(body.states ? { states: body.states } : {}),
      isActive: true,
    },
  });

  await prisma.adminAuditLog.create({
    data: { userId: admin.id, action: 'COUNSELLOR_ASSIGN', entityType: 'User', entityId: user.id, details: json({ email: user.email }) },
  });

  return ok({ counsellor: profile }, { status: 201 });
});

export const PATCH = withApi(async (req: Request) => {
  const admin = await requireUser(['ADMIN']);
  const body = (await req.json()) as { id?: string; isActive?: boolean; maxActiveCases?: number };
  if (!body.id) throw new ApiError(400, 'Missing counsellor id');
  const profile = await prisma.counsellor.update({
    where: { id: body.id },
    data: {
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      ...(body.maxActiveCases !== undefined ? { maxActiveCases: body.maxActiveCases } : {}),
    },
  });
  await prisma.adminAuditLog.create({
    data: { userId: admin.id, action: 'COUNSELLOR_UPDATE', entityType: 'Counsellor', entityId: profile.id },
  });
  return ok({ counsellor: profile });
});

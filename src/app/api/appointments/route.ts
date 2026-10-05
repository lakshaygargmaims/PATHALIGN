import { prisma } from '@/lib/db';
import { ok, withApi, parseBody, ApiError } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { appointmentSchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

export const GET = withApi(async () => {
  const user = await requireUser(['STUDENT', 'PARENT', 'COUNSELLOR', 'ADMIN']);
  const where =
    user.role === 'COUNSELLOR'
      ? { counsellor: { userId: user.id } }
      : user.role === 'ADMIN'
        ? {}
        : { family: { members: { some: { userId: user.id } } } };

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      counsellor: { include: { user: { select: { fullName: true } } } },
      case: { select: { id: true, subject: true, status: true } },
      family: { select: { id: true, familyCode: true } },
    },
    orderBy: { scheduledAt: 'asc' },
    take: 100,
  });
  return ok({ appointments });
});

export const POST = withApi(async (req: Request) => {
  const user = await requireUser(['STUDENT', 'PARENT', 'COUNSELLOR', 'ADMIN']);
  const input = parseBody(appointmentSchema, await req.json());

  const counsellor = await prisma.counsellor.findUnique({ where: { id: input.counsellorId } });
  if (!counsellor) throw new ApiError(404, 'Counsellor not found');

  const membership = await prisma.familyMember.findFirst({ where: { userId: user.id } });
  const familyId = input.familyId ?? membership?.familyId;
  if (!familyId && user.role !== 'COUNSELLOR' && user.role !== 'ADMIN') {
    throw new ApiError(400, 'Join a family group before booking an appointment');
  }

  const scheduledAt = new Date(input.scheduledAt);
  if (scheduledAt.getTime() < Date.now() - 15 * 60_000) {
    throw new ApiError(400, 'Appointment time must be in the future');
  }

  const clash = await prisma.appointment.findFirst({
    where: {
      counsellorId: counsellor.id,
      status: 'SCHEDULED',
      scheduledAt: { gte: new Date(scheduledAt.getTime() - input.durationMin * 60_000), lte: scheduledAt },
    },
  });
  if (clash) throw new ApiError(409, 'That counsellor already has an appointment in this slot. Pick another time.');

  const appointment = await prisma.appointment.create({
    data: {
      caseId: input.caseId,
      familyId,
      counsellorId: counsellor.id,
      createdById: user.id,
      scheduledAt,
      durationMin: input.durationMin,
      mode: input.mode,
      notes: input.notes,
    },
  });

  await prisma.notification.create({
    data: {
      userId: counsellor.userId,
      type: 'APPOINTMENT',
      title: 'New appointment request',
      body: `${input.mode} session at ${scheduledAt.toLocaleString('en-IN')}`,
      link: '/counsellor/appointments',
    },
  });

  return ok({ appointment }, { status: 201 });
});

export const PATCH = withApi(async (req: Request) => {
  const user = await requireUser(['COUNSELLOR', 'ADMIN']);
  const body = (await req.json()) as { id?: string; status?: string };
  if (!body.id) throw new ApiError(400, 'Missing appointment id');
  const record = await prisma.appointment.findUnique({ where: { id: body.id } });
  if (!record) throw new ApiError(404, 'Appointment not found');
  if (user.role === 'COUNSELLOR') {
    const profile = await prisma.counsellor.findUnique({ where: { userId: user.id } });
    if (!profile || profile.id !== record.counsellorId) throw new ApiError(403, 'Not your appointment');
  }
  const updated = await prisma.appointment.update({
    where: { id: record.id },
    data: { status: body.status as never },
  });
  return ok({ appointment: updated });
});

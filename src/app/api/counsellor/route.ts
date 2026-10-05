import { prisma } from '@/lib/db';
import { ok, withApi, parseBody, ApiError } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const sessionSchema = z.object({
  familyId: z.string().min(1),
  caseId: z.string().optional(),
  title: z.string().trim().min(3).max(180),
  scheduledAt: z.string().datetime({ offset: true }).optional(),
  durationMin: z.number().int().min(1).max(480).default(30),
  summary: z.string().trim().max(2000).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const GET = withApi(async (req: Request) => {
  const user = await requireUser(['COUNSELLOR', 'ADMIN']);
  const view = new URL(req.url).searchParams.get('view') ?? 'overview';

  if (view === 'sessions') {
    const where = user.role === 'COUNSELLOR' ? { counsellor: { userId: user.id } } : {};
    const sessions = await prisma.counsellingSession.findMany({
      where,
      include: { family: { select: { id: true, familyCode: true, district: true, state: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return ok({ sessions });
  }

  const profile = user.role === 'COUNSELLOR' ? await prisma.counsellor.findUnique({ where: { userId: user.id } }) : null;

  const [myCases, pendingCases, appointments, openConcerns, escalated] = await Promise.all([
    profile
      ? prisma.counsellorCase.findMany({
          where: { counsellorId: profile.id },
          include: {
            owner: { select: { id: true, fullName: true, role: true } },
            family: { select: { id: true, familyCode: true, district: true } },
            _count: { select: { notes: true } },
          },
          orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
          take: 50,
        })
      : Promise.resolve([]),
    profile
      ? prisma.counsellorCase.count({ where: { counsellorId: profile.id, status: 'PENDING' } })
      : Promise.resolve(0),
    prisma.appointment.findMany({
      where: user.role === 'COUNSELLOR' && profile ? { counsellorId: profile.id } : {},
      include: { counsellor: { include: { user: { select: { fullName: true } } } }, family: { select: { familyCode: true } } },
      orderBy: { scheduledAt: 'asc' },
      take: 20,
    }),
    prisma.parentConcern.count({ where: { status: 'OPEN' } }),
    prisma.counsellorCase.count({ where: { status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] } } }),
  ]);

  return ok({
    profile,
    myCases,
    pendingCases,
    appointments,
    openConcerns,
    escalated,
    queue: await prisma.counsellorCase.findMany({
      where: { status: 'PENDING', counsellorId: null },
      include: { owner: { select: { fullName: true, role: true } } },
      orderBy: { createdAt: 'asc' },
      take: 20,
    }),
  });
});

export const POST = withApi(async (req: Request) => {
  const user = await requireUser(['COUNSELLOR', 'ADMIN']);
  const input = parseBody(sessionSchema, await req.json());

  const profile = user.role === 'COUNSELLOR' ? await prisma.counsellor.findUnique({ where: { userId: user.id } }) : null;

  const session = await prisma.counsellingSession.create({
    data: {
      familyId: input.familyId,
      caseId: input.caseId,
      counsellorId: profile?.id,
      kind: 'HUMAN',
      title: input.title,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : new Date(),
      durationMin: input.durationMin,
      status: 'COMPLETED',
      summary: input.summary,
      notes: input.notes,
    },
  });

  await prisma.adminAuditLog.create({
    data: { userId: user.id, action: 'COUNSELLING_SESSION_CREATE', entityType: 'CounsellingSession', entityId: session.id },
  });

  return ok({ session }, { status: 201 });
});

export const PATCH = withApi(async () => {
  throw new ApiError(405, 'Use /api/cases/[id] to update case status');
});

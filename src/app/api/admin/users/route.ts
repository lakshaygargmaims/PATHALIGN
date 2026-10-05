import { prisma, json } from '@/lib/db';
import { ok, withApi, ApiError } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';

export const dynamic = 'force-dynamic';

export const GET = withApi(async (req: Request) => {
  await requireUser(['ADMIN']);
  const url = new URL(req.url);
  const role = url.searchParams.get('role');
  const search = url.searchParams.get('search')?.trim();
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const pageSize = 25;

  const where = {
    ...(role ? { role: role as never } : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { district: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        fullName: true,
        email: true,
        mobile: true,
        role: true,
        state: true,
        district: true,
        preferredLanguage: true,
        isActive: true,
        createdAt: true,
        _count: { select: { sessions: true, familyMemberships: true } },
      },
    }),
  ]);

  return ok({ users, total, page, pageSize });
});

export const PATCH = withApi(async (req: Request) => {
  const admin = await requireUser(['ADMIN']);
  const body = (await req.json()) as { id?: string; isActive?: boolean; role?: string };
  if (!body.id) throw new ApiError(400, 'Missing user id');

  const target = await prisma.user.findUnique({ where: { id: body.id } });
  if (!target) throw new ApiError(404, 'User not found');
  if (target.id === admin.id && body.isActive === false) {
    throw new ApiError(400, 'You cannot deactivate your own account');
  }

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: {
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      ...(body.role ? { role: body.role as never } : {}),
    },
  });

  if (body.isActive === false) {
    await prisma.session.deleteMany({ where: { userId: target.id } });
  }

  await prisma.adminAuditLog.create({
    data: {
      userId: admin.id,
      action: 'USER_UPDATE',
      entityType: 'User',
      entityId: target.id,
      details: json({ isActive: body.isActive ?? null, role: body.role ?? null }),
    },
  });

  return ok({
    user: { id: updated.id, fullName: updated.fullName, email: updated.email, role: updated.role, isActive: updated.isActive },
  });
});

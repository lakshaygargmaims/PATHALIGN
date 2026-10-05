import { prisma } from '@/lib/db';
import { ok, withApi, ApiError } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';

export const dynamic = 'force-dynamic';

export const GET = withApi(async () => {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  return ok({ notifications, unread: notifications.filter((n) => !n.isRead).length });
});

export const PATCH = withApi(async (req: Request) => {
  const user = await requireUser();
  const body = (await req.json()) as { id?: string; all?: boolean };
  if (body.all) {
    await prisma.notification.updateMany({ where: { userId: user.id, isRead: false }, data: { isRead: true } });
    return ok({ marked: 'all' });
  }
  if (!body.id) throw new ApiError(400, 'Missing notification id');
  await prisma.notification.updateMany({ where: { id: body.id, userId: user.id }, data: { isRead: true } });
  return ok({ marked: body.id });
});

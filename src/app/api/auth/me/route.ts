import { prisma } from '@/lib/db';
import { ok, withApi, parseBody, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/auth/session';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateMeSchema = z.object({
  preferredLanguage: z.enum(['EN', 'HI']).optional(),
  fullName: z.string().trim().min(2).max(120).optional(),
});

export const GET = withApi(async () => {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, 'Not authenticated');

  const membership = await prisma.familyMember.findFirst({
    where: { userId: user.id },
    include: { family: true },
  });
  const [studentProfile, parentProfile, unreadNotifications] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId: user.id } }),
    prisma.parentProfile.findUnique({ where: { userId: user.id } }),
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
  ]);

  return ok({
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      state: user.state,
      district: user.district,
      preferredLanguage: user.preferredLanguage,
      createdAt: user.createdAt,
    },
    family: membership
      ? { id: membership.family.id, code: membership.family.familyCode, relation: membership.relation, consentGranted: membership.consentGranted }
      : null,
    hasStudentProfile: Boolean(studentProfile),
    hasParentProfile: Boolean(parentProfile),
    unreadNotifications,
  });
});

export const PATCH = withApi(async (req: Request) => {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, 'Not authenticated');
  const input = parseBody(updateMeSchema, await req.json());

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(input.preferredLanguage ? { preferredLanguage: input.preferredLanguage } : {}),
      ...(input.fullName ? { fullName: input.fullName } : {}),
    },
    select: { id: true, fullName: true, email: true, preferredLanguage: true },
  });

  return ok({ user: updated });
});

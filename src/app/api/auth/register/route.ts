import { prisma, json } from '@/lib/db';
import { ok, withApi, parseBody, ApiError } from '@/lib/api';
import { registerSchema } from '@/lib/validation/schemas';
import { hashPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { rateLimit, clientKey } from '@/lib/rate-limit';
import { joinFamily } from '@/lib/services/families';

export const dynamic = 'force-dynamic';

const STAFF_ROLES = ['COUNSELLOR', 'ADMIN'] as const;

export const POST = withApi(async (req: Request) => {
  if (!rateLimit(clientKey(req, 'register'), 5, 60_000)) {
    throw new ApiError(429, 'Too many registration attempts. Try again in a minute.');
  }

  const raw = (await req.json()) as { staffCode?: string };
  const input = parseBody(registerSchema, raw);

  if ((STAFF_ROLES as readonly string[]).includes(input.role)) {
    const requiredCode = process.env.ADMIN_REGISTRATION_CODE;
    if (requiredCode && raw.staffCode !== requiredCode) {
      throw new ApiError(403, 'A valid staff registration code is required for counsellor/admin accounts');
    }
  }

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      mobile: input.mobile ?? null,
      passwordHash,
      role: input.role,
      state: input.state,
      district: input.district,
      preferredLanguage: input.preferredLanguage,
    },
  });

  if (input.familyCode && (input.role === 'STUDENT' || input.role === 'PARENT')) {
    try {
      await joinFamily(user, {
        familyCode: input.familyCode,
        relation: input.role === 'PARENT' ? 'PARENT' : 'STUDENT',
        consent: true,
      });
    } catch {
      // invalid code should not block account creation — user can join later
    }
  }

  if (input.isMinor && input.guardianName) {
    await prisma.consentRecord.create({
      data: {
        userId: user.id,
        kind: 'GUARDIAN_CONSENT_MINOR',
        granted: true,
        note: `Guardian recorded at registration: ${input.guardianName}`,
      },
    });
  }

  await createSession(user.id, req.headers.get('user-agent'));
  await prisma.adminAuditLog.create({
    data: { userId: user.id, action: 'REGISTER', entityType: 'User', entityId: user.id, details: json({ role: user.role }) },
  });

  return ok({
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      state: user.state,
      district: user.district,
      preferredLanguage: user.preferredLanguage,
    },
  });
});

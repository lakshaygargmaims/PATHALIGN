import { prisma } from '@/lib/db';
import { ok, withApi, parseBody, ApiError } from '@/lib/api';
import { loginSchema } from '@/lib/validation/schemas';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { rateLimit, clientKey } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export const POST = withApi(async (req: Request) => {
  if (!rateLimit(clientKey(req, 'login'), 10, 60_000)) {
    throw new ApiError(429, 'Too many login attempts. Please wait a minute and try again.');
  }

  const { email, password } = parseBody(loginSchema, await req.json());
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(401, 'Invalid email or password');

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new ApiError(401, 'Invalid email or password');
  if (!user.isActive) throw new ApiError(403, 'This account has been deactivated. Contact an administrator.');

  await createSession(user.id, req.headers.get('user-agent'));

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

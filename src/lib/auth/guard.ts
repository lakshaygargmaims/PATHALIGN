import type { Role, User } from '@prisma/client';
import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/auth/session';
import { dashboardPath } from '@/lib/utils';

export { dashboardPath };

/**
 * Authorization guard for API route handlers.
 * Never trust client-side role checks — every protected endpoint calls this.
 */
export async function requireUser(roles?: Role[]): Promise<User> {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, 'Authentication required');
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    throw new ApiError(403, `Requires role: ${roles.join(' or ')}`);
  }
  return user;
}

/** Guard for server components: redirects instead of throwing. */
export async function requireUserPage(roles?: Role[]): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    redirect(dashboardPath(user.role));
  }
  if (!user.isActive) redirect('/login');
  return user;
}

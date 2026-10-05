import { ok, withApi } from '@/lib/api';
import { destroySession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export const POST = withApi(async () => {
  await destroySession();
  return ok({ loggedOut: true });
});

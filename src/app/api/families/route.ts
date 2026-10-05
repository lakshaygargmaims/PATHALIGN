import { ok, withApi, parseBody, ApiError } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { familyCreateSchema, familyJoinSchema } from '@/lib/validation/schemas';
import { createFamily, joinFamily, getUserFamily, getFamilyOverview, setFamilyConsent } from '@/lib/services/families';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const GET = withApi(async () => {
  const user = await requireUser();
  const family = await getUserFamily(user.id);
  if (!family) return ok({ family: null });
  const overview = await getFamilyOverview(family.id);
  const membership = await prisma.familyMember.findFirst({ where: { userId: user.id, familyId: family.id } });
  return ok({ ...overview, myRelation: membership?.relation ?? null, myConsent: membership?.consentGranted ?? false });
});

export const POST = withApi(async (req: Request) => {
  const user = await requireUser(['STUDENT', 'PARENT', 'COUNSELLOR']);
  const input = parseBody(familyCreateSchema, await req.json());
  const family = await createFamily(user, input);
  return ok({ family });
});

export const PATCH = withApi(async (req: Request) => {
  const user = await requireUser();
  const body = (await req.json()) as { action?: string; familyCode?: string; relation?: string; consent?: boolean; granted?: boolean };

  if (body.action === 'join') {
    const input = parseBody(familyJoinSchema, body);
    const family = await joinFamily(user, input);
    return ok({ family });
  }

  if (body.action === 'consent') {
    const family = await getUserFamily(user.id);
    if (!family) throw new ApiError(400, 'You are not a member of any family group');
    await setFamilyConsent(user.id, family.id, Boolean(body.granted));
    return ok({ consentGranted: Boolean(body.granted) });
  }

  throw new ApiError(400, 'Unknown action');
});

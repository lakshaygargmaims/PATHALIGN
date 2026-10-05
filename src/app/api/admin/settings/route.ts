import { prisma, json } from '@/lib/db';
import { ok, withApi, ApiError } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { z } from 'zod';
import { aiStatus } from '@/lib/ai/provider';

export const dynamic = 'force-dynamic';

const DEFAULTS: Record<string, { value: unknown; description: string }> = {
  'app.name': { value: 'PATHALIGN AI', description: 'Application display name' },
  'app.tagline': { value: 'Aligning Dreams with Opportunities.', description: 'Public tagline' },
  'counselling.defaultLanguage': { value: 'EN', description: 'Default counselling language (EN or HI)' },
  'counselling.allowEscalation': { value: true, description: 'Show the “talk to a human counsellor” option' },
  'registration.open': { value: true, description: 'Allow new self-registration' },
  'demoDataBanner': { value: true, description: 'Show the synthetic-demo-data notice on admin dashboards' },
  'support.contact': { value: '', description: 'Support contact shown to families' },
};

export const GET = withApi(async () => {
  await requireUser(['ADMIN']);
  const stored = await prisma.systemSetting.findMany();
  const map = new Map(stored.map((s) => [s.key, s.value]));
  const settings = Object.entries(DEFAULTS).map(([key, def]) => ({
    key,
    value: map.has(key) ? map.get(key) : def.value,
    description: def.description,
    isDefault: !map.has(key),
  }));
  return ok({ settings, ai: aiStatus() });
});

export const PUT = withApi(async (req: Request) => {
  const admin = await requireUser(['ADMIN']);
  const body = (await req.json()) as { settings?: Array<{ key: string; value: unknown }> };
  if (!body.settings || !Array.isArray(body.settings)) throw new ApiError(400, 'settings array required');

  const allowed = body.settings.filter((s) => s.key in DEFAULTS);
  if (allowed.length === 0) throw new ApiError(400, 'No recognised setting keys provided');

  for (const s of allowed) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      create: { key: s.key, value: json(s.value), description: DEFAULTS[s.key]!.description, updatedById: admin.id },
      update: { value: json(s.value), updatedById: admin.id },
    });
  }
  await prisma.adminAuditLog.create({
    data: {
      userId: admin.id,
      action: 'SETTINGS_UPDATE',
      entityType: 'SystemSetting',
      details: json({ keys: allowed.map((s) => s.key) }),
    },
  });
  return ok({ updated: allowed.length });
});

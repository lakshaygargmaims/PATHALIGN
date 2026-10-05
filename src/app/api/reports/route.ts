import { ok, withApi, parseBody, ApiError } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { reportSchema } from '@/lib/validation/schemas';
import { createReport, listReports, getReportPayload } from '@/lib/services/reports';

export const dynamic = 'force-dynamic';

export const GET = withApi(async (req: Request) => {
  const user = await requireUser();
  const id = new URL(req.url).searchParams.get('id');
  if (id) {
    const report = await getReportPayload(id, user);
    return ok({ report });
  }
  const reports = await listReports(user);
  return ok({ reports });
});

export const POST = withApi(async (req: Request) => {
  const user = await requireUser(['STUDENT', 'PARENT', 'ADMIN']);
  const input = parseBody(reportSchema, await req.json());
  const result = await createReport(user, input);
  return ok(result, { status: 201 });
});

export const DELETE = withApi(async () => {
  throw new ApiError(405, 'Reports can be deleted from the Profile privacy controls');
});

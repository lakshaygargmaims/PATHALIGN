import { withApi, ApiError } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { getReportPayload } from '@/lib/services/reports';
import { renderReportPdf } from '@/lib/report/pdf';

export const dynamic = 'force-dynamic';

export const GET = withApi(
  async (req: Request, ctx: { params: { id: string } }) => {
    const user = await requireUser();
    const record = await getReportPayload(ctx.params.id, user);

    const payload = record.payload as unknown as Parameters<typeof renderReportPdf>[0];
    if (!payload || typeof payload !== 'object' || !payload.family) {
      throw new ApiError(422, 'This report has no renderable payload — regenerate it first.');
    }

    const doc = renderReportPdf(payload);
    const bytes = Buffer.from(doc.output('arraybuffer'));

    const safeCode = (payload.family?.code ?? 'family').replace(/[^A-Za-z0-9-]/g, '');
    const filename = `pathalign-report-${safeCode}-${record.type.toLowerCase()}.pdf`;

    return new Response(new Uint8Array(bytes), {
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `${new URL(req.url).searchParams.get('download') === '1' ? 'attachment' : 'inline'}; filename="${filename}"`,
        'content-length': String(bytes.byteLength),
        'cache-control': 'private, no-store',
      },
    });
  },
);

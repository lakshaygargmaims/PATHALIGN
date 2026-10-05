import { prisma, json } from '@/lib/db';
import { ok, withApi, parseBody, ApiError } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { importBatchSchema, importReviewSchema } from '@/lib/validation/schemas';
import { csvToObjects, toCsv } from '@/lib/csv';
import { slugify } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const GET = withApi(async (req: Request) => {
  await requireUser(['ADMIN']);
  const url = new URL(req.url);

  if (url.searchParams.get('view') === 'template') {
    const recordType = url.searchParams.get('recordType') ?? 'TRADE';
    const templates: Record<string, string> = {
      TRADE: toCsv(
        ['name', 'category', 'description', 'durationMonths', 'nsqfLevel', 'eligibility', 'feeMin', 'feeMax'],
        [{ name: 'Sample Trade', category: 'Engineering', description: 'Describe the trade here', durationMonths: 12, nsqfLevel: 4, eligibility: 'Class 10th pass', feeMin: 5000, feeMax: 20000 }],
      ),
      PROVIDER: toCsv(
        ['name', 'type', 'state', 'district', 'city', 'pinCode', 'lat', 'lng', 'affiliation'],
        [{ name: 'Sample ITI', type: 'ITI', state: 'Maharashtra', district: 'Pune', city: 'Pune', pinCode: '411001', lat: 18.52, lng: 73.85, affiliation: 'Verify affiliation' }],
      ),
      OPPORTUNITY: toCsv(
        ['title', 'sector', 'employmentType', 'state', 'district', 'employerName', 'isVacancy', 'description'],
        [{ title: 'Sample role description', sector: 'PRIVATE_SERVICES', employmentType: 'PRIVATE', state: 'Maharashtra', district: 'Pune', employerName: '', isVacancy: 'false', description: 'Describe the opportunity (not a live vacancy unless verified)' }],
      ),
      KNOWLEDGE: toCsv(['title', 'chunk', 'docType', 'language', 'tags'], [{ title: 'Sample knowledge', chunk: 'Content used for retrieval-augmented answers.', docType: 'FAQ', language: 'EN', tags: 'sample;demo' }]),
    };
    return new Response(templates[recordType] ?? templates.TRADE!, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="pathalign-${recordType.toLowerCase()}-template.csv"`,
      },
    });
  }

  const batches = await prisma.importBatch.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      uploadedBy: { select: { fullName: true } },
      reviewedBy: { select: { fullName: true } },
    },
  });
  return ok({ batches });
});

export const POST = withApi(async (req: Request) => {
  const admin = await requireUser(['ADMIN']);
  const body = await req.json();
  const action = (body.action as string) ?? 'upload';

  if (action === 'review') {
    const input = parseBody(importReviewSchema, body);
    const batch = await prisma.importBatch.findUnique({ where: { id: input.batchId } });
    if (!batch) throw new ApiError(404, 'Import batch not found');
    if (batch.status !== 'PENDING_REVIEW') throw new ApiError(400, 'This batch has already been reviewed');

    if (input.decision === 'REJECTED') {
      const updated = await prisma.importBatch.update({
        where: { id: batch.id },
        data: { status: 'REJECTED', reviewedById: admin.id, reviewedAt: new Date(), notes: input.notes ?? batch.notes },
      });
      await prisma.adminAuditLog.create({
        data: { userId: admin.id, action: 'IMPORT_REJECT', entityType: 'ImportBatch', entityId: batch.id },
      });
      return ok({ batch: updated });
    }

    const payload = batch.payload as { rows?: Array<Record<string, string>> } | null;
    const rows = payload?.rows ?? [];
    const applied = await applyImport(batch.recordType, rows);

    const updated = await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status: 'APPROVED',
        acceptedRows: applied.created,
        reviewedById: admin.id,
        reviewedAt: new Date(),
        notes: input.notes ?? `Applied ${applied.created} record(s), skipped ${applied.skipped}`,
      },
    });
    await prisma.adminAuditLog.create({
      data: {
        userId: admin.id,
        action: 'IMPORT_APPROVE',
        entityType: 'ImportBatch',
        entityId: batch.id,
        details: json(applied),
      },
    });
    return ok({ batch: updated, applied });
  }

  // upload + validate (staged for review, not applied yet)
  const input = parseBody(importBatchSchema, body);
  const parsed = csvToObjects(input.csv);
  if (parsed.rows.length === 0) {
    throw new ApiError(400, 'No valid rows found', { parseErrors: parsed.errors.slice(0, 10) });
  }

  const batch = await prisma.importBatch.create({
    data: {
      filename: input.filename,
      recordType: input.recordType,
      status: 'PENDING_REVIEW',
      rowCount: parsed.rows.length,
      acceptedRows: 0,
      payload: json({ headers: parsed.headers, rows: parsed.rows, parseErrors: parsed.errors }),
      notes: parsed.errors.length ? `${parsed.errors.length} row warning(s)` : null,
      uploadedById: admin.id,
    },
  });
  await prisma.adminAuditLog.create({
    data: {
      userId: admin.id,
      action: 'IMPORT_UPLOAD',
      entityType: 'ImportBatch',
      entityId: batch.id,
      details: json({ recordType: input.recordType, rows: parsed.rows.length }),
    },
  });

  return ok({ batch, preview: parsed.rows.slice(0, 5), parseErrors: parsed.errors.slice(0, 10) }, { status: 201 });
});

async function applyImport(recordType: string, rows: Array<Record<string, string>>): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    if (recordType === 'TRADE') {
      if (!row.name || !row.category || !row.description) {
        skipped++;
        continue;
      }
      const slug = slugify(row.name);
      const exists = await prisma.careerTrade.findUnique({ where: { slug } });
      if (exists) {
        skipped++;
        continue;
      }
      await prisma.careerTrade.create({
        data: {
          name: row.name,
          slug,
          category: row.category,
          description: row.description,
          durationMonths: Number(row.durationMonths || 6),
          nsqfLevel: row.nsqfLevel ? Number(row.nsqfLevel) : null,
          eligibility: row.eligibility,
          feeMin: row.feeMin ? Number(row.feeMin) : null,
          feeMax: row.feeMax ? Number(row.feeMax) : null,
          isSynthetic: true,
          verificationStatus: 'PENDING_VERIFICATION',
        },
      });
      created++;
    } else if (recordType === 'PROVIDER') {
      if (!row.name || !row.state || !row.district || !row.type) {
        skipped++;
        continue;
      }
      await prisma.trainingProvider.create({
        data: {
          name: row.name,
          type: row.type as never,
          state: row.state,
          district: row.district,
          city: row.city,
          pinCode: row.pinCode,
          lat: row.lat ? Number(row.lat) : null,
          lng: row.lng ? Number(row.lng) : null,
          affiliation: row.affiliation,
          isSynthetic: false,
          verificationStatus: 'PENDING_VERIFICATION',
        },
      });
      created++;
    } else if (recordType === 'OPPORTUNITY') {
      if (!row.title || !row.description) {
        skipped++;
        continue;
      }
      await prisma.employmentOpportunity.create({
        data: {
          title: row.title,
          description: row.description,
          sector: (row.sector as never) ?? 'OTHER',
          employmentType: (row.employmentType as never) ?? 'PRIVATE',
          state: row.state,
          district: row.district,
          employerName: row.employerName || null,
          isVacancy: row.isVacancy?.toLowerCase() === 'true',
          isSynthetic: false,
          verificationStatus: 'PENDING_VERIFICATION',
        },
      });
      created++;
    } else if (recordType === 'KNOWLEDGE') {
      if (!row.title || !row.chunk) {
        skipped++;
        continue;
      }
      await prisma.knowledgeDocument.create({
        data: {
          title: row.title,
          chunk: row.chunk,
          docType: row.docType || 'FAQ',
          language: row.language === 'HI' ? 'HI' : 'EN',
          tags: row.tags ? row.tags.split(/[;,]/).map((t) => t.trim()).filter(Boolean) : [],
          verificationStatus: 'PENDING_VERIFICATION',
        },
      });
      created++;
    } else {
      skipped++;
    }
  }
  return { created, skipped };
}

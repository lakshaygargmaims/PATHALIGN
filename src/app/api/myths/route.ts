import { ok, withApi } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const GET = withApi(async (req: Request) => {
  await requireUser();
  const url = new URL(req.url);
  const language = url.searchParams.get('language');

  const docs = await prisma.knowledgeDocument.findMany({
    where: {
      docType: 'MYTH_FACT',
      ...(language === 'HI' ? { language: 'HI' } : language === 'EN' ? { language: 'EN' } : {}),
    },
    orderBy: { title: 'asc' },
    select: {
      id: true,
      title: true,
      chunk: true,
      language: true,
      tags: true,
      verificationStatus: true,
      lastVerifiedAt: true,
      publishedAt: true,
      source: { select: { id: true, name: true, url: true, publisher: true, verificationStatus: true, isSynthetic: true } },
    },
    take: 60,
  });

  // Pair EN/HI variants of the same myth so the UI can show one card per myth.
  const en = docs.filter((d) => d.language === 'EN');
  const hi = docs.filter((d) => d.language === 'HI');
  const items = en.map((d) => {
    const match = hi.find((h) => h.title.replace(/ \(हिंदी\)$/, '') === d.title);
    const text = d.chunk;
    const mythMatch = /Myth:\s*"([^"]+)"/.exec(text);
    const factMatch = /Fact:\s*(.+?)\s*Evidence/s.exec(text);
    const evidenceMatch = /Evidence and explanation:\s*(.+?)\s*Last updated/s.exec(text);
    const updatedMatch = /Last updated:\s*([0-9-]+)/.exec(text);
    return {
      id: d.id,
      title: d.title,
      myth: mythMatch?.[1] ?? text.slice(0, 120),
      fact: factMatch?.[1]?.trim() ?? '',
      explanation: evidenceMatch?.[1]?.trim() ?? '',
      source: d.source,
      verificationStatus: d.verificationStatus,
      lastUpdated: updatedMatch?.[1] ?? null,
      hindiChunk: match?.chunk ?? null,
      tags: d.tags,
    };
  });

  return ok({ myths: items, total: items.length });
});

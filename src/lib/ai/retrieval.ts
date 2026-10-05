import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import type { AppLanguage } from '@prisma/client';
import type { RetrievedChunk } from './types';

// ------------------------------------------------------------
// Retrieval-Augmented Generation retrieval layer.
// Two modes:
//   - lexical (default): in-process BM25 over knowledge chunks (no external service)
//   - vector: pgvector cosine similarity (requires ENABLE_VECTOR_SEARCH + embeddings)
// ------------------------------------------------------------

const STOPWORDS = new Set(
  'a an and are as at be by for from has have in is it of on or that the this to was were will with what how why when which who whom do does did not no yes if then than so too very can could should would you your i me my we our they them he she his her its'.split(
    ' ',
  ),
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

interface Doc {
  id: string;
  title: string;
  chunk: string;
  docType: string;
  language: AppLanguage;
  tags: string[];
  tradeId: string | null;
  source: {
    id: string;
    name: string;
    url: string | null;
    publisher: string | null;
    category: string;
    isSynthetic: boolean;
    verificationStatus: string;
  } | null;
}

async function loadDocs(language?: AppLanguage): Promise<Doc[]> {
  const docs = await prisma.knowledgeDocument.findMany({
    where: language ? { OR: [{ language }, { language: 'EN' }] } : undefined,
    select: {
      id: true,
      title: true,
      chunk: true,
      docType: true,
      language: true,
      tags: true,
      tradeId: true,
      source: {
        select: {
          id: true,
          name: true,
          url: true,
          publisher: true,
          category: true,
          isSynthetic: true,
          verificationStatus: true,
        },
      },
    },
    take: 2000,
  });
  return docs as Doc[];
}

/** BM25 (k1=1.2, b=0.75) scoring over knowledge chunks. */
export function bm25Search(docs: Doc[], query: string, k = 5): RetrievedChunk[] {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return [];
  const k1 = 1.2;
  const b = 0.75;
  const tokenized = docs.map((d) => ({
    doc: d,
    tokens: tokenize(`${d.title} ${d.title} ${d.tags.join(' ')} ${d.chunk}`),
  }));
  const avgLen = tokenized.reduce((s, t) => s + t.tokens.length, 0) / (tokenized.length || 1);
  const df = new Map<string, number>();
  for (const t of tokenized) {
    const seen = new Set(t.tokens);
    for (const token of seen) df.set(token, (df.get(token) ?? 0) + 1);
  }
  const N = docs.length || 1;
  const results: RetrievedChunk[] = [];
  for (const { doc, tokens } of tokenized) {
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    let score = 0;
    for (const qt of qTokens) {
      const f = tf.get(qt) ?? 0;
      if (f === 0) continue;
      const n = df.get(qt) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      score += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * tokens.length) / (avgLen || 1))));
    }
    // light boost for tag matches
    const tagText = doc.tags.join(' ').toLowerCase();
    for (const qt of qTokens) if (tagText.includes(qt)) score += 0.5;
    if (score > 0) {
      results.push({
        id: doc.id,
        title: doc.title,
        chunk: doc.chunk,
        docType: doc.docType,
        language: doc.language,
        tags: doc.tags,
        tradeId: doc.tradeId,
        score: Number(score.toFixed(4)),
        source: doc.source,
      });
    }
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, k);
}

export function vectorEnabled(): boolean {
  return (
    process.env.ENABLE_VECTOR_SEARCH === 'true' &&
    process.env.RAG_MODE === 'vector' &&
    Boolean(process.env.OPENAI_API_KEY)
  );
}

async function vectorSearch(query: string, language: AppLanguage | undefined, k: number): Promise<RetrievedChunk[]> {
  const { getProvider } = await import('./provider');
  const provider = getProvider();
  if (!provider.embed) throw new Error('Provider does not support embeddings');
  const [vec] = await provider.embed([query]);
  if (!vec) throw new Error('Embedding failed');
  const pgVectorLiteral = `[${vec.join(',')}]`;
  const langFilter = language ? Prisma.sql`AND kd.language IN (${language}, 'EN')` : Prisma.empty;
  const rows = (await prisma.$queryRaw<
    Array<{
      id: string;
      title: string;
      chunk: string;
      docType: string;
      language: AppLanguage;
      tags: string[];
      tradeId: string | null;
      distance: number;
      sourceId: string | null;
      sourceName: string | null;
      sourceUrl: string | null;
      sourcePublisher: string | null;
      sourceCategory: string | null;
      sourceIsSynthetic: boolean | null;
      sourceVerification: string | null;
    }>
  >(Prisma.sql`
    SELECT kd.id, kd.title, kd.chunk, kd."docType", kd.language, kd.tags, kd."tradeId",
           1 - (kd.embedding <=> ${pgVectorLiteral}::vector) AS distance,
           ds.id AS "sourceId", ds.name AS "sourceName", ds.url AS "sourceUrl",
           ds.publisher AS "sourcePublisher", ds.category AS "sourceCategory",
           ds."isSynthetic" AS "sourceIsSynthetic", ds."verificationStatus" AS "sourceVerification"
    FROM "KnowledgeDocument" kd
    LEFT JOIN "DataSource" ds ON ds.id = kd."sourceId"
    WHERE kd.embedding IS NOT NULL
      ${langFilter}
    ORDER BY kd.embedding <=> ${pgVectorLiteral}::vector
    LIMIT ${k}
  `));
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    chunk: r.chunk,
    docType: r.docType,
    language: r.language,
    tags: r.tags,
    tradeId: r.tradeId,
    score: Number(r.distance),
    source: r.sourceId
      ? {
          id: r.sourceId,
          name: r.sourceName ?? 'Unknown source',
          url: r.sourceUrl,
          publisher: r.sourcePublisher,
          category: r.sourceCategory ?? 'OFFICIAL_BODY',
          isSynthetic: r.sourceIsSynthetic ?? false,
          verificationStatus: r.sourceVerification ?? 'PENDING_VERIFICATION',
        }
      : null,
  }));
}

export interface RetrievalOptions {
  language?: AppLanguage;
  k?: number;
  docTypes?: string[];
  tradeId?: string;
}

export async function retrieve(query: string, opts: RetrievalOptions = {}): Promise<RetrievedChunk[]> {
  const k = opts.k ?? 5;
  if (vectorEnabled()) {
    try {
      return await vectorSearch(query, opts.language, k);
    } catch (err) {
      console.warn('[rag] vector search failed, falling back to lexical:', err);
    }
  }
  const docs = await loadDocs(opts.language);
  const filtered = opts.docTypes
    ? docs.filter((d) => opts.docTypes!.includes(d.docType) || opts.docTypes!.includes('ANY'))
    : docs;
  const scoped = opts.tradeId ? filtered.filter((d) => d.tradeId === opts.tradeId || !d.tradeId) : filtered;
  const candidates = scoped.length > 0 ? scoped : filtered;
  const hits = bm25Search(candidates, query, k + (opts.tradeId ? 3 : 0));
  const tradeHits = opts.tradeId ? hits.filter((h) => h.tradeId === opts.tradeId) : [];
  const otherHits = hits.filter((h) => !opts.tradeId || h.tradeId !== opts.tradeId);
  return [...tradeHits, ...otherHits].slice(0, k);
}

/** Deduplicate sources for display under an AI answer. */
export function sourcesFromChunks(chunks: RetrievedChunk[]) {
  const seen = new Map<
    string,
    { id: string; title: string; url: string | null; publisher: string | null; isSynthetic: boolean; verificationStatus: string }
  >();
  for (const c of chunks) {
    if (!c.source) continue;
    const key = c.source.id;
    if (!seen.has(key)) {
      seen.set(key, {
        id: c.source.id,
        title: c.source.name,
        url: c.source.url,
        publisher: c.source.publisher,
        isSynthetic: c.source.isSynthetic,
        verificationStatus: c.source.verificationStatus,
      });
    }
  }
  return Array.from(seen.values());
}

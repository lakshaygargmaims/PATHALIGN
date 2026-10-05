'use client';

import { useState } from 'react';
import { ShieldQuestion } from 'lucide-react';
import { useApi } from '@/lib/hooks';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/states';
import { VerificationBadge } from '@/components/ui/badges';
import { cn, formatDate } from '@/lib/utils';

interface MythDoc {
  id: string;
  title: string;
  chunk: string;
  language: string;
  tags: string[];
  verificationStatus: string;
  lastVerifiedAt: string | null;
  publishedAt: string | null;
  source: { name: string; url: string | null; publisher: string | null; verificationStatus: string; isSynthetic: boolean } | null;
}

export default function StudentMythsPage() {
  const [language, setLanguage] = useState<'EN' | 'HI'>('EN');
  const { data, loading, error, refetch } = useApi<{ docs: MythDoc[] }>(
    `/api/myths?language=${language}`,
    [language],
  );

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-navy">
              <ShieldQuestion className="h-5 w-5 text-royal-600" /> Myth buster
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Common beliefs that hold families back, answered with sourced facts. Every entry shows its source and
              verification status so you can check it yourself.
            </p>
          </div>
          <div className="flex gap-1">
            {(['EN', 'HI'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLanguage(l)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold',
                  language === l ? 'bg-royal-600 text-white' : 'bg-surface text-slate-600 hover:bg-slate-200',
                )}
              >
                {l === 'EN' ? 'English' : 'हिन्दी'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <CardSkeleton rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data?.docs.length === 0 ? (
        <EmptyState title="No entries" description="No myth/fact records are loaded for this language yet." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data!.docs.map((d) => (
            <article key={d.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-navy">{d.title}</h3>
                <VerificationBadge
                  status={d.source?.isSynthetic ? 'SYNTHETIC_DEMO' : d.verificationStatus}
                  isSynthetic={d.source?.isSynthetic}
                />
              </div>
              <p className="mt-2 whitespace-pre-line text-xs text-slate-600">{d.chunk}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                {d.source ? (
                  d.source.url ? (
                    <a
                      href={d.source.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="font-semibold text-royal-600 hover:underline"
                    >
                      {d.source.name}
                    </a>
                  ) : (
                    <span>{d.source.name}</span>
                  )
                ) : (
                  <span>No source linked</span>
                )}
                {d.lastVerifiedAt ? <span>Checked {formatDate(d.lastVerifiedAt)}</span> : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

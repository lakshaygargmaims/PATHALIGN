'use client';

import { useState } from 'react';
import { LibraryBig } from 'lucide-react';
import { useApi } from '@/lib/hooks';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/states';
import { VerificationBadge } from '@/components/ui/badges';
import { formatINR, cn } from '@/lib/utils';

interface Trade {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  durationMonths: number;
  nsqfLevel: number | null;
  feeMin: number | null;
  feeMax: number | null;
  verificationStatus: string;
  isSynthetic: boolean;
  source: { name: string; verificationStatus: string } | null;
  salaryStats: Array<{ experienceLevel: string; monthlyMin: number; monthlyMax: number; verificationStatus: string; isEstimate: boolean }>;
  _count: { courses: number; pathways: number; knowledgeDocs: number };
}

const STATUSES = ['ALL', 'VERIFIED', 'PENDING_VERIFICATION', 'OUTDATED', 'UNAVAILABLE', 'SYNTHETIC_DEMO'];

export default function AdminCareers() {
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [verification, setVerification] = useState('ALL');
  const query = new URLSearchParams();
  if (term) query.set('search', term);
  if (verification !== 'ALL') query.set('verification', verification);
  const qs = query.toString();
  const { data, loading, error, refetch } = useApi<{ trades: Trade[] }>(`/api/admin/trades${qs ? `?${qs}` : ''}`, [term, verification]);

  const verified = (data?.trades ?? []).filter((t) => t.verificationStatus === 'VERIFIED').length;

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-navy">
              <LibraryBig className="h-5 w-5 text-teal-600" /> Career database
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {data?.trades.length ?? 0} trade(s) loaded · {verified} verified. Verification status travels with every
              record so students and parents can see what is official and what is demo data.
            </p>
          </div>
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setTerm(search.trim());
            }}
          >
            <div>
              <label htmlFor="trade-search" className="block text-xs font-semibold text-navy">
                Search
              </label>
              <input
                id="trade-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input mt-1 w-56"
                placeholder="Trade name or category"
              />
            </div>
            <button type="submit" className="btn-primary text-xs">
              Search
            </button>
          </form>
        </div>

        <div className="mt-4 flex flex-wrap gap-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setVerification(s)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold',
                verification === s ? 'bg-royal-600 text-white' : 'bg-surface text-slate-600 hover:bg-slate-200',
              )}
            >
              {s === 'ALL' ? 'All' : s.replace(/_/g, ' ').toLowerCase()}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <CardSkeleton rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data?.trades.length === 0 ? (
        <EmptyState title="No trades match" description="Clear the search or choose a different verification status." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data!.trades.map((t) => {
            const entry = t.salaryStats.find((s) => s.experienceLevel === 'ENTRY') ?? t.salaryStats[0];
            return (
              <article key={t.id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-navy">{t.name}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {t.category} · {t.durationMonths} months
                      {t.nsqfLevel ? ` · NSQF ${t.nsqfLevel}` : ''}
                    </p>
                  </div>
                  <VerificationBadge status={t.verificationStatus} isSynthetic={t.isSynthetic} />
                </div>

                <p className="mt-3 line-clamp-3 text-xs text-slate-600">{t.description}</p>

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <dt className="text-slate-400">Fees</dt>
                    <dd className="font-medium text-navy">
                      {t.feeMin != null && t.feeMax != null ? `${formatINR(t.feeMin)} – ${formatINR(t.feeMax)}` : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Entry earnings</dt>
                    <dd className="font-medium text-navy">
                      {entry ? `${formatINR(entry.monthlyMin)} – ${formatINR(entry.monthlyMax)}` : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Source</dt>
                    <dd className="font-medium text-navy">{t.source?.name ?? 'Unlinked'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Linked records</dt>
                    <dd className="font-medium text-navy">
                      {t._count.courses} course(s) · {t._count.pathways} pathway(s) · {t._count.knowledgeDocs} doc(s)
                    </dd>
                  </div>
                </dl>

                {entry?.isEstimate ? (
                  <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                    Entry earnings on this record are estimates, not verified figures.
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

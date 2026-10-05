'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApi } from '@/lib/hooks';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/badges';
import { relativeTime, cn } from '@/lib/utils';

interface CaseRow {
  id: string;
  subject: string;
  description?: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  owner: { fullName: string; role: string } | null;
  family: { familyCode: string; district: string | null } | null;
  counsellor: { user: { fullName: string } } | null;
  _count?: { notes: number; appointments: number };
}

const STATUSES = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const PRIORITY_ORDER = ['URGENT', 'HIGH', 'NORMAL', 'LOW'] as const;

function priorityClass(priority: string) {
  if (priority === 'URGENT') return 'bg-red-100 text-red-800';
  if (priority === 'HIGH') return 'bg-orange-100 text-orange-800';
  if (priority === 'NORMAL') return 'bg-royal-100 text-royal-800';
  return 'bg-slate-100 text-slate-600';
}

export default function CounsellorCases() {
  const [status, setStatus] = useState<string>('ALL');
  const query = status === 'ALL' ? '/api/cases?mine=1' : `/api/cases?mine=1&status=${status}`;
  const { data, loading, error, refetch } = useApi<{ cases: CaseRow[] }>(query, [status]);

  const cases = [...(data?.cases ?? [])].sort(
    (a, b) => PRIORITY_ORDER.indexOf(a.priority as never) - PRIORITY_ORDER.indexOf(b.priority as never),
  );

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-navy">Cases assigned to you</h2>
            <p className="text-xs text-slate-500">
              Sorted by priority, then by how recently the family raised the concern.
            </p>
          </div>
          <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filter by status">
            {['ALL', ...STATUSES].map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={status === s}
                onClick={() => setStatus(s)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                  status === s ? 'bg-royal-600 text-white' : 'bg-surface text-slate-600 hover:bg-slate-200',
                )}
              >
                {s === 'ALL' ? 'All' : s.replace(/_/g, ' ').toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <CardSkeleton rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : cases.length === 0 ? (
        <EmptyState
          title={status === 'ALL' ? 'No cases assigned yet' : `No ${status.replace(/_/g, ' ').toLowerCase()} cases`}
          description="When a family escalates a concern and you are the least-loaded counsellor, the case lands here with its conversation attached."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {cases.map((c) => (
            <article key={c.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/counsellor/cases/${c.id}`} className="text-sm font-semibold text-navy hover:text-royal-600">
                    {c.subject}
                  </Link>
                  <p className="mt-0.5 text-xs capitalize text-slate-500">
                    {c.category.replace(/_/g, ' ').toLowerCase()}
                  </p>
                </div>
                <span className={`badge shrink-0 ${priorityClass(c.priority)}`}>{c.priority}</span>
              </div>

              {c.description ? (
                <p className="mt-3 line-clamp-3 text-xs text-slate-600">{c.description}</p>
              ) : null}

              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <dt className="text-slate-400">Raised by</dt>
                  <dd className="font-medium text-navy">{c.owner?.fullName ?? 'Unknown'}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Family</dt>
                  <dd className="font-medium text-navy">
                    {c.family?.familyCode ?? '—'}
                    {c.family?.district ? ` · ${c.family.district}` : ''}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Status</dt>
                  <dd>
                    <StatusBadge status={c.status} />
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Raised</dt>
                  <dd className="font-medium text-navy">{relativeTime(c.createdAt)}</dd>
                </div>
              </dl>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {(c._count?.notes ?? 0)} note(s) · {(c._count?.appointments ?? 0)} appointment(s)
                </span>
                <Link href={`/counsellor/cases/${c.id}`} className="btn-secondary px-3 py-1.5 text-xs">
                  Open case
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

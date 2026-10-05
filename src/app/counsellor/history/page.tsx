'use client';

import Link from 'next/link';
import { History } from 'lucide-react';
import { useApi } from '@/lib/hooks';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/badges';
import { formatDate, relativeTime } from '@/lib/utils';

interface CaseRow {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  resolvedAt: string | null;
  owner: { fullName: string } | null;
  family: { familyCode: string } | null;
  counsellor: { user: { fullName: string } } | null;
  _count?: { notes: number };
}

export default function CounsellorHistory() {
  const { data, loading, error, refetch } = useApi<{ cases: CaseRow[] }>('/api/cases?mine=1');
  const closed = (data?.cases ?? [])
    .filter((c) => ['RESOLVED', 'CLOSED'].includes(c.status))
    .sort((a, b) => new Date(b.resolvedAt ?? b.createdAt).getTime() - new Date(a.resolvedAt ?? a.createdAt).getTime());

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-semibold text-navy">
          <History className="h-5 w-5 text-royal-600" /> Case history
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Resolved and closed cases you handled, most recent first. This history stays on the family record.
        </p>
      </section>

      {loading ? (
        <CardSkeleton rows={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : closed.length === 0 ? (
        <EmptyState
          title="No closed cases yet"
          description="Cases you resolve or close will be listed here as a permanent record."
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Case</th>
                <th className="px-4 py-3">Family</th>
                <th className="px-4 py-3">Closed</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {closed.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <Link href={`/counsellor/cases/${c.id}`} className="text-sm font-semibold text-navy hover:text-royal-600">
                      {c.subject}
                    </Link>
                    <p className="text-xs capitalize text-slate-500">{c.category.replace(/_/g, ' ').toLowerCase()}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {c.family?.familyCode ?? '—'}
                    <p className="text-slate-400">{c.owner?.fullName}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {formatDate(c.resolvedAt ?? c.createdAt)}
                    <p className="text-slate-400">opened {relativeTime(c.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{c._count?.notes ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Inbox } from 'lucide-react';
import { apiJson, useApi } from '@/lib/hooks';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/badges';
import { relativeTime } from '@/lib/utils';

interface QueueCase {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  owner: { fullName: string; role: string } | null;
}

interface Overview {
  queue: QueueCase[];
  escalated: number;
}

export default function CounsellorQueue() {
  const { data, loading, error, refetch } = useApi<Overview>('/api/counsellor');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  const claim = async (id: string) => {
    setBusyId(id);
    setClaimError(null);
    try {
      await apiJson(`/api/cases/${id}`, 'PATCH', { assignToMe: true, status: 'IN_PROGRESS' });
      refetch();
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : 'Could not claim this case');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-semibold text-navy">
          <Inbox className="h-5 w-5 text-royal-600" /> Unresolved concerns
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Cases with no counsellor yet, oldest first. Claiming one assigns it to you and sets it in progress.{' '}
          {data?.escalated ?? 0} case(s) system-wide are open right now.
        </p>
        {claimError ? <p className="mt-2 text-xs text-red-600">{claimError}</p> : null}
      </section>

      {loading ? (
        <CardSkeleton rows={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data?.queue.length === 0 ? (
        <EmptyState
          title="The queue is clear"
          description="Every escalated case currently has a counsellor. New escalations appear here automatically."
          icon={<Inbox className="h-5 w-5" />}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data!.queue.map((c) => (
            <article key={c.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/counsellor/cases/${c.id}`} className="text-sm font-semibold text-navy hover:text-royal-600">
                    {c.subject}
                  </Link>
                  <p className="mt-0.5 text-xs capitalize text-slate-500">
                    {c.category.replace(/_/g, ' ').toLowerCase()} · {c.owner?.fullName ?? 'Unknown'} ·{' '}
                    {relativeTime(c.createdAt)}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <button
                type="button"
                disabled={busyId === c.id}
                onClick={() => claim(c.id)}
                className="btn-primary mt-4 text-xs"
              >
                {busyId === c.id ? 'Claiming…' : 'Claim this case'}
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

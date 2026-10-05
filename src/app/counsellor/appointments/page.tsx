'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarClock, Video, Phone, MapPin } from 'lucide-react';
import { apiJson, useApi } from '@/lib/hooks';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/badges';
import { formatDateTime, cn } from '@/lib/utils';

interface Appointment {
  id: string;
  scheduledAt: string;
  durationMin: number;
  mode: string;
  status: string;
  notes: string | null;
  family: { familyCode: string; district: string | null; state: string | null } | null;
  case: { id: string; subject: string } | null;
}

const MODE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  VIDEO: Video,
  PHONE: Phone,
  IN_PERSON: MapPin,
};

const NEXT_STATUS: Record<string, string[]> = {
  SCHEDULED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export default function CounsellorAppointments() {
  const { data, loading, error, refetch } = useApi<{ appointments: Appointment[] }>('/api/appointments');
  const [busyId, setBusyId] = useState<string | null>(null);

  const setStatus = async (id: string, status: string) => {
    setBusyId(id);
    try {
      await apiJson('/api/appointments', 'PATCH', { id, status });
      refetch();
    } finally {
      setBusyId(null);
    }
  };

  const all = data?.appointments ?? [];
  const now = Date.now();
  const upcoming = all.filter((a) => new Date(a.scheduledAt).getTime() >= now && a.status === 'SCHEDULED');
  const past = all.filter((a) => new Date(a.scheduledAt).getTime() < now || a.status !== 'SCHEDULED');

  if (loading) return <CardSkeleton rows={4} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const Row = ({ a }: { a: Appointment }) => {
    const Icon = MODE_ICON[a.mode] ?? Phone;
    return (
      <li className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-royal-50 text-royal-600">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-navy">{formatDateTime(a.scheduledAt)}</p>
            <p className="text-xs text-slate-500">
              {a.durationMin} min · {a.mode.replace('_', ' ').toLowerCase()} ·{' '}
              {a.family?.familyCode ?? 'no family'}
              {a.family?.district ? ` · ${a.family.district}` : ''}
            </p>
            {a.case ? (
              <Link href={`/counsellor/cases/${a.case.id}`} className="mt-1 block truncate text-xs font-semibold text-royal-600 hover:underline">
                {a.case.subject}
              </Link>
            ) : null}
            {a.notes ? <p className="mt-1 text-xs text-slate-500">{a.notes}</p> : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={a.status} />
          {(NEXT_STATUS[a.status] ?? []).map((s) => (
            <button
              key={s}
              type="button"
              disabled={busyId === a.id}
              onClick={() => setStatus(a.id, s)}
              className={cn('btn-secondary px-3 py-1.5 text-xs')}
            >
              {s.replace(/_/g, ' ').toLowerCase()}
            </button>
          ))}
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-navy">
          <CalendarClock className="h-4 w-4 text-navy" /> Upcoming ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <EmptyState title="Nothing scheduled" description="Families can request a session from their support case." />
        ) : (
          <ul className="space-y-3">
            {upcoming.map((a) => (
              <Row key={a.id} a={a} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-navy">Past &amp; closed ({past.length})</h2>
        {past.length === 0 ? (
          <p className="text-xs text-slate-500">No past appointments yet.</p>
        ) : (
          <ul className="space-y-3">
            {past.map((a) => (
              <Row key={a.id} a={a} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

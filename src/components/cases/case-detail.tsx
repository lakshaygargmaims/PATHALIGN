'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldQuestion } from 'lucide-react';
import { useApi } from '@/lib/hooks';
import { CardSkeleton, ErrorState } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/badges';
import { formatDateTime } from '@/lib/utils';

interface CaseDetail {
  id: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  source: string;
  summaryShared: boolean;
  createdAt: string;
  resolvedAt: string | null;
  owner: { fullName: string; role: string };
  family: { familyCode: string } | null;
  counsellor: { user: { fullName: string } } | null;
  notes: Array<{ id: string; note: string; createdAt: string; author: { fullName: string } | null }>;
  appointments: Array<{ id: string; scheduledAt: string; mode: string; status: string }>;
}

interface CaseResponse {
  case: CaseDetail;
  conversation: { id: string; messages: Array<{ id: string; role: string; content: string; createdAt: string }> } | null;
}

export function CaseDetailView({ id, basePath }: { id: string; basePath: string }) {
  const { data, loading, error, refetch } = useApi<CaseResponse>(`/api/cases/${id}`, [id]);

  if (loading) return <CardSkeleton rows={5} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data?.case) return <ErrorState message="Case not found" onRetry={refetch} />;

  const record = data.case;

  return (
    <div className="space-y-5">
      <Link href={`${basePath}/cases`} className="inline-flex items-center gap-1 text-sm font-semibold text-royal-600 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to cases
      </Link>

      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-navy">{record.subject}</h2>
            <p className="mt-1 text-xs capitalize text-slate-500">
              {record.category.replace(/_/g, ' ').toLowerCase()} · raised {formatDateTime(record.createdAt)}
            </p>
          </div>
          <StatusBadge status={record.status} />
        </div>
        <p className="mt-4 whitespace-pre-line text-sm text-slate-700">{record.description}</p>
        <p className="mt-4 text-xs text-slate-500">
          Counsellor: <span className="font-semibold text-navy">{record.counsellor?.user.fullName ?? 'being assigned'}</span>
        </p>
      </section>

      {record.appointments.length > 0 ? (
        <section className="card p-5">
          <h3 className="text-sm font-semibold text-navy">Appointments</h3>
          <ul className="mt-3 space-y-2">
            {record.appointments.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-lg bg-surface p-3 text-xs">
                <span className="text-navy">
                  {formatDateTime(a.scheduledAt)} · {a.mode.replace('_', ' ').toLowerCase()}
                </span>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="card p-5">
        <h3 className="text-sm font-semibold text-navy">Counsellor notes ({record.notes.length})</h3>
        {record.notes.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">No notes shared yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {record.notes.map((n) => (
              <li key={n.id} className="rounded-lg bg-surface p-3">
                <p className="text-xs text-slate-700">{n.note}</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {n.author?.fullName ?? 'Counsellor'} · {formatDateTime(n.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <h3 className="text-sm font-semibold text-navy">Shared AI conversation</h3>
        {data.conversation ? (
          <ul className="mt-3 space-y-3">
            {data.conversation.messages.map((m) => (
              <li key={m.id} className={`rounded-lg p-3 text-xs ${m.role === 'USER' ? 'ml-6 bg-royal-50' : 'mr-6 bg-surface'}`}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {m.role === 'USER' ? 'You' : 'AI counsellor'}
                </p>
                <p className="mt-1 whitespace-pre-line text-slate-700">{m.content}</p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3 rounded-lg bg-surface p-4 text-xs text-slate-600">
            <ShieldQuestion className="mb-2 h-4 w-4 text-slate-400" />
            Your conversation was not shared with the counsellor. Your privacy settings decide this — you can change it
            from your profile at any time.
          </div>
        )}
      </section>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { apiJson, useApi } from '@/lib/hooks';
import { CardSkeleton, ErrorState } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/badges';
import { formatDateTime, relativeTime } from '@/lib/utils';

interface Note {
  id: string;
  note: string;
  createdAt: string;
  author: { fullName: string } | null;
}

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  concernCategory?: string | null;
}

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
  owner: { fullName: string; role: string; email: string | null; mobile: string | null };
  family: { familyCode: string; district: string | null; state: string | null } | null;
  counsellor: { id: string; user: { fullName: string } } | null;
  notes: Note[];
  appointments: Array<{ id: string; scheduledAt: string; mode: string; status: string }>;
}

interface CaseResponse {
  case: CaseDetail;
  conversation: { id: string; messages: ChatMessage[] } | null;
}

const STATUS_FLOW = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export default function CounsellorCaseDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { data, loading, error, refetch } = useApi<CaseResponse>(id ? `/api/cases/${id}` : null, [id]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const update = async (payload: Record<string, unknown>) => {
    if (!id) return;
    setBusy(true);
    setActionError(null);
    try {
      await apiJson(`/api/cases/${id}`, 'PATCH', payload);
      setNote('');
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update the case');
    } finally {
      setBusy(false);
    }
  };

  if (!id) notFound();
  if (loading) return <CardSkeleton rows={6} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data?.case) return <ErrorState message="Case not found" onRetry={refetch} />;

  const record = data.case;

  return (
    <div className="space-y-5">
      <Link href="/counsellor/cases" className="inline-flex items-center gap-1 text-sm font-semibold text-royal-600 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to cases
      </Link>

      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-navy">{record.subject}</h2>
            <p className="mt-1 text-xs capitalize text-slate-500">
              {record.category.replace(/_/g, ' ').toLowerCase()} · raised {relativeTime(record.createdAt)} via{' '}
              {record.source.replace(/_/g, ' ').toLowerCase()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={record.status} />
            <span className="badge bg-surface text-slate-600">{record.priority}</span>
          </div>
        </div>

        <p className="mt-4 whitespace-pre-line text-sm text-slate-700">{record.description}</p>

        <dl className="mt-5 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-slate-400">Raised by</dt>
            <dd className="text-sm font-medium text-navy">{record.owner.fullName}</dd>
            <dd className="text-xs text-slate-500">
              {record.owner.email}
              {record.owner.mobile ? ` · ${record.owner.mobile}` : ''}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Family</dt>
            <dd className="text-sm font-medium text-navy">{record.family?.familyCode ?? '—'}</dd>
            <dd className="text-xs text-slate-500">
              {[record.family?.district, record.family?.state].filter(Boolean).join(', ') || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Assigned counsellor</dt>
            <dd className="text-sm font-medium text-navy">{record.counsellor?.user.fullName ?? 'Unassigned'}</dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h3 className="text-sm font-semibold text-navy">Move this case forward</h3>
          <p className="mt-1 text-xs text-slate-500">
            Status changes notify the family and are written to the audit log.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {STATUS_FLOW.filter((s) => s !== record.status).map((s) => (
              <button
                key={s}
                type="button"
                disabled={busy}
                onClick={() => update({ status: s })}
                className="btn-secondary px-3 py-1.5 text-xs"
              >
                Mark {s.replace(/_/g, ' ').toLowerCase()}
              </button>
            ))}
          </div>

          {!record.counsellor ? (
            <button type="button" disabled={busy} onClick={() => update({ assignToMe: true })} className="btn-primary mt-3 text-xs">
              Assign this case to me
            </button>
          ) : null}

          <form
            className="mt-5 border-t border-slate-100 pt-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (note.trim()) update({ note });
            }}
          >
            <label htmlFor="case-note" className="text-xs font-semibold text-navy">
              Add a counselling note
            </label>
            <textarea
              id="case-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={2000}
              className="input mt-2 w-full"
              placeholder="What was discussed, what evidence was shared, and what the family agreed to try next."
            />
            <button type="submit" disabled={busy || note.trim().length === 0} className="btn-primary mt-2 text-xs">
              Save note
            </button>
          </form>

          {actionError ? <p className="mt-2 text-xs text-red-600">{actionError}</p> : null}

          <div className="mt-5 border-t border-slate-100 pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes ({record.notes.length})</h4>
            {record.notes.length === 0 ? (
              <p className="mt-2 text-xs text-slate-400">No notes recorded yet.</p>
            ) : (
              <ul className="mt-2 space-y-3">
                {record.notes.map((n) => (
                  <li key={n.id} className="rounded-lg bg-surface p-3">
                    <p className="text-xs text-slate-700">{n.note}</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {n.author?.fullName ?? 'System'} · {formatDateTime(n.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {record.appointments.length > 0 ? (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Appointments</h4>
              <ul className="mt-2 space-y-2">
                {record.appointments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between rounded-lg bg-surface p-3 text-xs">
                    <span className="text-navy">{formatDateTime(a.scheduledAt)} · {a.mode}</span>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="card p-5">
          <h3 className="text-sm font-semibold text-navy">Shared AI conversation</h3>
          {data.conversation ? (
            <>
              <p className="mt-1 text-xs text-slate-500">
                The family explicitly consented to share this thread when they escalated the case.
              </p>
              <ul className="mt-4 max-h-[32rem] space-y-3 overflow-y-auto pr-1">
                {data.conversation.messages.map((m) => (
                  <li
                    key={m.id}
                    className={`rounded-lg p-3 text-xs ${m.role === 'USER' ? 'ml-6 bg-royal-50' : 'mr-6 bg-surface'}`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {m.role === 'USER' ? 'Family member' : 'AI counsellor'}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-slate-700">{m.content}</p>
                    {m.concernCategory ? (
                      <p className="mt-1 text-[11px] capitalize text-slate-400">
                        Flagged: {m.concernCategory.replace(/_/g, ' ').toLowerCase()}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
              <ShieldAlert className="mb-2 h-4 w-4" />
              No conversation was shared with this case. That is the family’s choice — do not ask the family for chat
              history as a condition of help. The description above is all you have.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

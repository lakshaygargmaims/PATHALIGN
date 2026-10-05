'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessagesSquare, Plus } from 'lucide-react';
import { apiJson, useApi } from '@/lib/hooks';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/badges';
import { formatDateTime } from '@/lib/utils';

interface Session {
  id: string;
  title: string;
  kind: string;
  status: string;
  scheduledAt: string | null;
  durationMin: number;
  summary: string | null;
  notes: string | null;
  caseId: string | null;
  createdAt: string;
  family: { id: string; familyCode: string; district: string | null } | null;
}

export default function CounsellorSessions() {
  const { data, loading, error, refetch } = useApi<{ sessions: Session[] }>('/api/counsellor?view=sessions');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ familyId: '', title: '', summary: '', durationMin: '30' });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      await apiJson('/api/counsellor', 'POST', {
        familyId: form.familyId,
        title: form.title,
        summary: form.summary || undefined,
        durationMin: Number(form.durationMin) || 30,
      });
      setForm({ familyId: '', title: '', summary: '', durationMin: '30' });
      setOpen(false);
      refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save the session');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-navy">
              <MessagesSquare className="h-5 w-5 text-royal-600" /> Counselling sessions
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Every session is logged so the family report can show what actually happened.
            </p>
          </div>
          <button type="button" onClick={() => setOpen((v) => !v)} className="btn-primary text-xs">
            <Plus className="h-4 w-4" /> Record a session
          </button>
        </div>

        {open ? (
          <form onSubmit={submit} className="mt-5 space-y-3 border-t border-slate-100 pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="sess-family" className="text-xs font-semibold text-navy">
                  Family code
                </label>
                <input
                  id="sess-family"
                  required
                  value={form.familyId}
                  onChange={(e) => setForm({ ...form, familyId: e.target.value })}
                  className="input mt-1 w-full"
                  placeholder="Family id or code"
                />
              </div>
              <div>
                <label htmlFor="sess-duration" className="text-xs font-semibold text-navy">
                  Duration (minutes)
                </label>
                <input
                  id="sess-duration"
                  type="number"
                  min={1}
                  max={480}
                  value={form.durationMin}
                  onChange={(e) => setForm({ ...form, durationMin: e.target.value })}
                  className="input mt-1 w-full"
                />
              </div>
            </div>
            <div>
              <label htmlFor="sess-title" className="text-xs font-semibold text-navy">
                Title
              </label>
              <input
                id="sess-title"
                required
                minLength={3}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input mt-1 w-full"
                placeholder="e.g. Joint session on salary expectations"
              />
            </div>
            <div>
              <label htmlFor="sess-summary" className="text-xs font-semibold text-navy">
                Summary
              </label>
              <textarea
                id="sess-summary"
                rows={3}
                maxLength={2000}
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                className="input mt-1 w-full"
                placeholder="Concerns discussed, evidence shared, agreed next steps."
              />
            </div>
            {formError ? <p className="text-xs text-red-600">{formError}</p> : null}
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="btn-primary text-xs">
                {busy ? 'Saving…' : 'Save session'}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="btn-secondary text-xs">
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </section>

      {loading ? (
        <CardSkeleton rows={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data?.sessions.length === 0 ? (
        <EmptyState title="No sessions recorded" description="Record your first session to build a family counselling history." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Session</th>
                <th className="px-4 py-3">Family</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data!.sessions.map((s) => (
                <tr key={s.id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-navy">{s.title}</p>
                    <p className="mt-0.5 text-xs capitalize text-slate-500">{s.kind.replace(/_/g, ' ').toLowerCase()}</p>
                    {s.summary ? <p className="mt-1 line-clamp-2 max-w-md text-xs text-slate-600">{s.summary}</p> : null}
                    {s.caseId ? (
                      <Link href={`/counsellor/cases/${s.caseId}`} className="mt-1 inline-block text-xs font-semibold text-royal-600 hover:underline">
                        Related case →
                      </Link>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{s.family?.familyCode ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {formatDateTime(s.scheduledAt ?? s.createdAt)}
                    <p className="text-slate-400">{s.durationMin} min</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

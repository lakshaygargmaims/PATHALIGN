'use client';

import { useState } from 'react';
import { UserCog, Plus } from 'lucide-react';
import { apiJson, useApi } from '@/lib/hooks';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/states';

interface CounsellorRow {
  id: string;
  userId: string;
  name: string;
  email: string;
  isActive: boolean;
  designation: string | null;
  specialities: string[];
  states: string[];
  maxActiveCases: number;
  openCases: number;
  appointments: number;
}

export default function AdminCounsellors() {
  const { data, loading, error, refetch } = useApi<{ counsellors: CounsellorRow[] }>('/api/admin/counsellors');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('Vocational Counsellor');
  const [states, setStates] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    setNotice(null);
    try {
      await apiJson('/api/admin/counsellors', 'POST', {
        email: email.trim().toLowerCase(),
        designation,
        states: states
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setNotice(`Counsellor profile created for ${email.trim().toLowerCase()}.`);
      setEmail('');
      setStates('');
      refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create the counsellor');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-semibold text-navy">
          <UserCog className="h-5 w-5 text-royal-600" /> Counsellor management
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Cases are auto-assigned to the counsellor with the lowest load relative to their capacity.
        </p>

        <form onSubmit={create} className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label htmlFor="c-email" className="text-xs font-semibold text-navy">
              Existing account email
            </label>
            <input
              id="c-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input mt-1 w-full"
              placeholder="counsellor@example.com"
            />
          </div>
          <div>
            <label htmlFor="c-designation" className="text-xs font-semibold text-navy">
              Designation
            </label>
            <input
              id="c-designation"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="input mt-1 w-full"
            />
          </div>
          <div>
            <label htmlFor="c-states" className="text-xs font-semibold text-navy">
              States (comma separated)
            </label>
            <input
              id="c-states"
              value={states}
              onChange={(e) => setStates(e.target.value)}
              className="input mt-1 w-full"
              placeholder="Maharashtra, Karnataka"
            />
          </div>
          <div className="sm:col-span-4">
            {formError ? <p className="mb-2 text-xs text-red-600">{formError}</p> : null}
            {notice ? <p className="mb-2 text-xs text-teal-700">{notice}</p> : null}
            <button type="submit" disabled={busy} className="btn-primary text-xs">
              <Plus className="h-3 w-3" /> {busy ? 'Creating…' : 'Create counsellor profile'}
            </button>
          </div>
        </form>
      </section>

      {loading ? (
        <CardSkeleton rows={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data?.counsellors.length === 0 ? (
        <EmptyState title="No counsellors yet" description="Create a profile above for someone who has already registered." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Counsellor</th>
                <th className="px-4 py-3">Specialities</th>
                <th className="px-4 py-3">States</th>
                <th className="px-4 py-3">Load</th>
                <th className="px-4 py-3">Appointments</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data!.counsellors.map((c) => {
                const load = c.maxActiveCases > 0 ? Math.round((c.openCases / c.maxActiveCases) * 100) : 0;
                return (
                  <tr key={c.id} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-navy">{c.name}</p>
                      <p className="text-xs text-slate-500">{c.email}</p>
                      {c.designation ? <p className="text-[11px] text-slate-400">{c.designation}</p> : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.specialities.length === 0 ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : (
                          c.specialities.map((s) => (
                            <span key={s} className="badge bg-royal-100 text-royal-800">
                              {s.replace(/_/g, ' ').toLowerCase()}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{c.states.join(', ') || '—'}</td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-navy">
                        {c.openCases}/{c.maxActiveCases}
                      </p>
                      <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-1.5 rounded-full ${load >= 90 ? 'bg-red-500' : load >= 60 ? 'bg-amber-500' : 'bg-teal-500'}`}
                          style={{ width: `${Math.min(100, load)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{c.appointments}</td>
                    <td className="px-4 py-3">
                      <span className={c.isActive ? 'badge bg-teal-100 text-teal-800' : 'badge bg-slate-200 text-slate-600'}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

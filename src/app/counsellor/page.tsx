'use client';

import Link from 'next/link';
import { AlertOctagon, CalendarClock, Briefcase, MessagesSquare, ArrowRight, Inbox } from 'lucide-react';
import { useApi } from '@/lib/hooks';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/badges';
import { formatDateTime, relativeTime } from '@/lib/utils';

interface CaseRow {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  owner: { fullName: string; role: string } | null;
  family: { familyCode: string; district: string | null } | null;
  _count?: { notes: number };
}

interface AppointmentRow {
  id: string;
  scheduledAt: string;
  durationMin: number;
  mode: string;
  status: string;
  family: { familyCode: string } | null;
}

interface Overview {
  profile: { fullName: string | null; specializations: string[]; maxActiveCases: number } | null;
  myCases: CaseRow[];
  pendingCases: number;
  appointments: AppointmentRow[];
  openConcerns: number;
  escalated: number;
  queue: CaseRow[];
}

const PRIORITY_ORDER = ['URGENT', 'HIGH', 'NORMAL', 'LOW'] as const;

function priorityClass(priority: string) {
  if (priority === 'URGENT') return 'bg-red-100 text-red-800';
  if (priority === 'HIGH') return 'bg-orange-100 text-orange-800';
  if (priority === 'NORMAL') return 'bg-royal-100 text-royal-800';
  return 'bg-slate-100 text-slate-600';
}

export default function CounsellorDashboard() {
  const { data, loading, error, refetch } = useApi<Overview>('/api/counsellor');

  if (loading) return <CardSkeleton rows={5} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const openCases = (data?.myCases ?? []).filter((c) => !['RESOLVED', 'CLOSED'].includes(c.status));
  const urgent = openCases.filter((c) => c.priority === 'URGENT' || c.priority === 'HIGH');
  const capacity = data?.profile?.maxActiveCases ?? 0;
  const loadPct = capacity > 0 ? Math.min(100, (openCases.length / capacity) * 100) : 0;
  const upcoming = (data?.appointments ?? [])
    .filter((a) => new Date(a.scheduledAt).getTime() >= Date.now() && a.status === 'SCHEDULED')
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="card bg-navy p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">
              {data?.profile?.fullName ?? 'Counsellor'} workspace
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              {data?.profile?.specializations?.length
                ? `Specialisations: ${data.profile.specializations.join(', ')}`
                : 'Review assigned cases, resolve objections, and record counselling sessions.'}
            </p>
          </div>
          <Link href="/counsellor/queue" className="btn-secondary">
            Unassigned queue ({data?.queue.length ?? 0})
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          {[
            { label: 'Open cases', value: openCases.length },
            { label: 'Awaiting you', value: data?.pendingCases ?? 0 },
            { label: 'High / urgent', value: urgent.length },
            { label: 'Open concerns', value: data?.openConcerns ?? 0 },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-white/5 px-4 py-3">
              <p className="text-xs text-slate-300">{s.label}</p>
              <p className="mt-1 text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {capacity > 0 ? (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Caseload</span>
              <span>
                {openCases.length}/{capacity} active
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className={`h-2 rounded-full ${loadPct >= 90 ? 'bg-red-400' : loadPct >= 60 ? 'bg-amber-400' : 'bg-teal-400'}`}
                style={{ width: `${loadPct}%` }}
              />
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-royal-600" />
            <h3 className="text-sm font-semibold text-navy">Upcoming appointments</h3>
          </div>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">No sessions scheduled ahead.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {upcoming.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface p-3 text-xs">
                  <div>
                    <p className="font-semibold text-navy">{formatDateTime(a.scheduledAt)}</p>
                    <p className="text-slate-500">
                      {a.mode} · {a.durationMin} min · {a.family?.familyCode ?? 'family'}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
          <Link href="/counsellor/appointments" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-royal-600 hover:underline">
            All appointments <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-teal-600" />
            <h3 className="text-sm font-semibold text-navy">Unassigned queue</h3>
          </div>
          {data?.queue.length ? (
            <>
              <ul className="mt-3 space-y-2">
                {data.queue.slice(0, 4).map((c) => (
                  <li key={c.id} className="rounded-lg bg-surface p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold text-navy">{c.subject}</p>
                      <span className={`badge shrink-0 ${priorityClass(c.priority)}`}>{c.priority}</span>
                    </div>
                    <p className="mt-1 text-slate-500">
                      {c.owner?.fullName ?? 'Unknown'} · {relativeTime(c.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
              <Link href="/counsellor/queue" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-royal-600 hover:underline">
                Open queue <ArrowRight className="h-3 w-3" />
              </Link>
            </>
          ) : (
            <p className="mt-3 text-xs text-slate-500">Nothing waiting — every case has an owner.</p>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold text-navy">
            <Briefcase className="h-4 w-4 text-navy" /> My assigned cases
          </h3>
          <Link href="/counsellor/cases" className="text-sm font-semibold text-royal-600 hover:underline">
            All cases →
          </Link>
        </div>
        {openCases.length === 0 ? (
          <EmptyState
            title="No active cases"
            description="Cases assigned to you will appear here. Pick one up from the unassigned queue to get started."
            action={
              <Link href="/counsellor/queue" className="btn-secondary">
                Open queue
              </Link>
            }
          />
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Case</th>
                  <th className="px-4 py-3">Family</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Raised</th>
                </tr>
              </thead>
              <tbody>
                {[...openCases]
                  .sort(
                    (a, b) =>
                      PRIORITY_ORDER.indexOf(a.priority as never) - PRIORITY_ORDER.indexOf(b.priority as never),
                  )
                  .map((c) => (
                    <tr key={c.id} className="border-t border-slate-100 hover:bg-surface">
                      <td className="px-4 py-3">
                        <Link href={`/counsellor/cases/${c.id}`} className="font-semibold text-navy hover:text-royal-600">
                          {c.subject}
                        </Link>
                        <p className="text-xs text-slate-500">{c.category.replace(/_/g, ' ').toLowerCase()}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {c.family?.familyCode ?? '—'}
                        {c.family?.district ? ` · ${c.family.district}` : ''}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${priorityClass(c.priority)}`}>{c.priority}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{relativeTime(c.createdAt)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card flex items-center gap-4 p-5">
        <MessagesSquare className="h-6 w-6 shrink-0 text-teal-600" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-navy">Record a counselling session</h4>
          <p className="text-xs text-slate-500">
            {data?.escalated ?? 0} case(s) system-wide currently in PENDING / ASSIGNED / IN_PROGRESS.
          </p>
        </div>
        <Link href="/counsellor/sessions" className="btn-secondary shrink-0">
          Sessions
        </Link>
        <Link href="/counsellor/cases" className="btn-primary shrink-0">
          <AlertOctagon className="h-4 w-4" /> Work queue
        </Link>
      </section>
    </div>
  );
}

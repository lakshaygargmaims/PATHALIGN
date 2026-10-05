'use client';

import Link from 'next/link';
import { UserCog } from 'lucide-react';
import { useApi } from '@/lib/hooks';
import { CardSkeleton, ErrorState } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/badges';
import { initials, formatDate } from '@/lib/utils';

interface Overview {
  profile: {
    id: string;
    fullName: string | null;
    specializations: string[];
    languages: string[];
    bio: string | null;
    maxActiveCases: number;
    isActive: boolean;
  } | null;
  myCases: Array<{ id: string; status: string; createdAt: string }>;
}

interface Me {
  user: { fullName: string; email: string; role: string; preferredLanguage: string };
}

export default function CounsellorProfile() {
  const { data, loading, error, refetch } = useApi<Overview>('/api/counsellor');
  const me = useApi<Me>('/api/auth/me');

  if (loading) return <CardSkeleton rows={4} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const profile = data?.profile;
  const cases = data?.myCases ?? [];
  const openCases = cases.filter((c) => !['RESOLVED', 'CLOSED'].includes(c.status));
  const resolved = cases.filter((c) => ['RESOLVED', 'CLOSED'].includes(c.status));

  if (!profile) {
    return (
      <div className="card p-6">
        <h2 className="flex items-center gap-2 font-semibold text-navy">
          <UserCog className="h-5 w-5 text-royal-600" /> No counsellor profile
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Your account has the counsellor role but no counsellor record yet. An administrator needs to create one from{' '}
          <Link href="/admin/counsellors" className="font-semibold text-royal-600 hover:underline">
            Counsellor Management
          </Link>{' '}
          before cases can be assigned to you.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="card flex flex-wrap items-center gap-5 p-6">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-royal-600 text-xl font-bold text-white">
          {initials(profile.fullName ?? me.data?.user.fullName ?? 'C')}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-navy">{profile.fullName ?? me.data?.user.fullName}</h2>
          <p className="text-xs text-slate-500">
            {me.data?.user.email} · active languages: {profile.languages?.join(', ') || '—'}
          </p>
          {profile.bio ? <p className="mt-2 max-w-2xl text-sm text-slate-600">{profile.bio}</p> : null}
        </div>
        <span className={profile.isActive ? 'badge bg-teal-100 text-teal-800' : 'badge bg-slate-200 text-slate-600'}>
          {profile.isActive ? 'Accepting cases' : 'Not accepting cases'}
        </span>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs text-slate-500">Active caseload</p>
          <p className="mt-1 text-2xl font-bold text-navy">
            {openCases.length}
            <span className="text-sm font-medium text-slate-400">/{profile.maxActiveCases}</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">Slots are filled automatically, least-loaded first.</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-slate-500">Cases handled</p>
          <p className="mt-1 text-2xl font-bold text-navy">{cases.length}</p>
          <p className="mt-1 text-xs text-slate-400">{resolved.length} resolved or closed.</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-slate-500">Specialisations</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {profile.specializations.length === 0 ? (
              <span className="text-xs text-slate-400">Not set</span>
            ) : (
              profile.specializations.map((s) => (
                <span key={s} className="badge bg-royal-100 text-royal-800">
                  {s.replace(/_/g, ' ').toLowerCase()}
                </span>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="card overflow-x-auto">
        <h3 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-navy">Recent case activity</h3>
        {cases.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-slate-500">No cases yet.</p>
        ) : (
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Case</th>
                <th className="px-4 py-3">Opened</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {cases.slice(0, 20).map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <Link href={`/counsellor/cases/${c.id}`} className="text-sm font-semibold text-navy hover:text-royal-600">
                      Open case
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

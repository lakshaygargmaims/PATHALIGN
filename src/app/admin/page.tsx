'use client';

import Link from 'next/link';
import { Users, AlertOctagon, Briefcase, FileText, MessageSquareText, ArrowRight, LibraryBig } from 'lucide-react';
import { useApi } from '@/lib/hooks';
import { CardSkeleton, ErrorState } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/badges';
import { formatDateTime } from '@/lib/utils';

interface Overview {
  totalStudents: number;
  totalParents: number;
  totalCounsellors: number;
  totalAdmins: number;
  totalFamilies: number;
  counsellingSessions: number;
  unresolvedConcerns: number;
  openCases: number;
  escalations: number;
  reportsGenerated: number;
  conversationsStarted: number;
  consentedProfiles: number;
}

interface ConcernRow {
  category: string;
  label: string;
  open: number;
  total: number;
  share: number;
}

interface StatsResponse {
  overview: Overview;
  concerns: ConcernRow[];
  caseStatus: Array<{ status: string; count: number }>;
  popularTrades: Array<{ name: string; count: number }>;
  generatedAt: string;
  demoDataNotice: string;
}

export default function AdminDashboard() {
  const { data, loading, error, refetch } = useApi<StatsResponse>('/api/admin/stats');

  if (loading) return <CardSkeleton rows={5} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const o = data?.overview;
  const tiles = [
    { label: 'Students', value: o?.totalStudents ?? 0, icon: Users },
    { label: 'Parents', value: o?.totalParents ?? 0, icon: Users },
    { label: 'Families', value: o?.totalFamilies ?? 0, icon: Users },
    { label: 'Counsellors', value: o?.totalCounsellors ?? 0, icon: Briefcase },
    { label: 'Open cases', value: o?.openCases ?? 0, icon: Briefcase },
    { label: 'Unresolved concerns', value: o?.unresolvedConcerns ?? 0, icon: AlertOctagon },
    { label: 'AI escalations', value: o?.escalations ?? 0, icon: MessageSquareText },
    { label: 'Reports generated', value: o?.reportsGenerated ?? 0, icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <section className="card bg-navy p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Platform overview</h2>
            <p className="mt-1 text-sm text-slate-300">
              Every figure below is a live database aggregate — no hardcoded dashboard numbers.
            </p>
          </div>
          <p className="text-xs text-slate-400">Generated {formatDateTime(data?.generatedAt)}</p>
        </div>
        <p className="mt-4 rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-300">{data?.demoDataNotice}</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="card p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">{t.label}</p>
              <t.icon className="h-4 w-4 text-slate-300" />
            </div>
            <p className="mt-1 text-2xl font-bold text-navy">{t.value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h3 className="text-sm font-semibold text-navy">Parent resistance by category</h3>
          <p className="mt-1 text-xs text-slate-500">Where families are pushing back most often.</p>
          {data?.concerns.length === 0 ? (
            <p className="mt-4 text-xs text-slate-500">No concerns recorded yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data!.concerns.map((c) => (
                <li key={c.category}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-navy">{c.label}</span>
                    <span className="text-slate-500">
                      {c.total} ({c.share}%)
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-royal-500" style={{ width: `${c.share}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/analytics" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-royal-600 hover:underline">
            Full resistance analytics <ArrowRight className="h-3 w-3" />
          </Link>
        </section>

        <section className="card p-5">
          <h3 className="text-sm font-semibold text-navy">Case pipeline</h3>
          <p className="mt-1 text-xs text-slate-500">Human-counsellor escalations by status.</p>
          {data?.caseStatus.length === 0 ? (
            <p className="mt-4 text-xs text-slate-500">No cases recorded yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {data!.caseStatus.map((c) => (
                <li key={c.status} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
                  <StatusBadge status={c.status} />
                  <span className="text-sm font-bold text-navy">{c.count}</span>
                </li>
              ))}
            </ul>
          )}

          <h3 className="mt-6 text-sm font-semibold text-navy">Most explored trades</h3>
          {data?.popularTrades.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">No interest or recommendation activity yet.</p>
          ) : (
            <ol className="mt-3 space-y-2">
              {data!.popularTrades.map((t, i) => (
                <li key={t.name} className="flex items-center justify-between text-xs">
                  <span className="text-navy">
                    <span className="mr-2 font-bold text-slate-400">{i + 1}.</span>
                    {t.name}
                  </span>
                  <span className="text-slate-500">{t.count}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/users" className="card card-hover p-5">
          <Users className="h-5 w-5 text-royal-600" />
          <h4 className="mt-3 text-sm font-semibold text-navy">User Management</h4>
          <p className="mt-1 text-xs text-slate-500">Search, filter by role, and review account status.</p>
        </Link>
        <Link href="/admin/careers" className="card card-hover p-5">
          <LibraryBig className="h-5 w-5 text-teal-600" />
          <h4 className="mt-3 text-sm font-semibold text-navy">Career Database</h4>
          <p className="mt-1 text-xs text-slate-500">Trades with verification status and linked sources.</p>
        </Link>
        <Link href="/admin/data" className="card card-hover p-5">
          <FileText className="h-5 w-5 text-slate-600" />
          <h4 className="mt-3 text-sm font-semibold text-navy">Data &amp; Verification</h4>
          <p className="mt-1 text-xs text-slate-500">CSV imports, data sources, and exports.</p>
        </Link>
      </section>
    </div>
  );
}

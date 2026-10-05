'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Clock3, IndianRupee, GraduationCap, Users, Loader2 } from 'lucide-react';
import { useApi, useDebounced } from '@/lib/hooks';
import { VerificationBadge } from '@/components/ui/badges';
import { CardSkeleton, EmptyState } from '@/components/ui/states';
import { formatINR } from '@/lib/utils';

interface Trade {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  durationMonths: number;
  nsqfLevel: number | null;
  feeMax: number | null;
  verificationStatus: string;
  isSynthetic: boolean;
  salaryStats: Array<{ monthlyMin: number; monthlyMax: number }> | [];
  _count: { courses: number };
}

interface ListResponse {
  trades: Trade[];
  total: number;
  categories: Array<{ name: string; count: number }>;
}

export function TradeExplorer({ basePath = '/student/careers' }: { basePath?: string }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const debounced = useDebounced(search, 400);
  const query = `/api/careers/trades?${new URLSearchParams({
    ...(debounced ? { search: debounced } : {}),
    ...(category ? { category } : {}),
  }).toString()}`;
  const { data, loading, error } = useApi<ListResponse>(query);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search trade, sector or skill…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search careers"
          />
          {loading ? <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-300" /> : null}
        </div>
        <select className="input sm:w-64" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category filter">
          <option value="">All categories</option>
          {(data?.categories ?? []).map((c) => (
            <option key={c.name} value={c.name}>
              {c.name} ({c.count})
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {(data?.trades ?? []).map((t) => {
          const entry = t.salaryStats[0];
          return (
            <Link key={t.id} href={`${basePath}/${t.slug}`} className="card card-hover flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-base font-semibold text-navy">{t.name}</h2>
                <VerificationBadge status={t.verificationStatus} isSynthetic={t.isSynthetic} />
              </div>
              <p className="mt-1 text-xs font-medium text-royal-600">{t.category}</p>
              <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-500">{t.description}</p>
              <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock3 className="h-3.5 w-3.5 text-slate-400" /> {t.durationMonths} mo
                </div>
                <div className="flex items-center gap-1">
                  <IndianRupee className="h-3.5 w-3.5 text-slate-400" /> {t.feeMax ? formatINR(t.feeMax) : '—'}
                </div>
                <div className="flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5 text-slate-400" /> L{t.nsqfLevel ?? '—'}
                </div>
              </dl>
              {entry ? (
                <p className="mt-2 text-xs text-teal-700">
                  Entry estimate: {formatINR(entry.monthlyMin)}–{formatINR(entry.monthlyMax)}/month
                </p>
              ) : null}
              <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                <Users className="h-3.5 w-3.5" /> {t._count.courses} training centres recorded
              </p>
            </Link>
          );
        })}
      </div>

      {loading && (data?.trades.length ?? 0) === 0 ? <div className="mt-6"><CardSkeleton rows={3} /></div> : null}
      {!loading && (data?.trades.length ?? 0) === 0 ? (
        <div className="mt-6">
          <EmptyState title="No careers match this filter" description="Try a different keyword or clear the category filter." />
        </div>
      ) : null}
    </div>
  );
}

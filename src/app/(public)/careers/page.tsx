import Link from 'next/link';
import { Search, GraduationCap, IndianRupee, Clock3, ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/db';
import { VerificationBadge } from '@/components/ui/badges';
import { formatINR } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Explore Careers' };

export default async function PublicCareersPage({
  searchParams,
}: {
  searchParams: { search?: string; category?: string };
}) {
  const search = searchParams.search?.trim();
  const category = searchParams.category?.trim();

  const where = {
    status: 'ACTIVE',
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { category: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(category ? { category } : {}),
  };

  const [trades, categories] = await Promise.all([
    prisma.careerTrade.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 60,
      include: {
        salaryStats: { where: { experienceLevel: 'ENTRY' }, take: 1 },
        _count: { select: { courses: true } },
      },
    }),
    prisma.careerTrade.groupBy({ by: ['category'], _count: true, where: { status: 'ACTIVE' } }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">Explore career opportunities</h1>
        <p className="mt-2 text-sm text-slate-500">
          Browse the vocational trades in this deployment. Each record shows its verification status — records marked
          “Synthetic demo record” are placeholder data awaiting official import.
        </p>
      </div>

      <form className="mt-6 flex flex-col gap-3 sm:flex-row" action="/careers" method="get">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            name="search"
            defaultValue={search ?? ''}
            className="input pl-9"
            placeholder="Search trade, sector or skill…"
            aria-label="Search careers"
          />
        </div>
        <select name="category" defaultValue={category ?? ''} className="input sm:w-64" aria-label="Filter by category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.category} value={c.category}>
              {c.category} ({c._count})
            </option>
          ))}
        </select>
        <button type="submit" className="btn-primary">
          Filter
        </button>
      </form>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {trades.map((t) => {
          const entry = t.salaryStats[0];
          return (
            <Link key={t.id} href={`/careers/${t.slug}`} className="card card-hover flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-base font-semibold text-navy">{t.name}</h2>
                <VerificationBadge status={t.verificationStatus} isSynthetic={t.isSynthetic} />
              </div>
              <p className="mt-1 text-xs font-medium text-royal-600">{t.category}</p>
              <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-500">{t.description}</p>
              <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                  {t.durationMonths} mo
                </div>
                <div className="flex items-center gap-1">
                  <IndianRupee className="h-3.5 w-3.5 text-slate-400" />
                  {t.feeMax ? formatINR(t.feeMax) : '—'}
                </div>
                <div className="flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                  NSQF {t.nsqfLevel ?? '—'}
                </div>
              </dl>
              {entry ? (
                <p className="mt-2 text-xs text-teal-700">
                  Entry estimate: {formatINR(entry.monthlyMin)}–{formatINR(entry.monthlyMax)}/month
                </p>
              ) : null}
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-royal-600">
                View details <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          );
        })}
      </div>

      {trades.length === 0 ? (
        <div className="card mt-8 px-6 py-12 text-center text-sm text-slate-500">
          No careers match this filter. Try a different search term.
        </div>
      ) : null}
    </div>
  );
}

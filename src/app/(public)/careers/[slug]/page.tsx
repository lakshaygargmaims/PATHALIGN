import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock3, IndianRupee, GraduationCap, Users, TrendingUp, ArrowRight, BookOpen } from 'lucide-react';
import { prisma } from '@/lib/db';
import { VerificationBadge } from '@/components/ui/badges';
import { formatINR } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function PublicTradePage({ params }: { params: { slug: string } }) {
  const trade = await prisma.careerTrade.findUnique({
    where: { slug: params.slug },
    include: {
      qualification: true,
      source: { select: { name: true, url: true, publisher: true, verificationStatus: true, isSynthetic: true } },
      salaryStats: true,
      pathways: { include: { stages: { orderBy: { order: 'asc' } } }, take: 1 },
      _count: { select: { courses: true, opportunities: true } },
    },
  });
  if (!trade) notFound();

  const stages = trade.pathways[0]?.stages ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/careers" className="text-sm font-medium text-royal-600 hover:underline">
        ← Back to careers
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-royal-600">{trade.category}</p>
          <h1 className="mt-1 text-2xl font-bold text-navy sm:text-3xl">{trade.name}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <VerificationBadge status={trade.verificationStatus} isSynthetic={trade.isSynthetic} />
          {trade.source ? <span className="badge bg-slate-100 text-slate-600">{trade.source.name}</span> : null}
        </div>
      </div>

      <p className="mt-4 text-slate-600">{trade.description}</p>

      <dl className="mt-6 grid gap-4 sm:grid-cols-4">
        <div className="card p-4">
          <dt className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock3 className="h-3.5 w-3.5" /> Duration
          </dt>
          <dd className="mt-1 text-lg font-bold text-navy">{trade.durationMonths} months</dd>
        </div>
        <div className="card p-4">
          <dt className="flex items-center gap-1.5 text-xs text-slate-500">
            <IndianRupee className="h-3.5 w-3.5" /> Fee range (recorded)
          </dt>
          <dd className="mt-1 text-lg font-bold text-navy">
            {trade.feeMin && trade.feeMax ? `${formatINR(trade.feeMin)} – ${formatINR(trade.feeMax)}` : 'Not recorded'}
          </dd>
        </div>
        <div className="card p-4">
          <dt className="flex items-center gap-1.5 text-xs text-slate-500">
            <GraduationCap className="h-3.5 w-3.5" /> Qualification
          </dt>
          <dd className="mt-1 text-sm font-bold text-navy">
            {trade.qualification?.title ?? 'Not recorded'}
            {trade.nsqfLevel ? ` · NSQF L${trade.nsqfLevel}` : ''}
          </dd>
        </div>
        <div className="card p-4">
          <dt className="flex items-center gap-1.5 text-xs text-slate-500">
            <Users className="h-3.5 w-3.5" /> Training centres
          </dt>
          <dd className="mt-1 text-lg font-bold text-navy">{trade._count.courses}</dd>
        </div>
      </dl>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
          <TrendingUp className="h-5 w-5 text-teal-600" /> Recorded earning ranges
        </h2>
        <div className="card mt-3 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Experience level</th>
                <th className="px-4 py-3">Monthly range</th>
                <th className="px-4 py-3">Record status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trade.salaryStats.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium text-navy">{s.experienceLevel}</td>
                  <td className="px-4 py-3">
                    {formatINR(s.monthlyMin)} – {formatINR(s.monthlyMax)}
                    {s.isEstimate ? <span className="ml-2 text-xs text-amber-600">(estimate)</span> : null}
                  </td>
                  <td className="px-4 py-3">
                    <VerificationBadge status={s.verificationStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Earning figures are estimates from the referenced records. They are not guarantees of future income.
        </p>
      </section>

      {stages.length > 0 ? (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
            <BookOpen className="h-5 w-5 text-royal-600" /> Career progression
          </h2>
          <ol className="mt-3 space-y-3">
            {stages.map((s) => (
              <li key={s.id} className="card flex gap-4 p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
                  {s.order}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-navy">{s.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{s.description}</p>
                  {s.salaryRange ? <p className="mt-1 text-xs text-teal-700">{s.salaryRange}</p> : null}
                  {s.furtherEducation ? <p className="mt-1 text-xs text-royal-700">Further study: {s.furtherEducation}</p> : null}
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-xs text-slate-500">
            Progression stages are not automatic — they depend on employer, performance and applicable qualification
            rules.
          </p>
        </section>
      ) : null}

      <div className="card mt-8 flex flex-col items-start gap-3 bg-navy p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">See how this fits your family</h2>
          <p className="mt-1 text-sm text-slate-300">
            Run a personalised scenario, compare with another trade, and let your parents weigh in.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/register" className="btn bg-teal-500 text-white hover:bg-teal-600">
            Start Family Counselling <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/login" className="btn border border-white/30 bg-white/10 text-white hover:bg-white/20">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}

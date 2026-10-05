'use client';

import Link from 'next/link';
import { Clock3, IndianRupee, GraduationCap, Users, TrendingUp, ArrowRight, BookOpen, ShieldAlert } from 'lucide-react';
import { useApi } from '@/lib/hooks';
import { VerificationBadge } from '@/components/ui/badges';
import { CardSkeleton, EmptyState } from '@/components/ui/states';
import { formatINR } from '@/lib/utils';

interface Detail {
  trade: {
    id: string;
    name: string;
    slug: string;
    category: string;
    description: string;
    durationMonths: number;
    nsqfLevel: number | null;
    feeMin: number | null;
    feeMax: number | null;
    eligibility: string | null;
    verificationStatus: string;
    isSynthetic: boolean;
    qualification: { title: string; nsqfLevel: number | null; progressionNote: string | null } | null;
    source: { name: string; url: string | null; publisher: string | null; verificationStatus: string; isSynthetic: boolean } | null;
    salaryStats: Array<{ id: string; experienceLevel: string; monthlyMin: number; monthlyMax: number; isEstimate: boolean; verificationStatus: string }>;
    pathways: Array<{ stages: Array<{ id: string; order: number; title: string; description: string; salaryRange: string | null; furtherEducation: string | null }> }>;
    courses: Array<{
      id: string;
      durationMonths: number;
      feeMin: number | null;
      feeMax: number | null;
      provider: { id: string; name: string; type: string; district: string; state: string; verificationStatus: string; isSynthetic: boolean };
    }>;
    _count: { opportunities: number };
  };
  related: Array<{ id: string; name: string; slug: string; durationMonths: number }>;
}

export function TradeDetail({ slug, basePath }: { slug: string; basePath: string }) {
  const { data, loading, error } = useApi<Detail>(`/api/careers/trades/${slug}`);

  if (loading) return <CardSkeleton rows={6} />;
  if (error || !data) return <EmptyState title="Trade not found" description={error ?? 'This record does not exist.'} />;

  const t = data.trade;
  const stages = t.pathways[0]?.stages ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-royal-600">{t.category}</p>
          <h1 className="mt-1 text-2xl font-bold text-navy sm:text-3xl">{t.name}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <VerificationBadge status={t.verificationStatus} isSynthetic={t.isSynthetic} />
          {t.source ? <span className="badge bg-slate-100 text-slate-600">Source: {t.source.name}</span> : null}
        </div>
      </div>

      <p className="text-slate-600">{t.description}</p>

      <dl className="grid gap-4 sm:grid-cols-4">
        <div className="card p-4">
          <dt className="flex items-center gap-1.5 text-xs text-slate-500"><Clock3 className="h-3.5 w-3.5" /> Duration</dt>
          <dd className="mt-1 text-lg font-bold text-navy">{t.durationMonths} months</dd>
        </div>
        <div className="card p-4">
          <dt className="flex items-center gap-1.5 text-xs text-slate-500"><IndianRupee className="h-3.5 w-3.5" /> Fee range</dt>
          <dd className="mt-1 text-lg font-bold text-navy">
            {t.feeMin && t.feeMax ? `${formatINR(t.feeMin)} – ${formatINR(t.feeMax)}` : 'Not recorded'}
          </dd>
        </div>
        <div className="card p-4">
          <dt className="flex items-center gap-1.5 text-xs text-slate-500"><GraduationCap className="h-3.5 w-3.5" /> Qualification</dt>
          <dd className="mt-1 text-sm font-bold text-navy">
            {t.qualification?.title ?? 'Not recorded'}
            {t.nsqfLevel ? ` · NSQF L${t.nsqfLevel}` : ''}
          </dd>
        </div>
        <div className="card p-4">
          <dt className="flex items-center gap-1.5 text-xs text-slate-500"><Users className="h-3.5 w-3.5" /> Centres / pathways</dt>
          <dd className="mt-1 text-lg font-bold text-navy">
            {t.courses.length} / {t._count.opportunities}
          </dd>
        </div>
      </dl>

      {t.eligibility ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <strong>Eligibility:</strong> {t.eligibility}
        </p>
      ) : null}

      <section>
        <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
          <TrendingUp className="h-5 w-5 text-teal-600" /> Recorded earning ranges
        </h2>
        <div className="card mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Monthly range</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {t.salaryStats.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium text-navy">{s.experienceLevel}</td>
                  <td className="px-4 py-3">
                    {formatINR(s.monthlyMin)} – {formatINR(s.monthlyMax)}
                    {s.isEstimate ? <span className="ml-2 text-xs text-amber-600">(estimate)</span> : null}
                  </td>
                  <td className="px-4 py-3"><VerificationBadge status={s.verificationStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500">Estimates from referenced records — not guarantees of future income.</p>
      </section>

      {stages.length > 0 ? (
        <section>
          <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
            <BookOpen className="h-5 w-5 text-royal-600" /> Career progression
          </h2>
          <ol className="mt-3 space-y-3">
            {stages.map((s) => (
              <li key={s.id} className="card flex gap-4 p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">{s.order}</span>
                <div>
                  <h3 className="text-sm font-semibold text-navy">{s.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{s.description}</p>
                  {s.salaryRange ? <p className="mt-1 text-xs text-teal-700">{s.salaryRange}</p> : null}
                  {s.furtherEducation ? <p className="mt-1 text-xs text-royal-700">Further study: {s.furtherEducation}</p> : null}
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
            Progression steps are not automatic — they depend on employer, performance and applicable qualification rules.
          </p>
        </section>
      ) : null}

      <section>
        <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
          <Users className="h-5 w-5 text-royal-600" /> Training centres recording this course
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {t.courses.map((c) => (
            <div key={c.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-navy">{c.provider.name}</h3>
                <VerificationBadge status={c.provider.verificationStatus} isSynthetic={c.provider.isSynthetic} />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {c.provider.type.replace(/_/g, ' ')} · {c.provider.district}, {c.provider.state}
              </p>
              <p className="mt-2 text-xs text-slate-600">
                {c.durationMonths} months
                {c.feeMax ? ` · ${formatINR(c.feeMin ?? 0)}–${formatINR(c.feeMax)}` : ''}
              </p>
            </div>
          ))}
          {t.courses.length === 0 ? <p className="text-sm text-slate-400">No provider records for this trade yet.</p> : null}
        </div>
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-4 bg-navy p-6 text-white">
        <div>
          <h2 className="font-semibold">Run a personalised scenario for this trade</h2>
          <p className="mt-1 text-sm text-slate-300">Adjust location, budget and experience — or compare with another trade.</p>
        </div>
        <div className="flex gap-3">
          <Link href={`/student/simulator?trade=${t.slug}`} className="btn bg-teal-500 text-white hover:bg-teal-600">
            Open simulator <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {data.related.length > 0 ? (
        <section>
          <h2 className="text-lg font-bold text-navy">Related trades</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            {data.related.map((r) => (
              <Link key={r.id} href={`${basePath}/${r.slug}`} className="card p-4 text-sm font-medium text-navy hover:border-royal-300">
                {r.name}
                <span className="mt-1 block text-xs text-slate-400">{r.durationMonths} months</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      <span className="hidden">{basePath}</span>
    </div>
  );
}

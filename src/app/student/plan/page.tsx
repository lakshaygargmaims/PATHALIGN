'use client';

import Link from 'next/link';
import { Route, ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { useApi } from '@/lib/hooks';
import { CardSkeleton, EmptyState, ErrorState, Progress } from '@/components/ui/states';
import { formatDate } from '@/lib/utils';

interface RecommendationList {
  recommendations: Array<{
    id: string;
    title: string;
    matchScore: number | null;
    rationale: string;
    pathway: string;
    evidence: Array<{ label: string; value: string }>;
    trade?: { slug: string; category: string; durationMonths: number } | null;
  }>;
}
interface ConsensusData {
  consensus: { id: string; status: string; aiSummary: string | null; common: string[] } | null;
}
interface Confidence {
  comparison: { latestScore: number | null; change: number | null } | null;
}

export default function StudentPlanPage() {
  const recs = useApi<RecommendationList>('/api/recommendations');
  const consensus = useApi<ConsensusData>('/api/consensus');
  const confidence = useApi<Confidence>('/api/confidence');

  if (recs.loading) return <CardSkeleton rows={5} />;
  if (recs.error) return <ErrorState message={recs.error} onRetry={recs.refetch} />;

  const steps = [
    {
      label: 'Complete the career assessment',
      done: false,
      href: '/student/assessment',
      note: 'Unlocks scored recommendations.',
    },
    {
      label: 'Save your picks in Family Consensus',
      done: Boolean(consensus.data?.consensus && consensus.data.consensus.status !== 'OPEN'),
      href: '/student/consensus',
      note: 'Compare against what your parent chose.',
    },
    {
      label: 'Take the confidence questionnaire',
      done: confidence.data?.comparison?.latestScore != null,
      href: '/student/confidence',
      note: 'Measure change after counselling.',
    },
    {
      label: 'Explore trades and providers near you',
      done: false,
      href: '/student/careers',
      note: 'Check fees, duration and verification status.',
    },
    {
      label: 'Generate the family report',
      done: false,
      href: '/student/reports',
      note: 'One PDF for the whole family to review.',
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <h2 className="flex items-center gap-2 font-semibold text-navy">
          <Route className="h-5 w-5 text-royal-600" /> My career plan
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          A plan you and your family can work through together. Nothing here commits you to a trade.
        </p>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Steps completed</span>
            <span>
              {doneCount}/{steps.length}
            </span>
          </div>
          <div className="mt-2">
            <Progress value={(doneCount / steps.length) * 100} label="Plan progress" />
          </div>
        </div>
        <ol className="mt-4 space-y-2">
          {steps.map((s, i) => (
            <li key={s.label}>
              <Link
                href={s.href}
                className="flex items-start gap-3 rounded-lg bg-surface p-3 hover:bg-slate-100"
              >
                {s.done ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-navy">
                    {i + 1}. {s.label}
                  </p>
                  <p className="text-xs text-slate-500">{s.note}</p>
                </div>
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h3 className="mb-3 font-semibold text-navy">Recommended pathways</h3>
        {recs.data?.recommendations.length === 0 ? (
          <EmptyState
            title="No recommendations yet"
            description="Complete the career assessment or add interests on your profile, then generate recommendations."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {recs.data!.recommendations.map((r) => (
              <article key={r.id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{r.pathway}</p>
                    <h4 className="text-sm font-semibold text-navy">{r.title}</h4>
                  </div>
                  {r.matchScore != null ? <span className="badge bg-teal-100 text-teal-800">{r.matchScore}% match</span> : null}
                </div>
                <p className="mt-2 text-xs text-slate-600">{r.rationale}</p>
                {r.evidence.length > 0 ? (
                  <ul className="mt-3 space-y-1">
                    {r.evidence.slice(0, 4).map((e) => (
                      <li key={e.label} className="text-[11px] text-slate-500">
                        <span className="font-semibold text-navy">{e.label}:</span> {e.value}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {r.trade ? (
                  <p className="mt-3 text-[11px] text-slate-400">
                    {r.trade.category} · {r.trade.durationMonths} months · source reviewed {formatDate(new Date())}
                  </p>
                ) : null}
                {r.trade?.slug ? (
                  <Link href={`/student/careers/${r.trade.slug}`} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-royal-600 hover:underline">
                    View trade details <ArrowRight className="h-3 w-3" />
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

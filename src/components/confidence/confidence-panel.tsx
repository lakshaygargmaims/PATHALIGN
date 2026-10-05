'use client';

import { useState } from 'react';
import { Gauge, Loader2, CheckCircle2, Info } from 'lucide-react';
import { apiJson, useApi, ApiClientError } from '@/lib/hooks';
import { useToast } from '@/components/toast';
import { CardSkeleton, EmptyState, Progress } from '@/components/ui/states';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Cell } from 'recharts';

interface DimensionMeta {
  key: string;
  label: string;
  labelHi: string;
  question: string;
  questionHi: string;
}

interface Comparison {
  familyId: string;
  pre: { overallScore: number; createdAt: string } | null;
  post: { overallScore: number; createdAt: string } | null;
  change: number | null;
  latestScore: number | null;
  weakestDimensions: Array<{ key: string; label: string; score: number }>;
  disclaimer: string;
}

interface ConfidenceResponse {
  comparison: Comparison | null;
  dimensions: DimensionMeta[];
}

const SCALE = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'A little' },
  { value: 2, label: 'Somewhat' },
  { value: 3, label: 'Quite a bit' },
  { value: 4, label: 'Very much' },
];

export function ConfidencePanel() {
  const { toast } = useToast();
  const { data, loading, refetch } = useApi<ConfidenceResponse>('/api/confidence');
  const [phase, setPhase] = useState<'PRE' | 'POST'>('PRE');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ensureFamily = async () => {
    if (familyId) return familyId;
    const { apiFetch } = await import('@/lib/hooks');
    const fam = await apiFetch<{ family: { id: string } | null }>('/api/families');
    setFamilyId(fam.family?.id ?? null);
    return fam.family?.id ?? null;
  };

  const onSubmit = async () => {
    const missing = (data?.dimensions ?? []).find((d) => answers[d.key] === undefined);
    if (missing) {
      setError(`Please answer: “${missing.question}”`);
      return;
    }
    const id = await ensureFamily();
    if (!id) {
      setError('Join a family group first — the score belongs to your family unit.');
      return;
    }
    await submitWith(id);
  };

  const submitWith = async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      await apiJson('/api/confidence', 'POST', {
        familyId: id,
        phase,
        answers: {
          awareness: answers.awareness ?? 0,
          employmentTrust: answers.employmentTrust ?? 0,
          salaryUnderstanding: answers.salaryUnderstanding ?? 0,
          progressionAwareness: answers.progressionAwareness ?? 0,
          willingness: answers.willingness ?? 0,
        },
      });
      toast('Score recorded. You can now compare before/after counselling.', 'success');
      setAnswers({});
      refetch();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not save the score');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <CardSkeleton rows={5} />;
  if (!data) return <EmptyState title="Confidence score unavailable" description="Try refreshing the page." />;

  const c = data.comparison;
  const allAnswered = data.dimensions.every((d) => answers[d.key] !== undefined);

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs text-slate-500">First questionnaire (PRE)</p>
          <p className="mt-1 text-3xl font-bold text-navy">
            {c?.pre?.overallScore ?? '—'}
            <span className="text-sm font-medium text-slate-400">/100</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">{c?.pre ? new Date(c.pre.createdAt).toLocaleDateString('en-IN') : 'Not taken yet'}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-slate-500">Latest score (POST)</p>
          <p className="mt-1 text-3xl font-bold text-navy">
            {c?.latestScore ?? '—'}
            <span className="text-sm font-medium text-slate-400">/100</span>
          </p>
          <div className="mt-2">
            <Progress value={c?.latestScore ?? 0} label="Latest confidence score" />
          </div>
        </div>
        <div className="card p-5">
          <p className="text-xs text-slate-500">Change</p>
          <p
            className={cn(
              'mt-1 text-3xl font-bold',
              (c?.change ?? 0) > 0 ? 'text-teal-600' : (c?.change ?? 0) < 0 ? 'text-red-500' : 'text-navy',
            )}
          >
            {c?.change != null ? `${c.change > 0 ? '+' : ''}${c.change}` : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-400">Latest minus first questionnaire</p>
        </div>
      </div>

      {c?.change != null ? (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-navy">Score over time</h3>
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'PRE (before counselling)', score: c.pre?.overallScore ?? 0 },
                  { name: 'POST (latest)', score: c.post?.overallScore ?? c.latestScore ?? 0 },
                ]}
                margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip />
                <ReferenceLine y={50} stroke="#94A3B8" strokeDasharray="4 4" />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  <Cell fill="#2563EB" />
                  <Cell fill="#14B8A6" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {c.weakestDimensions.length > 0 ? (
            <p className="mt-3 text-xs text-slate-500">
              Areas needing further counselling:{' '}
              <strong>{c.weakestDimensions.map((w) => `${w.label} (${w.score}/20)`).join(', ')}</strong>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="card border-amber-200 bg-amber-50 p-4">
        <p className="flex items-start gap-2 text-xs text-amber-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          {c?.disclaimer ??
            'This is a self-reported awareness score for counselling follow-up. It is not a psychological assessment and does not predict enrolment or employment.'}
        </p>
      </div>

      {/* Questionnaire */}
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
            <Gauge className="h-5 w-5 text-teal-600" /> Family Career Confidence questionnaire
          </h2>
          <div className="flex rounded-lg border border-slate-200 p-1">
            {(['PRE', 'POST'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPhase(p)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                  phase === p ? 'bg-navy text-white' : 'text-slate-500 hover:text-navy',
                )}
              >
                {p === 'PRE' ? 'Before counselling' : 'After counselling'}
              </button>
            ))}
          </div>
        </div>

        <ol className="mt-5 space-y-5">
          {data.dimensions.map((dim, idx) => (
            <li key={dim.key}>
              <p className="text-sm font-medium text-navy">
                {idx + 1}. {dim.question}
              </p>
              <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={dim.question}>
                {SCALE.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    role="radio"
                    aria-checked={answers[dim.key] === s.value}
                    onClick={() => setAnswers((prev) => ({ ...prev, [dim.key]: s.value }))}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-xs transition-colors',
                      answers[dim.key] === s.value
                        ? 'border-royal-500 bg-royal-50 font-semibold text-royal-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300',
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ol>

        {error ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <button
          type="button"
          onClick={onSubmit}
          disabled={saving || !allAnswered}
          className="btn-primary mt-5"
          title={!allAnswered ? 'Answer all five questions first' : undefined}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Submit {phase === 'PRE' ? 'before-counselling' : 'after-counselling'} score
        </button>
        <p className="mt-2 text-xs text-slate-400">
          Each answer scores 0–4 → converted to 0–20 per dimension → totalled to 0–100. Nothing is inferred beyond what
          you answer.
        </p>
      </div>
    </div>
  );
}

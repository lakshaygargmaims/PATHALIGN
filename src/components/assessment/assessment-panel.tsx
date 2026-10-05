'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, CheckCircle2, Loader2 } from 'lucide-react';
import { apiJson, useApi } from '@/lib/hooks';
import { CardSkeleton, ErrorState, Progress } from '@/components/ui/states';

interface Question {
  id: string;
  text: string;
  textHi: string;
}

interface QuestionsResponse {
  studentInterest: Question[];
  parentExpectations: Question[];
}

interface ScoredResult {
  dimensions: Record<string, number>;
  overall: number;
  interpretation: string;
}

const OPTIONS = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'A little' },
  { value: 2, label: 'Somewhat' },
  { value: 3, label: 'Quite a lot' },
  { value: 4, label: 'Very much' },
];

export function AssessmentPanel({
  kind,
  title,
  subtitle,
}: {
  kind: 'STUDENT_INTEREST' | 'PARENT_EXPECTATIONS';
  title: string;
  subtitle: string;
}) {
  const questions = useApi<QuestionsResponse>('/api/assessments?questions=1');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<ScoredResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const list = questions.data
    ? kind === 'STUDENT_INTEREST'
      ? questions.data.studentInterest
      : questions.data.parentExpectations
    : [];

  useEffect(() => {
    setAnswers({});
    setResult(null);
  }, [kind]);

  const answered = list.filter((q) => answers[q.id] !== undefined).length;
  const complete = list.length > 0 && answered === list.length;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complete) return;
    setBusy(true);
    setFormError(null);
    try {
      const res = await apiJson<{ assessment: { scores: ScoredResult } }>('/api/assessments', 'POST', {
        kind,
        answers,
      });
      setResult(res.assessment.scores);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save your answers');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-semibold text-navy">
          <ClipboardList className="h-5 w-5 text-royal-600" /> {title}
        </h2>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        {list.length > 0 ? (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Progress</span>
              <span>
                {answered}/{list.length}
              </span>
            </div>
            <div className="mt-2">
              <Progress value={(answered / list.length) * 100} label="Assessment progress" />
            </div>
          </div>
        ) : null}
      </section>

      {questions.loading ? (
        <CardSkeleton rows={4} />
      ) : questions.error ? (
        <ErrorState message={questions.error} onRetry={questions.refetch} />
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {list.map((q, idx) => (
            <fieldset key={q.id} className="card p-5">
              <legend className="sr-only">{q.text}</legend>
              <p className="text-sm font-semibold text-navy">
                {idx + 1}. {q.text}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{q.textHi}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {OPTIONS.map((o) => {
                  const selected = answers[q.id] === o.value;
                  return (
                    <label
                      key={o.value}
                      className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        selected ? 'border-royal-600 bg-royal-50 text-royal-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={o.value}
                        checked={selected}
                        onChange={() => setAnswers({ ...answers, [q.id]: o.value })}
                        className="sr-only"
                      />
                      {o.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}

          {formError ? <p className="text-xs text-red-600">{formError}</p> : null}

          <button type="submit" disabled={!complete || busy} className="btn-primary">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {busy ? 'Saving…' : 'Submit assessment'}
          </button>
          {!complete ? <p className="text-xs text-slate-400">Answer every question to submit.</p> : null}
        </form>
      )}

      {result ? (
        <section className="card bg-navy p-5 text-white">
          <h3 className="text-sm font-semibold">Your result</h3>
          <p className="mt-1 text-3xl font-bold">
            {result.overall}
            <span className="text-sm font-medium text-slate-400">/100</span>
          </p>
          <p className="mt-2 text-xs text-slate-300">{result.interpretation}</p>
          <ul className="mt-4 space-y-2">
            {Object.entries(result.dimensions).map(([label, score]) => (
              <li key={label}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-200">{label}</span>
                  <span className="font-semibold text-teal-300">{score}</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                  <div className="h-1.5 rounded-full bg-teal-400" style={{ width: `${score}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

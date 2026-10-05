'use client';

import { useState } from 'react';
import { Sparkles, Route, Loader2 } from 'lucide-react';
import { apiJson, useApi } from '@/lib/hooks';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/states';

interface TwinStep {
  title: string;
  detail: string | null;
}
interface TwinPathway {
  pathway: string;
  title: string;
  tradeName: string | null;
  summary: string;
  steps: TwinStep[];
  additionalTraining: string[];
  estimatedCost: string | null;
  assumptions: string[];
}
interface TwinResult {
  pathways: TwinPathway[];
  note: string;
}

const PATHWAY_STYLE: Record<string, string> = {
  PREFERRED: 'border-teal-300 bg-teal-50',
  ALTERNATIVE: 'border-royal-300 bg-royal-50',
  GROWTH: 'border-purple-300 bg-purple-50',
  SAFE: 'border-slate-300 bg-slate-50',
};

export default function StudentTwinPage() {
  const trades = useApi<{ trades: Array<{ id: string; name: string }> }>('/api/careers/trades');
  const [form, setForm] = useState({ education: 'Class 10', skills: '', interests: '', budget: '', targetTradeId: '' });
  const [twin, setTwin] = useState<TwinResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await apiJson<{ twin: TwinResult }>('/api/recommendations', 'POST', {
        action: 'twin',
        education: form.education,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        interests: form.interests.split(',').map((s) => s.trim()).filter(Boolean),
        budget: Number(form.budget) || 0,
        targetTradeId: form.targetTradeId || undefined,
      });
      setTwin(res.twin);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not build the digital twin');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-semibold text-navy">
          <Sparkles className="h-5 w-5 text-purple-600" /> Career digital twin
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Model four possible pathways — what you want, a realistic alternative, a growth route and a lower-risk
          option — using real catalogue records for duration, fees and earnings. Every figure is an estimate.
        </p>

        <form onSubmit={generate} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="twin-edu" className="text-xs font-semibold text-navy">
              Current education
            </label>
            <input
              id="twin-edu"
              required
              minLength={2}
              value={form.education}
              onChange={(e) => setForm({ ...form, education: e.target.value })}
              className="input mt-1 w-full"
            />
          </div>
          <div>
            <label htmlFor="twin-budget" className="text-xs font-semibold text-navy">
              Budget (₹)
            </label>
            <input
              id="twin-budget"
              type="number"
              min={0}
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              className="input mt-1 w-full"
              placeholder="0"
            />
          </div>
          <div>
            <label htmlFor="twin-skills" className="text-xs font-semibold text-navy">
              Skills (comma separated)
            </label>
            <input
              id="twin-skills"
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
              className="input mt-1 w-full"
              placeholder="welding, drawing"
            />
          </div>
          <div>
            <label htmlFor="twin-interests" className="text-xs font-semibold text-navy">
              Interests (comma separated)
            </label>
            <input
              id="twin-interests"
              value={form.interests}
              onChange={(e) => setForm({ ...form, interests: e.target.value })}
              className="input mt-1 w-full"
              placeholder="electronics, design"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="twin-target" className="text-xs font-semibold text-navy">
              Target trade (optional)
            </label>
            <select
              id="twin-target"
              value={form.targetTradeId}
              onChange={(e) => setForm({ ...form, targetTradeId: e.target.value })}
              className="input mt-1 w-full"
            >
              <option value="">Let PATHALIGN choose the best match</option>
              {trades.data?.trades.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            {error ? <p className="mb-2 text-xs text-red-600">{error}</p> : null}
            <button type="submit" disabled={busy} className="btn-primary text-xs">
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Route className="h-3 w-3" />}
              {busy ? 'Building pathways…' : 'Build my digital twin'}
            </button>
          </div>
        </form>
      </section>

      {trades.loading ? <CardSkeleton rows={3} /> : null}
      {trades.error ? <ErrorState message={trades.error} onRetry={trades.refetch} /> : null}

      {twin ? (
        <>
          <p className="rounded-lg bg-surface p-3 text-xs text-slate-600">{twin.note}</p>
          <div className="grid gap-4 lg:grid-cols-2">
            {twin.pathways.map((p) => (
              <article key={p.pathway} className={`card border-l-4 p-5 ${PATHWAY_STYLE[p.pathway] ?? 'border-slate-300 bg-white'}`}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{p.pathway}</p>
                <h3 className="mt-1 text-sm font-bold text-navy">{p.title}</h3>
                <p className="mt-2 text-xs text-slate-600">{p.summary}</p>
                {p.estimatedCost ? <p className="mt-2 text-xs font-semibold text-navy">Cost: {p.estimatedCost}</p> : null}

                {p.steps.length > 0 ? (
                  <ol className="mt-3 space-y-2">
                    {p.steps.map((s, i) => (
                      <li key={`${p.pathway}-${i}`} className="text-xs">
                        <span className="font-semibold text-navy">{i + 1}. {s.title}</span>
                        {s.detail ? <p className="text-slate-500">{s.detail}</p> : null}
                      </li>
                    ))}
                  </ol>
                ) : null}

                {p.additionalTraining.length > 0 ? (
                  <>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Also needed</p>
                    <ul className="mt-1 space-y-1">
                      {p.additionalTraining.map((a) => (
                        <li key={a} className="text-xs text-slate-600">
                          • {a}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}

                <ul className="mt-3 space-y-1">
                  {p.assumptions.map((a) => (
                    <li key={a} className="text-[11px] text-slate-400">
                      {a}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </>
      ) : !trades.loading && !trades.error ? (
        <EmptyState
          title="No digital twin yet"
          description="Fill in your details above, or complete the career assessment first for a sharper match."
        />
      ) : null}
    </div>
  );
}

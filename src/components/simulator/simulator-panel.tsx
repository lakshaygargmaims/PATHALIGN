'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Calculator,
  Scale,
  Loader2,
  IndianRupee,
  Clock3,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  ArrowLeftRight,
} from 'lucide-react';
import { apiJson, useApi, ApiClientError } from '@/lib/hooks';
import { useToast } from '@/components/toast';
import { CardSkeleton, EmptyState } from '@/components/ui/states';
import { VerificationBadge } from '@/components/ui/badges';
import { formatINR, cn } from '@/lib/utils';
import { STATES } from '@/lib/india';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface TradeOption {
  id: string;
  name: string;
  category: string;
}

interface EarningRow {
  level: string;
  label: string;
  monthlyMin: number;
  monthlyMax: number;
  isEstimate: boolean;
  verificationStatus: string;
}

interface Profile {
  tradeId: string;
  name: string;
  category: string;
  description: string;
  durationMonths: number;
  nsqfLevel: number | null;
  feeMin: number | null;
  feeMax: number | null;
  eligibility: string | null;
  verificationStatus: string;
  isSynthetic: boolean;
  qualification: { title: string; progressionNote: string | null } | null;
  training: { durationMonths: number; feeMin: number | null; feeMax: number | null; providerCount: number; providersInState: number; withinBudget: boolean | null; budgetNote: string | null };
  earnings: EarningRow[];
  employmentPathways: Array<{ type: string; title: string; description: string; isVacancy: boolean }>;
  progression: Array<{ order: number; title: string; description: string; salaryRange: string | null }>;
  furtherEducation: string | null;
  selfEmployment: boolean;
  placements: Array<{ year: number; rate: number | null; notes: string | null }>;
  source: { name: string; verificationStatus: string } | null;
  assumptions: string[];
}

interface SimResponse {
  profile: Profile;
  scenario: Record<string, unknown>;
  disclaimer: string;
}

interface CompareRow {
  parameter: string;
  parameterHi: string;
  a: string;
  b: string;
  advantage: 'A' | 'B' | 'EQUAL' | 'NEUTRAL';
}

interface CompareResponse {
  comparison: { a: Profile; b: Profile; rows: CompareRow[]; generatedAt: string };
}

export function SimulatorPanel({ mode }: { mode: 'simulate' | 'compare' }) {
  const { toast } = useToast();
  const params = useSearchParams();
  const initialTrade = params.get('trade');

  const { data: list, loading: listLoading } = useApi<{ trades: TradeOption[] }>('/api/careers/trades?pageSize=100');
  const [tradeId, setTradeId] = useState('');
  const [tradeIdB, setTradeIdB] = useState('');
  const [state, setState] = useState('');
  const [education, setEducation] = useState('10TH');
  const [budget, setBudget] = useState('');
  const [experience, setExperience] = useState('FRESH');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimResponse | null>(null);
  const [compare, setCompare] = useState<CompareResponse['comparison'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trades = useMemo(() => list?.trades ?? [], [list]);

  useEffect(() => {
    if (!initialTrade || trades.length === 0) return;
    const match = trades.find((t) => t.id === initialTrade || (t as unknown as { slug?: string }).slug === initialTrade);
    if (match) setTradeId(match.id);
  }, [initialTrade, trades]);

  const runSimulate = async () => {
    if (!tradeId) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiJson<SimResponse>('/api/simulator', 'POST', {
        action: 'simulate',
        tradeId,
        state: state || undefined,
        educationLevel: education,
        budget: budget ? Number(budget) : undefined,
        experienceLevel: experience,
      });
      setResult(res);
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Simulation failed';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const runCompare = async () => {
    if (!tradeId || !tradeIdB || tradeId === tradeIdB) {
      setError('Pick two different trades to compare.');
      return;
    }
    setLoading(true);
    setError(null);
    setCompare(null);
    try {
      const res = await apiJson<CompareResponse>('/api/simulator', 'POST', {
        action: 'compare',
        tradeIds: [tradeId, tradeIdB],
        state: state || undefined,
      });
      setCompare(res.comparison);
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Comparison failed';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const chartData = result
    ? result.profile.earnings.map((e) => ({
        name: e.label,
        Min: e.monthlyMin,
        Max: e.monthlyMax,
      }))
    : [];

  if (listLoading) return <CardSkeleton rows={5} />;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="card p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="trade-a" className="label">
              {mode === 'compare' ? 'Trade A' : 'Select a trade'}
            </label>
            <select id="trade-a" className="input" value={tradeId} onChange={(e) => setTradeId(e.target.value)}>
              <option value="">Choose a trade…</option>
              {trades.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.category}
                </option>
              ))}
            </select>
          </div>

          {mode === 'compare' ? (
            <div>
              <label htmlFor="trade-b" className="label">
                Trade B
              </label>
              <select id="trade-b" className="input" value={tradeIdB} onChange={(e) => setTradeIdB(e.target.value)}>
                <option value="">Choose another trade…</option>
                {trades.map((t) => (
                  <option key={t.id} value={t.id} disabled={t.id === tradeId}>
                    {t.name} — {t.category}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label htmlFor="state" className="label">
                State (provider availability)
              </label>
              <select id="state" className="input" value={state} onChange={(e) => setState(e.target.value)}>
                <option value="">All India</option>
                {STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === 'simulate' ? (
            <>
              <div>
                <label htmlFor="edu" className="label">
                  Education level
                </label>
                <select id="edu" className="input" value={education} onChange={(e) => setEducation(e.target.value)}>
                  <option value="10TH">Class 10th</option>
                  <option value="12TH">Class 12th</option>
                  <option value="ITI_PASS">ITI passed</option>
                  <option value="DIPLOMA">Diploma</option>
                  <option value="GRADUATE">Graduate</option>
                </select>
              </div>
              <div>
                <label htmlFor="budget" className="label">
                  Training budget (₹)
                </label>
                <input id="budget" inputMode="numeric" className="input" placeholder="e.g. 30000" value={budget} onChange={(e) => setBudget(e.target.value.replace(/\D/g, ''))} />
              </div>
              <div>
                <label htmlFor="exp" className="label">
                  Experience level
                </label>
                <select id="exp" className="input" value={experience} onChange={(e) => setExperience(e.target.value)}>
                  <option value="FRESH">Just trained / fresher</option>
                  <option value="1_3_YEARS">1–3 years</option>
                  <option value="3_10_YEARS">3–10 years</option>
                  <option value="10_PLUS">10+ years</option>
                </select>
              </div>
            </>
          ) : null}

          <div className="flex items-end">
            <button
              type="button"
              onClick={mode === 'simulate' ? runSimulate : runCompare}
              disabled={loading || !tradeId || (mode === 'compare' && !tradeIdB)}
              className="btn-primary w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'simulate' ? <Calculator className="h-4 w-4" /> : <Scale className="h-4 w-4" />}
              {mode === 'simulate' ? 'Run scenario' : 'Compare'}
            </button>
          </div>
        </div>
        {error ? <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      </div>

      {/* Results — scenario */}
      {result ? (
        <>
          <div className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-navy">{result.profile.name}</h2>
                <p className="text-sm text-slate-500">{result.profile.category}</p>
              </div>
              <VerificationBadge status={result.profile.verificationStatus} isSynthetic={result.profile.isSynthetic} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="flex items-center gap-1.5 text-xs text-slate-500"><Clock3 className="h-3.5 w-3.5" /> Duration</p>
                <p className="mt-1 font-bold text-navy">{result.profile.training.durationMonths} months</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="flex items-center gap-1.5 text-xs text-slate-500"><IndianRupee className="h-3.5 w-3.5" /> Recorded fee</p>
                <p className="mt-1 font-bold text-navy">
                  {result.profile.training.feeMin && result.profile.training.feeMax
                    ? `${formatINR(result.profile.training.feeMin)}–${formatINR(result.profile.training.feeMax)}`
                    : 'Not recorded'}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="flex items-center gap-1.5 text-xs text-slate-500"><GraduationCap className="h-3.5 w-3.5" /> Qualification</p>
                <p className="mt-1 font-bold text-navy">{result.profile.qualification?.title ?? `NSQF L${result.profile.nsqfLevel ?? '—'}`}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="flex items-center gap-1.5 text-xs text-slate-500"><TrendingUp className="h-3.5 w-3.5" /> Centres recorded</p>
                <p className="mt-1 font-bold text-navy">
                  {result.profile.training.providerCount}
                  {state ? ` (${result.profile.training.providersInState} in ${state})` : ''}
                </p>
              </div>
            </div>

            {result.profile.training.budgetNote ? (
              <p className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {result.profile.training.budgetNote}
              </p>
            ) : null}

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-navy">Earning trajectory (monthly, estimate)</h3>
              <div className="mt-3 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip formatter={(v: number) => formatINR(v)} />
                    <Legend />
                    <Bar dataKey="Min" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Max" fill="#14B8A6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-navy">Employment pathways recorded</h3>
                <ul className="mt-2 space-y-2">
                  {result.profile.employmentPathways.map((p, i) => (
                    <li key={i} className="rounded-lg border border-slate-100 p-3">
                      <p className="text-sm font-medium text-navy">
                        {p.title}{' '}
                        <span className="ml-1 text-[10px] uppercase tracking-wide text-slate-400">
                          {p.isVacancy ? 'vacancy record' : 'employer segment'}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{p.description}</p>
                    </li>
                  ))}
                  {result.profile.employmentPathways.length === 0 ? (
                    <li className="text-sm text-slate-400">No pathway records for this trade yet.</li>
                  ) : null}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-navy">Progression stages</h3>
                <ol className="mt-2 space-y-2">
                  {result.profile.progression.map((s) => (
                    <li key={s.order} className="flex gap-3 rounded-lg border border-slate-100 p-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">{s.order}</span>
                      <div>
                        <p className="text-sm font-medium text-navy">{s.title}</p>
                        <p className="text-xs text-slate-500">{s.description}</p>
                        {s.salaryRange ? <p className="mt-1 text-xs text-teal-700">{s.salaryRange}</p> : null}
                      </div>
                    </li>
                  ))}
                </ol>
                {result.profile.furtherEducation ? (
                  <p className="mt-3 rounded-lg bg-royal-50 px-3 py-2 text-xs text-royal-800">
                    Further education: {result.profile.furtherEducation}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-navy">Assumptions & limits</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                {result.profile.assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs font-semibold text-amber-700">{result.disclaimer}</p>
            </div>
          </div>
        </>
      ) : null}

      {/* Results — comparison */}
      {compare ? (
        <div className="card p-6">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-royal-600" />
            <h2 className="text-lg font-bold text-navy">
              {compare.a.name} <span className="text-slate-400">vs</span> {compare.b.name}
            </h2>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Parameter</th>
                  <th className="px-4 py-3">{compare.a.name}</th>
                  <th className="px-4 py-3">{compare.b.name}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {compare.rows.map((r) => (
                  <tr key={r.parameter}>
                    <td className="px-4 py-3 font-medium text-navy">{r.parameter}</td>
                    <td className={cn('px-4 py-3', r.advantage === 'A' && 'bg-teal-50 font-semibold text-teal-900')}>
                      {r.a}
                      {r.advantage === 'A' ? ' ✓' : ''}
                    </td>
                    <td className={cn('px-4 py-3', r.advantage === 'B' && 'bg-teal-50 font-semibold text-teal-900')}>
                      {r.b}
                      {r.advantage === 'B' ? ' ✓' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Highlighted cells mark the lower cost / longer progression on that parameter only. “✓” is a mechanical
            comparison, not a recommendation — the right choice depends on your family’s priorities.
          </p>
        </div>
      ) : null}

      {!result && !compare && !loading ? (
        <EmptyState
          title={mode === 'simulate' ? 'Set your scenario and run it' : 'Pick two trades to compare'}
          description="Every figure in the output is drawn from records in this database and labelled with its verification status."
          icon={<Calculator className="h-5 w-5" />}
        />
      ) : null}
    </div>
  );
}

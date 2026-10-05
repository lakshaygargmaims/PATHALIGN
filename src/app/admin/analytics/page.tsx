'use client';

import { useState } from 'react';
import { ChartNoAxesCombined } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApi } from '@/lib/hooks';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/states';
import { cn } from '@/lib/utils';

interface Overview {
  totalStudents: number;
  totalParents: number;
  totalCounsellors: number;
  totalFamilies: number;
  openCases: number;
  unresolvedConcerns: number;
  escalations: number;
  reportsGenerated: number;
  consentedProfiles: number;
}
interface ConcernRow {
  category: string;
  label: string;
  open: number;
  total: number;
  share: number;
}
interface DistrictRow {
  state: string;
  district: string;
  concerns: number;
  families: number;
  unresolved: number;
  index: number;
}
interface SentimentRow {
  sentiment: string;
  count: number;
  share: number;
}
interface TrendPoint {
  date: string;
  users: number;
  conversations: number;
  concerns: number;
}
interface ConfidencePoint {
  date: string;
  averageScore: number;
  count: number;
}

interface StatsResponse {
  overview: Overview;
  concerns: ConcernRow[];
  districts: DistrictRow[];
  sentiment: SentimentRow[];
  trends: TrendPoint[];
  confidenceTrend: ConfidencePoint[];
  disagreements: Array<{ status: string; count: number }>;
  filters: { state: string | null; days: number };
}

const SENTIMENT_COLORS: Record<string, string> = {
  POSITIVE: '#14b8a6',
  NEUTRAL: '#94a3b8',
  MIXED: '#f59e0b',
  NEGATIVE: '#ef4444',
  UNKNOWN: '#cbd5e1',
};

const RANGES = [7, 30, 90] as const;

export default function AdminAnalytics() {
  const [days, setDays] = useState<number>(30);
  const [state, setState] = useState('');
  const path = `/api/admin/stats?days=${days}${state ? `&state=${encodeURIComponent(state)}` : ''}`;
  const { data, loading, error, refetch } = useApi<StatsResponse>(path, [days, state]);

  const states = [...new Set((data?.districts ?? []).map((d) => d.state))].filter(Boolean).sort();
  const trends = data?.trends ?? [];

  if (loading) return <CardSkeleton rows={5} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const o = data?.overview;

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-navy">
              <ChartNoAxesCombined className="h-5 w-5 text-royal-600" /> Resistance analytics
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Aggregates computed from live records. Use these to target counselling campaigns, not to rank districts.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="state-filter" className="block text-xs font-semibold text-navy">
                State
              </label>
              <select
                id="state-filter"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="input mt-1 w-44"
              >
                <option value="">All states</option>
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="block text-xs font-semibold text-navy">Window</span>
              <div className="mt-1 flex gap-1">
                {RANGES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setDays(r)}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-semibold',
                      days === r ? 'bg-royal-600 text-white' : 'bg-surface text-slate-600 hover:bg-slate-200',
                    )}
                  >
                    {r}d
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Students', value: o?.totalStudents ?? 0 },
          { label: 'Parents', value: o?.totalParents ?? 0 },
          { label: 'Families', value: o?.totalFamilies ?? 0 },
          { label: 'Open cases', value: o?.openCases ?? 0 },
          { label: 'Consented profiles', value: o?.consentedProfiles ?? 0 },
        ].map((t) => (
          <div key={t.label} className="card p-4">
            <p className="text-xs text-slate-500">{t.label}</p>
            <p className="mt-1 text-xl font-bold text-navy">{t.value}</p>
          </div>
        ))}
      </section>

      <section className="card p-5">
        <h3 className="text-sm font-semibold text-navy">Registrations, conversations &amp; concerns over time</h3>
        {trends.length === 0 ? (
          <EmptyState title="No trend data" description="Trend series appear once there is recent activity." />
        ) : (
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="conversations" stroke="#14b8a6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="concerns" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h3 className="text-sm font-semibold text-navy">Concern mix</h3>
          {data?.concerns.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">No concerns recorded.</p>
          ) : (
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data!.concerns} dataKey="total" nameKey="label" outerRadius={80}>
                    {data!.concerns.map((c, i) => (
                      <Cell key={c.category} fill={['#2563eb', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9', '#84cc16', '#f97316', '#64748b'][i % 10]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="card p-5">
          <h3 className="text-sm font-semibold text-navy">Conversation sentiment</h3>
          {data?.sentiment.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">No user messages analysed yet.</p>
          ) : (
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data!.sentiment}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="sentiment" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {data!.sentiment.map((s) => (
                      <Cell key={s.sentiment} fill={SENTIMENT_COLORS[s.sentiment] ?? '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <section className="card p-5">
        <h3 className="text-sm font-semibold text-navy">District resistance index</h3>
        <p className="mt-1 text-xs text-slate-500">
          Concerns per family in the district — a rough signal for where counselling effort is needed.
        </p>
        {data?.districts.length === 0 ? (
          <p className="mt-4 text-xs text-slate-500">No district-level data.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-4">District</th>
                  <th className="py-2 pr-4">Families</th>
                  <th className="py-2 pr-4">Concerns</th>
                  <th className="py-2 pr-4">Unresolved</th>
                  <th className="py-2">Index</th>
                </tr>
              </thead>
              <tbody>
                {data!.districts.slice(0, 25).map((d) => (
                  <tr key={`${d.state}-${d.district}`} className="border-t border-slate-100">
                    <td className="py-2 pr-4">
                      <p className="font-medium text-navy">{d.district}</p>
                      <p className="text-xs text-slate-400">{d.state}</p>
                    </td>
                    <td className="py-2 pr-4 text-xs text-slate-600">{d.families}</td>
                    <td className="py-2 pr-4 text-xs text-slate-600">{d.concerns}</td>
                    <td className="py-2 pr-4 text-xs text-slate-600">{d.unresolved}</td>
                    <td className="py-2">
                      <span className={`badge ${d.index > 80 ? 'bg-red-100 text-red-800' : d.index > 40 ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'}`}>
                        {d.index}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card p-5">
        <h3 className="text-sm font-semibold text-navy">Family confidence trend</h3>
        <p className="mt-1 text-xs text-slate-500">
          Average self-reported career-confidence score over time. Not an outcome measure.
        </p>
        {data?.confidenceTrend.length === 0 ? (
          <p className="mt-3 text-xs text-slate-500">No confidence questionnaires recorded.</p>
        ) : (
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data!.confidenceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="averageScore" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}

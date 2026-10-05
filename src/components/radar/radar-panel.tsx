'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPinned, Loader2, Search, GraduationCap, Briefcase, MapPin, AlertTriangle } from 'lucide-react';
import { apiJson, useApi, ApiClientError } from '@/lib/hooks';
import { useToast } from '@/components/toast';
import { CardSkeleton, EmptyState } from '@/components/ui/states';
import { VerificationBadge } from '@/components/ui/badges';
import { cn, formatINR } from '@/lib/utils';
import { STATES, districtsFor } from '@/lib/india';

const OpportunityMap = dynamic(() => import('@/components/map/opportunity-map').then((m) => m.OpportunityMap), {
  ssr: false,
  loading: () => <div className="h-80 animate-pulse rounded-xl bg-slate-100" />,
});

interface ProviderRow {
  id: string;
  name: string;
  type: string;
  state: string;
  district: string;
  city: string | null;
  lat: number | null;
  lng: number | null;
  verificationStatus: string;
  isSynthetic: boolean;
  distanceKm: number | null;
  affiliation: string | null;
  courses: Array<{ tradeId: string; tradeName: string; durationMonths: number; feeMin: number | null; feeMax: number | null; nsqfLevel: number | null }>;
}

interface OpportunityRow {
  id: string;
  title: string;
  kind: 'VACANCY' | 'APPRENTICESHIP' | 'OPPORTUNITY';
  sector: string;
  employmentType: string;
  employerName: string | null;
  state: string | null;
  district: string | null;
  description: string;
  openPositions: number | null;
  sourceUrl: string | null;
  verificationStatus: string;
  isSynthetic: boolean;
}

interface RadarResult {
  origin: { state: string; district: string; lat: number; lng: number } | null;
  originLabel: string;
  providerCount: number;
  courseCount: number;
  vacancyCount: number;
  apprenticeshipCount: number;
  providers: ProviderRow[];
  opportunities: OpportunityRow[];
  notes: string[];
}

interface TradeOption {
  id: string;
  name: string;
}

const PROVIDER_TYPES = [
  { value: '', label: 'All provider types' },
  { value: 'ITI', label: 'Government ITI' },
  { value: 'PRIVATE_ITI', label: 'Private ITI' },
  { value: 'NSDC_PARTNER', label: 'NSDC partner centre' },
  { value: 'POLYTECHNIC', label: 'Polytechnic' },
  { value: 'COMMUNITY_SKILL_CENTRE', label: 'Community skill centre' },
];

export function RadarPanel() {
  const { toast } = useToast();
  const { data: trades } = useApi<{ trades: TradeOption[] }>('/api/careers/trades?pageSize=100');

  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [tradeId, setTradeId] = useState('');
  const [providerType, setProviderType] = useState('');
  const [maxDuration, setMaxDuration] = useState('');
  const [maxFee, setMaxFee] = useState('');
  const [radius, setRadius] = useState('50');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RadarResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const districts = state ? districtsFor(state) : [];

  const search = async () => {
    if (!state) {
      setError('Select a state to search.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiJson<RadarResult>('/api/opportunities', 'POST', {
        state,
        district: district || undefined,
        tradeId: tradeId || undefined,
        providerType: providerType || undefined,
        maxDurationMonths: maxDuration ? Number(maxDuration) : undefined,
        maxFee: maxFee ? Number(maxFee) : undefined,
        radiusKm: Number(radius) || 50,
        includeVacancies: true,
      });
      setResult(res);
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Search failed';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const mapPoints = useMemo(() => {
    if (!result) return [];
    const providerPoints = result.providers
      .filter((p) => p.lat != null && p.lng != null)
      .map((p) => ({
        id: p.id,
        name: p.name,
        lat: p.lat!,
        lng: p.lng!,
        subtitle: `${p.type.replace(/_/g, ' ')} · ${p.district}`,
        kind: 'PROVIDER' as const,
        distanceKm: p.distanceKm,
      }));
    return providerPoints;
  }, [result]);

  const center: [number, number] = result?.origin ? [result.origin.lat, result.origin.lng] : [20.5937, 78.9629];

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="radar-state" className="label">State</label>
            <select id="radar-state" className="input" value={state} onChange={(e) => { setState(e.target.value); setDistrict(''); }}>
              <option value="">Select state</option>
              {STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="radar-district" className="label">District <span className="text-slate-400">(optional)</span></label>
            <input id="radar-district" className="input" list="radar-districts" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Type or pick" disabled={!state} />
            <datalist id="radar-districts">
              {districts.map((d) => <option key={d} value={d} />)}
            </datalist>
          </div>
          <div>
            <label htmlFor="radar-trade" className="label">Trade <span className="text-slate-400">(optional)</span></label>
            <select id="radar-trade" className="input" value={tradeId} onChange={(e) => setTradeId(e.target.value)}>
              <option value="">All trades</option>
              {(trades?.trades ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="radar-type" className="label">Provider type</label>
            <select id="radar-type" className="input" value={providerType} onChange={(e) => setProviderType(e.target.value)}>
              {PROVIDER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="radar-duration" className="label">Max duration (months)</label>
            <input id="radar-duration" inputMode="numeric" className="input" value={maxDuration} onChange={(e) => setMaxDuration(e.target.value.replace(/\D/g, ''))} placeholder="e.g. 12" />
          </div>
          <div>
            <label htmlFor="radar-fee" className="label">Max fee (₹)</label>
            <input id="radar-fee" inputMode="numeric" className="input" value={maxFee} onChange={(e) => setMaxFee(e.target.value.replace(/\D/g, ''))} placeholder="e.g. 30000" />
          </div>
          <div>
            <label htmlFor="radar-radius" className="label">Radius (km)</label>
            <input id="radar-radius" inputMode="numeric" className="input" value={radius} onChange={(e) => setRadius(e.target.value.replace(/\D/g, ''))} />
          </div>
          <div className="flex items-end">
            <button type="button" onClick={search} disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Search
            </button>
          </div>
        </div>
        {error ? <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      </div>

      {loading && !result ? <CardSkeleton rows={4} /> : null}

      {result ? (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="card p-4">
              <p className="text-xs text-slate-500">Training centres</p>
              <p className="mt-1 text-2xl font-bold text-navy">{result.providerCount}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-slate-500">Courses found</p>
              <p className="mt-1 text-2xl font-bold text-navy">{result.courseCount}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-slate-500">Vacancy records</p>
              <p className="mt-1 text-2xl font-bold text-navy">{result.vacancyCount}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-slate-500">Apprenticeship records</p>
              <p className="mt-1 text-2xl font-bold text-navy">{result.apprenticeshipCount}</p>
            </div>
          </div>

          {mapPoints.length > 0 ? (
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-navy">
                <MapPinned className="h-4 w-4 text-royal-600" /> Map — {result.originLabel}
              </h3>
              <OpportunityMap points={mapPoints} center={center} />
              <p className="mt-1 text-[11px] text-slate-400">
                Blue pins: training centres (education providers — not employers). Positions are approximate district-level demo coordinates.
              </p>
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-2">
            <section>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
                <GraduationCap className="h-4 w-4 text-royal-600" /> Training centres & courses
              </h3>
              <div className="mt-3 space-y-3">
                {result.providers.map((p) => (
                  <div key={p.id} className="card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-navy">{p.name}</h4>
                      <VerificationBadge status={p.verificationStatus} isSynthetic={p.isSynthetic} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {p.type.replace(/_/g, ' ')} · {p.city ?? p.district}, {p.district}, {p.state}
                      {p.distanceKm != null ? ` · ${p.distanceKm} km` : ''}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {p.courses.map((c) => (
                        <li key={`${p.id}-${c.tradeId}`} className="flex items-center justify-between text-xs text-slate-600">
                          <span>{c.tradeName} · {c.durationMonths} months</span>
                          <span>{c.feeMax ? `${formatINR(c.feeMin ?? 0)}–${formatINR(c.feeMax)}` : 'fee n/a'}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {result.providers.length === 0 ? (
                  <EmptyState title="No training centres match" description="Try widening the radius or clearing filters." />
                ) : null}
              </div>
            </section>

            <section>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
                <Briefcase className="h-4 w-4 text-teal-600" /> Employment records
              </h3>
              <div className="mt-3 space-y-3">
                {result.opportunities.map((o) => (
                  <div key={o.id} className="card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-navy">{o.title}</h4>
                      <span
                        className={cn(
                          'badge',
                          o.kind === 'VACANCY'
                            ? 'bg-teal-100 text-teal-800'
                            : o.kind === 'APPRENTICESHIP'
                              ? 'bg-royal-100 text-royal-800'
                              : 'bg-slate-100 text-slate-600',
                        )}
                      >
                        {o.kind === 'VACANCY' ? 'Vacancy record' : o.kind === 'APPRENTICESHIP' ? 'Apprenticeship' : 'Employer segment'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {o.employmentType.replace(/_/g, ' ')} · {o.sector.replace(/_/g, ' ')}
                      {o.employerName ? ` · ${o.employerName}` : ''}
                      {o.district ? ` · ${o.district}${o.state ? `, ${o.state}` : ''}` : ''}
                      {o.openPositions ? ` · ${o.openPositions} position(s)` : ''}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{o.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <VerificationBadge status={o.verificationStatus} isSynthetic={o.isSynthetic} />
                      {o.sourceUrl ? (
                        <a href={o.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-royal-600 hover:underline">
                          Verify on official portal ↗
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
                {result.opportunities.length === 0 ? (
                  <EmptyState title="No employment records for this filter" description="Employer-segment descriptions appear once records exist for the selected state." />
                ) : null}
              </div>
            </section>
          </div>

          <div className="card border-amber-200 bg-amber-50 p-4">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-800">
              <AlertTriangle className="h-3.5 w-3.5" /> How to read these results
            </h4>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-900">
              {result.notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          </div>
        </>
      ) : null}

      {!result && !loading ? (
        <EmptyState
          title="Find opportunities near you"
          description="Search training centres, courses, apprenticeships and employer records by state and district."
          icon={<MapPin className="h-5 w-5" />}
        />
      ) : null}
    </div>
  );
}

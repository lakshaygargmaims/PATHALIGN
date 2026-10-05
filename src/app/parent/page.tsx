'use client';

import Link from 'next/link';
import {
  ArrowRight,
  MessageSquareText,
  Users,
  ShieldAlert,
  Plus,
  Gauge,
  Scale,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { useState } from 'react';
import { useApi, apiJson, ApiClientError } from '@/lib/hooks';
import { useToast } from '@/components/toast';
import { CardSkeleton, EmptyState } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/badges';
import { formatINR } from '@/lib/utils';

interface Me {
  user: { fullName: string };
  family: { code: string; relation: string; consentGranted: boolean } | null;
  hasParentProfile: boolean;
}
interface FamilyData {
  members: Array<{ id: string; name: string; relation: string; consentGranted: boolean }>;
  studentProfile: { interests: string[]; aspirations: string | null } | null;
  parentProfile: { careerExpectations: string | null; financialConcerns: string | null } | null;
  myConsent: boolean;
}
interface ConcernList {
  concerns: Array<{ id: string; category: string; detail: string; status: string; createdAt: string }>;
}
interface Confidence {
  comparison: { latestScore: number | null; change: number | null } | null;
}
interface ConsensusData {
  consensus: { id: string; status: string; aiSummary: string | null } | null;
}
interface TradeLite {
  trades: Array<{ id: string; name: string }>;
}

const CONCERN_OPTIONS = [
  { value: 'LOW_SALARY', label: 'Low salary / earnings' },
  { value: 'JOB_SECURITY', label: 'Job security' },
  { value: 'SOCIAL_STATUS', label: 'Social status / respect' },
  { value: 'SAFETY', label: 'Safety' },
  { value: 'TRADITIONAL_DEGREE', label: 'Preference for traditional degree' },
  { value: 'FURTHER_EDUCATION', label: 'Further education options' },
  { value: 'FINANCIAL_LIMITATION', label: 'Financial limitations' },
  { value: 'LACK_OF_AWARENESS', label: 'Lack of awareness' },
  { value: 'FAMILY_PRESSURE', label: 'Family / social pressure' },
  { value: 'OTHER', label: 'Something else' },
];

export default function ParentDashboard() {
  const { toast } = useToast();
  const me = useApi<Me>('/api/auth/me');
  const family = useApi<FamilyData>('/api/families');
  const concerns = useApi<ConcernList>('/api/interests');
  const confidence = useApi<Confidence>('/api/confidence');
  const consensus = useApi<ConsensusData>('/api/consensus');
  const trades = useApi<TradeLite>('/api/public/careers');

  const [showConcern, setShowConcern] = useState(false);
  const [category, setCategory] = useState('JOB_SECURITY');
  const [detail, setDetail] = useState('');
  const [saving, setSaving] = useState(false);

  if (me.loading) return <CardSkeleton rows={5} />;

  const openConcerns = concerns.data?.concerns.filter((c) => c.status === 'OPEN') ?? [];
  const studentInterests = family.data?.studentProfile?.interests ?? [];

  const submitConcern = async () => {
    setSaving(true);
    try {
      await apiJson('/api/interests', 'POST', { action: 'concern', category, detail, language: 'EN' });
      toast('Concern recorded — it will appear in counselling analytics.', 'success');
      setDetail('');
      setShowConcern(false);
      concerns.refetch();
    } catch (err) {
      toast(err instanceof ApiClientError ? err.message : 'Could not save concern', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="card bg-navy p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Namaste, {me.data?.user.fullName.split(' ')[0] ?? ''} 🙏</h2>
            <p className="mt-1 text-sm text-slate-300">
              Review the information, share your concerns, and decide together with your child — no pressure either way.
            </p>
          </div>
          <div className="rounded-lg bg-white/10 px-4 py-2 text-sm">
            Family code: <span className="font-bold text-teal-300">{me.data?.family?.code ?? 'not joined yet'}</span>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Link href="/parent/counsellor" className="rounded-lg bg-white/10 p-4 hover:bg-white/15">
            <MessageSquareText className="h-5 w-5 text-teal-300" />
            <p className="mt-2 text-sm font-semibold">Talk to the AI counsellor</p>
            <p className="text-xs text-slate-400">Ask in Hindi or English, with sources</p>
          </Link>
          <Link href="/parent/consensus" className="rounded-lg bg-white/10 p-4 hover:bg-white/15">
            <Scale className="h-5 w-5 text-teal-300" />
            <p className="mt-2 text-sm font-semibold">Family Decisions</p>
            <p className="text-xs text-slate-400">
              Status: <span className="capitalize">{consensus.data?.consensus?.status.replace(/_/g, ' ').toLowerCase() ?? 'not started'}</span>
            </p>
          </Link>
          <Link href="/parent/comparison" className="rounded-lg bg-white/10 p-4 hover:bg-white/15">
            <Users className="h-5 w-5 text-teal-300" />
            <p className="mt-2 text-sm font-semibold">Compare two careers</p>
            <p className="text-xs text-slate-400">Duration, cost, earnings, progression</p>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {/* Concerns */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-navy">
              <ShieldAlert className="h-4 w-4 text-amber-500" /> Your concerns
            </h3>
            <button type="button" onClick={() => setShowConcern((v) => !v)} className="btn-secondary px-3 py-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" /> Add concern
            </button>
          </div>

          {showConcern ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <label htmlFor="concern-category" className="label">
                What is your concern about?
              </label>
              <select id="concern-category" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CONCERN_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <label htmlFor="concern-detail" className="label mt-3">
                Describe it in your own words
              </label>
              <textarea
                id="concern-detail"
                className="input min-h-[90px]"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="e.g. What if the salary after training is too low for our family?"
              />
              <button
                type="button"
                onClick={submitConcern}
                disabled={saving || detail.trim().length < 3}
                className="btn-primary mt-3"
              >
                {saving ? 'Saving…' : 'Record concern'}
              </button>
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            {concerns.loading ? (
              <p className="text-sm text-slate-400">Loading…</p>
            ) : (concerns.data?.concerns.length ?? 0) === 0 ? (
              <EmptyState
                title="No concerns recorded yet"
                description="Write down what worries you — the AI counsellor and human counsellors use these to answer properly."
              />
            ) : (
              concerns.data!.concerns.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 p-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-royal-600">
                      {CONCERN_OPTIONS.find((o) => o.value === c.category)?.label ?? c.category}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{c.detail}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="flex items-center gap-2 font-semibold text-navy">
              <Gauge className="h-4 w-4 text-teal-600" /> Confidence score
            </h3>
            <p className="mt-2 text-3xl font-bold text-navy">
              {confidence.data?.comparison?.latestScore ?? '—'}
              <span className="text-sm font-medium text-slate-400">/100</span>
            </p>
            {confidence.data?.comparison?.change != null ? (
              <p className={`text-xs ${confidence.data.comparison.change >= 0 ? 'text-teal-600' : 'text-red-500'}`}>
                {confidence.data.comparison.change >= 0 ? '+' : ''}
                {confidence.data.comparison.change} change after counselling
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-400">Complete the questionnaire before and after counselling</p>
            )}
            <Link href="/parent/confidence" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-royal-600 hover:underline">
              Open <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="card p-5">
            <h3 className="flex items-center gap-2 font-semibold text-navy">
              <CheckCircle2 className="h-4 w-4 text-teal-600" /> Sharing consent
            </h3>
            <p className="mt-2 text-xs text-slate-500">
              {family.data?.myConsent
                ? 'Your family profile is currently shared inside your family group. You can revoke this anytime.'
                : 'In-family sharing is currently revoked — family features are limited until you re-enable it.'}
            </p>
            <Link href="/parent/profile" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-royal-600 hover:underline">
              Privacy controls <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {studentInterests.length > 0 ? (
            <div className="card p-5">
              <h3 className="font-semibold text-navy">Student’s stated interests</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {studentInterests.map((i) => (
                  <span key={i} className="badge bg-royal-50 text-royal-700">
                    {i}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">Visible because sharing consent is enabled.</p>
            </div>
          ) : null}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-navy">Verified career information</h3>
          <Link href="/parent/careers" className="text-sm font-semibold text-royal-600 hover:underline">
            Explore all →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {(trades.data?.trades ?? []).slice(0, 3).map((t) => (
            <Link key={t.id} href={`/parent/careers`} className="card card-hover p-5">
              <h4 className="text-sm font-semibold text-navy">{t.name}</h4>
            </Link>
          ))}
          {!trades.loading && (trades.data?.trades.length ?? 0) === 0 ? (
            <p className="text-sm text-slate-400">No records available.</p>
          ) : null}
        </div>
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h4 className="text-sm font-semibold text-navy">Ready to review everything together?</h4>
          <p className="text-xs text-slate-500">
            Generate the Family Career Agreement Report — profile, concerns, recommendations, sources and next steps in
            one printable document.
          </p>
        </div>
        <Link href="/parent/reports" className="btn-primary shrink-0">
          <FileText className="h-4 w-4" /> Open reports
        </Link>
      </section>

      <p className="pb-4 text-center text-xs text-slate-400">
        Entry earning estimate example: {formatINR(12000)}–{formatINR(18000)}/month for electrician — always shown as an
        estimate with its source record.
      </p>
    </div>
  );
}

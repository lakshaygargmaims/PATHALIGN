'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Users,
  Plus,
  X,
  Loader2,
  Scale,
  CheckCircle2,
  AlertTriangle,
  MessageCircle,
  FileSignature,
  Lightbulb,
} from 'lucide-react';
import { apiFetch, apiJson, useApi, ApiClientError } from '@/lib/hooks';
import { useToast } from '@/components/toast';
import { CardSkeleton, EmptyState } from '@/components/ui/states';
import { StatusBadge, VerificationBadge } from '@/components/ui/badges';
import { cn } from '@/lib/utils';

interface Pick {
  tradeId?: string;
  label: string;
}

interface ConsensusRecord {
  id: string;
  status: string;
  studentPicks: Pick[];
  parentPicks: Pick[];
  common: string[];
  disagreements: string[];
  concerns: { student?: string[]; parent?: string[]; shared?: string[] };
  recommendations: Array<{ title: string; rationale: string; tradeId?: string }>;
  evidence: Array<{ trade: string; durationMonths: number; feeRange: string | null; earningEstimate: string | null; verificationStatus: string; sources: string[] }>;
  aiSummary: string | null;
  studentDecision: string | null;
  parentDecision: string | null;
  updatedAt: string;
}

interface ConsensusResponse {
  consensus: ConsensusRecord | null;
  history: ConsensusRecord[];
}

interface MeResponse {
  family: { code: string; relation: string } | null;
}

interface TradeOption {
  id: string;
  name: string;
  slug: string;
  category: string;
}

const STATUS_HELP: Record<string, string> = {
  AGREED: 'You both selected the same options — a strong basis for a joint decision.',
  PARTIALLY_AGREED: 'There is some overlap. Review the differences and see if the alternatives help.',
  NEEDS_DISCUSSION: 'No overlap yet. List your must-haves separately, or request a counsellor.',
  OPEN: 'Waiting for both participants to save their preferences.',
};

export function ConsensusPanel() {
  const { toast } = useToast();
  const me = useApi<MeResponse>('/api/auth/me');
  const { data, loading, refetch } = useApi<ConsensusResponse>('/api/consensus');
  const { data: tradeList } = useApi<{ trades: TradeOption[] }>('/api/careers/trades?pageSize=100');

  const [picks, setPicks] = useState<Pick[]>([]);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [newPick, setNewPick] = useState('');
  const [newConcern, setNewConcern] = useState('');
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [decision, setDecision] = useState('');
  const [error, setError] = useState<string | null>(null);

  const relation = me.data?.family?.relation ?? 'STUDENT';
  const participant: 'STUDENT' | 'PARENT' = relation === 'STUDENT' ? 'STUDENT' : 'PARENT';

  const consensus = data?.consensus ?? null;
  const sideSaved = participant === 'STUDENT' ? (consensus?.studentPicks?.length ?? 0) > 0 : (consensus?.parentPicks?.length ?? 0) > 0;
  const otherSideSaved = participant === 'STUDENT' ? (consensus?.parentPicks?.length ?? 0) > 0 : (consensus?.studentPicks?.length ?? 0) > 0;

  useEffect(() => {
    if (!consensus) return;
    setPicks(participant === 'STUDENT' ? consensus.studentPicks ?? [] : consensus.parentPicks ?? []);
    setConcerns(participant === 'STUDENT' ? consensus.concerns?.student ?? [] : consensus.concerns?.parent ?? []);
  }, [consensus?.id, participant]); // eslint-disable-line react-hooks/exhaustive-deps

  const addPick = () => {
    const match = (tradeList?.trades ?? []).find((t) => t.name.toLowerCase() === newPick.trim().toLowerCase());
    const loose = match ?? (tradeList?.trades ?? []).find((t) => t.name.toLowerCase().includes(newPick.trim().toLowerCase()));
    if (!newPick.trim()) return;
    if (picks.some((p) => p.label.toLowerCase() === newPick.trim().toLowerCase())) {
      setError('That option is already in your list.');
      return;
    }
    if (picks.length >= 6) {
      setError('You can shortlist up to 6 options.');
      return;
    }
    setPicks([...picks, { label: newPick.trim(), tradeId: loose?.id }]);
    setNewPick('');
    setError(null);
  };

  const addConcern = () => {
    if (!newConcern.trim()) return;
    setConcerns([...concerns, newConcern.trim()]);
    setNewConcern('');
  };

  const saveMySide = async () => {
    setSaving(true);
    setError(null);
    try {
      const fam = await apiFetch<{ family: { id: string } | null }>('/api/families');
      if (!fam.family) {
        setError('Join or create a family group first (see your Profile page).');
        return;
      }
      if (picks.length === 0) {
        setError('Add at least one career option before saving.');
        return;
      }
      await apiJson('/api/consensus', 'POST', {
        action: 'savePicks',
        familyId: fam.family.id,
        participant,
        picks,
        concerns,
      });
      toast('Your preferences are saved.', 'success');
      refetch();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not save your preferences');
    } finally {
      setSaving(false);
    }
  };

  const runAnalysis = async () => {
    if (!consensus) return;
    setAnalyzing(true);
    setError(null);
    try {
      await apiJson('/api/consensus', 'POST', { action: 'analyze', consensusId: consensus.id });
      toast('Analysis complete.', 'success');
      refetch();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const submitDecision = async () => {
    if (!consensus || !decision.trim()) return;
    setSaving(true);
    try {
      await apiJson('/api/consensus', 'POST', {
        action: 'decision',
        consensusId: consensus.id,
        participant,
        decision: decision.trim(),
      });
      toast('Your decision has been recorded.', 'success');
      setDecision('');
      refetch();
    } catch (err) {
      toast(err instanceof ApiClientError ? err.message : 'Could not save decision', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading || me.loading) return <CardSkeleton rows={5} />;

  if (!me.data?.family) {
    return (
      <EmptyState
        title="Join a family group first"
        description="The consensus engine compares your preferences with your parent's. Create or join a family with a code from your Profile page."
      />
    );
  }

  const analyzed = consensus && consensus.status !== 'OPEN';

  return (
    <div className="space-y-6">
      {/* Participant picker */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-navy">
              <Users className="h-5 w-5 text-royal-600" /> Your shortlist
              <span className="badge bg-royal-100 text-royal-700">{participant === 'STUDENT' ? 'Student' : 'Parent'}</span>
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Pick careers you would genuinely accept. Your counterpart does this independently — nobody sees the other
              side until both have saved.
            </p>
          </div>
          <div className="flex gap-2 text-xs">
            <span className={cn('rounded-full px-3 py-1', sideSaved ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-500')}>
              You: {sideSaved ? 'saved' : 'pending'}
            </span>
            <span className={cn('rounded-full px-3 py-1', otherSideSaved ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-500')}>
              {participant === 'STUDENT' ? 'Parent' : 'Student'}: {otherSideSaved ? 'saved' : 'pending'}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            className="input flex-1"
            list="consensus-trades"
            placeholder="Type a career, e.g. Electrician…"
            value={newPick}
            onChange={(e) => setNewPick(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPick()}
            aria-label="Career option"
          />
          <datalist id="consensus-trades">
            {(tradeList?.trades ?? []).map((t) => (
              <option key={t.id} value={t.name} />
            ))}
          </datalist>
          <button type="button" onClick={addPick} className="btn-secondary">
            <Plus className="h-4 w-4" /> Add option
          </button>
        </div>

        {picks.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {picks.map((p, i) => (
              <li key={`${p.label}-${i}`} className="inline-flex items-center gap-1.5 rounded-full bg-royal-50 px-3 py-1.5 text-sm text-royal-800">
                {p.label}
                {p.tradeId ? <span className="text-[10px] text-royal-400">(catalogue match)</span> : null}
                <button
                  type="button"
                  onClick={() => setPicks(picks.filter((_, idx) => idx !== i))}
                  aria-label={`Remove ${p.label}`}
                  className="rounded-full p-0.5 hover:bg-royal-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-400">No options added yet.</p>
        )}

        <div className="mt-5">
          <label htmlFor="consensus-concern" className="label">
            Your concerns (optional, shared with the analysis)
          </label>
          <div className="flex gap-2">
            <input
              id="consensus-concern"
              className="input flex-1"
              placeholder="e.g. Salary in the first two years"
              value={newConcern}
              onChange={(e) => setNewConcern(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addConcern()}
            />
            <button type="button" onClick={addConcern} className="btn-secondary">
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
          {concerns.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {concerns.map((c, i) => (
                <li key={`${c}-${i}`} className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs text-amber-800">
                  {c}
                  <button type="button" onClick={() => setConcerns(concerns.filter((_, idx) => idx !== i))} aria-label="Remove concern">
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {error ? <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={saveMySide} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Save my preferences
          </button>
          <button
            type="button"
            onClick={runAnalysis}
            disabled={analyzing || !consensus}
            className="btn-teal"
            title={!consensus ? 'Save your preferences first' : 'Run the comparison'}
          >
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scale className="h-4 w-4" />}
            {analyzing ? 'Analysing…' : 'Run consensus analysis'}
          </button>
        </div>
        {consensus && !otherSideSaved ? (
          <p className="mt-2 text-xs text-slate-500">
            The analysis runs once both sides have saved their preferences. You can still save yours now.
          </p>
        ) : null}
      </div>

      {/* Results */}
      {analyzed && consensus ? (
        <>
          <div className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
                <Lightbulb className="h-5 w-5 text-teal-600" /> Consensus result
              </h2>
              <StatusBadge status={consensus.status} />
            </div>
            <p className="mt-2 text-sm text-slate-600">{STATUS_HELP[consensus.status] ?? ''}</p>
            {consensus.aiSummary ? <p className="mt-2 text-sm text-slate-500">{consensus.aiSummary}</p> : null}

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-teal-800">Common interests</h3>
                <ul className="mt-2 space-y-1 text-sm text-teal-900">
                  {(consensus.common ?? []).map((c) => (
                    <li key={c}>✓ {c}</li>
                  ))}
                  {(consensus.common ?? []).length === 0 ? <li className="text-teal-600">None yet</li> : null}
                </ul>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-800">Student-only picks</h3>
                <ul className="mt-2 space-y-1 text-sm text-amber-900">
                  {(consensus.studentPicks ?? [])
                    .filter((p) => !(consensus.common ?? []).includes(p.label))
                    .map((p, i) => (
                      <li key={`${p.label}-${i}`}>{p.label}</li>
                    ))}
                </ul>
              </div>
              <div className="rounded-lg border border-royal-200 bg-royal-50 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-royal-800">Parent-only picks</h3>
                <ul className="mt-2 space-y-1 text-sm text-royal-900">
                  {(consensus.parentPicks ?? [])
                    .filter((p) => !(consensus.common ?? []).includes(p.label))
                    .map((p, i) => (
                      <li key={`${p.label}-${i}`}>{p.label}</li>
                    ))}
                </ul>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-navy">
                  <MessageCircle className="h-4 w-4 text-amber-500" /> Concerns on the table
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {(consensus.concerns?.student ?? []).map((c, i) => (
                    <li key={`s-${i}`}>Student: {c}</li>
                  ))}
                  {(consensus.concerns?.parent ?? []).map((c, i) => (
                    <li key={`p-${i}`}>Parent: {c}</li>
                  ))}
                  {(consensus.concerns?.shared ?? []).map((c, i) => (
                    <li key={`sh-${i}`} className="font-medium text-teal-700">Shared: {c}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-navy">
                  <AlertTriangle className="h-4 w-4 text-royal-500" /> Disagreements
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {(consensus.disagreements ?? []).map((d, i) => (
                    <li key={i}>• {d}</li>
                  ))}
                  {(consensus.disagreements ?? []).length === 0 ? <li className="text-slate-400">None — full overlap</li> : null}
                </ul>
              </div>
            </div>
          </div>

          {/* Recommendations + evidence */}
          <div className="card p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
              <Scale className="h-5 w-5 text-royal-600" /> Recommended pathways
            </h2>
            <div className="mt-3 space-y-3">
              {(consensus.recommendations ?? []).map((r, i) => (
                <div key={i} className="rounded-lg border border-slate-100 p-4">
                  <p className="text-sm font-semibold text-navy">{r.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{r.rationale}</p>
                </div>
              ))}
              {(consensus.recommendations ?? []).length === 0 ? (
                <p className="text-sm text-slate-400">Run the analysis to see recommendations.</p>
              ) : null}
            </div>

            {(consensus.evidence ?? []).length > 0 ? (
              <div className="mt-5 overflow-x-auto">
                <h3 className="text-sm font-semibold text-navy">Supporting evidence</h3>
                <table className="mt-2 w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Trade</th>
                      <th className="px-3 py-2">Duration</th>
                      <th className="px-3 py-2">Fee range</th>
                      <th className="px-3 py-2">Entry earning (estimate)</th>
                      <th className="px-3 py-2">Record status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {consensus.evidence.map((e, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-medium text-navy">{e.trade}</td>
                        <td className="px-3 py-2">{e.durationMonths} months</td>
                        <td className="px-3 py-2">{e.feeRange ?? '—'}</td>
                        <td className="px-3 py-2">{e.earningEstimate ?? '—'}</td>
                        <td className="px-3 py-2">
                          <VerificationBadge status={e.verificationStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>

          {/* Voluntary decisions */}
          <div className="card p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
              <FileSignature className="h-5 w-5 text-teal-600" /> Voluntary decisions
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Nobody is required to agree. Each participant may record their own decision — it is stored exactly as
              written.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Student’s decision</h3>
                <p className="mt-2 text-sm text-slate-700">{consensus.studentDecision ?? <em className="text-slate-400">Not recorded yet</em>}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Parent’s decision</h3>
                <p className="mt-2 text-sm text-slate-700">{consensus.parentDecision ?? <em className="text-slate-400">Not recorded yet</em>}</p>
              </div>
            </div>

            {!((participant === 'STUDENT' && consensus.studentDecision) || (participant === 'PARENT' && consensus.parentDecision)) ? (
              <div className="mt-4">
                <label htmlFor="my-decision" className="label">
                  Record your decision
                </label>
                <textarea
                  id="my-decision"
                  className="input min-h-[80px]"
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  placeholder="e.g. I agree to electrician training if the institute record is verified."
                />
                <button type="button" onClick={submitDecision} disabled={saving || !decision.trim()} className="btn-primary mt-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Save my decision
                </button>
              </div>
            ) : null}
          </div>
        </>
      ) : null}

      {!analyzed ? (
        <EmptyState
          title="No completed consensus yet"
          description="Both participants save their shortlists, then run the analysis to see overlaps, disagreements and alternatives."
          icon={<Scale className="h-5 w-5" />}
        />
      ) : null}
    </div>
  );
}

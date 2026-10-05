'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LifeBuoy, Plus, ShieldQuestion } from 'lucide-react';
import { apiJson, useApi } from '@/lib/hooks';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/badges';
import { formatDateTime } from '@/lib/utils';

interface CaseRow {
  id: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  summaryShared: boolean;
  createdAt: string;
  resolvedAt: string | null;
  counsellor: { user: { fullName: string } } | null;
  _count?: { notes: number; appointments: number };
}

const CATEGORIES = [
  { value: 'LOW_SALARY', label: 'Salary is too low' },
  { value: 'JOB_SECURITY', label: 'No job security' },
  { value: 'SOCIAL_STATUS', label: 'Social status / reputation' },
  { value: 'SAFETY', label: 'Safety concerns' },
  { value: 'TRADITIONAL_DEGREE', label: 'Prefers a traditional degree' },
  { value: 'FURTHER_EDUCATION', label: 'Wants further study first' },
  { value: 'FINANCIAL_LIMITATION', label: 'Fees are unaffordable' },
  { value: 'LACK_OF_AWARENESS', label: 'Does not know enough yet' },
  { value: 'FAMILY_PRESSURE', label: 'Family / social pressure' },
  { value: 'OTHER', label: 'Something else' },
];

export function CasesPanel({ basePath }: { basePath: string }) {
  const { data, loading, error, refetch } = useApi<{ cases: CaseRow[] }>('/api/cases');
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('LOW_SALARY');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    setNotice(null);
    try {
      const res = await apiJson<{ assigned: boolean; message?: string }>('/api/cases', 'POST', {
        subject,
        description,
        category,
        shareConversation: false,
      });
      setNotice(
        res.message ??
          (res.assigned
            ? 'Your request was sent and a counsellor has been assigned.'
            : 'Your request was received and is queued for the next available counsellor.'),
      );
      setSubject('');
      setDescription('');
      setOpen(false);
      refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not raise the request');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-navy">
              <LifeBuoy className="h-5 w-5 text-royal-600" /> Support cases
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Escalate anything the AI counsellor could not resolve. A human counsellor picks it up and you can track
              progress here. Your chat history is never shared automatically.
            </p>
          </div>
          <button type="button" onClick={() => setOpen((v) => !v)} className="btn-primary text-xs">
            <Plus className="h-4 w-4" /> Ask a counsellor
          </button>
        </div>

        {open ? (
          <form onSubmit={submit} className="mt-5 space-y-3 border-t border-slate-100 pt-4">
            <div>
              <label htmlFor="case-subject" className="text-xs font-semibold text-navy">
                Subject
              </label>
              <input
                id="case-subject"
                required
                minLength={4}
                maxLength={180}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input mt-1 w-full"
                placeholder="Short summary of what you need help with"
              />
            </div>
            <div>
              <label htmlFor="case-category" className="text-xs font-semibold text-navy">
                What is the concern about?
              </label>
              <select
                id="case-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input mt-1 w-full"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="case-description" className="text-xs font-semibold text-navy">
                Describe the concern
              </label>
              <textarea
                id="case-description"
                required
                minLength={10}
                maxLength={4000}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input mt-1 w-full"
                placeholder="What exactly is worrying you? Include any figures or facts you already have."
              />
            </div>
            {formError ? <p className="text-xs text-red-600">{formError}</p> : null}
            {notice ? <p className="text-xs text-teal-700">{notice}</p> : null}
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="btn-primary text-xs">
                {busy ? 'Sending…' : 'Send to a counsellor'}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="btn-secondary text-xs">
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </section>

      {loading ? (
        <CardSkeleton rows={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data?.cases.length === 0 ? (
        <EmptyState
          title="No support cases yet"
          description="If something is unresolved, raise it here and a human counsellor will respond."
        />
      ) : (
        <div className="space-y-3">
          {data!.cases.map((c) => (
            <article key={c.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`${basePath}/cases/${c.id}`} className="text-sm font-semibold text-navy hover:text-royal-600">
                    {c.subject}
                  </Link>
                  <p className="mt-0.5 text-xs capitalize text-slate-500">
                    {c.category.replace(/_/g, ' ').toLowerCase()} · raised {formatDateTime(c.createdAt)}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <p className="mt-3 line-clamp-2 text-xs text-slate-600">{c.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span>
                  Counsellor:{' '}
                  <span className="font-medium text-navy">{c.counsellor?.user.fullName ?? 'being assigned'}</span>
                </span>
                <span>{(c._count?.appointments ?? 0)} appointment(s)</span>
                {!c.summaryShared ? (
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <ShieldQuestion className="h-3 w-3" /> Chat not shared
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

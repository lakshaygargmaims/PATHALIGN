'use client';

import { useState } from 'react';
import { FileText, Download, Loader2, Plus } from 'lucide-react';
import { apiJson, useApi } from '@/lib/hooks';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/badges';
import { formatDateTime } from '@/lib/utils';

interface ReportRow {
  id: string;
  type: string;
  language: string;
  status: string;
  createdAt: string;
  familyId: string | null;
}

const TYPES = [
  { value: 'FAMILY_AGREEMENT', label: 'Family Career Agreement' },
  { value: 'COUNSELLING_SUMMARY', label: 'Counselling Summary' },
  { value: 'CAREER_ANALYSIS', label: 'Career Analysis' },
] as const;

const TYPE_LABEL: Record<string, string> = Object.fromEntries(TYPES.map((t) => [t.value, t.label]));

export function ReportsPanel() {
  const { data, loading, error, refetch } = useApi<{ reports: ReportRow[] }>('/api/reports');
  const [type, setType] = useState<string>('FAMILY_AGREEMENT');
  const [language, setLanguage] = useState<'EN' | 'HI'>('EN');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setActionError(null);
    try {
      await apiJson('/api/reports', 'POST', { type, language });
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not generate the report');
    } finally {
      setBusy(false);
    }
  };

  const download = (id: string) => {
    window.open(`/api/reports/${id}/pdf?download=1`, '_blank');
  };

  const view = (id: string) => {
    window.open(`/api/reports/${id}/pdf`, '_blank');
  };

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-semibold text-navy">
          <FileText className="h-5 w-5 text-royal-600" /> Family Career Agreement Report
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          One printable document combining family profile, student interests, parent concerns, consensus, recommended
          careers, verified earnings, providers and next steps. Regenerate it any time after new activity.
        </p>

        <form onSubmit={create} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="report-type" className="block text-xs font-semibold text-navy">
              Report type
            </label>
            <select id="report-type" value={type} onChange={(e) => setType(e.target.value)} className="input mt-1 w-64">
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="report-lang" className="block text-xs font-semibold text-navy">
              Language
            </label>
            <select
              id="report-lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'EN' | 'HI')}
              className="input mt-1 w-32"
            >
              <option value="EN">English</option>
              <option value="HI">Hindi</option>
            </select>
          </div>
          <button type="submit" disabled={busy} className="btn-primary text-xs">
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            {busy ? 'Generating…' : 'Generate report'}
          </button>
          {actionError ? <p className="w-full text-xs text-red-600">{actionError}</p> : null}
        </form>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-navy">Generated reports</h3>
        {loading ? (
          <CardSkeleton rows={3} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data?.reports.length === 0 ? (
          <EmptyState
            title="No reports yet"
            description="Generate your first report above. It takes a second and can be downloaded as a PDF."
          />
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Report</th>
                  <th className="px-4 py-3">Language</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">PDF</th>
                </tr>
              </thead>
              <tbody>
                {data!.reports.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-sm font-semibold text-navy">
                      {TYPE_LABEL[r.type] ?? r.type.replace(/_/g, ' ').toLowerCase()}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{r.language}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => view(r.id)} className="btn-secondary px-2 py-1 text-[11px]">
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={() => download(r.id)}
                          className="btn-primary px-2 py-1 text-[11px]"
                        >
                          <Download className="h-3 w-3" /> PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

'use client';

import { FileDown, Download } from 'lucide-react';
import { useApi } from '@/lib/hooks';
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

const EXPORTS = [
  { type: 'overview', label: 'Platform overview' },
  { type: 'concerns', label: 'Concern breakdown' },
  { type: 'districts', label: 'District resistance' },
  { type: 'trades', label: 'Career database' },
  { type: 'users', label: 'User accounts' },
];

export default function AdminReports() {
  const { data, loading, error, refetch } = useApi<{ reports: ReportRow[] }>('/api/reports');

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-semibold text-navy">
          <FileDown className="h-5 w-5 text-royal-600" /> Reports &amp; exports
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Reports contain a family’s own profile, concerns and earnings estimates. Download them only where you have a
          lawful basis, and never republish them.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {EXPORTS.map((e) => (
            <a key={e.type} href={`/api/admin/export?type=${e.type}`} className="btn-secondary text-xs">
              <Download className="h-3 w-3" /> {e.label}
            </a>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-navy">Generated family reports</h3>
        {loading ? (
          <CardSkeleton rows={3} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data?.reports.length === 0 ? (
          <EmptyState title="No reports generated" description="Reports appear here once a family generates one." />
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
                      {r.type.replace(/_/g, ' ').toLowerCase()}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{r.language}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/api/reports/${r.id}/pdf?download=1`}
                        className="btn-primary px-2 py-1 text-[11px]"
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        <Download className="h-3 w-3" /> PDF
                      </a>
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

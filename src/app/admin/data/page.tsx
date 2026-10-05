'use client';

import { useState } from 'react';
import { DatabaseZap, Upload, Check, X, Download } from 'lucide-react';
import { apiJson, apiFetch, useApi } from '@/lib/hooks';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/badges';
import { formatDateTime, cn } from '@/lib/utils';

interface Batch {
  id: string;
  filename: string;
  recordType: string;
  status: string;
  rowCount: number;
  acceptedRows: number;
  notes: string | null;
  createdAt: string;
  uploadedBy: { fullName: string } | null;
  reviewedBy: { fullName: string } | null;
}

const RECORD_TYPES = ['TRADE', 'PROVIDER', 'OPPORTUNITY', 'KNOWLEDGE'] as const;
const EXPORTS = [
  { type: 'overview', label: 'Platform overview' },
  { type: 'concerns', label: 'Concern breakdown' },
  { type: 'districts', label: 'District resistance' },
  { type: 'trades', label: 'Career database' },
  { type: 'users', label: 'User accounts' },
];

export default function AdminData() {
  const { data, loading, error, refetch } = useApi<{ batches: Batch[] }>('/api/admin/imports');
  const [recordType, setRecordType] = useState<(typeof RECORD_TYPES)[number]>('TRADE');
  const [fileName, setFileName] = useState('');
  const [csv, setCsv] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    setCsv(await file.text());
    setNotice(null);
    setFormError(null);
  };

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csv.trim()) {
      setFormError('Choose a CSV file first.');
      return;
    }
    setBusy(true);
    setFormError(null);
    setNotice(null);
    try {
      const res = await apiJson<{ batch: Batch; preview: Array<Record<string, string>>; parseErrors: string[] }>(
        '/api/admin/imports',
        'POST',
        { filename: fileName || 'upload.csv', recordType, csv },
      );
      setNotice(
        `Staged ${res.batch.rowCount} row(s) from ${res.batch.filename} for review.` +
          (res.parseErrors.length ? ` ${res.parseErrors.length} row(s) had warnings.` : ''),
      );
      setCsv('');
      setFileName('');
      refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setBusy(false);
    }
  };

  const review = async (batchId: string, decision: 'APPROVED' | 'REJECTED') => {
    setReviewing(batchId);
    setNotice(null);
    try {
      const res = await apiJson<{ batch: Batch; applied?: { created: number; skipped: number } }>(
        '/api/admin/imports',
        'POST',
        { action: 'review', batchId, decision },
      );
      setNotice(
        decision === 'APPROVED'
          ? `Applied ${res.applied?.created ?? 0} record(s), skipped ${res.applied?.skipped ?? 0}.`
          : 'Batch rejected — nothing was written to the database.',
      );
      refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Review failed');
    } finally {
      setReviewing(null);
    }
  };

  const download = async (kind: 'template' | 'export', value: string) => {
    const url =
      kind === 'template'
        ? `/api/admin/imports?view=template&recordType=${value}`
        : `/api/admin/export?type=${value}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${kind === 'template' ? `template-${value.toLowerCase()}` : `pathalign-${value}`}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Download failed');
    }
  };

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-semibold text-navy">
          <DatabaseZap className="h-5 w-5 text-royal-600" /> Data import
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Uploads are staged for review and never written straight to the database. Imported records default to
          pending verification until a source is linked.
        </p>

        <form onSubmit={upload} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="record-type" className="text-xs font-semibold text-navy">
                Record type
              </label>
              <select
                id="record-type"
                value={recordType}
                onChange={(e) => setRecordType(e.target.value as (typeof RECORD_TYPES)[number])}
                className="input mt-1 w-full"
              >
                {RECORD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="block text-xs font-semibold text-navy">CSV template</span>
              <button
                type="button"
                onClick={() => download('template', recordType)}
                className="btn-secondary mt-1 text-xs"
              >
                <Download className="h-3 w-3" /> Download {recordType.toLowerCase()} template
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="csv-file" className="text-xs font-semibold text-navy">
              CSV file
            </label>
            <input
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => void onFile(e.target.files?.[0])}
              className="input mt-1 w-full text-xs"
            />
            {fileName ? <p className="mt-1 text-[11px] text-slate-500">Selected: {fileName}</p> : null}
          </div>

          {formError ? <p className="text-xs text-red-600">{formError}</p> : null}
          {notice ? <p className="text-xs text-teal-700">{notice}</p> : null}

          <button type="submit" disabled={busy} className="btn-primary text-xs">
            <Upload className="h-3 w-3" /> {busy ? 'Validating…' : 'Upload for review'}
          </button>
        </form>
      </section>

      <section className="card p-5">
        <h3 className="text-sm font-semibold text-navy">Import batches</h3>
        {loading ? (
          <CardSkeleton rows={3} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data?.batches.length === 0 ? (
          <EmptyState title="No imports yet" description="Upload a CSV above; it will appear here awaiting review." />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">File</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Rows</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Uploaded</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {data!.batches.map((b) => (
                  <tr key={b.id} className="border-t border-slate-100 align-top">
                    <td className="px-3 py-3">
                      <p className="text-sm font-semibold text-navy">{b.filename}</p>
                      {b.notes ? <p className="text-[11px] text-slate-500">{b.notes}</p> : null}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-600">{b.recordType}</td>
                    <td className="px-3 py-3 text-xs text-slate-600">
                      {b.rowCount}
                      {b.acceptedRows > 0 ? ` · ${b.acceptedRows} applied` : ''}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">
                      {formatDateTime(b.createdAt)}
                      <p className="text-slate-400">{b.uploadedBy?.fullName}</p>
                    </td>
                    <td className="px-3 py-3">
                      {b.status === 'PENDING_REVIEW' ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={reviewing === b.id}
                            onClick={() => review(b.id, 'APPROVED')}
                            className="btn-primary px-2 py-1 text-[11px]"
                          >
                            <Check className="h-3 w-3" /> Approve
                          </button>
                          <button
                            type="button"
                            disabled={reviewing === b.id}
                            onClick={() => review(b.id, 'REJECTED')}
                            className="btn-secondary px-2 py-1 text-[11px]"
                          >
                            <X className="h-3 w-3" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          {b.reviewedBy ? `by ${b.reviewedBy.fullName}` : 'Reviewed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card p-5">
        <h3 className="text-sm font-semibold text-navy">Exports</h3>
        <p className="mt-1 text-xs text-slate-500">CSV downloads of live aggregates. Handle as personal data.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {EXPORTS.map((e) => (
            <button
              key={e.type}
              type="button"
              onClick={() => download('export', e.type)}
              className={cn('btn-secondary text-xs')}
            >
              <Download className="h-3 w-3" /> {e.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

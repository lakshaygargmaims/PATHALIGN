'use client';

import { useState } from 'react';
import { School } from 'lucide-react';
import { useApi } from '@/lib/hooks';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/states';
import { VerificationBadge } from '@/components/ui/badges';

interface Provider {
  id: string;
  name: string;
  type: string;
  state: string;
  district: string;
  city: string | null;
  pinCode: string | null;
  lat: number | null;
  lng: number | null;
  website: string | null;
  affiliation: string | null;
  verificationStatus: string;
  source: { name: string } | null;
  _count: { courses: number };
}

export default function AdminProviders() {
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const qs = term ? `?search=${encodeURIComponent(term)}` : '';
  const { data, loading, error, refetch } = useApi<{ providers: Provider[] }>(`/api/admin/providers${qs}`, [term]);

  const missingGeo = (data?.providers ?? []).filter((p) => p.lat == null || p.lng == null).length;

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-navy">
              <School className="h-5 w-5 text-teal-600" /> Training providers
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {data?.providers.length ?? 0} provider(s) shown
              {missingGeo > 0 ? ` · ${missingGeo} missing coordinates, so they will not appear on the map` : ''}.
            </p>
          </div>
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setTerm(search.trim());
            }}
          >
            <div>
              <label htmlFor="provider-search" className="block text-xs font-semibold text-navy">
                Search
              </label>
              <input
                id="provider-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input mt-1 w-56"
                placeholder="Provider name"
              />
            </div>
            <button type="submit" className="btn-primary text-xs">
              Search
            </button>
          </form>
        </div>
      </section>

      {loading ? (
        <CardSkeleton rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data?.providers.length === 0 ? (
        <EmptyState title="No providers found" description="Import providers from CSV under Data &amp; Verification." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Courses</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data!.providers.map((p) => (
                <tr key={p.id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-navy">{p.name}</p>
                    {p.website ? (
                      <a
                        href={p.website}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-xs text-royal-600 hover:underline"
                      >
                        Website
                      </a>
                    ) : null}
                    {p.affiliation ? <p className="text-xs text-slate-400">{p.affiliation}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-xs capitalize text-slate-600">{p.type.replace(/_/g, ' ').toLowerCase()}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {p.city ?? p.district}, {p.district}
                    <p className="text-slate-400">{p.state}</p>
                    {p.lat == null || p.lng == null ? (
                      <p className="mt-1 text-[11px] text-amber-700">No coordinates</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{p._count.courses}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{p.source?.name ?? 'Unlinked'}</td>
                  <td className="px-4 py-3">
                    <VerificationBadge status={p.verificationStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

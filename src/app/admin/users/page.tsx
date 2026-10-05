'use client';

import { useState } from 'react';
import { UsersRound } from 'lucide-react';
import { useApi } from '@/lib/hooks';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/states';
import { RoleBadge } from '@/components/ui/badges';
import { formatDate, cn } from '@/lib/utils';

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  mobile: string | null;
  role: string;
  state: string;
  district: string;
  preferredLanguage: string;
  isActive: boolean;
  createdAt: string;
  _count: { sessions: number; familyMemberships: number };
}

interface UsersResponse {
  users: UserRow[];
  total: number;
  page: number;
  pageSize: number;
}

const ROLES = ['ALL', 'STUDENT', 'PARENT', 'COUNSELLOR', 'ADMIN'];

export default function AdminUsers() {
  const [role, setRole] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [term, setTerm] = useState('');

  const query = new URLSearchParams();
  if (role !== 'ALL') query.set('role', role);
  if (term) query.set('search', term);
  query.set('page', String(page));
  const path = `/api/admin/users?${query.toString()}`;
  const { data, loading, error, refetch } = useApi<UsersResponse>(path, [role, term, page]);

  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 25;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-navy">
              <UsersRound className="h-5 w-5 text-royal-600" /> User management
            </h2>
            <p className="mt-1 text-xs text-slate-500">{total} account(s) match the current filter.</p>
          </div>
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setTerm(search.trim());
            }}
          >
            <div>
              <label htmlFor="user-search" className="block text-xs font-semibold text-navy">
                Search
              </label>
              <input
                id="user-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input mt-1 w-56"
                placeholder="Name, email or district"
              />
            </div>
            <button type="submit" className="btn-primary text-xs">
              Search
            </button>
          </form>
        </div>

        <div className="mt-4 flex flex-wrap gap-1">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRole(r);
                setPage(1);
              }}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold capitalize',
                role === r ? 'bg-royal-600 text-white' : 'bg-surface text-slate-600 hover:bg-slate-200',
              )}
            >
              {r.toLowerCase()}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <CardSkeleton rows={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data?.users.length === 0 ? (
        <EmptyState title="No users found" description="Adjust the role filter or search term." />
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Language</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {data!.users.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-navy">{u.fullName}</p>
                      <p className="text-xs text-slate-500">
                        {u.email}
                        {u.mobile ? ` · ${u.mobile}` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {u.district}, {u.state}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{u.preferredLanguage}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={u.isActive ? 'badge bg-teal-100 text-teal-800' : 'badge bg-slate-200 text-slate-600'}>
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 ? (
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>
                Page {data!.page} of {pages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="btn-secondary px-3 py-1.5"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  className="btn-secondary px-3 py-1.5"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

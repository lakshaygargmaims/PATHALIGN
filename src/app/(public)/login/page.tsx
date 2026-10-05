'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, LogIn, KeyRound } from 'lucide-react';
import { apiJson, ApiClientError } from '@/lib/hooks';
import { useToast } from '@/components/toast';

const DEMO_ACCOUNTS = [
  { role: 'Student', email: 'student@pathalign.demo', password: 'Student@123' },
  { role: 'Parent', email: 'parent@pathalign.demo', password: 'Parent@123' },
  { role: 'Counsellor', email: 'counsellor@pathalign.demo', password: 'Counsel@123' },
  { role: 'Administrator', email: 'admin@pathalign.demo', password: 'Admin@123' },
];

function dashFor(role: string): string {
  return role === 'STUDENT' ? '/student' : role === 'PARENT' ? '/parent' : role === 'COUNSELLOR' ? '/counsellor' : '/admin';
}

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiJson<{ user: { role: string } }>('/api/auth/login', 'POST', { email, password });
      toast('Welcome back!', 'success');
      router.replace(dashFor(res.user.role));
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
      <div>
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">Log in to PATHALIGN AI</h1>
        <p className="mt-2 text-sm text-slate-500">
          Access your family counselling workspace. Sessions are secure, HTTP-only and expire automatically.
        </p>

        <form onSubmit={submit} className="card mt-6 space-y-4 p-6" noValidate>
          <div>
            <label htmlFor="email" className="label">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="label">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="text-center text-sm text-slate-500">
            New here?{' '}
            <Link href="/register" className="font-semibold text-royal-600 hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </div>

      <aside className="card p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-navy">
          <KeyRound className="h-4 w-4 text-teal-600" />
          Demo accounts (seeded data)
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          This deployment ships with clearly-labelled synthetic demo records. Use these accounts to explore each role:
        </p>
        <ul className="mt-4 space-y-2">
          {DEMO_ACCOUNTS.map((a) => (
            <li key={a.email}>
              <button
                type="button"
                onClick={() => {
                  setEmail(a.email);
                  setPassword(a.password);
                }}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-left transition-colors hover:border-royal-300 hover:bg-royal-50"
              >
                <span>
                  <span className="block text-sm font-semibold text-navy">{a.role}</span>
                  <span className="block text-xs text-slate-500">{a.email}</span>
                </span>
                <span className="font-mono text-xs text-slate-400">{a.password}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[11px] text-slate-400">
          Clicking an account fills the form — then press Sign in.
        </p>
      </aside>
    </div>
  );
}

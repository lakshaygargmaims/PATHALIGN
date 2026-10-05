'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';
import { apiFetch } from '@/lib/hooks';

const LINKS = [
  { href: '/careers', label: 'Explore Careers' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/about', label: 'About' },
];

interface Me {
  user: { role: 'STUDENT' | 'PARENT' | 'COUNSELLOR' | 'ADMIN' };
}

function dashFor(role: Me['user']['role']): string {
  if (role === 'STUDENT') return '/student';
  if (role === 'PARENT') return '/parent';
  if (role === 'COUNSELLOR') return '/counsellor';
  return '/admin';
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    apiFetch<Me>('/api/auth/me')
      .then((d) => setMe(d))
      .catch(() => setMe(null))
      .finally(() => setLoading(false));
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur no-print">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="PATHALIGN AI home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors ${pathname === l.href ? 'text-royal-600' : 'text-slate-600 hover:text-navy'}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          ) : me ? (
            <>
              <Link href={dashFor(me.user.role)} className="btn-navy">
                Open dashboard
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Log in
              </Link>
              <Link href="/register" className="btn-primary">
                Register
              </Link>
            </>
          )}
        </div>

        <button type="button" className="btn-ghost px-2 py-2 md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm font-medium text-slate-700" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-3">
              {me ? (
                <Link href={dashFor(me.user.role)} className="btn-navy flex-1" onClick={() => setOpen(false)}>
                  Open dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="btn-secondary flex-1" onClick={() => setOpen(false)}>
                    Log in
                  </Link>
                  <Link href="/register" className="btn-primary flex-1" onClick={() => setOpen(false)}>
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

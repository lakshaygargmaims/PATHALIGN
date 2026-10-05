'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquareText,
  ClipboardList,
  Compass,
  Calculator,
  Users,
  Sparkles,
  MapPinned,
  ShieldQuestion,
  Gauge,
  Route,
  LifeBuoy,
  FileText,
  UserRound,
  Scale,
  Briefcase,
  AlertOctagon,
  MessagesSquare,
  CalendarClock,
  History,
  UsersRound,
  LibraryBig,
  School,
  DatabaseZap,
  UserCog,
  FileDown,
  Settings,
  Menu,
  X,
  LogOut,
  Bell,
} from 'lucide-react';
import { NAV, type NavSection } from './nav';
import { Logo, Avatar } from '@/components/logo';
import { apiFetch } from '@/lib/hooks';
import { cn, dashboardPath } from '@/lib/utils';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  MessageSquareText,
  ClipboardList,
  Compass,
  Calculator,
  Users,
  Sparkles,
  MapPinned,
  ShieldQuestion,
  Gauge,
  Route,
  LifeBuoy,
  FileText,
  UserRound,
  Scale,
  Briefcase,
  AlertOctagon,
  MessagesSquare,
  CalendarClock,
  History,
  UsersRound,
  LibraryBig,
  School,
  DatabaseZap,
  UserCog,
  FileDown,
  Settings,
};

interface Me {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: 'STUDENT' | 'PARENT' | 'COUNSELLOR' | 'ADMIN';
    preferredLanguage: 'EN' | 'HI';
  };
  family: { code: string; relation: string; consentGranted: boolean } | null;
  unreadNotifications: number;
}

function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? LayoutDashboard;
  return <Icon className={className} />;
}

export function DashboardShell({
  role,
  title,
  subtitle,
  children,
}: {
  role: 'STUDENT' | 'PARENT' | 'COUNSELLOR' | 'ADMIN';
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    apiFetch<Me>('/api/auth/me')
      .then((d) => setMe(d))
      .catch(() => {
        router.replace('/login');
      });
  }, [router]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const sections: NavSection[] = NAV[role];
  // For nested routes (/counsellor/cases/abc123) label the detail page after its
  // parent section rather than showing a bare "Detail".
  const parentSection = [...sections]
    .sort((a, b) => b.href.length - a.href.length)
    .find((s) => pathname.startsWith(`${s.href}/`));
  const pageTitle =
    title ??
    sections.find((s) => s.href === pathname)?.label ??
    (pathname.endsWith('/new') ? 'New case' : (parentSection ? `${parentSection.label} detail` : 'Dashboard'));

  const logout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    router.replace('/');
    router.refresh();
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-white/10 px-5">
        <Link href={dashboardPath(role)} aria-label="Home">
          <Logo dark />
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" aria-label="Dashboard">
        {sections.map((s) => {
          const active = pathname === s.href;
          return (
            <Link
              key={s.href}
              href={s.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-royal-600 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <NavIcon name={s.icon} className="h-4 w-4 shrink-0" />
              {s.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-5 py-4 text-xs text-slate-400">
        {me?.family ? (
          <p>
            Family code: <span className="font-semibold text-teal-300">{me.family.code}</span>
          </p>
        ) : (
          <p>No family group linked</p>
        )}
        <p className="mt-1">Role: {role.toLowerCase()}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-navy lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 w-72 bg-navy shadow-xl">
            <button
              type="button"
              className="absolute right-3 top-4 text-slate-300"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <button type="button" className="btn-ghost px-2 py-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold text-navy sm:text-lg">{pageTitle}</h1>
            {subtitle ? <p className="truncate text-xs text-slate-500">{subtitle}</p> : null}
          </div>

          <Link
            href={`${dashboardPath(role)}/profile`}
            className="relative hidden text-slate-500 hover:text-navy sm:block"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {me && me.unreadNotifications > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {me.unreadNotifications}
              </span>
            ) : null}
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-navy">{me?.user.fullName ?? '…'}</p>
              <p className="text-xs text-slate-500">{role.toLowerCase()}</p>
            </div>
            <Avatar name={me?.user.fullName ?? '?'} />
            <button type="button" onClick={logout} className="btn-ghost px-2 py-2 text-slate-500" aria-label="Log out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

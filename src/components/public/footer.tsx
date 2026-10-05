import Link from 'next/link';
import { Logo } from '@/components/logo';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white no-print">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-md text-sm text-slate-500">
            PATHALIGN AI helps students and parents explore, understand and confidently choose vocational career
            opportunities — together, with evidence and without pressure.
          </p>
          <p className="mt-3 text-xs text-slate-400">
            Deployments include clearly-labelled synthetic demo records until administrators import verified official
            datasets. Earning figures are estimates, never guarantees.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-navy">Platform</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link href="/careers" className="hover:text-royal-600">Explore careers</Link></li>
            <li><Link href="/how-it-works" className="hover:text-royal-600">How it works</Link></li>
            <li><Link href="/about" className="hover:text-royal-600">About PATHALIGN</Link></li>
            <li><Link href="/register" className="hover:text-royal-600">Create an account</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-navy">For officials</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link href="/login" className="hover:text-royal-600">Administrator login</Link></li>
            <li><Link href="/login" className="hover:text-royal-600">Counsellor login</Link></li>
            <li><span className="text-slate-400">Government impact dashboards</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-5 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} PATHALIGN AI — a demonstration platform for family-based vocational career
        counselling.
      </div>
    </footer>
  );
}

import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  Calculator,
  CheckCircle2,
  Gauge,
  Languages,
  MapPinned,
  Mic,
  Quote,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { prisma } from '@/lib/db';
import { Hero } from '@/components/landing/hero';
import { Faq } from '@/components/landing/faq';
import { VerificationBadge } from '@/components/ui/badges';

export const dynamic = 'force-dynamic';

async function getStats() {
  try {
    const [trades, providers, categories] = await Promise.all([
      prisma.careerTrade.count({ where: { status: 'ACTIVE' } }),
      prisma.trainingProvider.count(),
      prisma.careerTrade.findMany({ where: { status: 'ACTIVE' }, distinct: ['category'], select: { category: true } }),
    ]);
    const samples = await prisma.careerTrade.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      take: 6,
      select: { id: true, name: true, slug: true, durationMonths: true, verificationStatus: true, isSynthetic: true },
    });
    return { trades, providers, categories: categories.length, samples };
  } catch {
    return { trades: 0, providers: 0, categories: 0, samples: [] };
  }
}

const STEPS = [
  { title: 'Create your family group', text: 'A student and a parent join the same family with a shared code. Consent is explicit and revocable.' },
  { title: 'Share concerns and preferences', text: 'Both sides list what they hope for and what worries them — salary, security, reputation, cost.' },
  { title: 'Let the AI explain with evidence', text: 'The counsellor detects the real concern, retrieves verified records and answers in your language with sources.' },
  { title: 'Decide together', text: 'The consensus engine shows overlaps, gaps and alternatives. Nobody is forced — both record their own decision.' },
];

const TESTIMONIALS = [
  { name: 'Rakesh (parent, Pune)', text: 'पहले मुझे लगता था आईटीआई का कोई भविष्य नहीं। यहाँ स्टेज और कमाई के आँकड़े साथ दिखे तो बात करना आसान हुआ।', role: 'Parent' },
  { name: 'Aarav (student, Pune)', text: 'The sources shown under every answer helped me verify things with my father instead of just arguing.', role: 'Student' },
  { name: 'Sunita (parent, Lucknow)', text: 'I asked in Hindi on a cheap phone and still understood everything. The counsellor button got me a real call.', role: 'Parent' },
];

export default async function LandingPage() {
  const stats = await getStats();

  return (
    <>
      <Hero stats={stats} />

      {/* 3 — Project introduction */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-royal-600">Why PATHALIGN exists</p>
            <h2 className="section-title mt-2">Vocational careers fail families — not because of skill, but of trust.</h2>
            <p className="mt-4 text-slate-600">
              Parents often see vocational education as inferior to a traditional degree. Students struggle to convince
              their families. Neither side has trustworthy information about salary, security or growth — and existing
              platforms talk only to students.
            </p>
            <p className="mt-3 text-slate-600">
              PATHALIGN brings the whole family into one evidence-based conversation: personalised AI counselling,
              verified career information, progression visualisation and a shared decision workspace.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Users, title: 'Built for families', text: 'Separate, consent-based views for students and parents.' },
              { icon: ShieldCheck, title: 'Evidence over claims', text: 'Every record shows its source and verification status.' },
              { icon: Gauge, title: 'Explainable scoring', text: 'Confidence scores show exactly how they are computed.' },
              { icon: MapPinned, title: 'Local opportunity radar', text: 'Find training centres and pathways near your district.' },
            ].map((f) => (
              <div key={f.title} className="card card-hover p-5">
                <f.icon className="h-5 w-5 text-teal-600" />
                <h3 className="mt-3 text-sm font-semibold text-navy">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4 — How it works */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-royal-600">How PATHALIGN works</p>
            <h2 className="section-title mt-2">Four steps from disagreement to a joint decision</h2>
          </div>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="card relative p-5">
                <span className="absolute right-4 top-4 text-3xl font-extrabold text-slate-100">{i + 1}</span>
                <h3 className="text-sm font-semibold text-navy">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 5 — AI family counselling */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="card border-navy/10 bg-navy p-6 text-white sm:p-8">
            <span className="badge bg-white/10 text-teal-300">Signature feature 1</span>
            <h3 className="mt-3 text-xl font-bold">AI Parent Objection Analyzer</h3>
            <p className="mt-2 text-sm text-slate-300">
              Understands both sides of the conversation — in English and Hindi — and answers with retrieved records
              instead of guesses.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-200">
              {[
                'Detects 9 objection types: salary, security, status, safety, degree preference, further study, cost, awareness, family pressure',
                'Responds in the parent’s preferred language with a typing indicator and read-aloud',
                'Shows source references under every answer and labels estimates as estimates',
                'Escalates to a human counsellor with consent when AI cannot resolve the concern',
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                  {t}
                </li>
              ))}
            </ul>
            <Link href="/register" className="btn mt-6 bg-teal-500 text-white hover:bg-teal-600">
              Try the AI counsellor <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-4">
            <div className="card p-6">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-royal-600" />
                <h3 className="font-semibold text-navy">Signature feature 2 — Career Reality Simulator</h3>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Pick a trade, set your district, education level and budget — see duration, fees, recorded earning ranges
                by experience, employment pathways and progression stages. Compare two trades side by side.
              </p>
              <div className="mt-4 flex h-24 items-end gap-2" aria-hidden="true">
                {[38, 55, 72, 88].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t bg-royal-100" style={{ height: `${h}%` }}>
                    <div className="h-full rounded-t bg-royal-500" style={{ height: `${40 + i * 15}%` }} />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Illustrative layout. Earning figures in the app are labelled estimates with assumptions.
              </p>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-teal-600" />
                <h3 className="font-semibold text-navy">Signature feature 3 — Family Consensus Engine</h3>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Student and parent pick careers independently. The engine highlights common ground, disagreements and
                concerns, then recommends alternatives — with outcomes like <em>Agreed</em>,{' '}
                <em>Partially agreed</em> or <em>Needs further discussion</em>.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-teal-50 p-3 font-semibold text-teal-800">Common<br />1 option</div>
                <div className="rounded-lg bg-amber-50 p-3 font-semibold text-amber-800">Student-only<br />1 option</div>
                <div className="rounded-lg bg-royal-50 p-3 font-semibold text-royal-800">Parent-only<br />1 option</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8 — Verified opportunities */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-royal-600">Verified career opportunities</p>
              <h2 className="section-title mt-2">Every record tells you how much to trust it</h2>
              <p className="mt-4 text-slate-600">
                Trades, salaries, training providers and knowledge articles each carry a source, a verification status
                and a last-verified date. Synthetic demo data is never dressed up as official government data.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <VerificationBadge status="VERIFIED" />
                <VerificationBadge status="PENDING_VERIFICATION" />
                <VerificationBadge status="OUTDATED" />
                <VerificationBadge status="SYNTHETIC_DEMO" />
              </div>
              <Link href="/careers" className="btn-primary mt-6">
                Explore career database <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {stats.samples.map((t) => (
                <Link key={t.id} href={`/careers/${t.slug}`} className="card card-hover p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-navy">{t.name}</h3>
                    <VerificationBadge status={t.verificationStatus} isSynthetic={t.isSynthetic} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{t.durationMonths}-month training</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 9 — Voice counselling */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="card flex flex-col items-center gap-6 p-8 text-center sm:p-12 lg:flex-row lg:text-left">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-teal-100">
            <Mic className="h-9 w-9 text-teal-600" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-royal-600">Voice-first counselling</p>
            <h2 className="section-title mt-2">Speak in Hindi or English — read aloud answers</h2>
            <p className="mt-3 max-w-3xl text-slate-600">
              Designed for families with limited digital literacy: one large microphone button, simple navigation,
              read-aloud responses and instant language switching. If the microphone is unavailable, the complete
              text-based flow still works.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
              <span className="badge bg-slate-100 text-slate-700">
                <Languages className="h-3.5 w-3.5" /> English (en-IN)
              </span>
              <span className="badge bg-slate-100 text-slate-700">
                <Languages className="h-3.5 w-3.5" /> हिंदी (hi-IN)
              </span>
              <span className="badge bg-slate-100 text-slate-700">
                <Bot className="h-3.5 w-3.5" /> Text fallback always available
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 10 — Government impact dashboard preview */}
      <section className="bg-navy py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-300">For administrators</p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Understand where parental resistance actually comes from</h2>
              <p className="mt-4 text-slate-300">
                District-wise resistance indexes, objection categories, sentiment trends, disagreement patterns and
                confidence trends — computed from live, aggregated, privacy-safe database queries. No personal data is
                exposed in public dashboards.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-slate-300">
                {['Real database aggregations — never hardcoded statistics', 'CSV import with administrator approval workflow', 'Data verification status on every record', 'Exportable analytics reports'].map((t) => (
                  <li key={t} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-white/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-300">Illustrative dashboard layout</p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {['Students', 'Parents', 'Families', 'Cases'].map((label) => (
                  <div key={label} className="rounded-lg bg-white/10 p-3 text-center">
                    <div className="mx-auto mb-2 h-2 w-10 rounded bg-white/30" />
                    <p className="text-[11px] text-slate-400">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex h-32 items-end gap-1.5" aria-hidden="true">
                {[30, 45, 38, 60, 52, 70, 64, 80, 58, 72, 66, 84].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t bg-teal-400/70" style={{ height: `${h}%` }} />
                ))}
              </div>
              <p className="mt-3 text-[11px] text-slate-400">
                Mock-up of the layout only — the real dashboard plots live query results for your deployment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 11 — Testimonials (demo content) */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-royal-600">Testimonials</p>
          <h2 className="section-title mt-2">What families say</h2>
          <span className="mt-3 inline-block badge bg-amber-100 text-amber-800">
            Clearly labelled demo content — not real user quotes
          </span>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="card p-6">
              <Quote className="h-5 w-5 text-teal-500" />
              <blockquote className="mt-3 text-sm leading-relaxed text-slate-600">{t.text}</blockquote>
              <figcaption className="mt-4 text-xs text-slate-400">
                <span className="font-semibold text-navy">{t.name}</span> · {t.role} · demo content
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* 12 — FAQ */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-royal-600">FAQ</p>
            <h2 className="section-title mt-2">Questions families ask us</h2>
          </div>
          <div className="mt-8">
            <Faq />
          </div>
          <div className="mt-10 flex flex-col items-center gap-3">
            <p className="text-sm text-slate-500">Ready to align your family’s decision with real information?</p>
            <div className="flex gap-3">
              <Link href="/register" className="btn-primary">
                <Sparkles className="h-4 w-4" /> Start Family Counselling
              </Link>
              <Link href="/careers" className="btn-secondary">
                Explore Career Opportunities
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

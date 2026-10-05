import Link from 'next/link';
import { ArrowRight, Target, Users, Database, Lock, Cpu, FlaskConical } from 'lucide-react';

export const metadata = { title: 'About PATHALIGN' };

const ROLES = [
  { role: 'Students', text: 'Explore careers, take assessments, run simulations, and drive the family conversation with evidence.' },
  { role: 'Parents / Guardians', text: 'See verified career information, submit concerns and decide together — in their own language.' },
  { role: 'Human counsellors', text: 'Handle escalations, review conversation summaries (with consent), schedule sessions and track cases.' },
  { role: 'Government administrators', text: 'Monitor resistance patterns, manage the career database, verify sources and export aggregated analytics.' },
];

const PRINCIPLES = [
  { icon: Database, title: 'Evidence first', text: 'Every career claim carries a source, a verification status and a last-verified date. Nothing is asserted as government data without verification.' },
  { icon: FlaskConical, title: 'Honest demo mode', text: 'Synthetic records are labelled “Synthetic demo record” everywhere. The AI runs offline in clearly-labelled demo mode unless a provider key is configured.' },
  { icon: Lock, title: 'Consent by default', text: 'Sharing a profile or conversation with a family member or counsellor requires explicit consent, revocable at any time. Minors go through a guardian-consent workflow.' },
  { icon: Cpu, title: 'Swappable AI', text: 'A provider abstraction lets deployments switch between any OpenAI-compatible LLM or the built-in rule-based generator without code changes.' },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-royal-600">About the project</p>
        <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">Aligning Dreams with Opportunities</h1>
        <p className="mt-4 text-slate-600">
          PATHALIGN AI is an AI-powered vocational career counselling and family decision-support platform. It exists
          because vocational education in India is often rejected by families not for lack of capability, but for lack
          of trustworthy information and structured dialogue.
        </p>
        <p className="mt-3 text-slate-600">
          The platform combines personalised AI counselling, verified career data, career progression visualisation,
          a family consensus workflow and government-facing analytics into one system that serves four user categories.
        </p>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-navy">Who it serves</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {ROLES.map((r) => (
            <div key={r.role} className="card p-5">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-teal-600" />
                <h3 className="text-sm font-semibold text-navy">{r.role}</h3>
              </div>
              <p className="mt-2 text-sm text-slate-500">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-navy">Design principles</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="card p-5">
              <div className="flex items-center gap-2">
                <p.icon className="h-4 w-4 text-royal-600" />
                <h3 className="text-sm font-semibold text-navy">{p.title}</h3>
              </div>
              <p className="mt-2 text-sm text-slate-500">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card mt-10 p-6">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-teal-600" />
          <h2 className="text-lg font-bold text-navy">Mission</h2>
        </div>
        <p className="mt-2 text-slate-600">
          Bridge the gap between students and parents regarding vocational education by providing personalised AI
          counselling, verified employment information, career progression visualisation and a family-based career
          decision-making workspace.
        </p>
        <Link href="/register" className="btn-primary mt-5">
          Start Family Counselling <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}

import Link from 'next/link';
import { ArrowRight, Users, MessageSquareText, Scale, Gauge, MapPinned, Mic, FileText, ShieldCheck } from 'lucide-react';

export const metadata = { title: 'How It Works' };

const STEPS = [
  {
    title: '1 · Create or join a family group',
    text: 'Students and parents create accounts and join the same family with a shared code. Sharing inside the family is based on explicit, revocable consent.',
  },
  {
    title: '2 · Build your family profile',
    text: 'A short structured assessment captures student interests, parent expectations, financial limits and areas of disagreement.',
  },
  {
    title: '3 · Talk to the AI counsellor',
    text: 'Ask anything in English or Hindi. The AI detects the underlying objection, retrieves knowledge records, answers with sources, and offers human escalation.',
  },
  {
    title: '4 · Simulate and compare careers',
    text: 'Pick a trade and see duration, fees, recorded earning ranges, employment pathways and progression stages. Compare two trades parameter by parameter.',
  },
  {
    title: '5 · Run the family consensus',
    text: 'Student and parent choose careers independently. The engine shows common ground, disagreements, concerns and alternatives — without forcing agreement.',
  },
  {
    title: '6 · Record decisions and generate a report',
    text: 'Both participants voluntarily record their decision, and a printable Family Career Agreement Report (PDF) captures profile, concerns, recommendations and sources.',
  },
];

const FEATURES = [
  { icon: MessageSquareText, title: 'AI Parent Objection Analyzer', text: 'Nine objection types detected in English and Hindi, with grounded answers and visible sources.' },
  { icon: Scale, title: 'Career Reality Simulator', text: 'Scenario planning with adjustable location, education, budget and experience — every forecast labelled an estimate.' },
  { icon: Users, title: 'Family Consensus Engine', text: 'Independent preferences, mapped overlaps, and outcomes such as Agreed, Partially agreed or Needs discussion.' },
  { icon: Gauge, title: 'Confidence Score', text: 'A transparent 0–100 self-reported awareness score with per-dimension breakdown — never a psychological test.' },
  { icon: MapPinned, title: 'Local Opportunity Radar', text: 'Training centres, courses and employer segments near your district on an OpenStreetMap map.' },
  { icon: Mic, title: 'Voice-first counselling', text: 'Speak in Hindi or English and hear answers read aloud. Text fallback always available.' },
  { icon: FileText, title: 'Family Career Agreement Report', text: 'A printable PDF summarising the family profile, concerns, recommendations, sources and action plan.' },
  { icon: ShieldCheck, title: 'Verification workflow', text: 'Admins import datasets, review and mark records verified — synthetic data stays visibly labelled.' },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">How PATHALIGN works</h1>
        <p className="mt-3 text-slate-600">
          PATHALIGN turns a tense family conversation into a structured, evidence-based decision — in six steps.
        </p>
      </div>

      <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((s) => (
          <li key={s.title} className="card p-5">
            <h2 className="text-sm font-bold text-navy">{s.title}</h2>
            <p className="mt-2 text-sm text-slate-500">{s.text}</p>
          </li>
        ))}
      </ol>

      <h2 className="section-title mt-14">Everything the platform includes</h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="card card-hover p-5">
            <f.icon className="h-5 w-5 text-teal-600" />
            <h3 className="mt-3 text-sm font-semibold text-navy">{f.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{f.text}</p>
          </div>
        ))}
      </div>

      <div className="card mt-12 flex flex-col items-start gap-4 bg-navy p-8 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Ready to try it with your family?</h2>
          <p className="mt-1 text-sm text-slate-300">Four demo roles are pre-seeded — or create your own account.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/register" className="btn bg-teal-500 text-white hover:bg-teal-600">
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/login" className="btn border border-white/30 bg-white/10 text-white hover:bg-white/20">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}

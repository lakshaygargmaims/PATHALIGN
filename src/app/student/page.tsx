'use client';

import Link from 'next/link';
import {
  ArrowRight,
  ClipboardList,
  MessageSquareText,
  Users,
  Gauge,
  Route,
  FileText,
  CheckCircle2,
  Circle,
  Compass,
} from 'lucide-react';
import { useApi } from '@/lib/hooks';
import { Progress, CardSkeleton } from '@/components/ui/states';

interface Me {
  user: { fullName: string };
  family: { code: string; relation: string; consentGranted: boolean } | null;
  hasStudentProfile: boolean;
}
interface AssessmentList {
  assessments: Array<{ id: string; kind: string; createdAt: string }>;
}
interface RecommendationList {
  recommendations: Array<{ id: string; title: string; matchScore: number | null; rationale: string; pathway: string; trade?: { slug: string } | null }>;
}
interface Confidence {
  comparison: { latestScore: number | null; change: number | null; pre: unknown; post: unknown } | null;
}
interface CaseList {
  cases: Array<{ id: string; subject: string; status: string; createdAt: string }>;
}
interface ConsensusData {
  consensus: { id: string; status: string; aiSummary: string | null } | null;
}

const QUICK_LINKS = [
  { href: '/student/counsellor', label: 'Ask the AI Counsellor', icon: MessageSquareText, text: 'English or Hindi, with sources' },
  { href: '/student/assessment', label: 'Career Assessment', icon: ClipboardList, text: '8 quick interest questions' },
  { href: '/student/simulator', label: 'Career Simulator', icon: Route, text: 'Scenario + side-by-side compare' },
  { href: '/student/consensus', label: 'Family Consensus', icon: Users, text: 'Compare with your parent’s picks' },
  { href: '/student/careers', label: 'Career Explorer', icon: Compass, text: '18 trades with verification status' },
  { href: '/student/reports', label: 'Family Report (PDF)', icon: FileText, text: 'Printable agreement report' },
];

export default function StudentDashboard() {
  const me = useApi<Me>('/api/auth/me');
  const assessments = useApi<AssessmentList>('/api/assessments');
  const recs = useApi<RecommendationList>('/api/recommendations');
  const confidence = useApi<Confidence>('/api/confidence');
  const cases = useApi<CaseList>('/api/cases');
  const consensus = useApi<ConsensusData>('/api/consensus');

  if (me.loading) return <CardSkeleton rows={5} />;

  const steps = [
    { label: 'Complete your profile', done: me.data?.hasStudentProfile ?? false, href: '/student/profile' },
    { label: 'Finish the career assessment', done: (assessments.data?.assessments.length ?? 0) > 0, href: '/student/assessment' },
    { label: 'Talk to the AI counsellor', done: true, href: '/student/counsellor' },
    { label: 'Run the family consensus', done: Boolean(consensus.data?.consensus && consensus.data.consensus.status !== 'OPEN'), href: '/student/consensus' },
    { label: 'Generate the family report', done: false, href: '/student/reports' },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="space-y-6">
      <section className="card bg-navy p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Welcome back, {me.data?.user.fullName.split(' ')[0] ?? 'there'} 👋</h2>
            <p className="mt-1 text-sm text-slate-300">
              Continue building the evidence your family needs to decide together.
            </p>
          </div>
          <div className="rounded-lg bg-white/10 px-4 py-2 text-sm">
            Family code:{' '}
            <span className="font-bold text-teal-300">{me.data?.family?.code ?? 'not joined yet'}</span>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Getting-started progress</span>
            <span>{doneCount}/{steps.length} steps</span>
          </div>
          <div className="mt-2">
            <Progress value={(doneCount / steps.length) * 100} label="Getting started progress" />
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((s) => (
              <li key={s.label}>
                <Link href={s.href} className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-200 hover:bg-white/10">
                  {s.done ? <CheckCircle2 className="h-4 w-4 text-teal-400" /> : <Circle className="h-4 w-4 text-slate-500" />}
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs text-slate-500">Family Career Confidence</p>
          <p className="mt-1 text-2xl font-bold text-navy">
            {confidence.loading ? '—' : (confidence.data?.comparison?.latestScore ?? '—')}
            <span className="text-sm font-medium text-slate-400">/100</span>
          </p>
          {confidence.data?.comparison?.change != null ? (
            <p className="mt-1 text-xs text-teal-600">
              {confidence.data.comparison.change > 0 ? '+' : ''}
              {confidence.data.comparison.change} since first questionnaire
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-400">Take the pre/post questionnaire to track change</p>
          )}
          <Link href="/student/confidence" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-royal-600 hover:underline">
            Open score <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="card p-5">
          <p className="text-xs text-slate-500">Consensus status</p>
          <p className="mt-1 text-lg font-bold capitalize text-navy">
            {consensus.loading ? '—' : (consensus.data?.consensus?.status.replace(/_/g, ' ').toLowerCase() ?? 'Not started')}
          </p>
          <p className="mt-1 line-clamp-2 text-xs text-slate-400">
            {consensus.data?.consensus?.aiSummary ?? 'Save your picks and your parent’s picks to see overlaps.'}
          </p>
          <Link href="/student/consensus" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-royal-600 hover:underline">
            Open consensus <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="card p-5">
          <p className="text-xs text-slate-500">Support cases</p>
          <p className="mt-1 text-2xl font-bold text-navy">{cases.loading ? '—' : (cases.data?.cases.length ?? 0)}</p>
          <p className="mt-1 text-xs text-slate-400">Open or historical requests to a human counsellor</p>
          <Link href="/student/cases" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-royal-600 hover:underline">
            Manage cases <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-navy">Recommended for you</h3>
          <Link href="/student/plan" className="text-sm font-semibold text-royal-600 hover:underline">
            Full career plan →
          </Link>
        </div>
        {recs.loading ? (
          <CardSkeleton rows={2} />
        ) : (recs.data?.recommendations.length ?? 0) === 0 ? (
          <div className="card p-6 text-sm text-slate-500">
            No recommendations yet — complete your assessment or update your interests to generate them.{' '}
            <Link href="/student/assessment" className="font-semibold text-royal-600 hover:underline">
              Start assessment
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {recs.data!.recommendations.slice(0, 4).map((r) => (
              <div key={r.id} className="card p-5">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-navy">{r.title}</h4>
                  {r.matchScore != null ? (
                    <span className="badge bg-teal-100 text-teal-800">{r.matchScore}% match</span>
                  ) : null}
                </div>
                <p className="mt-2 line-clamp-3 text-xs text-slate-500">{r.rationale}</p>
                {r.trade?.slug ? (
                  <Link href={`/student/careers/${r.trade.slug}`} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-royal-600 hover:underline">
                    View trade <ArrowRight className="h-3 w-3" />
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 font-semibold text-navy">Quick actions</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="card card-hover p-5">
              <l.icon className="h-5 w-5 text-teal-600" />
              <h4 className="mt-3 text-sm font-semibold text-navy">{l.label}</h4>
              <p className="mt-1 text-xs text-slate-500">{l.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="card flex items-center gap-4 p-5">
        <Gauge className="h-6 w-6 shrink-0 text-royal-600" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-navy">Explore 18 vocational trades</h4>
          <p className="text-xs text-slate-500">Each record shows fee range, duration, NSQF level and verification status.</p>
        </div>
        <Link href="/student/careers" className="btn-secondary shrink-0">
          Explore <Compass className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}

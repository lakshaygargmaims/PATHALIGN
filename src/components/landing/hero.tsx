'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Compass, MessageCircleHeart, ShieldCheck, Sparkles } from 'lucide-react';

export function Hero({ stats }: { stats: { trades: number; providers: number; categories: number } }) {
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, #2563EB 0, transparent 45%), radial-gradient(circle at 80% 70%, #14B8A6 0, transparent 40%)',
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-24">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-teal-200">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered vocational career counselling for families
          </span>
          <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-[2.9rem]">
            Your Skills. Your Future.{' '}
            <span className="text-teal-300">Your Family&rsquo;s Confidence.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            An intelligent career counselling platform helping students and parents discover, understand and
            confidently choose vocational career opportunities.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="btn bg-teal-500 px-6 py-3 text-base font-semibold text-white hover:bg-teal-600">
              Start Family Counselling
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/careers"
              className="btn border border-white/30 bg-white/5 px-6 py-3 text-base font-semibold text-white hover:bg-white/10"
            >
              <Compass className="h-4 w-4" />
              Explore Career Opportunities
            </Link>
          </div>

          <dl className="mt-9 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-6">
            <div>
              <dt className="text-xs text-slate-400">Career trades</dt>
              <dd className="text-xl font-bold text-white">{stats.trades}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Training centres</dt>
              <dd className="text-xl font-bold text-white">{stats.providers}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Job sectors</dt>
              <dd className="text-xl font-bold text-white">{stats.categories}</dd>
            </div>
          </dl>
          <p className="mt-2 text-[11px] text-slate-400">Live counts from this deployment’s career database.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative"
        >
          <div className="card p-5 text-slate-800">
            <div className="flex items-center justify-between">
              <span className="badge bg-royal-100 text-royal-800">AI Family Counsellor</span>
              <span className="badge bg-teal-100 text-teal-800">हिंदी · English</span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5 text-sm">
                ITI करने के बाद मेरे बच्चे का भविष्य क्या होगा? डिग्री ज़्यादा अच्छी नहीं है?
              </div>
              <div className="ml-auto max-w-[90%] rounded-2xl rounded-tr-sm bg-navy px-4 py-3 text-sm text-white">
                <p className="font-semibold text-teal-300">Concern detected: preference for traditional degree</p>
                <p className="mt-1.5 text-slate-200">
                  ITI trades record a 6–24 month duration and defined progression stages. Sharing the recorded earning
                  ranges and pathways below so you can compare both options together.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="badge bg-slate-100 text-slate-600">DGT · pending verification</span>
                <span className="badge bg-purple-100 text-purple-700">Demo salary record</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
              <div className="rounded-lg bg-teal-50 p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-teal-800">
                  <MessageCircleHeart className="h-3.5 w-3.5" /> Student preference
                </p>
                <p className="mt-1 text-sm font-bold text-navy">Solar PV Technician</p>
              </div>
              <div className="rounded-lg bg-royal-50 p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-royal-800">
                  <ShieldCheck className="h-3.5 w-3.5" /> Parent preference
                </p>
                <p className="mt-1 text-sm font-bold text-navy">Electrician</p>
              </div>
            </div>
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Consensus result: <span className="font-semibold">Partially agreed</span> — 1 shared option. Both sides can
              record their own decision voluntarily.
            </p>
          </div>

          <div className="absolute -bottom-4 -right-3 hidden rounded-lg bg-teal-500 px-3 py-2 text-xs font-semibold text-white shadow-lg sm:block">
            Voice-first · हिंदी आवाज़ में
          </div>
        </motion.div>
      </div>
    </section>
  );
}

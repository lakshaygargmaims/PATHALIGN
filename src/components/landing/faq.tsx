'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  {
    q: 'Is PATHALIGN AI only for students?',
    a: 'No. PATHALIGN is built for the whole family. Parents get their own counselling view, concerns are tracked separately, and decisions are recorded jointly — neither side is pressured.',
  },
  {
    q: 'Where does the career and salary information come from?',
    a: 'Each record carries a source, a verification status and a last-verified date. In this deployment, demo records are explicitly labelled "Synthetic demo record" and administrators can import and verify official datasets through the Data Verification module.',
  },
  {
    q: 'Does the AI guarantee a job or a salary?',
    a: 'Never. Every earning figure is labelled an estimate with its assumptions. When the knowledge base has no verified answer, the AI says so plainly and offers to connect you with a human counsellor.',
  },
  {
    q: 'Can parents and students see each other’s conversations?',
    a: 'Only with explicit consent. Sharing a conversation with a counsellor or a family member is an opt-in action, revocable at any time from the profile privacy controls.',
  },
  {
    q: 'Is this a psychological assessment?',
    a: 'No. The Family Career Confidence Score is a self-reported awareness measure for counselling follow-up. It does not predict enrolment, employment or mental health outcomes.',
  },
  {
    q: 'Does it work on a low-end phone with Hindi voice input?',
    a: 'Yes. The interface is built mobile-first with large controls, and voice input/output use the browser’s built-in speech support in English and Hindi. If speech is unavailable, the full text flow still works.',
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-3xl divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
      {ITEMS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-semibold text-navy">{item.q}</span>
              <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', isOpen && 'rotate-180')} />
            </button>
            {isOpen ? <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{item.a}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

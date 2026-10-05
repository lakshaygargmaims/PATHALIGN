import { cn, initials } from '@/lib/utils';

export function Logo({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" aria-hidden="true">
        <rect width="40" height="40" rx="10" fill={dark ? '#F8FAFC' : '#102B46'} />
        <path
          d="M11 28V12h7.4c3.6 0 6 2.1 6 5.3 0 2.3-1.2 4-3.2 4.8L26 28h-4.3l-4.2-5.2H15V28h-4Zm4-8.7h3.1c1.6 0 2.6-.9 2.6-2.3s-1-2.3-2.6-2.3H15v4.6Z"
          fill={dark ? '#102B46' : '#F8FAFC'}
        />
        <circle cx="29" cy="14" r="3.4" fill="#14B8A6" />
        <path d="M22.5 27.5c2.6-1.4 5-3.3 6.9-5.7" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      </svg>
      <span className="flex flex-col leading-tight">
        <span className={cn('text-[15px] font-extrabold tracking-tight', dark ? 'text-white' : 'text-navy')}>
          PATHALIGN <span className="text-teal-600">AI</span>
        </span>
        <span className={cn('text-[10px] font-medium', dark ? 'text-slate-300' : 'text-slate-500')}>
          Aligning Dreams with Opportunities
        </span>
      </span>
    </span>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center justify-center rounded-full bg-navy text-xs font-bold text-white',
        className,
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

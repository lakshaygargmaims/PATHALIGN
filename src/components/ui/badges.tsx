import { cn } from '@/lib/utils';
import type { VerificationStatus } from '@prisma/client';
import { BadgeCheck, Clock3, AlertCircle, FlaskConical, EyeOff } from 'lucide-react';

/**
 * Verification badge — every record in the UI shows its verification
 * state so synthetic demo data is never mistaken for official data.
 */
export function VerificationBadge({
  status,
  isSynthetic,
  className,
}: {
  status: VerificationStatus | string;
  isSynthetic?: boolean;
  className?: string;
}) {
  const s = String(status);
  const map: Record<string, { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }> = {
    VERIFIED: { label: 'Verified', cls: 'bg-teal-100 text-teal-800', icon: BadgeCheck },
    PENDING_VERIFICATION: { label: 'Pending verification', cls: 'bg-amber-100 text-amber-800', icon: Clock3 },
    OUTDATED: { label: 'Outdated', cls: 'bg-orange-100 text-orange-800', icon: AlertCircle },
    UNAVAILABLE: { label: 'Unavailable', cls: 'bg-slate-200 text-slate-600', icon: EyeOff },
    SYNTHETIC_DEMO: { label: 'Synthetic demo record', cls: 'bg-purple-100 text-purple-800', icon: FlaskConical },
  };
  const entry = map[s] ?? { label: s, cls: 'bg-slate-200 text-slate-600', icon: FlaskConical };
  const Icon = entry.icon;
  const effective = isSynthetic && s === 'VERIFIED' ? 'SYNTHETIC_DEMO' : s;
  const finalEntry = map[effective] ?? entry;
  const FinalIcon = finalEntry.icon;

  return (
    <span className={cn('badge', finalEntry.cls, className)}>
      <FinalIcon className="h-3 w-3" />
      {finalEntry.label}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    STUDENT: 'bg-royal-100 text-royal-800',
    PARENT: 'bg-teal-100 text-teal-800',
    COUNSELLOR: 'bg-navy-100 text-navy-700',
    ADMIN: 'bg-slate-800 text-white',
  };
  return <span className={cn('badge capitalize', styles[role] ?? 'bg-slate-100 text-slate-700')}>{role.toLowerCase()}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    AGREED: 'bg-teal-100 text-teal-800',
    PARTIALLY_AGREED: 'bg-amber-100 text-amber-800',
    NEEDS_DISCUSSION: 'bg-orange-100 text-orange-800',
    COUNSELLOR_REQUESTED: 'bg-royal-100 text-royal-800',
    OPEN: 'bg-amber-100 text-amber-800',
    ADDRESSED: 'bg-teal-100 text-teal-800',
    CLOSED: 'bg-slate-200 text-slate-600',
    PENDING: 'bg-amber-100 text-amber-800',
    ASSIGNED: 'bg-royal-100 text-royal-800',
    IN_PROGRESS: 'bg-royal-100 text-royal-800',
    RESOLVED: 'bg-teal-100 text-teal-800',
    SCHEDULED: 'bg-royal-100 text-royal-800',
    COMPLETED: 'bg-teal-100 text-teal-800',
    CANCELLED: 'bg-slate-200 text-slate-600',
    NO_SHOW: 'bg-red-100 text-red-800',
    READY: 'bg-teal-100 text-teal-800',
    FAILED: 'bg-red-100 text-red-800',
    APPROVED: 'bg-teal-100 text-teal-800',
    REJECTED: 'bg-red-100 text-red-800',
    PENDING_REVIEW: 'bg-amber-100 text-amber-800',
  };
  const label = String(status).replace(/_/g, ' ').toLowerCase();
  return <span className={cn('badge capitalize', styles[status] ?? 'bg-slate-100 text-slate-700')}>{label}</span>;
}

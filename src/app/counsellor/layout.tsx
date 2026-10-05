import { requireUserPage } from '@/lib/auth/guard';
import { DashboardShell } from '@/components/dashboard/shell';

export default async function CounsellorLayout({ children }: { children: React.ReactNode }) {
  await requireUserPage(['COUNSELLOR', 'ADMIN']);
  return <DashboardShell role="COUNSELLOR">{children}</DashboardShell>;
}

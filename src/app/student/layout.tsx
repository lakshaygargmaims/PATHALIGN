import { requireUserPage } from '@/lib/auth/guard';
import { DashboardShell } from '@/components/dashboard/shell';

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  await requireUserPage(['STUDENT', 'ADMIN']);
  return <DashboardShell role="STUDENT">{children}</DashboardShell>;
}

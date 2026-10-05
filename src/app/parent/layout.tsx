import { requireUserPage } from '@/lib/auth/guard';
import { DashboardShell } from '@/components/dashboard/shell';

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  await requireUserPage(['PARENT', 'ADMIN']);
  return <DashboardShell role="PARENT">{children}</DashboardShell>;
}

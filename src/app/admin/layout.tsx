import { requireUserPage } from '@/lib/auth/guard';
import { DashboardShell } from '@/components/dashboard/shell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireUserPage(['ADMIN']);
  return <DashboardShell role="ADMIN">{children}</DashboardShell>;
}

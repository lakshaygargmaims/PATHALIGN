export type NavSection = {
  href: string;
  label: string;
  icon: string;
};

const STUDENT_NAV: NavSection[] = [
  { href: '/student', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/student/counsellor', label: 'AI Counsellor', icon: 'MessageSquareText' },
  { href: '/student/assessment', label: 'Career Assessment', icon: 'ClipboardList' },
  { href: '/student/careers', label: 'Career Explorer', icon: 'Compass' },
  { href: '/student/simulator', label: 'Career Simulator', icon: 'Calculator' },
  { href: '/student/consensus', label: 'Family Consensus', icon: 'Users' },
  { href: '/student/twin', label: 'Career Digital Twin', icon: 'Sparkles' },
  { href: '/student/radar', label: 'Opportunity Radar', icon: 'MapPinned' },
  { href: '/student/myths', label: 'Myth Buster', icon: 'ShieldQuestion' },
  { href: '/student/confidence', label: 'Confidence Score', icon: 'Gauge' },
  { href: '/student/plan', label: 'My Career Plan', icon: 'Route' },
  { href: '/student/cases', label: 'Support Cases', icon: 'LifeBuoy' },
  { href: '/student/reports', label: 'Reports', icon: 'FileText' },
  { href: '/student/profile', label: 'Profile', icon: 'UserRound' },
];

const PARENT_NAV: NavSection[] = [
  { href: '/parent', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/parent/counsellor', label: 'Family Counselling', icon: 'MessageSquareText' },
  { href: '/parent/careers', label: 'Explore Careers', icon: 'Compass' },
  { href: '/parent/comparison', label: 'Career Comparison', icon: 'Scale' },
  { href: '/parent/consensus', label: 'Family Decisions', icon: 'Users' },
  { href: '/parent/confidence', label: 'Confidence Score', icon: 'Gauge' },
  { href: '/parent/radar', label: 'Opportunity Radar', icon: 'MapPinned' },
  { href: '/parent/myths', label: 'Myth Buster', icon: 'ShieldQuestion' },
  { href: '/parent/cases', label: 'Support Cases', icon: 'LifeBuoy' },
  { href: '/parent/reports', label: 'Reports', icon: 'FileText' },
  { href: '/parent/profile', label: 'Profile', icon: 'UserRound' },
];

const COUNSELLOR_NAV: NavSection[] = [
  { href: '/counsellor', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/counsellor/cases', label: 'Assigned Cases', icon: 'Briefcase' },
  { href: '/counsellor/queue', label: 'Unresolved Concerns', icon: 'AlertOctagon' },
  { href: '/counsellor/sessions', label: 'Counselling Sessions', icon: 'MessagesSquare' },
  { href: '/counsellor/appointments', label: 'Appointments', icon: 'CalendarClock' },
  { href: '/counsellor/history', label: 'Case History', icon: 'History' },
  { href: '/counsellor/profile', label: 'Profile', icon: 'UserRound' },
];

const ADMIN_NAV: NavSection[] = [
  { href: '/admin', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/admin/analytics', label: 'Resistance Analytics', icon: 'ChartNoAxesCombined' },
  { href: '/admin/users', label: 'User Management', icon: 'UsersRound' },
  { href: '/admin/careers', label: 'Career Database', icon: 'LibraryBig' },
  { href: '/admin/providers', label: 'Training Providers', icon: 'School' },
  { href: '/admin/data', label: 'Data & Verification', icon: 'DatabaseZap' },
  { href: '/admin/counsellors', label: 'Counsellor Management', icon: 'UserCog' },
  { href: '/admin/reports', label: 'Reports & Exports', icon: 'FileDown' },
  { href: '/admin/settings', label: 'Settings', icon: 'Settings' },
];

export const NAV: Record<'STUDENT' | 'PARENT' | 'COUNSELLOR' | 'ADMIN', NavSection[]> = {
  STUDENT: STUDENT_NAV,
  PARENT: PARENT_NAV,
  COUNSELLOR: COUNSELLOR_NAV,
  ADMIN: ADMIN_NAV,
};

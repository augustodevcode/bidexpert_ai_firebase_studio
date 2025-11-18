import type { ReactNode } from 'react';
import DashboardLayout from '@/app/dashboard/layout';

export default function LawyerLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

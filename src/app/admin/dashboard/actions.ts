// src/app/admin/dashboard/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { AdminDashboardStats } from '@/types';

export async function getAdminDashboardStatsAction(): Promise<AdminDashboardStats> {
  const db = await getDatabaseAdapter();
  return db.getAdminDashboardStats();
}

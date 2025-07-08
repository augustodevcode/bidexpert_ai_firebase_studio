// src/app/admin/reports/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { AdminReportData } from '@/types';

export async function getAdminReportDataAction(): Promise<AdminReportData> {
  try {
    const db = await getDatabaseAdapter();
    return await db.getAdminReportData();
  } catch (error) {
    console.error('[Action - getAdminReportDataAction] Error fetching admin report data:', error);
    // Return a default structure on error to prevent crashes
    return {
      totalRevenue: 0,
      newUsersLast30Days: 0,
      activeAuctions: 0,
      lotsSoldCount: 0,
      salesData: [],
      categoryData: [],
    };
  }
}

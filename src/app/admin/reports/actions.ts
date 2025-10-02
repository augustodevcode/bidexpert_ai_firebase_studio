// src/app/admin/reports/actions.ts
/**
 * @fileoverview Server Actions para a página principal de relatórios do administrador.
 * Fornece funções que agregam estatísticas chave de toda a plataforma, como
 * contagens totais, faturamento, e dados para gráficos de desempenho.
 * Esta camada de ação delega a lógica de agregação complexa para o DashboardService.
 */
'use server';

import { DashboardService } from '@/services/dashboard.service';
import type { AdminReportData } from '@/types';

const dashboardService = new DashboardService();

/**
 * Fetches key statistics and chart data for the main admin dashboard.
 * @returns {Promise<AdminReportData>} An object containing all necessary data for the dashboard.
 */
export async function getAdminReportDataAction(): Promise<AdminReportData> {
  return dashboardService.getAdminDashboardStats();
}

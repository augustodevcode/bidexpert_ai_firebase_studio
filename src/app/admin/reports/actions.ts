// src/app/admin/reports/actions.ts
/**
 * @fileoverview Server Actions para a página principal de relatórios do administrador.
 * Fornece funções que agregam estatísticas chave de toda a plataforma, como
 * contagens totais, faturamento, e dados para gráficos de desempenho.
 * Esta camada de ação delega a lógica de agregação complexa para o DashboardService.
 */
'use server';

import { ReportService } from '@/services/report.service';
import { DashboardService } from '@/services/dashboard.service';
import type { AdminReportData, Report } from '@/types';

const reportService = new ReportService();
const dashboardService = new DashboardService();


export async function getAdminReportDataAction(): Promise<AdminReportData> {
  return dashboardService.getAdminDashboardStats();
}

/**
 * Fetches all saved reports for the current tenant.
 * @returns {Promise<Report[]>} A promise that resolves to an array of reports.
 */
export async function getReportsAction(): Promise<Report[]> {
    return reportService.getReports();
}

/**
 * Fetches a single saved report by its ID for the current tenant.
 * @param {string} id - The ID of the report.
 * @returns {Promise<Report | null>} A promise resolving to the report or null if not found.
 */
export async function getReportAction(id: string): Promise<Report | null> {
    return reportService.getReportById(id);
}

/**
 * Creates a new report record in the database for the current tenant.
 * @param {Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>} data - The report data.
 * @returns {Promise<{success: boolean, message: string, report?: Report}>} The result of the operation.
 */
export async function createReportAction(data: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>): Promise<{success: boolean, message: string, report?: Report}> {
    return reportService.createReport(data);
}

/**
 * Updates an existing report in the database for the current tenant.
 * @param {string} id - The ID of the report to update.
 * @param {Partial<Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>} data - The data to update.
 * @returns {Promise<{success: boolean, message: string}>} The result of the operation.
 */
export async function updateReportAction(id: string, data: Partial<Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>): Promise<{success: boolean, message: string}> {
    return reportService.updateReport(id, data);
}

/**
 * Deletes a report from the database for the current tenant.
 * @param {string} id - The ID of the report to delete.
 * @returns {Promise<{success: boolean, message: string}>} The result of the operation.
 */
export async function deleteReportAction(id: string): Promise<{success: boolean, message: string}> {
    return reportService.deleteReport(id);
}

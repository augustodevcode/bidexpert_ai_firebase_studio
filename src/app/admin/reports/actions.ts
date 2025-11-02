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
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/get-tenant-id';
import { Report } from '@prisma/client';

const dashboardService = new DashboardService();

/**
 * Fetches key statistics and chart data for the main admin dashboard.
 * @returns {Promise<AdminReportData>} An object containing all necessary data for the dashboard.
 */
export async function getAdminReportDataAction(): Promise<AdminReportData> {
  return dashboardService.getAdminDashboardStats();
}

export async function createReportAction(data: { name: string; description?: string; definition: any; }) {
    const tenantId = await getTenantId();
    try {
        const report = await prisma.report.create({
            data: {
                ...data,
                tenantId,
            },
        });
        revalidatePath('/admin/reports');
        return { success: true, message: 'Relatório criado com sucesso.', report };
    } catch (error) {
        return { success: false, message: 'Erro ao criar relatório.' };
    }
}

export async function getReportsAction(): Promise<Report[]> {
    const tenantId = await getTenantId();
    return prisma.report.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
    });
}

export async function updateReportAction(id: string, data: { name: string; description?: string; definition: any; }) {
    try {
        const report = await prisma.report.update({
            where: { id },
            data,
        });
        revalidatePath('/admin/reports');
        return { success: true, message: 'Relatório atualizado com sucesso.', report };
    } catch (error) {
        return { success: false, message: 'Erro ao atualizar relatório.' };
    }
}

export async function deleteReportAction(id: string) {
    try {
        await prisma.report.delete({
            where: { id },
        });
        revalidatePath('/admin/reports');
        return { success: true, message: 'Relatório excluído com sucesso.' };
    } catch (error) {
        return { success: false, message: 'Erro ao excluir relatório.' };
    }
}
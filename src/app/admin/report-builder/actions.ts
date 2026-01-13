// src/app/admin/report-builder/actions.ts
/**
 * @fileoverview Server Actions para o módulo de Report Builder.
 * Fornece operações CRUD para relatórios e templates.
 */
'use server';

import { ReportService } from '@/services/report.service';
import { getTenantIdFromRequest } from '@/lib/actions/auth';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { ReportType, ReportDefinition } from '@/types/report-builder.types';
import type { Report } from '@prisma/client';

const reportService = new ReportService();

// ============================================================================
// REPORT CRUD ACTIONS
// ============================================================================

/**
 * Obtém todos os relatórios do tenant atual
 */
export async function getReportsAction() {
  try {
    const tenantId = await getTenantIdFromRequest();
    const reports = await reportService.getReports(tenantId);
    return reports;
  } catch (error) {
    console.error('Erro ao buscar relatórios:', error);
    throw error;
  }
}

/**
 * Obtém um relatório específico por ID
 */
export async function getReportByIdAction(id: string): Promise<{ success: boolean; message: string; data?: Report }> {
  try {
    const tenantId = await getTenantIdFromRequest();
    const report = await reportService.getReportById(id, tenantId);
    
    if (!report) {
      return { success: false, message: 'Relatório não encontrado.' };
    }
    
    return { success: true, message: 'Relatório carregado.', data: report };
  } catch (error: unknown) {
    console.error('Erro ao buscar relatório:', error);
    const message = error instanceof Error ? error.message : 'Erro ao buscar relatório.';
    return { success: false, message };
  }
}

/**
 * Cria um novo relatório
 */
export async function createReportAction(data: {
  name: string;
  description?: string;
  type?: ReportType;
  dataSource?: string;
  definition: ReportDefinition;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: 'Usuário não autenticado.' };
    }

    const tenantId = await getTenantIdFromRequest();
    
    const result = await reportService.createReport(
      {
        name: data.name,
        description: data.description || null,
        definition: data.definition as unknown,
        createdById: session.user.id,
      },
      tenantId
    );

    if (result.success) {
      revalidatePath('/admin/report-builder/reports');
    }

    return result;
  } catch (error: unknown) {
    console.error('Erro ao criar relatório:', error);
    const message = error instanceof Error ? error.message : 'Erro ao criar relatório.';
    return { success: false, message };
  }
}

/**
 * Atualiza um relatório existente
 */
export async function updateReportAction(id: string | bigint, data: {
  name?: string;
  description?: string;
  definition?: ReportDefinition;
}) {
  try {
    const tenantId = await getTenantIdFromRequest();
    const reportId = typeof id === 'bigint' ? id.toString() : id;
    
    const updateData: Record<string, unknown> = { ...data };
    if (data.definition) {
      updateData.definition = data.definition as unknown;
    }

    const result = await reportService.updateReport(reportId, updateData, tenantId);

    if (result.success) {
      revalidatePath('/admin/report-builder/reports');
      revalidatePath(`/admin/report-builder/designer/${reportId}`);
    }

    return result;
  } catch (error: unknown) {
    console.error('Erro ao atualizar relatório:', error);
    const message = error instanceof Error ? error.message : 'Erro ao atualizar relatório.';
    return { success: false, message };
  }
}

/**
 * Exclui um relatório
 */
export async function deleteReportAction(id: string) {
  try {
    const tenantId = await getTenantIdFromRequest();
    const result = await reportService.deleteReport(id, tenantId);

    if (result.success) {
      revalidatePath('/admin/report-builder/reports');
    }

    return result;
  } catch (error: unknown) {
    console.error('Erro ao excluir relatório:', error);
    const message = error instanceof Error ? error.message : 'Erro ao excluir relatório.';
    return { success: false, message };
  }
}

// ============================================================================
// PREDEFINED REPORTS ACTIONS
// ============================================================================

// Relatórios predefinidos (em produção viriam do banco de dados)
const PREDEFINED_REPORTS_DATA: Record<string, {
  name: string;
  description: string;
  type: ReportType;
  dataSource: string;
  definition: ReportDefinition;
}> = {
  'EMP_LIST': {
    name: 'Lista de Funcionários',
    description: 'Relatório completo com dados dos funcionários cadastrados',
    type: 'TABLE',
    dataSource: 'User',
    definition: {
      version: '1.0',
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 15, bottom: 20, left: 15 },
      bands: {
        reportHeader: { id: 'reportHeader', height: 60 },
        pageHeader: { id: 'pageHeader', height: 40 },
        detail: { id: 'detail', height: 30 },
        pageFooter: { id: 'pageFooter', height: 30 },
      },
      elements: [
        {
          id: 'title',
          type: 'text',
          bandId: 'reportHeader',
          position: { x: 0, y: 10 },
          size: { width: 400, height: 30 },
          properties: {
            content: 'Lista de Funcionários',
            font: { family: 'Inter', size: 18, weight: 'bold', color: '#1e293b' },
            textAlign: 'center',
          },
        },
        {
          id: 'table',
          type: 'table',
          bandId: 'detail',
          position: { x: 0, y: 0 },
          size: { width: 600, height: 200 },
          properties: {
            tableConfig: {
              columns: [
                { id: 'col-1', fieldBinding: 'fullName', header: 'Nome Completo', width: 200 },
                { id: 'col-2', fieldBinding: 'email', header: 'E-mail', width: 200 },
                { id: 'col-3', fieldBinding: 'cellPhone', header: 'Telefone', width: 120 },
                { id: 'col-4', fieldBinding: 'createdAt', header: 'Cadastro', width: 100, format: 'date' },
              ],
              showHeader: true,
              alternateRowColors: true,
            },
          },
        },
      ],
    },
  },
  'EMP_BIRTHDAY': {
    name: 'Aniversariantes do Mês',
    description: 'Lista de funcionários que fazem aniversário no mês selecionado',
    type: 'TABLE',
    dataSource: 'User',
    definition: {
      version: '1.0',
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 15, bottom: 20, left: 15 },
      bands: {
        reportHeader: { id: 'reportHeader', height: 60 },
        detail: { id: 'detail', height: 30 },
        pageFooter: { id: 'pageFooter', height: 30 },
      },
      elements: [
        {
          id: 'title',
          type: 'text',
          bandId: 'reportHeader',
          position: { x: 0, y: 10 },
          size: { width: 400, height: 30 },
          properties: {
            content: 'Aniversariantes do Mês',
            font: { family: 'Inter', size: 18, weight: 'bold', color: '#1e293b' },
            textAlign: 'center',
          },
        },
        {
          id: 'table',
          type: 'table',
          bandId: 'detail',
          position: { x: 0, y: 0 },
          size: { width: 500, height: 200 },
          properties: {
            tableConfig: {
              columns: [
                { id: 'col-1', fieldBinding: 'fullName', header: 'Nome', width: 250 },
                { id: 'col-2', fieldBinding: 'dateOfBirth', header: 'Data de Nascimento', width: 150, format: 'date' },
                { id: 'col-3', fieldBinding: 'email', header: 'E-mail', width: 200 },
              ],
              showHeader: true,
              alternateRowColors: true,
            },
          },
        },
      ],
    },
  },
  'AUCTION_SUMMARY': {
    name: 'Resumo de Leilões',
    description: 'Visão geral dos leilões com estatísticas de participação',
    type: 'MASTER_DETAIL',
    dataSource: 'Auction',
    definition: {
      version: '1.0',
      pageSize: 'A4',
      orientation: 'landscape',
      margins: { top: 15, right: 15, bottom: 15, left: 15 },
      bands: {
        reportHeader: { id: 'reportHeader', height: 80 },
        groupHeaders: [{ id: 'groupHeader', height: 35, groupField: 'status', sortOrder: 'asc' }],
        detail: { id: 'detail', height: 25 },
        groupFooters: [{ id: 'groupFooter', height: 30, groupField: 'status', sortOrder: 'asc' }],
        pageFooter: { id: 'pageFooter', height: 25 },
      },
      elements: [
        {
          id: 'title',
          type: 'text',
          bandId: 'reportHeader',
          position: { x: 0, y: 10 },
          size: { width: 700, height: 35 },
          properties: {
            content: 'Resumo de Leilões',
            font: { family: 'Inter', size: 24, weight: 'bold', color: '#1e40af' },
            textAlign: 'center',
          },
        },
        {
          id: 'table',
          type: 'table',
          bandId: 'detail',
          position: { x: 0, y: 0 },
          size: { width: 750, height: 200 },
          properties: {
            tableConfig: {
              columns: [
                { id: 'col-1', fieldBinding: 'title', header: 'Título', width: 200 },
                { id: 'col-2', fieldBinding: 'startDate', header: 'Data Início', width: 100, format: 'datetime' },
                { id: 'col-3', fieldBinding: 'endDate', header: 'Data Fim', width: 100, format: 'datetime' },
                { id: 'col-4', fieldBinding: 'status', header: 'Status', width: 100 },
                { id: 'col-5', fieldBinding: 'lotsCount', header: 'Lotes', width: 80, alignment: 'center' },
              ],
              showHeader: true,
              showFooter: true,
              alternateRowColors: true,
              headerStyle: { weight: 'bold', color: '#ffffff' },
            },
          },
        },
      ],
      groupings: [{ id: 'group-status', field: 'status', sortOrder: 'asc' }],
    },
  },
  'SALES_INVOICE': {
    name: 'Nota de Arrematação',
    description: 'Documento fiscal para registro de vendas em leilão',
    type: 'INVOICE',
    dataSource: 'Lot',
    definition: {
      version: '1.0',
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      bands: {
        reportHeader: { id: 'reportHeader', height: 120 },
        detail: { id: 'detail', height: 400 },
        reportFooter: { id: 'reportFooter', height: 100 },
      },
      elements: [
        {
          id: 'logo',
          type: 'image',
          bandId: 'reportHeader',
          position: { x: 10, y: 10 },
          size: { width: 150, height: 50 },
          properties: {
            imageUrl: '/logo.png',
          },
        },
        {
          id: 'title',
          type: 'text',
          bandId: 'reportHeader',
          position: { x: 170, y: 10 },
          size: { width: 300, height: 30 },
          properties: {
            content: 'NOTA DE ARREMATAÇÃO',
            font: { family: 'Inter', size: 20, weight: 'bold', color: '#1e293b' },
          },
        },
        {
          id: 'invoice-number',
          type: 'field',
          bandId: 'reportHeader',
          position: { x: 400, y: 10 },
          size: { width: 150, height: 20 },
          properties: {
            fieldBinding: 'invoiceNumber',
            font: { family: 'Inter', size: 12, weight: 'bold' },
          },
        },
      ],
    },
  },
};

/**
 * Copia um relatório predefinido para o usuário
 */
export async function copyPredefinedReportAction(reportCode: string, newName: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: 'Usuário não autenticado.' };
    }

    const tenantId = await getTenantIdFromRequest();
    const predefinedReport = PREDEFINED_REPORTS_DATA[reportCode];

    if (!predefinedReport) {
      return { success: false, message: 'Template não encontrado.' };
    }

    const result = await reportService.createReport(
      {
        name: newName,
        description: `Cópia de "${predefinedReport.name}". ${predefinedReport.description}`,
        definition: predefinedReport.definition as any,
        createdById: session.user.id,
      },
      tenantId
    );

    if (result.success) {
      revalidatePath('/admin/report-builder/reports');
    }

    return result;
  } catch (error: unknown) {
    console.error('Erro ao copiar relatório predefinido:', error);
    const message = error instanceof Error ? error.message : 'Erro ao copiar relatório.';
    return { success: false, message };
  }
}

/**
 * Obtém definição de um relatório predefinido para preview
 */
export async function getPredefinedReportAction(reportCode: string) {
  try {
    const predefinedReport = PREDEFINED_REPORTS_DATA[reportCode];

    if (!predefinedReport) {
      return { success: false, message: 'Template não encontrado.', data: null };
    }

    return { 
      success: true, 
      message: 'Template encontrado.',
      data: predefinedReport,
    };
  } catch (error: unknown) {
    console.error('Erro ao buscar template:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido.';
    return { success: false, message, data: null };
  }
}

// ============================================================================
// EXPORT ACTIONS
// ============================================================================

/**
 * Gera dados para exportação de relatório
 */
export async function generateReportDataAction(reportId: string, _parameters?: Record<string, unknown>) {
  try {
    const tenantId = await getTenantIdFromRequest();
    const report = await reportService.getReportById(reportId, tenantId);

    if (!report) {
      return { success: false, message: 'Relatório não encontrado.', data: null };
    }

    const mockData = generateMockData(report.definition as unknown as ReportDefinition);

    return {
      success: true,
      message: 'Dados gerados com sucesso.',
      data: mockData,
      report,
    };
  } catch (error: unknown) {
    console.error('Erro ao gerar dados do relatório:', error);
    const message = error instanceof Error ? error.message : 'Erro ao gerar dados.';
    return { success: false, message, data: null };
  }
}

// Helper para gerar dados mock
function generateMockData(_definition: ReportDefinition): unknown[] {
  // Dados de exemplo para demonstração
  return [
    { id: 1, fullName: 'João Silva', email: 'joao@email.com', cellPhone: '(11) 99999-1111', createdAt: new Date() },
    { id: 2, fullName: 'Maria Santos', email: 'maria@email.com', cellPhone: '(11) 99999-2222', createdAt: new Date() },
    { id: 3, fullName: 'Pedro Oliveira', email: 'pedro@email.com', cellPhone: '(11) 99999-3333', createdAt: new Date() },
    { id: 4, fullName: 'Ana Costa', email: 'ana@email.com', cellPhone: '(11) 99999-4444', createdAt: new Date() },
    { id: 5, fullName: 'Carlos Lima', email: 'carlos@email.com', cellPhone: '(11) 99999-5555', createdAt: new Date() },
  ];
}

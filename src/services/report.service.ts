// src/services/report.service.ts
/**
 * @fileoverview Este arquivo contém a classe ReportService, que encapsula a
 * lógica de negócio para o gerenciamento de relatórios customizados criados
 * pelos usuários no Construtor de Relatórios. Ele interage com o repositório
 * para realizar operações de CRUD nas definições de relatórios.
 */
import { ReportRepository } from '@/repositories/report.repository';
import type { Report } from '@/types';
import { getTenantId } from '@/lib/get-tenant-id';
import type { Prisma } from '@prisma/client';

export class ReportService {
  private repository: ReportRepository;

  constructor() {
    this.repository = new ReportRepository();
  }

  async getReports(tenantId?: string): Promise<Report[]> {
    const finalTenantId = await getTenantId(tenantId);
    if (!finalTenantId) {
      return [];
    }
    return this.repository.findAll(finalTenantId);
  }

  async getReportById(id: string, tenantId?: string): Promise<Report | null> {
    const finalTenantId = await getTenantId(tenantId);
    if (!finalTenantId) {
      return null;
    }
    return this.repository.findById(finalTenantId, id);
  }
  
  async createReport(data: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>, tenantId?: string): Promise<{ success: boolean; message: string; report?: Report }> {
      const finalTenantId = await getTenantId(tenantId);
      if (!finalTenantId) {
        return { success: false, message: 'Tenant ID não encontrado.' };
      }
      try {
          const reportData = {
              ...data,
              tenant: { connect: { id: finalTenantId } },
          }
          const newReport = await this.repository.create(reportData as Prisma.ReportCreateInput);
          return { success: true, message: 'Relatório criado com sucesso.', report: newReport };
      } catch (error: any) {
          return { success: false, message: `Falha ao criar relatório: ${error.message}`};
      }
  }
  
  async updateReport(id: string, data: Partial<Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>, tenantId?: string): Promise<{ success: boolean; message: string }> {
      const finalTenantId = await getTenantId(tenantId);
      if (!finalTenantId) {
        return { success: false, message: 'Tenant ID não encontrado.' };
      }
      try {
          await this.repository.update(finalTenantId, id, data);
          return { success: true, message: 'Relatório atualizado com sucesso.'};
      } catch (error: any) {
          return { success: false, message: `Falha ao atualizar relatório: ${error.message}`};
      }
  }
  
  async deleteReport(id: string, tenantId?: string): Promise<{ success: boolean; message: string }> {
      const finalTenantId = await getTenantId(tenantId);
      if (!finalTenantId) {
        return { success: false, message: 'Tenant ID não encontrado.' };
      }
      try {
          await this.repository.delete(finalTenantId, id);
          return { success: true, message: 'Relatório excluído com sucesso.'};
      } catch (error: any) {
          return { success: false, message: `Falha ao excluir relatório: ${error.message}`};
      }
  }

  async deleteAllReports(tenantId: string): Promise<{ success: boolean; message: string; }> {
    try {
      await this.repository.deleteAll(tenantId);
      return { success: true, message: 'Todos os relatórios foram excluídos.' };
    } catch (error: any) {
      return { success: false, message: 'Falha ao excluir todos os relatórios.' };
    }
  }
}


// src/services/report.service.ts
/**
 * @fileoverview Este arquivo contém a classe ReportService, que encapsula a
 * lógica de negócio para o gerenciamento de relatórios customizados criados
 * pelos usuários no Construtor de Relatórios. Ele interage com o repositório
 * para realizar operações de CRUD nas definições de relatórios.
 */
import { ReportRepository } from '@/repositories/report.repository';
import type { Report, Prisma } from '@prisma/client';
import { tenantContext } from '@/lib/tenant-context';

export class ReportService {
  private repository: ReportRepository;

  constructor() {
    this.repository = new ReportRepository();
  }

  async getReports(tenantId?: string): Promise<Report[]> {
    const finalTenantId = tenantId || tenantContext.getStore()?.tenantId || '1';
    return this.repository.findAll(finalTenantId);
  }

  async getReportById(id: string, tenantId?: string): Promise<Report | null> {
    const finalTenantId = tenantId || tenantContext.getStore()?.tenantId || '1';
    return this.repository.findById(finalTenantId, id);
  }
  
  async createReport(data: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'tenantId' | 'createdById'> & { createdById: string }, tenantId?: string): Promise<{ success: boolean; message: string; report?: Report }> {
      const finalTenantId = tenantId || tenantContext.getStore()?.tenantId || '1';
      try {
          const reportData: Prisma.ReportCreateInput = {
              name: data.name,
              description: data.description,
              definition: data.definition,
              Tenant: { connect: { id: BigInt(finalTenantId) } },
              User: { connect: { id: BigInt(data.createdById) } },
              updatedAt: new Date()
          };
          const newReport = await this.repository.create(reportData);
          return { success: true, message: 'Relatório criado com sucesso.', report: newReport };
      } catch (error: any) {
          return { success: false, message: `Falha ao criar relatório: ${error.message}`};
      }
  }
  
  async updateReport(id: string, data: Partial<Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>, tenantId?: string): Promise<{ success: boolean; message: string }> {
      const finalTenantId = tenantId || tenantContext.getStore()?.tenantId || '1';
      try {
          await this.repository.update(finalTenantId, id, { ...data, updatedAt: new Date() });
          return { success: true, message: 'Relatório atualizado com sucesso.'};
      } catch (error: any) {
          return { success: false, message: `Falha ao atualizar relatório: ${error.message}`};
      }
  }
  
  async deleteReport(id: string, tenantId?: string): Promise<{ success: boolean; message: string }> {
      const finalTenantId = tenantId || tenantContext.getStore()?.tenantId || '1';
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

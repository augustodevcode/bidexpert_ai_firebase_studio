// src/services/report.service.ts
import { ReportRepository } from '@/repositories/report.repository';
import type { Report } from '@/types';
import { getTenantIdFromRequest } from '@/lib/actions/auth';
import type { Prisma } from '@prisma/client';

export class ReportService {
  private repository: ReportRepository;

  constructor() {
    this.repository = new ReportRepository();
  }

  async getReports(): Promise<Report[]> {
    const tenantId = await getTenantIdFromRequest();
    return this.repository.findAll(tenantId);
  }

  async getReportById(id: string): Promise<Report | null> {
    const tenantId = await getTenantIdFromRequest();
    return this.repository.findById(tenantId, id);
  }
  
  async createReport(data: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>): Promise<{ success: boolean; message: string; report?: Report }> {
      const tenantId = await getTenantIdFromRequest();
      try {
          const reportData = {
              ...data,
              tenant: { connect: { id: tenantId } },
          }
          const newReport = await this.repository.create(reportData as Prisma.ReportCreateInput);
          return { success: true, message: 'Relatório criado com sucesso.', report: newReport };
      } catch (error: any) {
          return { success: false, message: `Falha ao criar relatório: ${error.message}`};
      }
  }
  
  async updateReport(id: string, data: Partial<Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>): Promise<{ success: boolean; message: string }> {
      const tenantId = await getTenantIdFromRequest();
      try {
          await this.repository.update(tenantId, id, data);
          return { success: true, message: 'Relatório atualizado com sucesso.'};
      } catch (error: any) {
          return { success: false, message: `Falha ao atualizar relatório: ${error.message}`};
      }
  }
  
  async deleteReport(id: string): Promise<{ success: boolean; message: string }> {
      const tenantId = await getTenantIdFromRequest();
      try {
          await this.repository.delete(tenantId, id);
          return { success: true, message: 'Relatório excluído com sucesso.'};
      } catch (error: any) {
          return { success: false, message: `Falha ao excluir relatório: ${error.message}`};
      }
  }
}

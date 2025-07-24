// src/services/judicial-process.service.ts
import { JudicialProcessRepository } from '@/repositories/judicial-process.repository';
import type { JudicialProcess, JudicialProcessFormData } from '@/types';
import { slugify } from '@/lib/sample-data-helpers';
import type { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export class JudicialProcessService {
  private repository: JudicialProcessRepository;

  constructor() {
    this.repository = new JudicialProcessRepository();
  }

  async getJudicialProcesses(): Promise<JudicialProcess[]> {
    const processes = await this.repository.findAll();
    return processes.map(p => ({
      ...p,
      courtName: p.court?.name,
      districtName: p.district?.name,
      branchName: p.branch?.name,
      sellerName: p.seller?.name,
    }));
  }

  async getJudicialProcessById(id: string): Promise<JudicialProcess | null> {
    const process = await this.repository.findById(id);
    if (!process) return null;
    return {
      ...process,
      courtName: process.court?.name,
      districtName: process.district?.name,
      branchName: process.branch?.name,
      sellerName: process.seller?.name,
    };
  }

  async createJudicialProcess(data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: string; }> {
    try {
      const { parties, ...processData } = data;
      const dataToCreate: Prisma.JudicialProcessCreateInput = {
        ...processData,
        publicId: `PROC-${uuidv4()}`,
        parties: {
          create: parties,
        },
      };

      const newProcess = await this.repository.create(dataToCreate);
      return { success: true, message: 'Processo judicial criado com sucesso.', processId: newProcess.id };
    } catch (error: any) {
      console.error("Error in JudicialProcessService.create:", error);
      return { success: false, message: `Falha ao criar processo: ${error.message}` };
    }
  }

  async updateJudicialProcess(id: string, data: Partial<JudicialProcessFormData>): Promise<{ success: boolean; message: string; }> {
    try {
      const { parties, ...processData } = data;
      await this.repository.update(id, processData, parties);
      return { success: true, message: 'Processo judicial atualizado com sucesso.' };
    } catch (error: any) {
      console.error(`Error in JudicialProcessService.update for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar processo: ${error.message}` };
    }
  }

  async deleteJudicialProcess(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      await this.repository.delete(id);
      return { success: true, message: 'Processo judicial excluído com sucesso.' };
    } catch (error: any) {
      console.error(`Error in JudicialProcessService.delete for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir processo: ${error.message}` };
    }
  }
}

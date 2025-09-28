// src/services/judicial-process.service.ts
/**
 * @fileoverview Este arquivo contém a classe JudicialProcessService, que
 * encapsula a lógica de negócio para o gerenciamento de Processos Judiciais.
 * O serviço lida com a criação e atualização de processos, incluindo a
 * gestão de suas partes (autores, réus, etc.) e a vinculação automática
 * de comitentes judiciais.
 */
import { JudicialProcessRepository } from '@/repositories/judicial-process.repository';
import { SellerService } from './seller.service';
import type { JudicialProcess, JudicialProcessFormData } from '@/types';
import { slugify } from '@/lib/ui-helpers';
import type { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';


export class JudicialProcessService {
  private repository: JudicialProcessRepository;
  private sellerService: SellerService;

  constructor() {
    this.repository = new JudicialProcessRepository();
    this.sellerService = new SellerService();
  }

  async getJudicialProcesses(tenantId: string): Promise<JudicialProcess[]> {
    const processes = await this.repository.findAll(tenantId);
    return processes.map(p => ({
      ...p,
      courtName: p.court?.name,
      districtName: p.district?.name,
      branchName: p.branch?.name,
      sellerName: p.seller?.name,
    }));
  }

  async getJudicialProcessById(tenantId: string, id: string): Promise<JudicialProcess | null> {
    const process = await this.repository.findById(tenantId, id);
    if (!process) return null;
    return {
      ...process,
      courtName: process.court?.name,
      districtName: process.district?.name,
      branchName: process.branch?.name,
      sellerName: process.seller?.name,
    };
  }

  async createJudicialProcess(tenantId: string, data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: string; }> {
    try {
      const { parties, courtId, districtId, branchId, sellerId: providedSellerId, ...processData } = data;
      let finalSellerId = providedSellerId;

      if (!finalSellerId && branchId) {
        const branchSeller = await prisma.seller.findFirst({ where: { judicialBranchId: branchId, tenantId }});
        if (branchSeller) {
          finalSellerId = branchSeller.id;
        } else {
          const branchDetails = await prisma.judicialBranch.findUnique({ where: { id: branchId }});
          if (branchDetails) {
            const newSellerResult = await this.sellerService.createSeller(tenantId, {
              name: branchDetails.name,
              isJudicial: true,
              judicialBranchId: branchId
            } as any);
            if (newSellerResult.success && newSellerResult.sellerId) {
              finalSellerId = newSellerResult.sellerId;
            } else {
              throw new Error(`Falha ao criar comitente para a vara: ${newSellerResult.message}`);
            }
          }
        }
      }
      
      const dataToCreate: Prisma.JudicialProcessCreateInput = {
        ...processData,
        publicId: `PROC-${uuidv4()}`,
        parties: {
          create: parties,
        },
        court: { connect: { id: courtId } },
        district: { connect: { id: districtId } },
        branch: { connect: { id: branchId } },
        tenant: { connect: { id: tenantId } },
      };

      if (finalSellerId) {
        dataToCreate.seller = { connect: { id: finalSellerId } };
      }

      const newProcess = await this.repository.create(dataToCreate);
      return { success: true, message: 'Processo judicial criado com sucesso.', processId: newProcess.id };
    } catch (error: any) {
      console.error("Error in JudicialProcessService.create:", error);
      return { success: false, message: `Falha ao criar processo: ${error.message}` };
    }
  }

  async updateJudicialProcess(tenantId: string, id: string, data: Partial<JudicialProcessFormData>): Promise<{ success: boolean; message: string; }> {
    try {
      const { parties, courtId, districtId, branchId, sellerId, ...processData } = data;
      const dataToUpdate: Partial<Prisma.JudicialProcessUpdateInput> = {...processData};

      if (courtId) dataToUpdate.court = { connect: { id: courtId } };
      if (districtId) dataToUpdate.district = { connect: { id: districtId } };
      if (branchId) dataToUpdate.branch = { connect: { id: branchId } };
      if (sellerId) dataToUpdate.seller = { connect: { id: sellerId } };
      else if (data.hasOwnProperty('sellerId')) dataToUpdate.seller = { disconnect: true };

      await this.repository.update(tenantId, id, dataToUpdate, parties);
      return { success: true, message: 'Processo judicial atualizado com sucesso.' };
    } catch (error: any) {
      console.error(`Error in JudicialProcessService.update for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar processo: ${error.message}` };
    }
  }

  async deleteJudicialProcess(tenantId: string, id: string): Promise<{ success: boolean; message: string; }> {
    try {
      await this.repository.delete(tenantId, id);
      return { success: true, message: 'Processo judicial excluído com sucesso.' };
    } catch (error: any) {
      console.error(`Error in JudicialProcessService.delete for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir processo: ${error.message}` };
    }
  }
}

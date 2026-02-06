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
import type { JudicialProcess, JudicialProcessFormData, ProcessParty } from '@/types';
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
    // DEBUG: Check for lots in processes
    if (processes.length > 0 && (processes[0] as any).lots) {
        console.error('JudicialProcessService.getJudicialProcesses: FOUND LOTS IN PROCESS RESPONSE!', (processes[0] as any).lots);
    }
    return processes.map(p => {
        // Explicitly remove potential relations that might cause serialization issues
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { lots, assets, Lot, Asset, Court, JudicialDistrict, JudicialBranch, Seller, JudicialParty, Auction, ...rest } = p as any;
        
        const partiesList = p.JudicialParty ?? p.parties ?? [];
        
        return {
            ...rest,
            id: p.id.toString(),
            tenantId: p.tenantId.toString(),
            courtId: p.courtId?.toString(),
            districtId: p.districtId?.toString(),
            branchId: p.branchId?.toString(),
            sellerId: p.sellerId?.toString(),
            courtName: p.Court?.name ?? p.court?.name,
            districtName: p.JudicialDistrict?.name ?? p.district?.name,
            branchName: p.JudicialBranch?.name ?? p.branch?.name,
            sellerName: p.Seller?.name ?? p.seller?.name,
            parties: partiesList.map((party: any) => ({...party, id: party.id.toString(), processId: party.processId.toString()})),
            lotCount: p._count?.Lot ?? p._count?.lots ?? 0,
            assetCount: p._count?.Asset ?? p._count?.assets ?? 0,
            auctions: Auction?.map((a: any) => ({ ...a, id: a.id.toString() })) ?? [],
        };
    });
  }

  async getJudicialProcessById(tenantId: string, id: string): Promise<JudicialProcess | null> {
    const process = await this.repository.findById(tenantId, id);
    if (!process) return null;
    
    // Clean up relations
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { lots, assets, Lot, Asset, Court, JudicialDistrict, JudicialBranch, Seller, JudicialParty, Auction, ...rest } = process as any;
    
    const partiesList = process.JudicialParty ?? process.parties ?? [];

    return {
      ...rest,
      id: process.id.toString(),
      tenantId: process.tenantId.toString(),
      courtId: process.courtId?.toString(),
      districtId: process.districtId?.toString(),
      branchId: process.branchId?.toString(),
      sellerId: process.sellerId?.toString(),
      courtName: process.Court?.name ?? process.court?.name,
      districtName: process.JudicialDistrict?.name ?? process.district?.name,
      branchName: process.JudicialBranch?.name ?? process.branch?.name,
      sellerName: process.Seller?.name ?? process.seller?.name,
      parties: partiesList.map((party: any) => ({...party, id: party.id.toString(), processId: party.processId.toString()})),
      auctions: Auction?.map((a: any) => ({ ...a, id: a.id.toString() })) ?? [],
      lots: Lot?.map((l: any) => ({ ...l, id: l.id.toString(), title: l.title ?? l.description ?? 'Lote sem título' })) ?? [],
      assets: Asset?.map((a: any) => ({ ...a, id: a.id.toString() })) ?? [],
    };
  }

  async createJudicialProcess(tenantId: string, data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: string; }> {
    try {
      const { parties, courtId, districtId, branchId, sellerId: providedSellerId, ...processData } = data;
      let finalSellerId = providedSellerId;

      if (!finalSellerId && branchId) {
        const branchSeller = await prisma.seller.findFirst({ where: { judicialBranchId: BigInt(branchId), tenantId: BigInt(tenantId) }});
        if (branchSeller) {
          finalSellerId = branchSeller.id.toString();
        } else {
          const branchDetails = await prisma.judicialBranch.findUnique({ where: { id: BigInt(branchId) }});
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
        JudicialParty: {
          create: parties as any,
        },
        Tenant: { connect: { id: BigInt(tenantId) } },
      };

      if (courtId) (dataToCreate as any).Court = { connect: { id: BigInt(courtId) } };
      if (districtId) (dataToCreate as any).JudicialDistrict = { connect: { id: BigInt(districtId) } };
      if (branchId) (dataToCreate as any).JudicialBranch = { connect: { id: BigInt(branchId) } };

      if (finalSellerId) {
        (dataToCreate as any).Seller = { connect: { id: BigInt(finalSellerId) } };
      }

      const newProcess = await prisma.judicialProcess.upsert({
        where: { processNumber_tenantId: { processNumber: processData.processNumber, tenantId: BigInt(tenantId) } },
        update: dataToCreate,
        create: dataToCreate,
      });
      return { success: true, message: 'Processo judicial criado/atualizado com sucesso.', processId: newProcess.id.toString() };
    } catch (error: any) {
      console.error("Error in JudicialProcessService.create:", error);
      return { success: false, message: `Falha ao criar processo: ${error.message}` };
    }
  }

  async updateJudicialProcess(tenantId: string, id: string, data: Partial<JudicialProcessFormData>): Promise<{ success: boolean; message: string; }> {
    try {
      const { parties, courtId, districtId, branchId, sellerId, ...processData } = data;
      const dataToUpdate: Partial<Prisma.JudicialProcessUpdateInput> = {...processData};

      if (courtId) dataToUpdate.court = { connect: { id: BigInt(courtId) } };
      if (districtId) dataToUpdate.district = { connect: { id: BigInt(districtId) } };
      if (branchId) dataToUpdate.branch = { connect: { id: BigInt(branchId) } };
      if (sellerId) dataToUpdate.seller = { connect: { id: BigInt(sellerId) } };
      else if (data.hasOwnProperty('sellerId')) dataToUpdate.seller = { disconnect: true };

      await this.repository.update(tenantId, id, dataToUpdate, parties as any[]);
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

  async deleteAllJudicialProcesses(tenantId: string): Promise<{ success: boolean; message: string; }> {
    try {
      const processes = await this.repository.findAll(tenantId);
      for (const process of processes) {
        await this.deleteJudicialProcess(tenantId, process.id.toString());
      }
      return { success: true, message: 'Todos os processos judiciais foram excluídos.' };
    } catch (error: any) {
      return { success: false, message: 'Falha ao excluir todos os processos judiciais.' };
    }
  }
}

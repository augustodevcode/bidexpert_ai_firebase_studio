// src/services/vehicle-make.service.ts
/**
 * @fileoverview Este arquivo contém a classe VehicleMakeService, que gerencia a
 * lógica de negócio para as Marcas de Veículos. Ele interage com o repositório
 * para realizar operações de CRUD e garante a aplicação de regras de negócio,
 * como impedir a exclusão de uma marca que ainda possui modelos vinculados.
 */
import { VehicleMakeRepository } from '@/repositories/vehicle-make.repository';
import { prisma } from '@/lib/prisma';
import type { VehicleMake, VehicleMakeFormData } from '@/types';
import { slugify } from '@/lib/ui-helpers';
import type { Prisma } from '@prisma/client';

export class VehicleMakeService {
  private repository: VehicleMakeRepository;

  constructor() {
    this.repository = new VehicleMakeRepository();
  }

  async getVehicleMakes(): Promise<VehicleMake[]> {
    return this.repository.findAll();
  }

  async getVehicleMakeById(id: string): Promise<VehicleMake | null> {
    return this.repository.findById(id);
  }

  async createVehicleMake(data: VehicleMakeFormData): Promise<{ success: boolean; message: string; makeId?: string; }> {
    try {
      const slug = slugify(data.name);
      
      const newMake = await prisma.vehicleMake.upsert({
        where: { slug },
        update: { ...data, slug },
        create: { ...data, slug },
      });
      return { success: true, message: 'Marca criada/atualizada com sucesso.', makeId: newMake.id };
    } catch (error: any) {
      console.error("Error in VehicleMakeService.create:", error);
      return { success: false, message: `Falha ao criar marca: ${error.message}` };
    }
  }

  async updateVehicleMake(id: string, data: Partial<VehicleMakeFormData>): Promise<{ success: boolean; message: string; }> {
    try {
      const dataToUpdate: Partial<Prisma.VehicleMakeUpdateInput> = { ...data };
      if (data.name) {
        dataToUpdate.slug = slugify(data.name);
      }
      await this.repository.update(id, dataToUpdate);
      return { success: true, message: 'Marca atualizada com sucesso.' };
    } catch (error: any) {
      console.error(`Error in VehicleMakeService.update for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar marca: ${error.message}` };
    }
  }

  async deleteVehicleMake(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      // In a real app, check for linked models
      const modelCount = await this.repository.countModels(id);
      if (modelCount > 0) {
        return { success: false, message: `Não é possível excluir. A marca possui ${modelCount} modelo(s) vinculado(s).` };
      }
      await this.repository.delete(id);
      return { success: true, message: 'Marca excluída com sucesso.' };
    } catch (error: any) {
      console.error(`Error in VehicleMakeService.delete for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir marca: ${error.message}` };
    }
  }

  async deleteMany(where: Prisma.VehicleMakeWhereInput): Promise<{ success: boolean; message: string; }> {
    try {
      await this.repository.deleteMany(where);
      return { success: true, message: 'Marcas excluídas com sucesso.' };
    } catch (error: any) {
      console.error("Error in VehicleMakeService.deleteMany:", error);
      return { success: false, message: `Falha ao excluir marcas: ${error.message}` };
    }
  }
}

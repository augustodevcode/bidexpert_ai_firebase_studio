// src/services/vehicle-make.service.ts
import { VehicleMakeRepository } from '@/repositories/vehicle-make.repository';
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
      const existing = await this.repository.findByName(data.name);
      if (existing) {
        return { success: false, message: 'Já existe uma marca com este nome.' };
      }
      
      const dataToCreate: Prisma.VehicleMakeCreateInput = { ...data, slug };
      const newMake = await this.repository.create(dataToCreate);
      return { success: true, message: 'Marca criada com sucesso.', makeId: newMake.id };
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
}

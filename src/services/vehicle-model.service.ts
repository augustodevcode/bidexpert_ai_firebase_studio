// src/services/vehicle-model.service.ts
/**
 * @fileoverview Este arquivo contém a classe VehicleModelService, que gerencia a
 * lógica de negócio para os Modelos de Veículos. Ele interage com o repositório
 * para realizar operações de CRUD, garantindo que cada modelo seja corretamente
 * associado a uma marca e validando dados antes da persistência.
 */
import { VehicleModelRepository } from '@/repositories/vehicle-model.repository';
import { prisma } from '@/lib/prisma';
import type { VehicleModel, VehicleModelFormData } from '@/types';
import { slugify } from '@/lib/ui-helpers';
import type { Prisma } from '@prisma/client';

export class VehicleModelService {
  private repository: VehicleModelRepository;

  constructor() {
    this.repository = new VehicleModelRepository();
  }
  
  private mapModelsWithDetails(models: any[]): VehicleModel[] {
    return models.map(model => ({
      ...model,
      makeName: model.make?.name,
    }));
  }

  async getVehicleModels(): Promise<VehicleModel[]> {
    const models = await this.repository.findAll();
    return this.mapModelsWithDetails(models);
  }

  async getVehicleModelById(id: string): Promise<VehicleModel | null> {
    const model = await this.repository.findById(id);
    if (!model) return null;
    return this.mapModelsWithDetails([model])[0];
  }

  async createVehicleModel(data: VehicleModelFormData): Promise<{ success: boolean; message: string; modelId?: string; }> {
    try {
      const slug = slugify(data.name);
      const { makeId, ...restOfData } = data;
      const dataToUpsert: Prisma.VehicleModelCreateInput = { 
        ...restOfData,
        slug,
        VehicleMake: { connect: { id: BigInt(makeId) } },
      };
      
      const newModel = await prisma.vehicleModel.upsert({
        where: { makeId_name: { makeId: BigInt(makeId), name: data.name } },
        update: dataToUpsert,
        create: dataToUpsert,
      });
      return { success: true, message: 'Modelo criado/atualizado com sucesso.', modelId: newModel.id.toString() };
    } catch (error: any) {
      console.error("Error in VehicleModelService.create:", error);
       if (error.code === 'P2002') {
        return { success: false, message: 'Já existe um modelo com este nome para esta marca.' };
      }
      return { success: false, message: `Falha ao criar modelo: ${error.message}` };
    }
  }

  async updateVehicleModel(id: string, data: Partial<VehicleModelFormData>): Promise<{ success: boolean; message: string; }> {
    try {
      const dataToUpdate: Partial<Prisma.VehicleModelUpdateInput> = { ...data };
      if (data.name) {
        dataToUpdate.slug = slugify(data.name);
      }
      if (data.makeId) {
        dataToUpdate.VehicleMake = { connect: { id: BigInt(data.makeId) } };
      }
      await this.repository.update(id, dataToUpdate);
      return { success: true, message: 'Modelo atualizado com sucesso.' };
    } catch (error: any) {
      console.error(`Error in VehicleModelService.update for id ${id}:`, error);
       if (error.code === 'P2002') {
        return { success: false, message: 'Já existe um modelo com este nome para esta marca.' };
      }
      return { success: false, message: `Falha ao atualizar modelo: ${error.message}` };
    }
  }

  async deleteVehicleModel(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      await this.repository.delete(id);
      return { success: true, message: 'Modelo excluído com sucesso.' };
    } catch (error: any) {
      console.error(`Error in VehicleModelService.delete for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir modelo: ${error.message}` };
    }
  }

  async deleteMany(where: Prisma.VehicleModelWhereInput): Promise<{ success: boolean; message: string; }> {
    try {
      await this.repository.deleteMany(where);
      return { success: true, message: 'Modelos excluídos com sucesso.' };
    } catch (error: any) {
      console.error("Error in VehicleModelService.deleteMany:", error);
      return { success: false, message: `Falha ao excluir modelos: ${error.message}` };
    }
  }
}

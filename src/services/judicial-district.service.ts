// src/services/judicial-district.service.ts
import { JudicialDistrictRepository } from '@/repositories/judicial-district.repository';
import type { JudicialDistrict, JudicialDistrictFormData } from '@/types';
import { slugify } from '@/lib/ui-helpers';
import type { Prisma } from '@prisma/client';

export class JudicialDistrictService {
  private repository: JudicialDistrictRepository;

  constructor() {
    this.repository = new JudicialDistrictRepository();
  }

  async getJudicialDistricts(): Promise<JudicialDistrict[]> {
    const districts = await this.repository.findAll();
    return districts.map(d => ({
        ...d,
        courtName: d.court.name,
        stateUf: d.state.uf,
    }));
  }

  async getJudicialDistrictById(id: string): Promise<JudicialDistrict | null> {
    const district = await this.repository.findById(id);
     if (!district) return null;
    return {
        ...district,
        courtName: district.court.name,
        stateUf: district.state.uf,
    }
  }

  async createJudicialDistrict(data: JudicialDistrictFormData): Promise<{ success: boolean; message: string; districtId?: string; }> {
    try {
      const dataToCreate: Prisma.JudicialDistrictCreateInput = {
        name: data.name,
        slug: slugify(data.name),
        zipCode: data.zipCode,
        court: { connect: { id: data.courtId } },
        state: { connect: { id: data.stateId } }
      };
      
      const newDistrict = await this.repository.create(dataToCreate);
      return { success: true, message: 'Comarca criada com sucesso.', districtId: newDistrict.id };
    } catch (error: any) {
      console.error("Error in JudicialDistrictService.create:", error);
      return { success: false, message: `Falha ao criar comarca: ${error.message}` };
    }
  }

  async updateJudicialDistrict(id: string, data: Partial<JudicialDistrictFormData>): Promise<{ success: boolean; message: string }> {
    try {
      const dataToUpdate: Prisma.JudicialDistrictUpdateInput = { ...data };
      if (data.name) {
        dataToUpdate.slug = slugify(data.name);
      }
      if (data.courtId) {
          dataToUpdate.court = { connect: { id: data.courtId } };
      }
      if (data.stateId) {
          dataToUpdate.state = { connect: { id: data.stateId } };
      }
      
      await this.repository.update(id, dataToUpdate);
      return { success: true, message: 'Comarca atualizada com sucesso.' };
    } catch (error: any) {
      console.error(`Error in JudicialDistrictService.update for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar comarca: ${error.message}` };
    }
  }

  async deleteJudicialDistrict(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      // In a real app, you would check for dependencies like JudicialBranches
      await this.repository.delete(id);
      return { success: true, message: 'Comarca excluída com sucesso.' };
    } catch (error: any) {
      console.error(`Error in JudicialDistrictService.delete for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir comarca: ${error.message}` };
    }
  }
}

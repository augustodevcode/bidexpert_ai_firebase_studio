// src/services/city.service.ts
import { CityRepository } from '@/repositories/city.repository';
import { StateRepository } from '@/repositories/state.repository';
import type { CityInfo, CityFormData } from '@/types';
import { slugify } from '@/lib/ui-helpers';
import type { Prisma } from '@prisma/client';

export class CityService {
  private cityRepository: CityRepository;
  private stateRepository: StateRepository;

  constructor() {
    this.cityRepository = new CityRepository();
    this.stateRepository = new StateRepository();
  }

  async getCities(stateIdFilter?: string): Promise<CityInfo[]> {
    const cities = await this.cityRepository.findAll(stateIdFilter);
    return cities.map(city => ({
      ...city,
      stateUf: city.state.uf,
    }));
  }

  async getCityById(id: string): Promise<CityInfo | null> {
    const city = await this.cityRepository.findById(id);
    if (!city) return null;
    return {
      ...city,
      stateUf: city.state.uf,
    };
  }

  async createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string; }> {
    try {
      const parentState = await this.stateRepository.findById(data.stateId);
      if (!parentState) {
        return { success: false, message: 'Estado pai não encontrado.' };
      }
      
      if (data.ibgeCode) {
        const existingCity = await this.cityRepository.findByIbgeCode(data.ibgeCode);
        if (existingCity) {
             return { success: false, message: `Uma cidade com o código IBGE '${data.ibgeCode}' já existe.` };
        }
      }

      const dataToCreate: Prisma.CityCreateInput = {
        name: data.name,
        slug: slugify(data.name),
        state: { connect: { id: data.stateId } },
        stateUf: parentState.uf,
        ibgeCode: data.ibgeCode || null,
      };

      const newCity = await this.cityRepository.create(dataToCreate);
      return { success: true, message: 'Cidade criada com sucesso.', cityId: newCity.id };
    } catch (error: any) {
      console.error("Error in CityService.createCity:", error);
      return { success: false, message: `Falha ao criar cidade: ${error.message}` };
    }
  }

  async updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }> {
    try {
      const dataToUpdate: Prisma.CityUpdateInput = {};
      if (data.name) dataToUpdate.name = data.name; dataToUpdate.slug = slugify(data.name);
      if (data.ibgeCode) dataToUpdate.ibgeCode = data.ibgeCode;

      if (data.stateId) {
        const parentState = await this.stateRepository.findById(data.stateId);
        if (parentState) {
          dataToUpdate.state = { connect: { id: data.stateId } };
          dataToUpdate.stateUf = parentState.uf;
        }
      }
      
      await this.cityRepository.update(id, dataToUpdate);
      return { success: true, message: 'Cidade atualizada com sucesso.' };
    } catch (error: any) {
      console.error(`Error in CityService.updateCity for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar cidade: ${error.message}` };
    }
  }

  async deleteCity(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      // In a real app, you would check for dependencies (e.g., lots, users in this city)
      await this.cityRepository.delete(id);
      return { success: true, message: 'Cidade excluída com sucesso.' };
    } catch (error: any) {
      console.error(`Error in CityService.deleteCity for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir cidade: ${error.message}` };
    }
  }
}

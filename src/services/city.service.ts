// src/services/city.service.ts
/**
 * @fileoverview Este arquivo contém a classe CityService, que encapsula a
 * lógica de negócio para o gerenciamento de Cidades. Ele interage com o
 * repositório de cidades e estados para realizar operações de CRUD, garantindo
 * a consistência dos dados, como a denormalização da sigla do estado (UF) e
 * validação de unicidade de códigos do IBGE.
 */
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

  /**
   * Busca todas as cidades, opcionalmente filtrando por estado, e denormaliza a UF.
   * @param {string} [stateIdFilter] - O ID do estado para filtrar as cidades.
   * @returns {Promise<CityInfo[]>} Uma lista de cidades.
   */
  async getCities(stateIdFilter?: string): Promise<CityInfo[]> {
    const cities = await this.cityRepository.findAll(stateIdFilter);
    return cities.map(city => ({
      ...city,
      stateUf: city.state.uf,
    }));
  }

  /**
   * Busca uma cidade específica pelo seu ID.
   * @param {string} id - O ID da cidade.
   * @returns {Promise<CityInfo | null>} A cidade encontrada ou null.
   */
  async getCityById(id: string): Promise<CityInfo | null> {
    const city = await this.cityRepository.findById(id);
    if (!city) return null;
    return {
      ...city,
      stateUf: city.state.uf,
    };
  }

  /**
   * Cria uma nova cidade, garantindo a associação correta com o estado e a
   * unicidade do código IBGE.
   * @param {CityFormData} data - Os dados do formulário da nova cidade.
   * @returns {Promise<{success: boolean; message: string; cityId?: string;}>} O resultado da operação.
   */
  async createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string; }> {
    try {
      const parentState = await this.stateRepository.findById(data.stateId);
      if (!parentState) {
        return { success: false, message: 'Estado pai não encontrado.' };
      }
      
      const dataToUpsert: Prisma.CityCreateInput = {
        name: data.name,
        slug: slugify(data.name),
        state: { connect: { id: data.stateId } },
        ibgeCode: data.ibgeCode || null,
      };

      const newCity = await this.cityRepository.upsert(dataToUpsert);
      return { success: true, message: 'Cidade criada/atualizada com sucesso.', cityId: newCity.id };
    } catch (error: any) {
      console.error("Error in CityService.createCity:", error);
      return { success: false, message: `Falha ao criar cidade: ${error.message}` };
    }
  }

  /**
   * Atualiza uma cidade existente.
   * @param {string} id - O ID da cidade a ser atualizada.
   * @param {Partial<CityFormData>} data - Os dados a serem modificados.
   * @returns {Promise<{success: boolean; message: string;}>} O resultado da operação.
   */
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

  /**
   * Exclui uma cidade do banco de dados.
   * @param {string} id - O ID da cidade a ser excluída.
   * @returns {Promise<{success: boolean; message: string;}>} O resultado da operação.
   */
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

  async deleteAllCities(): Promise<{ success: boolean; message: string; }> {
    try {
      await this.cityRepository.deleteAll();
      return { success: true, message: 'Todas as cidades foram excluídas.' };
    } catch (error: any) {
      return { success: false, message: 'Falha ao excluir todas as cidades.' };
    }
  }
}

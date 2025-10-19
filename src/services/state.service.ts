// src/services/state.service.ts
/**
 * @fileoverview Este arquivo contém a classe StateService, responsável por
 * gerenciar a lógica de negócio dos Estados (UFs). Ele interage com o repositório
 * para realizar operações de CRUD, incluindo validações como a checagem de
 * UFs duplicadas antes de criar ou atualizar um registro.
 */
import { StateRepository } from '@/repositories/state.repository';
import type { StateInfo, StateFormData } from '@/types';
import { slugify } from '@/lib/ui-helpers';
import type { Prisma } from '@prisma/client';

export class StateService {
  private repository: StateRepository;

  constructor() {
    this.repository = new StateRepository();
  }

  async getStates(): Promise<StateInfo[]> {
    const states = await this.repository.findAllWithCityCount();
    return states.map(s => ({
      ...s,
      cityCount: s._count.cities,
    }));
  }

  async getStateById(id: string): Promise<StateInfo | null> {
    return this.repository.findById(id);
  }

  async createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string }> {
    try {
      const dataToUpsert: Prisma.StateCreateInput = {
        name: data.name,
        uf: data.uf.toUpperCase(),
        slug: slugify(data.name),
      };

      const newState = await prisma.state.upsert({
        where: { uf: data.uf.toUpperCase() },
        update: dataToUpsert,
        create: dataToUpsert,
      });
      return { success: true, message: 'Estado criado/atualizado com sucesso.', stateId: newState.id };
    } catch (error: any) {
      console.error("Error in StateService.create:", error);
      return { success: false, message: `Falha ao criar estado: ${error.message}` };
    }
  }

  async updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string }> {
    try {
      if (data.uf) {
        const existingByUf = await this.repository.findByUf(data.uf);
        if (existingByUf && existingByUf.id !== id) {
          return { success: false, message: `A UF '${data.uf}' já está em uso por outro estado.` };
        }
      }

      const dataToUpdate: Prisma.StateUpdateInput = { ...data };
      if (data.name) {
        dataToUpdate.slug = slugify(data.name);
      }
      if (data.uf) {
        dataToUpdate.uf = data.uf.toUpperCase();
      }
      
      await this.repository.update(id, dataToUpdate);
      return { success: true, message: 'Estado atualizado com sucesso.' };
    } catch (error: any) {
      console.error(`Error in StateService.update for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar estado: ${error.message}` };
    }
  }

  async deleteState(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const cityCount = await this.repository.countCities(id);
      if (cityCount > 0) {
        return { success: false, message: `Não é possível excluir. O estado possui ${cityCount} cidade(s) vinculada(s).` };
      }
      await this.repository.delete(id);
      return { success: true, message: 'Estado excluído com sucesso.' };
    } catch (error: any) {
      console.error(`Error in StateService.delete for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir estado: ${error.message}` };
    }
  }

  async deleteAllStates(): Promise<{ success: boolean; message: string; }> {
    try {
      await this.repository.deleteAll();
      return { success: true, message: 'Todos os estados foram excluídos.' };
    } catch (error: any) {
      return { success: false, message: 'Falha ao excluir todos os estados.' };
    }
  }
}

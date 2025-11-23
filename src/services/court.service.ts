// src/services/court.service.ts
/**
 * @fileoverview Este arquivo contém a classe CourtService, que encapsula a
 * lógica de negócio para o gerenciamento de Tribunais. Ele interage com o
 * repositório para realizar operações de CRUD, garantindo a consistência
 * dos dados, como a geração automática de `slug`.
 */
import { CourtRepository } from '@/repositories/court.repository';
import type { Court, CourtFormData } from '@/types';
import { slugify } from '@/lib/ui-helpers';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class CourtService {
  private courtRepository: CourtRepository;

  constructor() {
    this.courtRepository = new CourtRepository();
  }

  async getCourts(): Promise<Court[]> {
    return this.courtRepository.findAll();
  }

  async getCourtById(id: string): Promise<Court | null> {
    return this.courtRepository.findById(id);
  }

  async createCourt(data: CourtFormData): Promise<{ success: boolean; message: string; courtId?: string; }> {
    try {
      const slug = slugify(data.name);
      
      const newCourt = await prisma.court.upsert({
        where: { slug },
        update: { ...data, slug },
        create: { ...data, slug },
      });
      return { success: true, message: 'Tribunal criado/atualizado com sucesso.', courtId: newCourt.id };
    } catch (error: any) {
      console.error("Error in CourtService.createCourt:", error);
      return { success: false, message: `Falha ao criar tribunal: ${error.message}` };
    }
  }

  async updateCourt(id: string, data: Partial<CourtFormData>): Promise<{ success: boolean; message: string }> {
    try {
      const dataToUpdate: Partial<Prisma.CourtUpdateInput> = { ...data };
      
      if (data.name) {
        const newSlug = slugify(data.name);
        // Check if the slug is actually changing
        const currentCourt = await this.courtRepository.findById(id);
        if (currentCourt && currentCourt.slug !== newSlug) {
           dataToUpdate.slug = newSlug;
        } else {
           // If slug is same, don't update it to avoid potential (though rare) conflicts or redundant updates
           if (currentCourt && currentCourt.slug === newSlug) {
             delete dataToUpdate.slug;
           } else {
             dataToUpdate.slug = newSlug;
           }
        }
      }

      await this.courtRepository.update(id, dataToUpdate);
      return { success: true, message: 'Tribunal atualizado com sucesso.' };
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
        console.warn(`[CourtService] Tentativa de duplicidade ao atualizar tribunal ${id}: ${error.meta?.target}`);
        return { success: false, message: 'Já existe um tribunal com este nome.' };
      }
      console.error(`Error in CourtService.updateCourt for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar tribunal: ${error.message}` };
    }
  }

  async deleteCourt(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      await this.courtRepository.delete(id);
      return { success: true, message: 'Tribunal excluído com sucesso.' };
    } catch (error: any) {
      console.error(`Error in CourtService.deleteCourt for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir tribunal: ${error.message}` };
    }
  }

  async deleteAllCourts(): Promise<{ success: boolean; message: string; }> {
    try {
      await this.courtRepository.deleteAll();
      return { success: true, message: 'Todos os tribunais foram excluídos.' };
    } catch (error: any) {
      return { success: false, message: 'Falha ao excluir todos os tribunais.' };
    }
  }
}

// src/services/bem.service.ts
/**
 * @fileoverview Este arquivo contém a classe BemService, que encapsula a lógica
 * de negócio para o gerenciamento de Bens. "Bens" são os ativos individuais
 * (como um carro ou um apartamento) antes de serem agrupados em lotes para leilão.
 * O serviço interage com o repositório para realizar operações de CRUD e
 * aplica validações, como verificar se um bem pode ser excluído.
 */
import { BemRepository } from '@/repositories/bem.repository';
import type { Bem, BemFormData } from '@/types';
import type { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { getPrismaInstance } from '@/lib/prisma';

export class BemService {
  private repository: BemRepository;
  private prisma;

  constructor() {
    this.repository = new BemRepository();
    this.prisma = getPrismaInstance();
  }

  /**
   * Mapeia os dados brutos de um bem do Prisma para o tipo Bem definido na aplicação.
   * Realiza conversões de tipo (Decimal para number) e enriquece o objeto com
   * nomes de entidades relacionadas.
   * @param {any[]} bens - Array de bens brutos do banco de dados.
   * @returns {Bem[]} Um array de bens formatados.
   */
  private mapBensWithDetails(bens: any[]): Bem[] {
    return bens.map(bem => ({
      ...bem,
      evaluationValue: bem.evaluationValue ? Number(bem.evaluationValue) : null,
      totalArea: bem.totalArea ? Number(bem.totalArea) : null,
      builtArea: bem.builtArea ? Number(bem.builtArea) : null,
      latitude: bem.latitude ? Number(bem.latitude) : null,
      longitude: bem.longitude ? Number(bem.longitude) : null,
      categoryName: bem.category?.name,
      subcategoryName: bem.subcategory?.name,
      judicialProcessNumber: bem.judicialProcess?.processNumber,
      sellerName: bem.seller?.name,
    }));
  }

  /**
   * Busca bens com base em filtros, como ID do processo judicial, ID do comitente e tenant.
   * @param {object} filter - Filtros a serem aplicados na busca.
   * @returns {Promise<Bem[]>} Uma lista de bens.
   */
  async getBens(filter?: { judicialProcessId?: string; sellerId?: string; tenantId?: string }): Promise<Bem[]> {
    const bens = await this.repository.findAll(filter);
    return this.mapBensWithDetails(bens);
  }

  /**
   * Busca um bem específico pelo seu ID.
   * @param {string} id - O ID do bem.
   * @returns {Promise<Bem | null>} O bem encontrado ou null.
   */
  async getBemById(id: string): Promise<Bem | null> {
    const bem = await this.repository.findById(id);
    if (!bem) return null;
    return this.mapBensWithDetails([bem])[0];
  }

  /**
   * Busca uma lista de bens pelos seus IDs.
   * @param {string[]} ids - Um array de IDs de bens.
   * @returns {Promise<Bem[]>} Uma lista de bens.
   */
  async getBensByIds(ids: string[]): Promise<Bem[]> {
    const bens = await this.repository.findByIds(ids);
    return this.mapBensWithDetails(bens);
  }

  /**
   * Cria um novo bem.
   * @param {string} tenantId - O ID do tenant.
   * @param {BemFormData} data - Os dados do formulário do novo bem.
   * @returns {Promise<{success: boolean; message: string; bemId?: string;}>} O resultado da operação.
   */
  async createBem(tenantId: string, data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string; }> {
    try {
      const { categoryId, subcategoryId, judicialProcessId, sellerId, ...bemData } = data;

      const dataToCreate: Prisma.BemCreateInput = {
        ...bemData,
        publicId: `BEM-${uuidv4()}`,
        tenant: { connect: { id: tenantId } },
      };
      
      if (categoryId) dataToCreate.category = { connect: { id: categoryId } };
      if (subcategoryId) dataToCreate.subcategory = { connect: { id: subcategoryId } };
      if (judicialProcessId) dataToCreate.judicialProcess = { connect: { id: judicialProcessId } };
      if (sellerId) dataToCreate.seller = { connect: { id: sellerId } };
      
      const newBem = await this.repository.create(dataToCreate);
      return { success: true, message: 'Bem criado com sucesso.', bemId: newBem.id };
    } catch (error: any) {
      console.error("Error in BemService.createBem:", error);
      return { success: false, message: `Falha ao criar bem: ${error.message}` };
    }
  }

  /**
   * Atualiza um bem existente.
   * @param {string} id - O ID do bem a ser atualizado.
   * @param {Partial<BemFormData>} data - Os dados a serem modificados.
   * @returns {Promise<{success: boolean; message: string;}>} O resultado da operação.
   */
  async updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> {
    try {
      const { categoryId, subcategoryId, judicialProcessId, sellerId, ...bemData } = data;
      const dataToUpdate: Prisma.BemUpdateInput = { ...bemData };
      
      if (categoryId) dataToUpdate.category = { connect: { id: categoryId } };
      if (subcategoryId) dataToUpdate.subcategory = { connect: { id: subcategoryId } };
      if (judicialProcessId) dataToUpdate.judicialProcess = { connect: { id: judicialProcessId } };
      if (sellerId) dataToUpdate.seller = { connect: { id: sellerId } };

      await this.repository.update(id, dataToUpdate);
      return { success: true, message: 'Bem atualizado com sucesso.' };
    } catch (error: any) {
      console.error(`Error in BemService.updateBem for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar bem: ${error.message}` };
    }
  }

  /**
   * Exclui um bem, verificando antes se ele está vinculado a um lote ativo.
   * @param {string} id - O ID do bem a ser excluído.
   * @returns {Promise<{success: boolean; message: string;}>} O resultado da operação.
   */
  async deleteBem(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      const linkedLots = await this.prisma.lotBens.findMany({
        where: { bemId: id },
        include: { lot: { select: { status: true } } }
      });

      const isProtected = linkedLots.some(link => 
        link.lot.status === 'ABERTO_PARA_LANCES' || 
        link.lot.status === 'VENDIDO'
      );
      
      if (isProtected) {
          return { success: false, message: "Este bem está vinculado a um lote ativo ou vendido e não pode ser excluído."};
      }

      await this.repository.delete(id);
      return { success: true, message: 'Bem excluído com sucesso.' };
    } catch (error: any) {
      console.error(`Error in BemService.deleteBem for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir bem: ${error.message}` };
    }
  }
}

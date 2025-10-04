// src/services/asset.service.ts
/**
 * @fileoverview Este arquivo contém a classe AssetService, que encapsula
 * a lógica de negócio para o gerenciamento de Ativos (Assets). "Assets" são
 * os itens individuais (como um carro ou um apartamento) antes de serem
 * agrupados em lotes para leilão. O serviço interage com o repositório para
 * realizar operações de CRUD e aplica validações, como verificar se um ativo
 * pode ser excluído.
 */
import { AssetRepository } from '@/repositories/asset.repository';
import type { Asset, AssetFormData } from '@/types';
import type { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';

export class AssetService {
  private repository: AssetRepository;
  private prisma;

  constructor() {
    this.repository = new AssetRepository();
    this.prisma = prisma;
  }

  /**
   * Mapeia os dados brutos de um ativo do Prisma para o tipo Asset definido na aplicação.
   * Realiza conversões de tipo (Decimal para number) e enriquece o objeto com
   * nomes de entidades relacionadas.
   * @param {any[]} assets - Array de ativos brutos do banco de dados.
   * @returns {Asset[]} Um array de ativos formatados.
   */
  private mapAssetsWithDetails(assets: any[]): Asset[] {
    return assets.map(asset => ({
      ...asset,
      evaluationValue: asset.evaluationValue ? Number(asset.evaluationValue) : null,
      totalArea: asset.totalArea ? Number(asset.totalArea) : null,
      builtArea: asset.builtArea ? Number(asset.builtArea) : null,
      latitude: asset.latitude ? Number(asset.latitude) : null,
      longitude: asset.longitude ? Number(asset.longitude) : null,
      categoryName: asset.category?.name,
      subcategoryName: asset.subcategory?.name,
      judicialProcessNumber: asset.judicialProcess?.processNumber,
      sellerName: asset.seller?.name,
    }));
  }

  /**
   * Busca ativos com base em filtros, como ID do processo judicial, ID do comitente e tenant.
   * @param {object} filter - Filtros a serem aplicados na busca.
   * @returns {Promise<Asset[]>} Uma lista de ativos.
   */
  async getAssets(filter?: { judicialProcessId?: string; sellerId?: string; tenantId?: string; status?: string }): Promise<Asset[]> {
    const assets = await this.repository.findAll(filter);
    return this.mapAssetsWithDetails(assets);
  }

  /**
   * Busca um ativo específico pelo seu ID.
   * @param {string} tenantId - O ID do tenant.
   * @param {string} id - O ID do ativo.
   * @returns {Promise<Asset | null>} O ativo encontrado ou null.
   */
  async getAssetById(tenantId: string, id: string): Promise<Asset | null> {
    const asset = await this.repository.findById(id);
    if (!asset || asset.tenantId !== tenantId) return null;
    return this.mapAssetsWithDetails([asset])[0];
  }

  /**
   * Busca uma lista de ativos pelos seus IDs.
   * @param {string[]} ids - Um array de IDs de ativos.
   * @returns {Promise<Asset[]>} Uma lista de ativos.
   */
  async getAssetsByIds(ids: string[]): Promise<Asset[]> {
    const assets = await this.repository.findByIds(ids);
    return this.mapAssetsWithDetails(assets);
  }

  /**
   * Cria um novo ativo.
   * @param {string} tenantId - O ID do tenant.
   * @param {AssetFormData} data - Os dados do formulário do novo ativo.
   * @returns {Promise<{success: boolean; message: string; assetId?: string;}>} O resultado da operação.
   */
  async createAsset(tenantId: string, data: AssetFormData): Promise<{ success: boolean; message: string; assetId?: string; }> {
    try {
      const { categoryId, subcategoryId, judicialProcessId, sellerId, ...assetData } = data;

      const dataToCreate: Prisma.AssetCreateInput = {
        ...(assetData as any),
        publicId: `ASSET-${uuidv4()}`,
        tenant: { connect: { id: tenantId } },
      };
      
      if (categoryId) dataToCreate.category = { connect: { id: categoryId } };
      if (subcategoryId) dataToCreate.subcategory = { connect: { id: subcategoryId } };
      if (judicialProcessId) dataToCreate.judicialProcess = { connect: { id: judicialProcessId } };
      if (sellerId) dataToCreate.seller = { connect: { id: sellerId } };
      
      const newAsset = await this.repository.create(dataToCreate);
      return { success: true, message: 'Ativo criado com sucesso.', assetId: newAsset.id };
    } catch (error: any) {
      console.error("Error in AssetService.createAsset:", error);
      return { success: false, message: `Falha ao criar ativo: ${error.message}` };
    }
  }

  /**
   * Atualiza um ativo existente.
   * @param {string} id - O ID do ativo a ser atualizado.
   * @param {Partial<AssetFormData>} data - Os dados a serem modificados.
   * @returns {Promise<{success: boolean; message: string;}>} O resultado da operação.
   */
  async updateAsset(id: string, data: Partial<AssetFormData>): Promise<{ success: boolean; message: string; }> {
    try {
      const { categoryId, subcategoryId, judicialProcessId, sellerId, ...assetData } = data;
      const dataToUpdate: Prisma.AssetUpdateInput = { ...assetData };
      
      if (categoryId) dataToUpdate.category = { connect: { id: categoryId } };
      if (subcategoryId) dataToUpdate.subcategory = { connect: { id: subcategoryId } };
      if (judicialProcessId) dataToUpdate.judicialProcess = { connect: { id: judicialProcessId } };
      if (sellerId) dataToUpdate.seller = { connect: { id: sellerId } };

      await this.repository.update(id, dataToUpdate);
      return { success: true, message: 'Ativo atualizado com sucesso.' };
    } catch (error: any) {
      console.error(`Error in AssetService.updateAsset for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar ativo: ${error.message}` };
    }
  }

  /**
   * Exclui um ativo, verificando antes se ele está vinculado a um lote ativo.
   * @param {string} id - O ID do ativo a ser excluído.
   * @returns {Promise<{success: boolean; message: string;}>} O resultado da operação.
   */
  async deleteAsset(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      const linkedLots = await this.prisma.assetsOnLots.findMany({
        where: { assetId: id },
        include: { lot: { select: { status: true } } }
      });

      const isProtected = linkedLots.some(link => 
        link.lot.status === 'ABERTO_PARA_LANCES' || 
        link.lot.status === 'VENDIDO'
      );
      
      if (isProtected) {
          return { success: false, message: "Este ativo está vinculado a um lote ativo ou vendido e não pode ser excluído."};
      }

      await this.repository.delete(id);
      return { success: true, message: 'Ativo excluído com sucesso.' };
    } catch (error: any) {
      console.error(`Error in AssetService.deleteAsset for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir ativo: ${error.message}` };
    }
  }
}

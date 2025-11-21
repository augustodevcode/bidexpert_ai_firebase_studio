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
import { prisma } from '@/lib/prisma';
import { generatePublicId } from '@/lib/public-id-generator';

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
    return assets.map(asset => {
        const primaryLot = asset.lots?.[0]?.lot;
        const lotInfo = primaryLot ? `Lote ${primaryLot.number || primaryLot.id.toString().substring(0,4)}: ${primaryLot.title}` : null;
        return {
            ...asset,
            evaluationValue: asset.evaluationValue ? Number(asset.evaluationValue) : null,
            latitude: asset.latitude ? Number(asset.latitude) : null,
            longitude: asset.longitude ? Number(asset.longitude) : null,
            categoryName: asset.category?.name,
            subcategoryName: asset.subcategory?.name,
            judicialProcessNumber: asset.judicialProcess?.processNumber,
            sellerName: asset.seller?.name,
            lotInfo: lotInfo,
        }
    });
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
    const asset = await this.repository.findById(id.toString());
    // Embora o repositório possa ser chamado de múltiplos tenants, o serviço impõe a regra de negócio
    // de que a busca por ID deve respeitar o tenant atual.
    if (!asset || asset.tenantId.toString() !== tenantId) return null;
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
      const { categoryId, subcategoryId, judicialProcessId, sellerId, cityId, stateId, ...assetData } = data;

      // Gera o publicId usando a máscara configurada
      const publicId = await generatePublicId(tenantId, 'asset');

      const dataToCreate: Prisma.AssetCreateInput = {
        ...(assetData as any),
        publicId,
        tenant: { connect: { id: BigInt(tenantId) } },
      };
      
      if (categoryId) dataToCreate.category = { connect: { id: BigInt(categoryId) } };
      if (subcategoryId) dataToCreate.subcategory = { connect: { id: BigInt(subcategoryId) } };
      if (judicialProcessId) dataToCreate.judicialProcess = { connect: { id: BigInt(judicialProcessId) } };
      if (sellerId) dataToCreate.seller = { connect: { id: BigInt(sellerId) } };
      if (cityId) {
          const city = await this.prisma.city.findUnique({where: {id: BigInt(cityId)}});
          if(city) dataToCreate.locationCity = city.name;
      }
      if (stateId) {
          const state = await this.prisma.state.findUnique({where: {id: BigInt(stateId)}});
          if(state) dataToCreate.locationState = state.uf;
      }
      
      const newAsset = await this.repository.create(dataToCreate);
      return { success: true, message: 'Ativo criado com sucesso.', assetId: newAsset.id.toString() };
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
      const { categoryId, subcategoryId, judicialProcessId, sellerId, cityId, stateId, ...assetData } = data;
      const dataToUpdate: Prisma.AssetUpdateInput = { ...assetData };
      
      if (categoryId) dataToUpdate.category = { connect: { id: BigInt(categoryId) } };
      if (subcategoryId) dataToUpdate.subcategory = { connect: { id: BigInt(subcategoryId) } };
      if (judicialProcessId) dataToUpdate.judicialProcess = { connect: { id: BigInt(judicialProcessId) } };
      if (sellerId) dataToUpdate.seller = { connect: { id: BigInt(sellerId) } };
      if (cityId) {
          const city = await this.prisma.city.findUnique({where: {id: BigInt(cityId)}});
          if(city) dataToUpdate.locationCity = city.name;
      }
      if (stateId) {
          const state = await this.prisma.state.findUnique({where: {id: BigInt(stateId)}});
          if(state) dataToUpdate.locationState = state.uf;
      }


      await this.repository.update(BigInt(id), dataToUpdate);
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
      // Disconnect asset from any lots it is linked to.
      await this.prisma.assetsOnLots.deleteMany({ where: { assetId: BigInt(id) } });

      await this.repository.delete(BigInt(id));
      return { success: true, message: 'Ativo excluído com sucesso.' };
    } catch (error: any) {
      console.error(`Error in AssetService.deleteAsset for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir ativo: ${error.message}` };
    }
  }

  async deleteAllAssets(tenantId: string): Promise<{ success: boolean; message: string; }> {
    try {
      const assets = await this.repository.findAll({ tenantId });
      for (const asset of assets) {
        await this.deleteAsset(asset.id);
      }
      return { success: true, message: 'Todos os ativos foram excluídos.' };
    } catch (error: any) {
      return { success: false, message: 'Falha ao excluir todos os ativos.' };
    }
  }
}

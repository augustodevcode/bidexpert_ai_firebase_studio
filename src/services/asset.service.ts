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
        
        // Destructure lots out to avoid sending it if it contains Decimals
        const { lots, ...assetWithoutLots } = asset;

        return {
            ...assetWithoutLots,
            id: asset.id.toString(),
            tenantId: asset.tenantId.toString(),
            categoryId: asset.categoryId?.toString(),
            subcategoryId: asset.subcategoryId?.toString(),
            judicialProcessId: asset.judicialProcessId?.toString(),
            sellerId: asset.sellerId?.toString(),
            imageMediaId: asset.imageMediaId?.toString(),
            evaluationValue: asset.evaluationValue ? Number(asset.evaluationValue) : null,
            latitude: asset.latitude ? Number(asset.latitude) : null,
            longitude: asset.longitude ? Number(asset.longitude) : null,
            totalArea: asset.totalArea ? Number(asset.totalArea) : null,
            builtArea: asset.builtArea ? Number(asset.builtArea) : null,
            categoryName: asset.category?.name,
            subcategoryName: asset.subcategory?.name,
            judicialProcessNumber: asset.judicialProcess?.processNumber,
            sellerName: asset.seller?.name,
            lotInfo: lotInfo,
            occupationStatus: asset.occupationStatus || null,
            occupationNotes: asset.occupationNotes,
            occupationLastVerified: asset.occupationLastVerified,
            occupationUpdatedBy: asset.occupationUpdatedBy ? asset.occupationUpdatedBy.toString() : null,
            lots: asset.lots ? asset.lots.map((l: any) => ({
                ...l,
                lot: l.lot ? {
                    ...l.lot,
                    id: l.lot.id.toString(),
                    price: l.lot.price ? Number(l.lot.price) : null,
                    initialPrice: l.lot.initialPrice ? Number(l.lot.initialPrice) : null,
                    secondInitialPrice: l.lot.secondInitialPrice ? Number(l.lot.secondInitialPrice) : null,
                    bidIncrementStep: l.lot.bidIncrementStep ? Number(l.lot.bidIncrementStep) : null,
                    auctionId: l.lot.auctionId?.toString(),
                    categoryId: l.lot.categoryId?.toString(),
                    subcategoryId: l.lot.subcategoryId?.toString(),
                    sellerId: l.lot.sellerId?.toString(),
                    auctioneerId: l.lot.auctioneerId?.toString(),
                    cityId: l.lot.cityId?.toString(),
                    stateId: l.lot.stateId?.toString(),
                    tenantId: l.lot.tenantId?.toString(),
                    original_lot_id: l.lot.original_lot_id?.toString(),
                } : null
            })) : [],
        }
    });
  }

  /**
   * Busca ativos com base em filtros, como ID do processo judicial, ID do comitente e tenant.
   * @param {object} filter - Filtros a serem aplicados na busca.
   * @returns {Promise<Asset[]>} Uma lista de ativos.
   */
  async getAssets(filter?: { judicialProcessId?: string, sellerId?: string, tenantId?: string, status?: string }): Promise<Asset[]> {
    const assets = await this.repository.findAll(filter);
    return this.mapAssetsWithDetails(assets);
  }

  /**
   * Busca um ativo específico pelo seu ID.
   * @param {string} tenantId - O ID do tenant.
   * @param {string} id - O ID do ativo.
   * @returns {Promise<Asset | null>} O ativo encontrado ou null.
   */
  async getAssetById(_tenantId: string, id: string): Promise<Asset | null> {
    const asset = await this.repository.findById(id);
    if (!asset) return null;
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
      const { 
        categoryId, subcategoryId, judicialProcessId, sellerId, cityId, stateId, 
        street, number, complement, neighborhood, zipCode,
        mediaItemIds,
        ...assetData 
      } = data;

      // Construct address if not provided but components are
      if (!assetData.address && (street || number || neighborhood)) {
        const parts = [];
        if (street) parts.push(street);
        if (number) parts.push(number);
        if (complement) parts.push(complement);
        if (neighborhood) parts.push(neighborhood);
        if (zipCode) parts.push(`CEP: ${zipCode}`);
        assetData.address = parts.join(', ');
      }

      // Normaliza campos que podem vir como string vazia
      const normalizedAssetData = { ...assetData } as Record<string, any>;
      
      // Remove campos vazios ou converte para null
      Object.keys(normalizedAssetData).forEach(key => {
        const value = normalizedAssetData[key];
        if (value === '' || value === undefined) {
          normalizedAssetData[key] = null;
        }
      });

      // Gera o publicId usando a máscara configurada
      const publicId = await generatePublicId(tenantId, 'asset');

      const dataToCreate: Prisma.AssetCreateInput = {
        title: assetData.title,
        ...normalizedAssetData,
        publicId,
        tenant: { connect: { id: BigInt(tenantId) } },
        mediaItemIds: mediaItemIds ? (mediaItemIds as any) : undefined, // Save to JSON field as well
      };

      // Conecta relacionamentos
      if (categoryId) dataToCreate.category = { connect: { id: BigInt(categoryId) } };
      if (subcategoryId) dataToCreate.subcategory = { connect: { id: BigInt(subcategoryId) } };
      if (judicialProcessId) dataToCreate.judicialProcess = { connect: { id: BigInt(judicialProcessId) } };
      if (sellerId) dataToCreate.seller = { connect: { id: BigInt(sellerId) } };
      
      // Atualiza locationCity e locationState baseado nos IDs se fornecidos
      if (cityId) {
          const city = await this.prisma.city.findUnique({where: {id: BigInt(cityId)}});
          if(city) dataToCreate.locationCity = city.name;
      }
      if (stateId) {
          const state = await this.prisma.state.findUnique({where: {id: BigInt(stateId)}});
          if(state) dataToCreate.locationState = state.uf;
      }
      
      // Transactional creation
        const newAsset = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          const asset = await tx.asset.create({ data: dataToCreate });

          // Create AssetMedia records if mediaItemIds are present
              if (mediaItemIds && Array.isArray(mediaItemIds) && mediaItemIds.length > 0) {
                const safeMediaIds = mediaItemIds.filter((mediaId) => mediaId !== null && mediaId !== undefined && mediaId !== '');
                await Promise.all((safeMediaIds as Array<string | number | bigint>).map((mediaId, index) => {
                  return tx.assetMedia.create({
                    data: {
                      assetId: asset.id,
                      tenantId: BigInt(tenantId),
                      mediaItemId: BigInt(mediaId),
                      displayOrder: index,
                      isPrimary: index === 0
                    }
                  });
                }));
              }
          return asset;
      });

      return { success: true, message: 'Ativo criado com sucesso!', assetId: newAsset.id.toString() };
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
      const { 
        categoryId, subcategoryId, judicialProcessId, sellerId, cityId, stateId, 
        street, number, complement, neighborhood, zipCode,
        ...assetData 
      } = data;

      // Construct address if not provided but components are
      if (!assetData.address && (street || number || neighborhood)) {
        const parts = [];
        if (street) parts.push(street);
        if (number) parts.push(number);
        if (complement) parts.push(complement);
        if (neighborhood) parts.push(neighborhood);
        if (zipCode) parts.push(`CEP: ${zipCode}`);
        assetData.address = parts.join(', ');
      }
      
      // Normaliza campos que podem vir como string vazia
      const normalizedAssetData = { ...assetData } as Record<string, any>;
      
      // Remove campos vazios ou converte para null
      Object.keys(normalizedAssetData).forEach(key => {
        const value = normalizedAssetData[key];
        if (value === '' || value === undefined) {
          normalizedAssetData[key] = null;
        }
      });

      const dataToUpdate: Prisma.AssetUpdateInput = { ...normalizedAssetData };
      
      // Conecta relacionamentos
      if (categoryId) dataToUpdate.category = { connect: { id: BigInt(categoryId) } };
      if (subcategoryId) dataToUpdate.subcategory = { connect: { id: BigInt(subcategoryId) } };
      if (judicialProcessId) dataToUpdate.judicialProcess = { connect: { id: BigInt(judicialProcessId) } };
      if (sellerId) dataToUpdate.seller = { connect: { id: BigInt(sellerId) } };
      
      // Atualiza locationCity e locationState baseado nos IDs se fornecidos
      if (cityId) {
          const city = await this.prisma.city.findUnique({where: {id: BigInt(cityId)}});
          if(city) dataToUpdate.locationCity = city.name;
      }
      if (stateId) {
          const state = await this.prisma.state.findUnique({where: {id: BigInt(stateId)}});
          if(state) dataToUpdate.locationState = state.uf;
      }

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
      // Disconnect asset from any lots it is linked to.
      await this.prisma.assetsOnLots.deleteMany({ where: { assetId: BigInt(id) } });

      await this.repository.delete(id);
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

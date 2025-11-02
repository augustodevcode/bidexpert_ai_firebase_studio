// src/services/auction.service.ts
/**
 * @fileoverview Este arquivo contém a classe AuctionService, que encapsula
 * a lógica de negócio principal para o gerenciamento de leilões. Atua como um
 * intermediário entre as server actions (controllers) e o repositório de leilões
 * (camada de dados), garantindo a aplicação de regras de negócio e validações.
 */
import { AuctionRepository } from '@/repositories/auction.repository';
import type { Auction, AuctionFormData, LotCategory } from '@/types';
import { slugify } from '@/lib/ui-helpers';
import type { Prisma } from '@prisma/client';
import { PrismaClientValidationError } from '@prisma/client/runtime/library';
import { v4 as uuidv4 } from 'uuid';
import { utcToZonedTime } from 'date-fns-tz';
import { getPrismaInstance } from '@/lib/prisma';
import { nowInSaoPaulo } from '@/lib/timezone';
import { prisma } from '@/lib/prisma';

// Status que NUNCA devem ser visíveis publicamente
const NON_PUBLIC_STATUSES: Prisma.AuctionStatus[] = ['RASCUNHO', 'EM_PREPARACAO'];

export class AuctionService {
  private auctionRepository: AuctionRepository;
  private prisma;

  constructor() {
    this.auctionRepository = new AuctionRepository();
    this.prisma = prisma;
  }

  /**
   * Mapeia os dados brutos do leilão do Prisma para o tipo Auction definido na aplicação.
   * Realiza conversões de tipo (ex: Decimal para number) e calcula campos derivados.
   * @param {any[]} auctions - Array de leilões brutos do banco de dados.
   * @returns {Auction[]} Um array de leilões formatados.
   */
  private mapAuctionsWithDetails(auctions: any[]): Auction[] {
    return auctions.map(a => {
        // Encontra o lote em destaque, se houver
        const featuredLot = a.lots?.find((lot: any) => lot.isFeatured);
        
        return {
            ...a,
            id: a.id.toString(),
            initialOffer: a.initialOffer ? Number(a.initialOffer) : undefined,
            estimatedRevenue: a.estimatedRevenue ? Number(a.estimatedRevenue) : undefined,
            achievedRevenue: a.achievedRevenue ? Number(a.achievedRevenue) : undefined,
            decrementAmount: a.decrementAmount ? Number(a.decrementAmount) : null,
            floorPrice: a.floorPrice ? Number(a.floorPrice) : null,
            latitude: a.latitude ? Number(a.latitude) : null,
            longitude: a.longitude ? Number(a.longitude) : null,
            totalLots: a._count?.lots ?? a.lots?.length ?? 0,
            sellerId: a.sellerId?.toString() ?? null,
            auctioneerId: a.auctioneerId?.toString() ?? null,
            categoryId: a.categoryId?.toString() ?? null,
            judicialProcessId: a.judicialProcessId?.toString() ?? null,
            tenantId: a.tenantId.toString(),
            seller: a.Seller ? { ...a.Seller, id: a.Seller.id.toString() } : null,
            auctioneer: a.auctioneer ? { ...a.auctioneer, id: a.auctioneer.id.toString() } : null,
            category: a.category ? { ...a.category, id: a.category.id.toString() } : null,
            sellerName: a.Seller?.name,
            auctioneerName: a.auctioneer?.name,
            categoryName: a.category?.name,
            // Se imageMediaId for 'INHERIT', usa a imagem do lote em destaque. Senão, usa a do leilão.
            imageUrl: a.imageMediaId === 'INHERIT' ? featuredLot?.imageUrl : a.imageUrl,
            auctionStages: (a.stages || a.auctionStages || []).map((stage: any) => ({
                ...stage,
                id: stage.id.toString(),
                auctionId: stage.auctionId.toString(),
                initialPrice: stage.initialPrice ? Number(stage.initialPrice) : null,
            })),
            lots: (a.lots || []).map((lot: any) => ({
                ...lot,
                id: lot.id.toString(),
                auctionId: lot.auctionId.toString(),
                price: Number(lot.price),
                initialPrice: lot.initialPrice ? Number(lot.initialPrice) : null,
                secondInitialPrice: lot.secondInitialPrice ? Number(lot.secondInitialPrice) : null,
                bidIncrementStep: lot.bidIncrementStep ? Number(lot.bidIncrementStep) : null,
                evaluationValue: lot.evaluationValue ? Number(lot.evaluationValue) : null,
                assets: (lot.assets || []).map((assetRelation: any) => ({
                ...assetRelation.asset,
                id: assetRelation.asset.id.toString(),
                evaluationValue: assetRelation.asset.evaluationValue ? Number(assetRelation.asset.evaluationValue) : null,
                }))
            }))
        }
    });
  }

  /**
   * Busca todos os leilões para um determinado tenant. Por padrão, exclui status não públicos.
   * @param {string} tenantId - O ID do tenant.
   * @param {number} [limit] - Limite de resultados.
   * @param {boolean} [isPublicCall=true] - Define se a chamada é pública (padrão) ou interna (para admin).
   * @returns {Promise<Auction[]>} Uma lista de leilões.
   */
  async getAuctions(tenantId: string, limit?: number, isPublicCall = true): Promise<Auction[]> {
    const where: Prisma.AuctionWhereInput = {};
    
    if (isPublicCall) {
        where.status = { notIn: NON_PUBLIC_STATUSES };
    }

    const auctions = await this.auctionRepository.findAll(tenantId, where, limit);
    return this.mapAuctionsWithDetails(auctions);
  }

  /**
   * Busca um leilão específico por ID ou publicId, respeitando o tenantId se fornecido.
   * @param {string | undefined} tenantId - O ID do tenant (opcional para chamadas públicas).
   * @param {string} id - O ID ou publicId do leilão.
   * @param {boolean} isPublicCall - Se a chamada é pública.
   * @returns {Promise<Auction | null>} O leilão encontrado ou null.
   */
  async getAuctionById(tenantId: string | undefined, id: string, isPublicCall = false): Promise<Auction | null> {
    const auction = await this.auctionRepository.findById(tenantId, id);
    if (!auction) return null;

    if (isPublicCall && NON_PUBLIC_STATUSES.includes(auction.status)) {
        return null; 
    }

    if (auction.categoryId) {
        const category = await this.prisma.lotCategory.findUnique({ where: { id: auction.categoryId }});
        // @ts-ignore
        auction.category = category;
    }

    return this.mapAuctionsWithDetails([auction])[0];
  }

  /**
   * Busca múltiplos leilões por seus IDs.
   * @param {string} tenantId - O ID do tenant.
   * @param {string[]} ids - Um array de IDs de leilões.
   * @returns {Promise<Auction[]>} Uma lista de leilões.
   */
  async getAuctionsByIds(tenantId: string, ids: string[]): Promise<Auction[]> {
    const auctions = await this.auctionRepository.findByIds(tenantId, ids);
    return this.mapAuctionsWithDetails(auctions);
  }

  /**
   * Busca leilões por slug ou ID do leiloeiro, excluindo status não públicos.
   * @param {string} tenantId - O ID do tenant.
   * @param {string} auctioneerSlug - O slug ou ID do leiloeiro.
   * @returns {Promise<Auction[]>} Uma lista de leilões públicos.
   */
  async getAuctionsByAuctioneerSlug(tenantId: string, auctioneerSlug: string): Promise<Auction[]> {
    const auctions = await this.auctionRepository.findByAuctioneerSlug(tenantId, auctioneerSlug);
    const publicAuctions = auctions.filter(a => !NON_PUBLIC_STATUSES.includes(a.status));
    return this.mapAuctionsWithDetails(publicAuctions);
  }

  /**
   * Busca leilões por slug ou ID do comitente, excluindo status não públicos.
   * @param {string} tenantId - O ID do tenant.
   * @param {string} sellerSlugOrPublicId - O slug, ID ou publicId do comitente.
   * @returns {Promise<Auction[]>} Uma lista de leilões públicos.
   */
   async getAuctionsBySellerSlug(tenantId: string, sellerSlugOrPublicId: string): Promise<Auction[]> {
    const auctions = await this.auctionRepository.findBySellerSlug(tenantId, sellerSlugOrPublicId);
    const publicAuctions = auctions.filter(a => !NON_PUBLIC_STATUSES.includes(a.status));
    return this.mapAuctionsWithDetails(publicAuctions);
  }

  /**
   * Cria um novo leilão com seus estágios (praças) dentro de uma transação.
   * @param {string} tenantId - O ID do tenant.
   * @param {Partial<AuctionFormData>} data - Os dados do formulário do leilão.
   * @returns {Promise<{success: boolean; message: string; auctionId?: string;}>} O resultado da operação.
   */
  async createAuction(tenantId: string, data: Partial<AuctionFormData>): Promise<{ success: boolean; message: string; auctionId?: string; }> {
    try {
      if (!data.title) throw new Error("O título do leilão é obrigatório.");
      if (!data.auctioneerId) throw new Error("O ID do leiloeiro é obrigatório.");
      if (!data.sellerId) throw new Error("O ID do comitente é obrigatório.");

      const derivedAuctionDate = (data.auctionStages && data.auctionStages.length > 0 && data.auctionStages[0].startDate)
        ? new Date(data.auctionStages[0].startDate as Date)
        : nowInSaoPaulo();

      const { auctioneerId, sellerId, categoryId, cityId, stateId, judicialProcessId, auctionStages, imageUrl, ...restOfData } = data;

      let finalImageUrl = imageUrl;
      if (data.imageMediaId && data.imageMediaId !== 'INHERIT' && !imageUrl) {
        const mediaItem = await this.prisma.mediaItem.findUnique({ where: { id: BigInt(data.imageMediaId) }});
        if (mediaItem) finalImageUrl = mediaItem.urlOriginal;
      }
      
      const newAuction = await this.prisma.$transaction(async (tx: any) => {
        const createdAuction = await tx.auction.create({
          data: {
            ...(restOfData as any),
            imageUrl: finalImageUrl,
            publicId: `AUC-${uuidv4()}`,
            slug: slugify(data.title!),
            auctionDate: derivedAuctionDate,
            softCloseMinutes: Number(data.softCloseMinutes) || undefined,
            auctioneer: { connect: { id: BigInt(auctioneerId) } },
            Seller: { connect: { id: BigInt(sellerId) } }, // Corrected relation name
            category: categoryId ? { connect: { id: BigInt(categoryId) } } : undefined,
            tenant: { connect: { id: BigInt(tenantId) } },
            city: cityId ? { connect: { id: BigInt(cityId) } } : undefined,
            state: stateId ? { connect: { id: BigInt(stateId) } } : undefined,
            judicialProcess: judicialProcessId ? { connect: { id: BigInt(judicialProcessId) } } : undefined,
          }
        });

        if (data.auctionStages && data.auctionStages.length > 0) {
          await tx.auctionStage.createMany({
            data: data.auctionStages.map((stage: any) => ({
              name: stage.name,
              startDate: new Date(stage.startDate as Date),
              endDate: new Date(stage.endDate as Date),
              initialPrice: stage.initialPrice,
              auctionId: createdAuction.id,
            })),
          });
        }

        return createdAuction;
      });

      return { success: true, message: 'Leilão criado com sucesso.', auctionId: newAuction.id.toString() };

    } catch (error: any) {
      console.error("Error in AuctionService.createAuction:", error);
      if (error instanceof PrismaClientValidationError) {
         return { success: false, message: `Falha de validação ao criar leilão: ${error.message}` };
      }
      return { success: false, message: `Falha ao criar leilão: ${error.message}` };
    }
  }

  /**
   * Atualiza um leilão existente e seus estágios.
   * @param {string} tenantId - O ID do tenant.
   * @param {string} id - O ID do leilão a ser atualizado.
   * @param {Partial<AuctionFormData>} data - Os dados a serem atualizados.
   * @returns {Promise<{success: boolean; message: string;}>} O resultado da operação.
   */
  async updateAuction(tenantId: string, id: string, data: Partial<AuctionFormData>): Promise<{ success: boolean; message: string; }> {
    try {
      const auctionToUpdate = await this.auctionRepository.findById(tenantId, id);
      if (!auctionToUpdate) {
        return { success: false, message: 'Leilão não encontrado para este tenant.' };
      }
      const internalId = BigInt(auctionToUpdate.id);

      const { categoryId, auctioneerId, sellerId, auctionStages, judicialProcessId, auctioneerName, sellerName, cityId, stateId, tenantId: _tenantId, imageUrl, ...restOfData } = data;

      let finalImageUrl = imageUrl;
      if (data.imageMediaId && data.imageMediaId !== 'INHERIT' && !imageUrl) {
        const mediaItem = await this.prisma.mediaItem.findUnique({ where: { id: BigInt(data.imageMediaId) }});
        if (mediaItem) finalImageUrl = mediaItem.urlOriginal;
      }

      await this.prisma.$transaction(async (tx: any) => {
        const dataToUpdate: Prisma.AuctionUpdateInput = {
            ...(restOfData as any),
            imageUrl: finalImageUrl,
        };
        
        if (data.title) dataToUpdate.slug = slugify(data.title);
        
        if (auctioneerId) dataToUpdate.auctioneer = { connect: { id: BigInt(auctioneerId) } };
        if (sellerId) dataToUpdate.Seller = { connect: { id: BigInt(sellerId) } }; // Corrected relation name
        if (categoryId) dataToUpdate.category = { connect: { id: BigInt(categoryId) } };
        if (cityId) dataToUpdate.city = { connect: {id: BigInt(cityId) }};
        if (stateId) dataToUpdate.state = { connect: {id: BigInt(stateId) }};
        if (judicialProcessId) {
          dataToUpdate.judicialProcess = { connect: { id: BigInt(judicialProcessId) } };
        } else if (data.hasOwnProperty('judicialProcessId')) {
          dataToUpdate.judicialProcess = { disconnect: true };
        }
        
        if (data.softCloseMinutes) dataToUpdate.softCloseMinutes = Number(data.softCloseMinutes);

        const derivedAuctionDate = (auctionStages && auctionStages.length > 0 && auctionStages[0].startDate) ? auctionStages[0].startDate : (data.auctionDate || undefined);
        if (derivedAuctionDate) {
            dataToUpdate.auctionDate = derivedAuctionDate;
        }

        await tx.auction.update({ where: { id: internalId }, data: dataToUpdate });

        if (auctionStages) {
            await tx.auctionStage.deleteMany({ where: { auctionId: internalId } });
            await tx.auctionStage.createMany({
                data: auctionStages.map(stage => ({
                    name: stage.name,
                    startDate: new Date(stage.startDate as Date),
                    endDate: new Date(stage.endDate as Date),
                    initialPrice: stage.initialPrice,
                    auctionId: internalId,
                })),
            });
        }
      });

      return { success: true, message: 'Leilão atualizado com sucesso.' };
      
    } catch (error: any) {
      console.error(`Error in AuctionService.updateAuction for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar leilão: ${error.message}` };
    }
  }

  /**
   * Exclui um leilão, mas apenas se ele não tiver lotes associados.
   * @param {string} tenantId - O ID do tenant.
   * @param {string} id - O ID do leilão a ser excluído.
   * @returns {Promise<{success: boolean; message: string;}>} O resultado da operação.
   */
  async deleteAuction(tenantId: string, id: string): Promise<{ success: boolean; message: string; }> {
    try {
      const lotCount = await this.auctionRepository.countLots(tenantId, id);
      if (lotCount > 0) {
        return { success: false, message: `Não é possível excluir. O leilão possui ${lotCount} lote(s) associado(s).` };
      }
      const auctionIdAsBigInt = BigInt(id);
      await this.prisma.$transaction(async (tx: any) => {
          await tx.auctionHabilitation.deleteMany({ where: { auctionId: auctionIdAsBigInt } });
          await tx.auctionStage.deleteMany({ where: { auctionId: auctionIdAsBigInt }});
          await tx.auction.delete({ where: { id: auctionIdAsBigInt, tenantId: BigInt(tenantId) } });
      });
      return { success: true, message: 'Leilão excluído com sucesso.' };
    } catch (error: any) {
      console.error(`Error in AuctionService.deleteAuction for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir leilão: ${error.message}` };
    }
  }

  async deleteAllAuctions(tenantId: string): Promise<{ success: boolean; message: string; }> {
    try {
      const auctions = await this.auctionRepository.findAll(tenantId);
      for (const auction of auctions) {
        await this.deleteAuction(tenantId, auction.id.toString());
      }
      return { success: true, message: 'Todos os leilões foram excluídos.' };
    } catch (error: any) {
      return { success: false, message: 'Falha ao excluir todos os leilões.' };
    }
  }
}

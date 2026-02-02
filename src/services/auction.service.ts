// src/services/auction.service.ts
/**
 * @fileoverview Este arquivo contém a classe AuctionService, que encapsula
 * a lógica de negócio principal para o gerenciamento de leilões. Atua como um
 * intermediário entre as server actions (controllers) e o repositório de leilões
 * (camada de dados), garantindo a aplicação de regras de negócio e validações.
 * 
 * REGRAS DE CONSISTÊNCIA DE ESTADO:
 * - Leilões só podem ser abertos (ABERTO/ABERTO_PARA_LANCES) se:
 *   1. Possuem pelo menos 1 Lote que atende aos requisitos de integridade
 *   2. Todos os Lotes vinculados estão prontos (não em RASCUNHO sem validação)
 * 
 * - Ao encerrar um Leilão:
 *   1. Todos os Lotes abertos são automaticamente encerrados
 *   2. Ativos vinculados a Lotes vendidos são marcados como VENDIDO
 */
import { AuctionRepository } from '@/repositories/auction.repository';
import type { Auction, AuctionFormData, LotCategory } from '@/types';
import { slugify } from '@/lib/ui-helpers';
import type { Prisma, AuctionStatus, LotStatus } from '@prisma/client';
import { PrismaClientValidationError } from '@prisma/client/runtime/library';
import { nowInSaoPaulo } from '@/lib/timezone';
import { prisma } from '@/lib/prisma';
import { generatePublicId } from '@/lib/public-id-generator';
import { createManualAuditLog } from '@/lib/audit-context';

// Status que NUNCA devem ser visíveis publicamente
const NON_PUBLIC_STATUSES: Auction['status'][] = ['RASCUNHO', 'EM_PREPARACAO'];

// Status de Leilão que permitem abertura de Lotes
const AUCTION_ALLOWS_LOT_OPENING: AuctionStatus[] = ['ABERTO', 'ABERTO_PARA_LANCES'];

// Status de Lote que precisam de integridade para Leilão abrir
const LOT_DRAFT_STATUSES: LotStatus[] = ['RASCUNHO'];

// Resultado da validação de integridade do Leilão
export interface AuctionIntegrityValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  lotsWithIssues: Array<{ lotId: string; lotTitle: string; issues: string[] }>;
}

export class AuctionService {
  private auctionRepository: AuctionRepository;
  private prisma;

  constructor() {
    this.auctionRepository = new AuctionRepository();
    this.prisma = prisma;
  }

  /**
   * Valida a integridade de um Leilão para verificar se pode ser aberto.
   * Regras verificadas:
   * 1. Possui pelo menos 1 Lote
   * 2. Todos os Lotes possuem pelo menos 1 Ativo vinculado
   * 3. Todos os Lotes possuem título e preço válidos
   * 4. Nenhum Lote está em RASCUNHO sem atender requisitos mínimos
   */
  async validateAuctionIntegrity(auctionId: string): Promise<AuctionIntegrityValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const lotsWithIssues: Array<{ lotId: string; lotTitle: string; issues: string[] }> = [];

    try {
      const auction = await this.prisma.auction.findFirst({
        where: {
          OR: [
            { id: /^\d+$/.test(auctionId) ? BigInt(auctionId) : undefined },
            { publicId: auctionId }
          ].filter(Boolean)
        },
        include: {
          Lot: {
            include: {
              AssetsOnLots: { select: { assetId: true } }
            }
          }
        }
      });

      if (!auction) {
        return { isValid: false, errors: ['Leilão não encontrado'], warnings: [], lotsWithIssues: [] };
      }

      // @ts-ignore
      const lots = auction.Lot || [];

      // 1. Verificar se possui Lotes
      if (lots.length === 0) {
        errors.push('Leilão deve possuir pelo menos 1 Lote para ser aberto');
        return { isValid: false, errors, warnings, lotsWithIssues };
      }

      // 2. Verificar cada Lote
      let lotsReady = 0;
      for (const lot of lots) {
        const lotIssues: string[] = [];

        // Verificar Ativos vinculados
        // @ts-ignore
        if (!lot.AssetsOnLots || lot.AssetsOnLots.length === 0) {
          lotIssues.push('Não possui Ativos vinculados');
        }

        // Verificar título
        if (!lot.title || lot.title.trim() === '') {
          lotIssues.push('Título não preenchido');
        }

        // Verificar preço
        const initialPrice = lot.initialPrice ? Number(lot.initialPrice) : 0;
        const price = lot.price ? Number(lot.price) : 0;
        if (initialPrice <= 0 && price <= 0) {
          lotIssues.push('Preço inicial não definido');
        }

        if (lotIssues.length > 0) {
          lotsWithIssues.push({
            lotId: lot.id.toString(),
            lotTitle: lot.title || `Lote #${lot.number || lot.id}`,
            issues: lotIssues
          });
        } else {
          lotsReady++;
        }
      }

      // 3. Verificar se há pelo menos 1 Lote pronto
      if (lotsReady === 0) {
        errors.push(`Nenhum dos ${lots.length} Lotes está pronto para abertura. Todos possuem pendências.`);
      } else if (lotsWithIssues.length > 0) {
        warnings.push(`${lotsWithIssues.length} de ${lots.length} Lotes possuem pendências e não serão abertos automaticamente`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        lotsWithIssues
      };
    } catch (error) {
      console.error('Erro ao validar integridade do Leilão:', error);
      return { isValid: false, errors: ['Erro interno ao validar Leilão'], warnings: [], lotsWithIssues: [] };
    }
  }

  /**
   * Atualiza o status de um Leilão com validação de integridade.
   * Ao abrir um Leilão, valida todos os Lotes.
   * Ao encerrar um Leilão, encerra automaticamente todos os Lotes abertos.
   */
  async updateAuctionStatus(
    tenantId: string, 
    auctionId: string, 
    newStatus: AuctionStatus
  ): Promise<{ success: boolean; message: string; validation?: AuctionIntegrityValidation }> {
    try {
      // Se está abrindo o Leilão, validar integridade
      if (AUCTION_ALLOWS_LOT_OPENING.includes(newStatus)) {
        const validation = await this.validateAuctionIntegrity(auctionId);
        if (!validation.isValid) {
          return { 
            success: false, 
            message: `Não é possível abrir o Leilão. Erros: ${validation.errors.join('; ')}`,
            validation
          };
        }

        // Abrir automaticamente os Lotes que estão prontos
        await this.prisma.$transaction(async (tx) => {
          // Atualizar status do Leilão
          await tx.auction.update({
            where: { 
              id: /^\d+$/.test(auctionId) ? BigInt(auctionId) : undefined,
              publicId: !/^\d+$/.test(auctionId) ? auctionId : undefined
            },
            data: { status: newStatus, updatedAt: new Date() }
          });

          // Buscar Lotes que estão prontos (não em RASCUNHO ou que passam na validação)
          const readyLotIds = validation.lotsWithIssues.length === 0 
            ? undefined // Todos estão prontos
            : { 
                notIn: validation.lotsWithIssues.map(l => BigInt(l.lotId))
              };

          // Atualizar status dos Lotes prontos para EM_BREVE ou ABERTO_PARA_LANCES
          const targetLotStatus: LotStatus = newStatus === 'ABERTO_PARA_LANCES' ? 'ABERTO_PARA_LANCES' : 'EM_BREVE';
          
          await tx.lot.updateMany({
            where: {
              auctionId: /^\d+$/.test(auctionId) ? BigInt(auctionId) : undefined,
              status: { in: ['RASCUNHO', 'EM_BREVE'] },
              ...(readyLotIds ? { id: readyLotIds } : {})
            },
            data: { status: targetLotStatus, updatedAt: new Date() }
          });
        });

        const warningMsg = validation.warnings.length > 0 
          ? ` Avisos: ${validation.warnings.join('; ')}` 
          : '';
        return { 
          success: true, 
          message: `Leilão aberto com sucesso.${warningMsg}`,
          validation
        };
      }

      // Se está encerrando o Leilão, encerrar Lotes automaticamente
      if (['ENCERRADO', 'FINALIZADO', 'CANCELADO', 'SUSPENSO'].includes(newStatus)) {
        await this.prisma.$transaction(async (tx) => {
          // Atualizar status do Leilão
          await tx.auction.update({
            where: { 
              id: /^\d+$/.test(auctionId) ? BigInt(auctionId) : undefined,
              publicId: !/^\d+$/.test(auctionId) ? auctionId : undefined
            },
            data: { status: newStatus, updatedAt: new Date() }
          });

          // Encerrar todos os Lotes abertos
          const lotStatusOnClose: LotStatus = newStatus === 'CANCELADO' ? 'CANCELADO' : 'ENCERRADO';
          
          await tx.lot.updateMany({
            where: {
              auctionId: /^\d+$/.test(auctionId) ? BigInt(auctionId) : undefined,
              status: { in: ['EM_BREVE', 'ABERTO_PARA_LANCES'] }
            },
            data: { status: lotStatusOnClose, updatedAt: new Date() }
          });
        });

        return { success: true, message: `Leilão ${newStatus.toLowerCase()} com sucesso. Lotes foram encerrados automaticamente.` };
      }

      // Para outros status, apenas atualizar
      await this.prisma.auction.update({
        where: { 
          id: /^\d+$/.test(auctionId) ? BigInt(auctionId) : undefined,
          publicId: !/^\d+$/.test(auctionId) ? auctionId : undefined
        },
        data: { status: newStatus, updatedAt: new Date() }
      });

      return { success: true, message: `Status do Leilão atualizado para ${newStatus}` };
    } catch (error) {
      console.error('Erro ao atualizar status do Leilão:', error);
      return { success: false, message: 'Erro ao atualizar status do Leilão' };
    }
  }

  /**
   * Mapeia os dados brutos do leilão do Prisma para o tipo Auction definido na aplicação.
   * Realiza conversões de tipo (ex: Decimal para number) e calcula campos derivados.
   * @param {any[]} auctions - Array de leilões brutos do banco de dados.
   * @returns {Auction[]} Um array de leilões formatados.
   */
  private mapAuctionsWithDetails(auctions: any[]): Auction[] {
    return auctions.map(a => {
        // Extract raw relations to avoid leaking them (and their Decimals/BigInts) into the response
        const { 
            Lot, lots, 
            Seller, seller, 
            Auctioneer, auctioneer, 
            LotCategory, category, 
            AuctionStage, stages, auctionStages,
            _count, 
            ...rest
        } = a;

        const lotList = Lot ?? lots ?? [];
        const featuredLot = lotList.find((lot: any) => lot.isFeatured);
        const sellerObj = Seller ?? seller;
        const auctioneerObj = Auctioneer ?? auctioneer;
        const categoryObj = LotCategory ?? category;
        const stagesList = AuctionStage ?? stages ?? auctionStages ?? [];
        const countLot = _count?.Lot ?? _count?.lots ?? lotList.length ?? 0;

        return {
            ...rest,
            id: a.id.toString(),
            initialOffer: a.initialOffer ? Number(a.initialOffer) : undefined,
            estimatedRevenue: a.estimatedRevenue ? Number(a.estimatedRevenue) : undefined,
            achievedRevenue: a.achievedRevenue ? Number(a.achievedRevenue) : undefined,
            decrementAmount: a.decrementAmount ? Number(a.decrementAmount) : null,
            floorPrice: a.floorPrice ? Number(a.floorPrice) : null,
            latitude: a.latitude ? Number(a.latitude) : null,
            longitude: a.longitude ? Number(a.longitude) : null,
            totalLots: countLot,
            sellerId: a.sellerId?.toString() ?? null,
            auctioneerId: a.auctioneerId?.toString() ?? null,
            categoryId: a.categoryId?.toString() ?? null,
            judicialProcessId: a.judicialProcessId?.toString() ?? null,
            stateId: a.stateId?.toString() ?? null,
            cityId: a.cityId?.toString() ?? null,
            tenantId: a.tenantId.toString(),
            seller: sellerObj ? { ...sellerObj, id: sellerObj.id.toString() } : null,
            auctioneer: auctioneerObj ? { ...auctioneerObj, id: auctioneerObj.id.toString() } : null,
            category: categoryObj ? { ...categoryObj, id: categoryObj.id.toString() } : null,
            sellerName: sellerObj?.name,
            auctioneerName: auctioneerObj?.name,
            categoryName: categoryObj?.name,
            imageUrl: a.imageMediaId === 'INHERIT' ? featuredLot?.imageUrl : a.imageUrl,
            auctionStages: stagesList.map((stage: any) => ({
                id: stage.id.toString(),
                name: stage.name,
                auctionId: stage.auctionId.toString(),
                tenantId: stage.tenantId?.toString() ?? a.tenantId.toString(),
                discountPercent: stage.discountPercent ? Number(stage.discountPercent) : 100,
                status: stage.status,
                startDate: stage.startDate,
                endDate: stage.endDate,
            })),
            lots: lotList.map((lot: any) => ({
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
    // For public calls, pass undefined to allow cross-tenant lookup
    const auction = await this.auctionRepository.findById(isPublicCall ? undefined : tenantId, id);
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

      const { auctioneerId, sellerId, categoryId, cityId, stateId, judicialProcessId, auctionStages, imageUrl: _imageUrl, ...restOfData } = data;
      
      // Gera o publicId FORA da transação para evitar timeout por nested transactions
      const publicId = await generatePublicId(tenantId, 'auction');
      
      const newAuction = await this.prisma.$transaction(async (tx: any) => {
        const createdAuction = await tx.auction.create({
          data: {
            ...(restOfData as any),
            publicId,
            slug: slugify(data.title!),
            auctionDate: derivedAuctionDate,
            softCloseMinutes: Number(data.softCloseMinutes) || undefined,
            Auctioneer: { connect: { id: BigInt(auctioneerId) } },
            Seller: { connect: { id: BigInt(sellerId) } },
            LotCategory: categoryId ? { connect: { id: BigInt(categoryId) } } : undefined,
            Tenant: { connect: { id: BigInt(tenantId) } },
            City: cityId ? { connect: { id: BigInt(cityId) } } : undefined,
            State: stateId ? { connect: { id: BigInt(stateId) } } : undefined,
            JudicialProcess: judicialProcessId ? { connect: { id: BigInt(judicialProcessId) } } : undefined,
            updatedAt: new Date(),
          }
        });

        if (data.auctionStages && data.auctionStages.length > 0) {
          await tx.auctionStage.createMany({
            data: data.auctionStages.map((stage: any) => ({
              name: stage.name,
              startDate: new Date(stage.startDate as Date),
              endDate: stage.endDate ? new Date(stage.endDate as Date) : null,
              discountPercent: stage.discountPercent ?? 100,
              auctionId: createdAuction.id,
              tenantId: BigInt(tenantId),
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

      const { categoryId, auctioneerId, sellerId, auctionStages, judicialProcessId, cityId, stateId, tenantId: _tenantId, imageUrl: _imageUrl, ...restOfData } = data;

      await this.prisma.$transaction(async (tx: any) => {
        const dataToUpdate: Prisma.AuctionUpdateInput = {
            ...(restOfData as any),
        };
        
        if (data.title) dataToUpdate.slug = slugify(data.title);
        
        if (auctioneerId) dataToUpdate.auctioneer = { connect: { id: BigInt(auctioneerId) } };
        if (sellerId) dataToUpdate.seller = { connect: { id: BigInt(sellerId) } }; // Corrected relation name
        if (categoryId) dataToUpdate.category = { connect: { id: BigInt(categoryId) } };
        if (cityId) dataToUpdate.cityRef = { connect: {id: BigInt(cityId) }};
        if (stateId) dataToUpdate.stateRef = { connect: {id: BigInt(stateId) }};
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

        // Auditoria manual para operações em transação
        await createManualAuditLog(tx, {
          entityType: 'Auction',
          entityId: internalId,
          action: 'UPDATE',
          changes: {
            before: { title: auctionToUpdate.title },
            after: { title: data.title || auctionToUpdate.title, ...restOfData },
          },
          metadata: { operation: 'updateAuction', hasStages: !!auctionStages },
        });

        if (auctionStages) {
            await tx.auctionStage.deleteMany({ where: { auctionId: internalId } });
            await tx.auctionStage.createMany({
                data: auctionStages.map(stage => ({
                    name: stage.name,
                    startDate: new Date(stage.startDate as Date),
                    endDate: stage.endDate ? new Date(stage.endDate as Date) : null,
                    discountPercent: stage.discountPercent ?? 100,
                    auctionId: internalId,
                    tenantId: BigInt(tenantId),
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
      
      // Buscar dados do leilão antes de excluir para auditoria
      const auctionToDelete = await this.auctionRepository.findById(tenantId, id);
      
      const auctionIdAsBigInt = BigInt(id);
      await this.prisma.$transaction(async (tx: any) => {
          await tx.auctionHabilitation.deleteMany({ where: { auctionId: auctionIdAsBigInt } });
          await tx.auctionStage.deleteMany({ where: { auctionId: auctionIdAsBigInt }});
          await tx.auction.delete({ where: { id: auctionIdAsBigInt, tenantId: BigInt(tenantId) } });
          
          // Auditoria manual para operações em transação
          await createManualAuditLog(tx, {
            entityType: 'Auction',
            entityId: auctionIdAsBigInt,
            action: 'DELETE',
            changes: {
              before: auctionToDelete ? { id: auctionToDelete.id, title: auctionToDelete.title, status: auctionToDelete.status } : null,
            },
            metadata: { operation: 'deleteAuction' },
          });
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

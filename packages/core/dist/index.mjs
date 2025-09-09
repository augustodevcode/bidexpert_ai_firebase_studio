// src/lib/zod-enums.ts
var auctionStatusValues = [
  "RASCUNHO",
  "EM_PREPARACAO",
  "EM_BREVE",
  "ABERTO",
  "ABERTO_PARA_LANCES",
  "ENCERRADO",
  "FINALIZADO",
  "CANCELADO",
  "SUSPENSO"
];
var lotStatusValues = [
  "RASCUNHO",
  "EM_BREVE",
  "ABERTO_PARA_LANCES",
  "ENCERRADO",
  "VENDIDO",
  "NAO_VENDIDO",
  "RELISTADO",
  "CANCELADO"
];
var userHabilitationStatusValues = [
  "PENDING_DOCUMENTS",
  "PENDING_ANALYSIS",
  "HABILITADO",
  "REJECTED_DOCUMENTS",
  "BLOCKED"
];
var accountTypeValues = ["PHYSICAL", "LEGAL", "DIRECT_SALE_CONSIGNOR"];
var paymentStatusValues = ["PENDENTE", "PROCESSANDO", "PAGO", "FALHOU", "REEMBOLSADO", "CANCELADO"];
var auctionTypeValues = ["JUDICIAL", "EXTRAJUDICIAL", "PARTICULAR", "TOMADA_DE_PRECOS"];
var auctionMethodValues = ["STANDARD", "DUTCH", "SILENT"];
var auctionParticipationValues = ["ONLINE", "PRESENCIAL", "HIBRIDO"];

// src/lib/zod-schemas.ts
import { z } from "zod";
var BiddingSettingsSchema = z.object({
  instantBiddingEnabled: z.boolean().default(true),
  getBidInfoInstantly: z.boolean().default(true),
  biddingInfoCheckIntervalSeconds: z.number().int().min(1).max(60).default(1)
});
var AuctionStageSchema = z.object({
  name: z.string().min(1),
  endDate: z.union([z.date(), z.string().datetime()]),
  initialPrice: z.number().positive().optional(),
  statusText: z.string().optional()
});
var AuctionSchema = z.object({
  id: z.string(),
  publicId: z.string(),
  title: z.string().min(5),
  description: z.string().optional(),
  status: z.enum(auctionStatusValues).default("RASCUNHO"),
  auctionDate: z.union([z.date(), z.string().datetime()]),
  endDate: z.union([z.date(), z.string().datetime()]).optional().nullable(),
  totalLots: z.number().int().optional(),
  categoryId: z.string().optional(),
  auctioneerId: z.string(),
  sellerId: z.string(),
  imageUrl: z.string().url().optional().nullable(),
  imageMediaId: z.string().optional().nullable(),
  visits: z.number().int().optional(),
  auctionType: z.enum(["JUDICIAL", "EXTRAJUDICIAL", "PARTICULAR", "TOMADA_DE_PRECOS", "DUTCH", "SILENT"]).optional(),
  auctionStages: z.array(AuctionStageSchema).optional(),
  biddingSettings: BiddingSettingsSchema.optional(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()])
  // Add other fields as needed, matching the types/index.ts Auction interface
});
var LotSchema = z.object({
  id: z.string(),
  publicId: z.string(),
  auctionId: z.string(),
  number: z.string().optional(),
  title: z.string().min(5),
  description: z.string().optional().nullable(),
  price: z.number(),
  initialPrice: z.number().optional().nullable(),
  status: z.enum(lotStatusValues).default("EM_BREVE"),
  bidsCount: z.number().int().optional(),
  views: z.number().int().optional(),
  imageUrl: z.string().url().optional().nullable(),
  imageMediaId: z.string().optional().nullable(),
  categoryId: z.string().optional(),
  bemIds: z.array(z.string()).optional(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()])
  // Add other fields as needed
});
var UserProfileDataSchema = z.object({
  id: z.string(),
  uid: z.string(),
  email: z.string().email(),
  password: z.string().optional(),
  fullName: z.string().nullable(),
  habilitationStatus: z.enum(userHabilitationStatusValues),
  accountType: z.enum(accountTypeValues),
  roleIds: z.array(z.string()),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()])
  // Add other fields from UserProfileData interface
});
var SellerProfileInfoSchema = z.object({
  id: z.string(),
  publicId: z.string(),
  slug: z.string(),
  name: z.string(),
  isJudicial: z.boolean().default(false),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()])
  // Add other fields
});
var AuctioneerProfileInfoSchema = z.object({
  id: z.string(),
  publicId: z.string(),
  slug: z.string(),
  name: z.string(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()])
  // Add other fields
});
var cardSchema = z.object({
  cardholderName: z.string().min(3, { message: "O nome no cart\xE3o \xE9 obrigat\xF3rio." }),
  cardNumber: z.string().min(16, { message: "O n\xFAmero do cart\xE3o deve ter 16 d\xEDgitos." }).max(16, { message: "O n\xFAmero do cart\xE3o deve ter 16 d\xEDgitos." }).regex(/^\d+$/, { message: "O n\xFAmero do cart\xE3o deve conter apenas d\xEDgitos." }),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, { message: "Formato de validade inv\xE1lido. Use MM/AA." }).refine((val) => {
    const [month, year] = val.split("/");
    const expiry = new Date(2e3 + parseInt(year, 10), parseInt(month, 10));
    const now = /* @__PURE__ */ new Date();
    now.setMonth(now.getMonth() - 1);
    return expiry > now;
  }, { message: "Cart\xE3o expirado." }),
  cvc: z.string().min(3, { message: "CVC deve ter 3 d\xEDgitos." }).max(4, { message: "CVC inv\xE1lido." })
});
var checkoutFormSchema = z.object({
  paymentMethod: z.enum(["credit_card", "installments"], {
    required_error: "Selecione um m\xE9todo de pagamento."
  }),
  installments: z.coerce.number().optional(),
  cardDetails: cardSchema.optional()
}).superRefine((data, ctx) => {
  if (data.paymentMethod === "credit_card" && !data.cardDetails) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["cardDetails"],
      message: "Detalhes do cart\xE3o s\xE3o obrigat\xF3rios para pagamento \xE0 vista."
    });
  }
});

// src/lib/ui-helpers.ts
var slugify = (text) => {
  if (!text) return "";
  return text.toString().toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").replace(/[^\w-]+/g, "").replace(/--+/g, "-");
};

// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
var globalForPrisma = global;
var prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
});
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// src/repositories/auction.repository.ts
var AuctionRepository = class {
  async findAll() {
    return prisma.auction.findMany({
      orderBy: { auctionDate: "desc" },
      include: {
        _count: { select: { lots: true } },
        seller: true,
        // Include full seller object
        auctioneer: true,
        // Include full auctioneer object
        category: { select: { name: true } },
        stages: true
      }
    });
  }
  async findById(id) {
    return prisma.auction.findFirst({
      where: { OR: [{ id }, { publicId: id }] },
      include: {
        lots: { include: { bens: { include: { bem: true } } } },
        auctioneer: true,
        seller: true,
        // Full seller object
        category: true,
        stages: true
      }
    });
  }
  async findByIds(ids) {
    return prisma.auction.findMany({
      where: {
        OR: [
          { id: { in: ids } },
          { publicId: { in: ids } }
        ]
      },
      include: {
        _count: { select: { lots: true } },
        seller: true,
        auctioneer: true,
        category: { select: { name: true } },
        stages: true
      }
    });
  }
  async create(data) {
    return prisma.auction.create({ data });
  }
  async update(id, data) {
    return prisma.auction.update({ where: { id }, data });
  }
  async delete(id) {
    await prisma.auction.delete({ where: { id } });
  }
  async countLots(auctionId) {
    return prisma.lot.count({ where: { auctionId } });
  }
  async findByAuctioneerSlug(auctioneerSlug) {
    return prisma.auction.findMany({
      where: {
        auctioneer: {
          OR: [
            { slug: auctioneerSlug },
            { id: auctioneerSlug },
            { publicId: auctioneerSlug }
          ]
        }
      },
      include: {
        _count: { select: { lots: true } },
        seller: true,
        auctioneer: true,
        category: true,
        stages: true,
        lots: {
          include: {
            bens: { include: { bem: true } }
          }
        }
      },
      orderBy: { auctionDate: "desc" }
    });
  }
  async findBySellerSlug(sellerSlugOrId) {
    return prisma.auction.findMany({
      where: {
        seller: {
          OR: [{ slug: sellerSlugOrId }, { id: sellerSlugOrId }, { publicId: sellerSlugOrId }]
        }
      },
      include: {
        _count: { select: { lots: true } },
        seller: true,
        auctioneer: true,
        category: true,
        stages: true,
        lots: {
          include: {
            bens: { include: { bem: true } }
          }
        }
      }
    });
  }
};

// src/services/auction.service.ts
import { v4 as uuidv4 } from "uuid";
var AuctionService = class {
  auctionRepository;
  constructor() {
    this.auctionRepository = new AuctionRepository();
  }
  mapAuctionsWithDetails(auctions) {
    return auctions.map((a) => ({
      ...a,
      totalLots: a._count?.lots ?? a.lots?.length ?? 0,
      seller: a.seller,
      auctioneer: a.auctioneer,
      category: a.category,
      sellerName: a.seller?.name,
      auctioneerName: a.auctioneer?.name,
      categoryName: a.category?.name,
      auctionStages: a.stages || a.auctionStages || []
    }));
  }
  async getAuctions() {
    const auctions = await this.auctionRepository.findAll();
    return this.mapAuctionsWithDetails(auctions);
  }
  async getAuctionById(id) {
    const auction = await this.auctionRepository.findById(id);
    if (!auction) return null;
    return this.mapAuctionsWithDetails([auction])[0];
  }
  async getAuctionsByIds(ids) {
    if (ids.length === 0) return [];
    const auctions = await this.auctionRepository.findByIds(ids);
    return this.mapAuctionsWithDetails(auctions);
  }
  async getAuctionsByAuctioneerSlug(auctioneerSlug) {
    const auctions = await this.auctionRepository.findByAuctioneerSlug(auctioneerSlug);
    return this.mapAuctionsWithDetails(auctions);
  }
  async getAuctionsBySellerSlug(sellerSlug) {
    const auctions = await this.auctionRepository.findBySellerSlug(sellerSlug);
    return this.mapAuctionsWithDetails(auctions);
  }
  async createAuction(data) {
    try {
      const { categoryId, auctioneerId, sellerId, stages, judicialProcessId, cityId, stateId, ...restOfData } = data;
      if (!data.title) throw new Error("O t\xEDtulo do leil\xE3o \xE9 obrigat\xF3rio.");
      if (!auctioneerId) throw new Error("O ID do leiloeiro \xE9 obrigat\xF3rio.");
      if (!sellerId) throw new Error("O ID do comitente \xE9 obrigat\xF3rio.");
      const derivedAuctionDate = stages && stages.length > 0 && stages[0].startDate ? stages[0].startDate : /* @__PURE__ */ new Date();
      const auctionData = {
        ...restOfData,
        auctionDate: derivedAuctionDate,
        publicId: `AUC-${uuidv4()}`,
        slug: slugify(data.title),
        auctioneer: { connect: { id: auctioneerId } },
        seller: { connect: { id: sellerId } },
        auctionType: data.auctionType,
        participation: data.participation,
        auctionMethod: data.auctionMethod,
        softCloseMinutes: Number(data.softCloseMinutes)
      };
      if (categoryId) auctionData.category = { connect: { id: categoryId } };
      if (cityId) auctionData.city = { connect: { id: cityId } };
      if (stateId) auctionData.state = { connect: { id: stateId } };
      if (judicialProcessId) auctionData.judicialProcess = { connect: { id: judicialProcessId } };
      if (stages && stages.length > 0) {
        auctionData.stages = {
          create: stages.map((stage) => ({
            name: stage.name,
            startDate: new Date(stage.startDate),
            endDate: new Date(stage.endDate),
            evaluationValue: stage.evaluationValue
          }))
        };
      }
      const newAuction = await this.auctionRepository.create(auctionData);
      return { success: true, message: "Leil\xE3o criado com sucesso.", auctionId: newAuction.id };
    } catch (error) {
      console.error("Error in AuctionService.createAuction:", error);
      return { success: false, message: `Falha ao criar leil\xE3o: ${error.message}` };
    }
  }
  async updateAuction(id, data) {
    try {
      const auctionToUpdate = await this.auctionRepository.findById(id);
      if (!auctionToUpdate) return { success: false, message: "Leil\xE3o n\xE3o encontrado para atualiza\xE7\xE3o." };
      const internalId = auctionToUpdate.id;
      const { categoryId, auctioneerId, sellerId, stages, judicialProcessId, cityId, stateId, ...restOfData } = data;
      await prisma.$transaction(async (tx) => {
        const dataToUpdate = { ...restOfData };
        if (data.title) dataToUpdate.slug = slugify(data.title);
        if (auctioneerId) dataToUpdate.auctioneer = { connect: { id: auctioneerId } };
        if (sellerId) dataToUpdate.seller = { connect: { id: sellerId } };
        if (categoryId) dataToUpdate.category = { connect: { id: categoryId } };
        if (cityId) dataToUpdate.city = { connect: { id: cityId } };
        if (stateId) dataToUpdate.state = { connect: { id: stateId } };
        if (judicialProcessId) dataToUpdate.judicialProcess = { connect: { id: judicialProcessId } };
        else if (data.hasOwnProperty("judicialProcessId")) dataToUpdate.judicialProcess = { disconnect: true };
        if (data.softCloseMinutes) dataToUpdate.softCloseMinutes = Number(data.softCloseMinutes);
        const derivedAuctionDate = stages && stages.length > 0 && stages[0].startDate ? stages[0].startDate : data.auctionDate || void 0;
        if (derivedAuctionDate) dataToUpdate.auctionDate = derivedAuctionDate;
        await tx.auction.update({ where: { id: internalId }, data: dataToUpdate });
        if (stages) {
          await tx.auctionStage.deleteMany({ where: { auctionId: internalId } });
          await tx.auctionStage.createMany({
            data: stages.map((stage) => ({
              name: stage.name,
              startDate: new Date(stage.startDate),
              endDate: new Date(stage.endDate),
              evaluationValue: stage.evaluationValue,
              auctionId: internalId
            }))
          });
        }
      });
      return { success: true, message: "Leil\xE3o atualizado com sucesso." };
    } catch (error) {
      console.error(`Error in AuctionService.updateAuction for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar leil\xE3o: ${error.message}` };
    }
  }
  async deleteAuction(id) {
    try {
      const lotCount = await this.auctionRepository.countLots(id);
      if (lotCount > 0) {
        return { success: false, message: `N\xE3o \xE9 poss\xEDvel excluir. O leil\xE3o possui ${lotCount} lote(s) associado(s).` };
      }
      await prisma.$transaction(async (tx) => {
        await tx.auctionStage.deleteMany({ where: { auctionId: id } });
        await tx.auction.delete({ where: { id } });
      });
      return { success: true, message: "Leil\xE3o exclu\xEDdo com sucesso." };
    } catch (error) {
      console.error(`Error in AuctionService.deleteAuction for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir leil\xE3o: ${error.message}` };
    }
  }
  async updateAuctionTitle(id, newTitle) {
    return this.updateAuction(id, { title: newTitle });
  }
  async updateAuctionImage(auctionId, mediaItemId, imageUrl) {
    return this.updateAuction(auctionId, { imageUrl, imageMediaId: mediaItemId });
  }
  async updateAuctionFeaturedStatus(id, newStatus) {
    return this.updateAuction(id, { isFeaturedOnMarketplace: newStatus });
  }
};

// src/repositories/lot.repository.ts
var LotRepository = class {
  async findAll(auctionId) {
    return prisma.lot.findMany({
      where: auctionId ? { auctionId } : {},
      include: {
        bens: { include: { bem: true } },
        // Include the Bem through LotBens
        auction: { select: { title: true } },
        category: { select: { name: true } },
        subcategory: { select: { name: true } },
        stageDetails: true
      },
      orderBy: { number: "asc" }
    });
  }
  async findById(id) {
    return prisma.lot.findFirst({
      where: { OR: [{ id }, { publicId: id }] },
      include: {
        bens: { include: { bem: true } },
        // Include the Bem through LotBens
        auction: { include: { auctionStages: true, seller: true } },
        // Include auction stages
        stageDetails: true
      }
    });
  }
  async findByIds(ids) {
    if (ids.length === 0) return [];
    return prisma.lot.findMany({
      where: { id: { in: ids } },
      include: {
        auction: { include: { auctionStages: true, seller: true } },
        stageDetails: true
      }
    });
  }
  async create(lotData, bemIds) {
    return prisma.$transaction(async (tx) => {
      const newLot = await tx.lot.create({
        data: lotData
      });
      if (bemIds && bemIds.length > 0) {
        await tx.lotBens.createMany({
          data: bemIds.map((bemId) => ({
            lotId: newLot.id,
            bemId
          }))
        });
      }
      return newLot;
    });
  }
  async update(id, lotData, bemIds, stageDetails) {
    return prisma.$transaction(async (tx) => {
      const updatedLot = await tx.lot.update({
        where: { id },
        data: lotData
      });
      if (bemIds !== void 0) {
        await tx.lotBens.deleteMany({
          where: { lotId: id }
        });
        if (bemIds.length > 0) {
          await tx.lotBens.createMany({
            data: bemIds.map((bemId) => ({
              lotId: id,
              bemId
            }))
          });
        }
      }
      if (stageDetails) {
        await tx.lotStagePrice.deleteMany({ where: { lotId: id } });
        if (stageDetails.length > 0) {
          await tx.lotStagePrice.createMany({
            data: stageDetails.map((detail) => ({
              lotId: id,
              auctionStageId: detail.stageId,
              initialBid: detail.initialBid,
              bidIncrement: detail.bidIncrement
            }))
          });
        }
      }
      return updatedLot;
    });
  }
  async delete(id) {
    await prisma.$transaction(async (tx) => {
      await tx.lotBens.deleteMany({
        where: { lotId: id }
      });
      await tx.lotStagePrice.deleteMany({
        where: { lotId: id }
      });
      await tx.lot.delete({ where: { id } });
    });
  }
};

// src/repositories/bid.repository.ts
var BidRepository = class {
  async findHighestBid(lotId) {
    return prisma.bid.findFirst({
      where: { lotId },
      orderBy: { amount: "desc" }
    });
  }
  async findBidsByLotId(lotId) {
    return prisma.bid.findMany({
      where: { lotId },
      orderBy: { timestamp: "desc" }
    });
  }
  async findBidsByUserId(userId) {
    return prisma.bid.findMany({
      where: { bidderId: userId },
      orderBy: { timestamp: "desc" },
      distinct: ["lotId"],
      // Get only the latest bid from the user for each lot
      include: {
        lot: {
          include: {
            auction: {
              select: { title: true }
            }
          }
        }
      }
    });
  }
  async createBid(data) {
    return prisma.bid.create({ data });
  }
  async findActiveMaxBid(userId, lotId) {
    return prisma.userLotMaxBid.findFirst({
      where: { userId, lotId, isActive: true }
    });
  }
  async upsertMaxBid(data) {
    return prisma.userLotMaxBid.upsert({
      where: { userId_lotId: { userId: data.userId, lotId: data.lotId } },
      update: { maxAmount: data.maxAmount, isActive: true },
      create: data
    });
  }
};

// src/services/lot.service.ts
import { v4 as uuidv42 } from "uuid";
var LotService = class {
  lotRepository;
  bidRepository;
  constructor() {
    this.lotRepository = new LotRepository();
    this.bidRepository = new BidRepository();
  }
  async getLots(auctionId) {
    const lots = await this.lotRepository.findAll(auctionId);
    return lots.map((lot) => ({
      ...lot,
      bens: lot.bens.map((lb) => lb.bem),
      auctionName: lot.auction?.title,
      categoryName: lot.category?.name,
      subcategoryName: lot.subcategory?.name
    }));
  }
  async getLotsBySellerId(sellerId) {
    const lots = await prisma.lot.findMany({ where: { sellerId } });
    return lots;
  }
  async getLotById(id) {
    const lot = await this.lotRepository.findById(id);
    if (!lot) return null;
    return {
      ...lot,
      bens: lot.bens.map((lb) => lb.bem),
      auction: lot.auction
    };
  }
  async getLotsByIds(ids) {
    const lots = await this.lotRepository.findByIds(ids);
    return lots;
  }
  async createLot(data) {
    try {
      const {
        bemIds,
        categoryId,
        auctionId,
        type,
        sellerId,
        subcategoryId,
        stageDetails,
        ...lotData
      } = data;
      const finalCategoryId = categoryId || type;
      if (!auctionId) {
        return { success: false, message: "\xC9 obrigat\xF3rio associar o lote a um leil\xE3o." };
      }
      if (!finalCategoryId) {
        return { success: false, message: "A categoria \xE9 obrigat\xF3ria para o lote." };
      }
      const dataToCreate = {
        ...lotData,
        price: Number(lotData.price) || Number(lotData.initialPrice) || 0,
        publicId: `LOTE-PUB-${uuidv42().substring(0, 8)}`,
        slug: lotData.title ? lotData.title : "",
        auction: { connect: { id: auctionId } },
        category: { connect: { id: finalCategoryId } },
        isRelisted: data.isRelisted || false,
        relistCount: data.relistCount || 0
      };
      if (data.originalLotId) dataToCreate.originalLot = { connect: { id: data.originalLotId } };
      if (sellerId) dataToCreate.seller = { connect: { id: sellerId } };
      if (data.auctioneerId) dataToCreate.auctioneer = { connect: { id: data.auctioneerId } };
      if (subcategoryId) dataToCreate.subcategory = { connect: { id: subcategoryId } };
      if (data.hasOwnProperty("inheritedMediaFromBemId")) dataToCreate.inheritedMediaFromBemId = data.inheritedMediaFromBemId;
      const newLot = await this.lotRepository.create(dataToCreate, bemIds || []);
      return { success: true, message: "Lote criado com sucesso.", lotId: newLot.id };
    } catch (error) {
      console.error("Error in LotService.createLot:", error);
      return { success: false, message: `Falha ao criar lote: ${error.message}` };
    }
  }
  async updateLot(id, data) {
    try {
      const {
        bemIds,
        categoryId,
        subcategoryId,
        type,
        auctionId,
        sellerId,
        auctioneerId,
        stateId,
        cityId,
        stageDetails,
        ...lotData
      } = data;
      const dataToUpdate = {
        ...lotData,
        price: lotData.price ? Number(lotData.price) : void 0
      };
      if (lotData.title) dataToUpdate.slug = lotData.title;
      const finalCategoryId = categoryId || type;
      if (finalCategoryId) dataToUpdate.category = { connect: { id: finalCategoryId } };
      if (auctionId) dataToUpdate.auction = { connect: { id: auctionId } };
      if (subcategoryId) dataToUpdate.subcategory = { connect: { id: subcategoryId } };
      else if (data.hasOwnProperty("subcategoryId")) dataToUpdate.subcategory = { disconnect: true };
      if (sellerId) dataToUpdate.seller = { connect: { id: sellerId } };
      if (auctioneerId) dataToUpdate.auctioneer = { connect: { id: auctioneerId } };
      if (cityId) dataToUpdate.city = { connect: { id: cityId } };
      if (stateId) dataToUpdate.state = { connect: { id: stateId } };
      if (data.hasOwnProperty("inheritedMediaFromBemId")) dataToUpdate.inheritedMediaFromBemId = data.inheritedMediaFromBemId;
      await this.lotRepository.update(id, dataToUpdate, bemIds, stageDetails);
      return { success: true, message: "Lote atualizado com sucesso." };
    } catch (error) {
      console.error(`Error in LotService.updateLot for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar lote: ${error.message}` };
    }
  }
  async deleteLot(id) {
    const lotToDelete = await this.getLotById(id);
    if (!lotToDelete) {
      return { success: false, message: "Lote n\xE3o encontrado." };
    }
    await this.lotRepository.delete(lotToDelete.id);
    return { success: true, message: "Lote exclu\xEDdo com sucesso." };
  }
  async finalizeLot(lotId) {
    const lot = await this.getLotById(lotId);
    if (!lot) return { success: false, message: "Lote n\xE3o encontrado." };
    if (lot.status !== "ABERTO_PARA_LANCES" && lot.status !== "ENCERRADO") {
      return { success: false, message: `O lote n\xE3o pode ser finalizado no status atual (${lot.status}).` };
    }
    const winningBid = await this.bidRepository.findHighestBid(lot.id);
    if (winningBid) {
      await this.lotRepository.update(lot.id, { status: "VENDIDO", winner: { connect: { id: winningBid.bidderId } }, price: winningBid.amount });
      return { success: true, message: `Lote finalizado! Vencedor: ${winningBid.bidderDisplay} com R$ ${winningBid.amount.toLocaleString("pt-BR")}.` };
    } else {
      await this.lotRepository.update(lot.id, { status: "NAO_VENDIDO" });
      return { success: true, message: "Lote finalizado como 'N\xE3o Vendido' por falta de lances." };
    }
  }
};

// src/repositories/seller.repository.ts
var SellerRepository = class {
  async findAll() {
    return prisma.seller.findMany({ orderBy: { name: "asc" } });
  }
  async findById(id) {
    return prisma.seller.findUnique({ where: { id } });
  }
  async findByName(name) {
    try {
      return await prisma.seller.findUnique({ where: { name } });
    } catch (error) {
      return null;
    }
  }
  async findBySlug(slugOrId) {
    return prisma.seller.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }, { publicId: slugOrId }]
      }
    });
  }
  async findLotsBySellerId(sellerId) {
    return prisma.lot.findMany({
      where: { sellerId },
      include: { auction: true }
    });
  }
  async create(data) {
    return prisma.seller.create({ data });
  }
  async update(id, data) {
    return prisma.seller.update({ where: { id }, data });
  }
  async delete(id) {
    await prisma.seller.delete({ where: { id } });
  }
};

// src/services/seller.service.ts
import { v4 as uuidv43 } from "uuid";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

// src/repositories/user-win.repository.ts
var UserWinRepository = class {
  async findById(id) {
    return prisma.userWin.findUnique({
      where: { id },
      include: {
        lot: {
          include: {
            auction: {
              select: {
                title: true
              }
            }
          }
        }
      }
    });
  }
  async findByIds(ids) {
    return prisma.userWin.findMany({
      where: { id: { in: ids } }
    });
  }
  async findByIdSimple(id) {
    return prisma.userWin.findUnique({ where: { id } });
  }
  async findWinsByUserId(userId) {
    return prisma.userWin.findMany({
      where: { userId },
      include: {
        lot: {
          include: {
            auction: { select: { title: true } }
          }
        }
      },
      orderBy: { winDate: "desc" }
    });
  }
  async findWinsBySellerId(sellerId) {
    return prisma.userWin.findMany({
      where: {
        lot: {
          sellerId
        }
      },
      include: {
        lot: {
          include: {
            auction: { select: { title: true } }
          }
        }
      },
      orderBy: {
        winDate: "desc"
      }
    });
  }
  async update(id, data) {
    return prisma.userWin.update({
      where: { id },
      data
    });
  }
};

// src/services/user-win.service.ts
var UserWinService = class {
  repository;
  constructor() {
    this.repository = new UserWinRepository();
  }
  formatWin(win) {
    if (!win || !win.id) return null;
    const lotWithAuctionName = win.lot ? {
      ...win.lot,
      auctionName: win.lot.auction?.title
    } : null;
    return { ...win, lot: lotWithAuctionName, id: win.id };
  }
  async getWinDetails(winId) {
    const win = await this.repository.findById(winId);
    return this.formatWin(win);
  }
  async findWinsByUserId(userId) {
    const wins = await this.repository.findWinsByUserId(userId);
    return wins.map((win) => this.formatWin(win)).filter(Boolean);
  }
  async getWinsForConsignor(sellerId) {
    const wins = await this.repository.findWinsBySellerId(sellerId);
    return wins.map((win) => ({
      ...this.formatWin(win),
      user: { fullName: win.user?.fullName }
    })).filter(Boolean);
  }
  async getUserReportData(userId) {
    if (!userId) {
      throw new Error("User ID is required to generate a report.");
    }
    const wins = await this.repository.findWinsByUserId(userId);
    const totalLotsWon = wins.length;
    const totalAmountSpent = wins.reduce((sum, win) => sum + win.winningBidAmount, 0);
    const totalBidsPlaced = await prisma.bid.count({ where: { bidderId: userId } });
    const categorySpendingMap = /* @__PURE__ */ new Map();
    const allCategories = await prisma.lotCategory.findMany({ select: { id: true, name: true } });
    const categoryNameMap = new Map(allCategories.map((c) => [c.id, c.name]));
    wins.forEach((win) => {
      const categoryId = win.lot?.categoryId;
      if (categoryId) {
        const categoryName = categoryNameMap.get(categoryId) || "Outros";
        const currentAmount = categorySpendingMap.get(categoryName) || 0;
        categorySpendingMap.set(categoryName, currentAmount + win.winningBidAmount);
      }
    });
    const spendingByCategory = Array.from(categorySpendingMap, ([name, value]) => ({ name, value }));
    return {
      totalLotsWon,
      totalAmountSpent,
      totalBidsPlaced,
      spendingByCategory
    };
  }
};

// src/services/seller.service.ts
var SellerService = class {
  sellerRepository;
  lotService;
  userWinService;
  auctionRepository;
  constructor() {
    this.sellerRepository = new SellerRepository();
    this.lotService = new LotService();
    this.userWinService = new UserWinService();
    this.auctionRepository = new AuctionRepository();
  }
  async getSellers() {
    return this.sellerRepository.findAll();
  }
  async getSellerById(id) {
    return this.sellerRepository.findById(id);
  }
  async findByName(name) {
    return this.sellerRepository.findByName(name);
  }
  async getSellerBySlug(slugOrId) {
    return this.sellerRepository.findBySlug(slugOrId);
  }
  async getLotsBySellerSlug(sellerSlugOrId) {
    const seller = await this.sellerRepository.findBySlug(sellerSlugOrId);
    if (!seller) return [];
    return this.lotService.getLotsBySellerId(seller.id);
  }
  async getAuctionsBySellerSlug(sellerSlugOrId) {
    return this.auctionRepository.findBySellerSlug(sellerSlugOrId);
  }
  async createSeller(data) {
    try {
      const existingSeller = await this.findByName(data.name);
      if (existingSeller) {
        return { success: false, message: "J\xE1 existe um comitente com este nome." };
      }
      const { userId, ...sellerData } = data;
      const dataToCreate = {
        ...sellerData,
        slug: slugify(data.name),
        publicId: `COM-${uuidv43()}`
      };
      if (userId) {
        dataToCreate.user = { connect: { id: userId } };
      }
      const newSeller = await this.sellerRepository.create(dataToCreate);
      return { success: true, message: "Comitente criado com sucesso.", sellerId: newSeller.id };
    } catch (error) {
      console.error("Error in SellerService.createSeller:", error);
      return { success: false, message: `Falha ao criar comitente: ${error.message}` };
    }
  }
  async updateSeller(id, data) {
    try {
      const dataWithSlug = data.name ? { ...data, slug: slugify(data.name) } : data;
      await this.sellerRepository.update(id, dataWithSlug);
      return { success: true, message: "Comitente atualizado com sucesso." };
    } catch (error) {
      console.error(`Error in SellerService.updateSeller for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar comitente: ${error.message}` };
    }
  }
  async deleteSeller(id) {
    try {
      const lots = await this.lotService.getLotsBySellerId(id);
      if (lots.length > 0) {
        return { success: false, message: `N\xE3o \xE9 poss\xEDvel excluir. O comitente est\xE1 vinculado a ${lots.length} lote(s).` };
      }
      await this.sellerRepository.delete(id);
      return { success: true, message: "Comitente exclu\xEDdo com sucesso." };
    } catch (error) {
      console.error(`Error in SellerService.deleteSeller for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir comitente: ${error.message}` };
    }
  }
  async getSellerDashboardData(sellerId) {
    const [sellerData, sellerWins] = await Promise.all([
      this.sellerRepository.findById(sellerId),
      this.userWinService.getWinsForConsignor(sellerId)
    ]);
    if (!sellerData) return null;
    const commissionRate = 0.05;
    const paidWins = sellerWins.filter((win) => win.paymentStatus === "PAGO");
    const totalRevenue = paidWins.reduce((acc, win) => acc + win.winningBidAmount, 0);
    const totalCommission = totalRevenue * commissionRate;
    const netValue = totalRevenue - totalCommission;
    const lotsSoldCount = sellerWins.length;
    const averageTicket = lotsSoldCount > 0 ? totalRevenue / lotsSoldCount : 0;
    const totalLots = await prisma.lot.count({ where: { sellerId } });
    const salesRate = totalLots > 0 ? lotsSoldCount / totalLots * 100 : 0;
    const totalAuctions = await prisma.auction.count({ where: { sellerId } });
    const salesByMonthMap = /* @__PURE__ */ new Map();
    const now = /* @__PURE__ */ new Date();
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthKey = format(date, "MMM/yy", { locale: ptBR });
      salesByMonthMap.set(monthKey, 0);
    }
    paidWins.forEach((win) => {
      const winDate = win.paymentDate ? new Date(win.paymentDate) : new Date(win.winDate);
      const monthKey = format(winDate, "MMM/yy", { locale: ptBR });
      if (salesByMonthMap.has(monthKey)) {
        salesByMonthMap.set(monthKey, (salesByMonthMap.get(monthKey) || 0) + win.winningBidAmount);
      }
    });
    const salesByMonth = Array.from(salesByMonthMap, ([name, Faturamento]) => ({ name, Faturamento }));
    return {
      totalRevenue,
      totalCommission,
      netValue,
      totalAuctions,
      totalLots,
      lotsSoldCount,
      paidCount: paidWins.length,
      salesRate,
      averageTicket,
      salesByMonth,
      platformCommissionPercentage: commissionRate * 100
    };
  }
  async getSellersPerformance() {
    const sellers = await this.sellerRepository.findAll();
    const performanceData = await Promise.all(
      sellers.map(async (seller) => {
        const dashboardData = await this.getSellerDashboardData(seller.id);
        return {
          id: seller.id,
          name: seller.name,
          totalAuctions: dashboardData?.totalAuctions || 0,
          totalLots: dashboardData?.totalLots || 0,
          totalRevenue: dashboardData?.totalRevenue || 0,
          averageTicket: dashboardData?.averageTicket || 0
        };
      })
    );
    return performanceData.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }
};

// src/repositories/auctioneer.repository.ts
var AuctioneerRepository = class {
  async findAll() {
    return prisma.auctioneer.findMany({ orderBy: { name: "asc" } });
  }
  async findById(id) {
    return prisma.auctioneer.findFirst({ where: { OR: [{ id }, { publicId: id }] } });
  }
  async findBySlug(slugOrId) {
    return prisma.auctioneer.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }, { publicId: slugOrId }]
      }
    });
  }
  async create(data) {
    return prisma.auctioneer.create({ data });
  }
  async update(id, data) {
    return prisma.auctioneer.update({ where: { id }, data });
  }
  async delete(id) {
    await prisma.auctioneer.delete({ where: { id } });
  }
};

// src/services/auctioneer.service.ts
import { v4 as uuidv44 } from "uuid";
import { format as format2, subMonths as subMonths2 } from "date-fns";
import { ptBR as ptBR2 } from "date-fns/locale";
var AuctioneerService = class {
  auctioneerRepository;
  auctionRepository;
  constructor() {
    this.auctioneerRepository = new AuctioneerRepository();
    this.auctionRepository = new AuctionRepository();
  }
  mapAuctionsWithDetails(auctions) {
    return auctions.map((a) => ({
      ...a,
      totalLots: a._count?.lots ?? a.lots?.length ?? 0,
      seller: a.seller,
      // Pass the full seller object
      auctioneer: a.auctioneer,
      // Pass the full auctioneer object
      category: a.category,
      // Pass the full category object
      sellerName: a.seller?.name,
      auctioneerName: a.auctioneer?.name,
      categoryName: a.category?.name,
      auctionStages: a.stages || a.auctionStages || []
    }));
  }
  async obterLeiloeiros() {
    return this.auctioneerRepository.findAll();
  }
  async obterLeiloeiroPorId(id) {
    return this.auctioneerRepository.findById(id);
  }
  async obterLeiloeiroPorSlug(slugOrId) {
    return this.auctioneerRepository.findBySlug(slugOrId);
  }
  async obterLeiloesPorLeiloeiroSlug(auctioneerSlug) {
    const auctions = await this.auctionRepository.findByAuctioneerSlug(auctioneerSlug);
    return this.mapAuctionsWithDetails(auctions);
  }
  async criarLeiloeiro(data) {
    try {
      const dataToCreate = {
        ...data,
        slug: slugify(data.name),
        publicId: `LEILOE-${uuidv44()}`
      };
      const newAuctioneer = await this.auctioneerRepository.create(dataToCreate);
      return { success: true, message: "Leiloeiro criado com sucesso.", auctioneerId: newAuctioneer.id };
    } catch (error) {
      console.error("Error in AuctioneerService.createAuctioneer:", error);
      if (error.code === "P2002" && error.meta?.target?.includes("name")) {
        return { success: false, message: "J\xE1 existe um leiloeiro com este nome." };
      }
      return { success: false, message: `Falha ao criar leiloeiro: ${error.message}` };
    }
  }
  async atualizarLeiloeiro(id, data) {
    try {
      const dataWithSlug = data.name ? { ...data, slug: slugify(data.name) } : data;
      await this.auctioneerRepository.update(id, dataWithSlug);
      return { success: true, message: "Leiloeiro atualizado com sucesso." };
    } catch (error) {
      console.error(`Error in AuctioneerService.updateAuctioneer for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar leiloeiro: ${error.message}` };
    }
  }
  async excluirLeiloeiro(id) {
    try {
      const linkedAuctions = await this.auctionRepository.findByAuctioneerSlug(id);
      if (linkedAuctions.length > 0) {
        return { success: false, message: `N\xE3o \xE9 poss\xEDvel excluir. O leiloeiro est\xE1 vinculado a ${linkedAuctions.length} leil\xE3o(\xF5es).` };
      }
      await this.auctioneerRepository.delete(id);
      return { success: true, message: "Leiloeiro exclu\xEDdo com sucesso." };
    } catch (error) {
      console.error(`Error in AuctioneerService.deleteAuctioneer for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir leiloeiro: ${error.message}` };
    }
  }
  async obterDadosDashboardLeiloeiro(auctioneerId) {
    const [auctioneerData, platformSettings] = await Promise.all([
      prisma.auctioneer.findUnique({
        where: { id: auctioneerId },
        include: {
          _count: {
            select: { auctions: true }
          },
          auctions: {
            include: {
              lots: {
                where: { status: "VENDIDO" },
                select: { price: true, updatedAt: true }
              },
              _count: {
                select: { lots: true }
              }
            }
          }
        }
      }),
      Promise.resolve({})
    ]);
    if (!auctioneerData) return null;
    const allLotsFromAuctions = auctioneerData.auctions.flatMap((auc) => auc.lots);
    const totalLots = auctioneerData.auctions.reduce((sum, auc) => sum + auc._count.lots, 0);
    const totalRevenue = allLotsFromAuctions.reduce((acc, lot) => acc + (lot.price || 0), 0);
    const lotsSoldCount = allLotsFromAuctions.length;
    const averageTicket = lotsSoldCount > 0 ? totalRevenue / lotsSoldCount : 0;
    const salesRate = totalLots > 0 ? lotsSoldCount / totalLots * 100 : 0;
    const salesByMonthMap = /* @__PURE__ */ new Map();
    const now = /* @__PURE__ */ new Date();
    for (let i = 11; i >= 0; i--) {
      const date = subMonths2(now, i);
      const monthKey = format2(date, "MMM/yy", { locale: ptBR2 });
      salesByMonthMap.set(monthKey, 0);
    }
    allLotsFromAuctions.forEach((lot) => {
      if (lot.updatedAt) {
        const monthKey = format2(new Date(lot.updatedAt), "MMM/yy", { locale: ptBR2 });
        if (salesByMonthMap.has(monthKey)) {
          salesByMonthMap.set(monthKey, (salesByMonthMap.get(monthKey) || 0) + (lot.price || 0));
        }
      }
    });
    const salesByMonth = Array.from(salesByMonthMap, ([name, Faturamento]) => ({ name, Faturamento }));
    return {
      totalRevenue,
      totalAuctions: auctioneerData._count.auctions,
      totalLots,
      lotsSoldCount,
      salesRate,
      averageTicket,
      salesByMonth
    };
  }
  async obterPerformanceLeiloeiros() {
    const auctioneers = await this.auctioneerRepository.findAll();
    const performanceData = await Promise.all(
      auctioneers.map(async (auctioneer) => {
        const dashboardData = await this.obterDadosDashboardLeiloeiro(auctioneer.id);
        return {
          id: auctioneer.id,
          name: auctioneer.name,
          totalAuctions: dashboardData?.totalAuctions || 0,
          totalLots: dashboardData?.totalLots || 0,
          lotsSoldCount: dashboardData?.lotsSoldCount || 0,
          totalRevenue: dashboardData?.totalRevenue || 0,
          averageTicket: dashboardData?.averageTicket || 0,
          salesRate: dashboardData?.salesRate || 0
        };
      })
    );
    return performanceData.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }
};

// src/repositories/habilitation.repository.ts
var HabilitationRepository = class {
  async findHabilitationRequests() {
    return prisma.user.findMany({
      where: {
        habilitationStatus: { in: ["PENDING_ANALYSIS", "REJECTED_DOCUMENTS", "PENDING_DOCUMENTS"] }
      },
      orderBy: { updatedAt: "desc" }
    });
  }
  async createOrUpdateAuctionHabilitation(userId, auctionId) {
    return prisma.auctionHabilitation.upsert({
      where: { userId_auctionId: { userId, auctionId } },
      update: {},
      create: { userId, auctionId }
    });
  }
  async checkAuctionHabilitation(userId, auctionId) {
    const habilitation = await prisma.auctionHabilitation.findUnique({
      where: {
        userId_auctionId: {
          userId,
          auctionId
        }
      }
    });
    return !!habilitation;
  }
  async findUserDocuments(userId) {
    return prisma.userDocument.findMany({
      where: { userId },
      include: { documentType: true }
    });
  }
  async findDocumentById(id) {
    return prisma.userDocument.findUnique({ where: { id } });
  }
  async updateDocumentStatus(id, status, rejectionReason) {
    return prisma.userDocument.update({
      where: { id },
      data: { status, rejectionReason }
    });
  }
  async createOrUpdateUserDocument(userId, documentTypeId, fileUrl, fileName) {
    return prisma.userDocument.upsert({
      where: {
        userId_documentTypeId: {
          userId,
          documentTypeId
        }
      },
      update: {
        fileUrl,
        fileName,
        status: "PENDING_ANALYSIS",
        rejectionReason: null
      },
      create: {
        userId,
        documentTypeId,
        fileUrl,
        fileName,
        status: "PENDING_ANALYSIS"
      }
    });
  }
};

// src/services/habilitation.service.ts
import { revalidatePath } from "next/cache";
var HabilitationService = class {
  repository;
  constructor() {
    this.repository = new HabilitationRepository();
  }
  async getHabilitationRequests() {
    const users = await this.repository.findHabilitationRequests();
    return users;
  }
  async habilitateForAuction(userId, auctionId) {
    try {
      await this.repository.createOrUpdateAuctionHabilitation(userId, auctionId);
      if (process.env.NODE_ENV !== "test") {
        revalidatePath(`/auctions/${auctionId}`);
      }
      return { success: true, message: "Voc\xEA foi habilitado para este leil\xE3o com sucesso!" };
    } catch (e) {
      console.error(`Failed to habilitate user ${userId} for auction ${auctionId}:`, e);
      return { success: false, message: `N\xE3o foi poss\xEDvel completar sua habilita\xE7\xE3o para este leil\xE3o. ${e.message}` };
    }
  }
  async isUserHabilitatedForAuction(userId, auctionId) {
    if (!userId || !auctionId) return false;
    return this.repository.checkAuctionHabilitation(userId, auctionId);
  }
  async getUserDocuments(userId) {
    return this.repository.findUserDocuments(userId);
  }
  async saveUserDocument(userId, documentTypeId, fileUrl, fileName) {
    if (!userId || !documentTypeId || !fileUrl) {
      return { success: false, message: "Dados insuficientes para salvar o documento." };
    }
    try {
      await this.repository.createOrUpdateUserDocument(userId, documentTypeId, fileUrl, fileName);
      if (process.env.NODE_ENV !== "test") {
        revalidatePath("/dashboard/documents");
        revalidatePath(`/admin/habilitations/${userId}`);
      }
      return { success: true, message: "Documento salvo com sucesso." };
    } catch (error) {
      console.error("Error saving user document:", error);
      return { success: false, message: `Falha ao salvar documento: ${error.message}` };
    }
  }
  async approveDocument(documentId, analystId) {
    try {
      const docToUpdate = await this.repository.findDocumentById(documentId);
      if (!docToUpdate) {
        throw new Error("Documento n\xE3o encontrado.");
      }
      await this.repository.updateDocumentStatus(documentId, "APPROVED", null);
      if (process.env.NODE_ENV !== "test") {
        revalidatePath("/admin/habilitations");
        revalidatePath(`/admin/habilitations/${docToUpdate.userId}`);
      }
      return { success: true, message: "Documento aprovado." };
    } catch (e) {
      console.error(`Error approving document ${documentId}:`, e);
      return { success: false, message: `Falha ao aprovar documento: ${e.message}` };
    }
  }
  async rejectDocument(documentId, reason) {
    if (!reason) {
      return { success: false, message: "O motivo da rejei\xE7\xE3o \xE9 obrigat\xF3rio." };
    }
    try {
      const docToUpdate = await this.repository.findDocumentById(documentId);
      if (!docToUpdate) {
        throw new Error("Documento n\xE3o encontrado.");
      }
      await this.repository.updateDocumentStatus(documentId, "REJECTED", reason);
      if (process.env.NODE_ENV !== "test") {
        revalidatePath("/admin/habilitations");
        revalidatePath(`/admin/habilitations/${docToUpdate.userId}`);
      }
      return { success: true, message: "Documento rejeitado." };
    } catch (e) {
      return { success: false, message: "Falha ao rejeitar documento." };
    }
  }
};

// src/services/bid.service.ts
import { revalidatePath as revalidatePath2 } from "next/cache";
var BidService = class {
  repository;
  lotService;
  habilitationService;
  constructor() {
    this.repository = new BidRepository();
    this.lotService = new LotService();
    this.habilitationService = new HabilitationService();
  }
  async placeBid(lotIdOrPublicId, auctionIdOrPublicId, userId, userDisplayName, bidAmount) {
    try {
      const lot = await this.lotService.getLotById(lotIdOrPublicId);
      if (!lot) return { success: false, message: "Lote n\xE3o encontrado." };
      const isHabilitado = await this.habilitationService.isUserHabilitatedForAuction(userId, lot.auctionId);
      if (!isHabilitado) {
        return { success: false, message: "Voc\xEA n\xE3o est\xE1 habilitado para dar lances neste leil\xE3o." };
      }
      if (lot.status !== "ABERTO_PARA_LANCES") return { success: false, message: "Este lote n\xE3o est\xE1 aberto para lances." };
      const bidIncrement = lot.bidIncrementStep || 1;
      const nextMinimumBid = lot.price + bidIncrement;
      if (bidAmount < nextMinimumBid) {
        return { success: false, message: `O lance deve ser de no m\xEDnimo R$ ${nextMinimumBid.toLocaleString("pt-BR")}.` };
      }
      const previousHighBid = await this.repository.findHighestBid(lot.id);
      const newBid = await this.repository.createBid({
        lot: { connect: { id: lot.id } },
        auction: { connect: { id: lot.auctionId } },
        bidder: { connect: { id: userId } },
        bidderDisplay: userDisplayName,
        amount: bidAmount
      });
      await this.lotService.updateLot(lot.id, {
        price: bidAmount,
        bidsCount: (lot.bidsCount || 0) + 1
      });
      if (process.env.NODE_ENV !== "test") {
        revalidatePath2(`/auctions/${auctionIdOrPublicId}/lots/${lotIdOrPublicId}`);
        revalidatePath2(`/auctions/${auctionIdOrPublicId}/live`);
        revalidatePath2(`/live-dashboard`);
      }
      const updatedLot = await this.lotService.getLotById(lotIdOrPublicId);
      return { success: true, message: "Lance realizado com sucesso!", updatedLot, newBid };
    } catch (error) {
      console.error("Error in BidService.placeBid:", error);
      return { success: false, message: `Ocorreu um erro ao registrar seu lance: ${error.message}` };
    }
  }
  async placeMaxBid(lotId, userId, maxAmount) {
    try {
      const lot = await this.lotService.getLotById(lotId);
      if (!lot) return { success: false, message: "Lote n\xE3o encontrado." };
      await this.repository.upsertMaxBid({
        userId,
        lotId: lot.id,
        maxAmount,
        isActive: true
      });
      if (process.env.NODE_ENV !== "test") {
        revalidatePath2(`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`);
      }
      return { success: true, message: "Lance m\xE1ximo definido com sucesso!" };
    } catch (error) {
      console.error("Error setting max bid:", error);
      return { success: false, message: "Falha ao definir lance m\xE1ximo." };
    }
  }
  async getActiveUserLotMaxBid(lotIdOrPublicId, userId) {
    if (!userId) return null;
    const lot = await this.lotService.getLotById(lotIdOrPublicId);
    if (!lot) return null;
    try {
      return this.repository.findActiveMaxBid(userId, lot.id);
    } catch (error) {
      console.error("Error fetching active max bid:", error);
      return null;
    }
  }
  async getBidsForLot(lotIdOrPublicId) {
    const lot = await this.lotService.getLotById(lotIdOrPublicId);
    if (!lot) return [];
    try {
      return this.repository.findBidsByLotId(lot.id);
    } catch (error) {
      console.error("Error fetching bids:", error);
      return [];
    }
  }
  async getBidsForUser(userId) {
    if (!userId) {
      console.warn("[BidService - getBidsForUser] No userId provided.");
      return [];
    }
    const userBidsRaw = await this.repository.findBidsByUserId(userId);
    return userBidsRaw.map((bid) => {
      let bidStatus = "PERDENDO";
      if (bid.lot.status === "ABERTO_PARA_LANCES") {
        if (bid.amount === bid.lot.price) {
          bidStatus = "GANHANDO";
        } else {
          bidStatus = "PERDENDO";
        }
      } else if (bid.lot.status === "VENDIDO") {
        if (bid.lot.winnerId === userId) {
          bidStatus = "ARREMATADO";
        } else {
          bidStatus = "NAO_ARREMATADO";
        }
      } else if (bid.lot.status === "ENCERRADO" || bid.lot.status === "NAO_VENDIDO") {
        bidStatus = "ENCERRADO";
      } else if (bid.lot.status === "CANCELADO") {
        bidStatus = "CANCELADO";
      }
      return {
        id: bid.id,
        user: {},
        // User data is not needed here
        amount: bid.amount,
        date: bid.timestamp,
        // @ts-ignore
        lot: { ...bid.lot, auctionName: bid.lot.auction.title },
        bidStatus,
        userBidAmount: bid.amount
      };
    });
  }
};

// src/repositories/contact-message.repository.ts
var ContactMessageRepository = class {
  async findAll() {
    return prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
  }
  async create(data) {
    return prisma.contactMessage.create({ data });
  }
  async update(id, data) {
    return prisma.contactMessage.update({ where: { id }, data });
  }
  async delete(id) {
    await prisma.contactMessage.delete({ where: { id } });
  }
};

// src/services/contact-message.service.ts
var ContactMessageService = class {
  repository;
  constructor() {
    this.repository = new ContactMessageRepository();
  }
  async getContactMessages() {
    return this.repository.findAll();
  }
  async saveMessage(data) {
    try {
      await this.repository.create(data);
      return { success: true, message: "Mensagem salva com sucesso." };
    } catch (error) {
      console.error("Error in ContactMessageService.saveMessage:", error);
      return { success: false, message: `Falha ao salvar mensagem: ${error.message}` };
    }
  }
  async toggleReadStatus(id, isRead) {
    try {
      await this.repository.update(id, { isRead });
      return { success: true, message: `Status da mensagem atualizado.` };
    } catch (error) {
      return { success: false, message: "Falha ao atualizar status da mensagem." };
    }
  }
  async deleteMessage(id) {
    try {
      await this.repository.delete(id);
      return { success: true, message: "Mensagem exclu\xEDda." };
    } catch (error) {
      return { success: false, message: "Falha ao excluir mensagem." };
    }
  }
};

// src/repositories/document-template.repository.ts
var DocumentTemplateRepository = class {
  async findAll() {
    return prisma.documentTemplate.findMany({ orderBy: { name: "asc" } });
  }
  async findById(id) {
    return prisma.documentTemplate.findUnique({ where: { id } });
  }
  async create(data) {
    return prisma.documentTemplate.create({ data });
  }
  async update(id, data) {
    return prisma.documentTemplate.update({ where: { id }, data });
  }
  async delete(id) {
    await prisma.documentTemplate.delete({ where: { id } });
  }
};

// src/services/document-template.service.ts
var DocumentTemplateService = class {
  repository;
  constructor() {
    this.repository = new DocumentTemplateRepository();
  }
  async getDocumentTemplates() {
    return this.repository.findAll();
  }
  async getDocumentTemplateById(id) {
    return this.repository.findById(id);
  }
  async createDocumentTemplate(data) {
    try {
      const newTemplate = await this.repository.create(data);
      return { success: true, message: "Template criado com sucesso.", templateId: newTemplate.id };
    } catch (error) {
      console.error("Error in DocumentTemplateService.create:", error);
      return { success: false, message: `Falha ao criar template: ${error.message}` };
    }
  }
  async updateDocumentTemplate(id, data) {
    try {
      await this.repository.update(id, data);
      return { success: true, message: "Template atualizado com sucesso." };
    } catch (error) {
      console.error(`Error in DocumentTemplateService.update for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar template: ${error.message}` };
    }
  }
  async deleteDocumentTemplate(id) {
    try {
      await this.repository.delete(id);
      return { success: true, message: "Template exclu\xEDdo com sucesso." };
    } catch (error) {
      console.error(`Error in DocumentTemplateService.delete for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir template: ${error.message}` };
    }
  }
};

// src/repositories/document-type.repository.ts
var DocumentTypeRepository = class {
  async findAll() {
    return prisma.documentType.findMany({ orderBy: { name: "asc" } });
  }
};

// src/services/document-type.service.ts
var DocumentTypeService = class {
  repository;
  constructor() {
    this.repository = new DocumentTypeRepository();
  }
  async getDocumentTypes() {
    return this.repository.findAll();
  }
};
export {
  AuctionSchema,
  AuctionService,
  AuctioneerProfileInfoSchema,
  AuctioneerService,
  BidService,
  ContactMessageService,
  DocumentTemplateService,
  DocumentTypeService,
  HabilitationService,
  LotSchema,
  LotService,
  SellerProfileInfoSchema,
  SellerService,
  UserProfileDataSchema,
  UserWinService,
  accountTypeValues,
  auctionMethodValues,
  auctionParticipationValues,
  auctionStatusValues,
  auctionTypeValues,
  checkoutFormSchema,
  lotStatusValues,
  paymentStatusValues,
  slugify,
  userHabilitationStatusValues
};

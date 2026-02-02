
// src/types/index.ts
import type { 
    User as PmUser, 
    Role as PmRole, 
    UsersOnRoles,
    UsersOnTenants,
    Tenant as PmTenant,
    Auction as PmAuction, 
    AuctionStage as PmAuctionStage,
    Lot as PmLot, 
    LotCategory as PmLotCategory, 
    Subcategory as PmSubcategory,
    Seller as PmSeller, 
    Auctioneer as PmAuctioneer,
    Asset as PmAsset,
    Bid as PmBid,
    UserWin as PmUserWin,
    Review as PmReview,
    LotQuestion as PmLotQuestion,
    UserDocument as PmUserDocument,
    DocumentType as PmDocumentType,
    DirectSaleOffer as PmDirectSaleOffer,
    PlatformSettings as PmPlatformSettings,
    ThemeSettings as PmThemeSettings,
    ThemeColors as PmThemeColors,
    IdMasks as PmIdMasks,
    VariableIncrementRule as PmVariableIncrementRule,
    MapSettings as PmMapSettings,
    BiddingSettings as PmBiddingSettings,
    PaymentGatewaySettings as PmPaymentGatewaySettings,
    NotificationSettings as PmNotificationSettings,
    MentalTriggerSettings as PmMentalTriggerSettings,
    SectionBadgeVisibility as PmSectionBadgeVisibility,
    RealtimeSettings as PmRealtimeSettings,
    UserLotMaxBid as PmUserLotMaxBid,
    JudicialProcess as PmJudicialProcess,
    Court as PmCourt,
    JudicialDistrict as PmJudicialDistrict,
    JudicialBranch as PmJudicialBranch,
    JudicialParty as PmJudicialParty,
    State as PmState,
    City as PmCity,
    MediaItem as PmMediaItem,
    DataSource as PmDataSource,
    Report as PmReport,
    ContactMessage as PmContactMessage,
    VehicleMake as PmVehicleMake,
    VehicleModel as PmVehicleModel,
    AuctionHabilitation,
    InstallmentPayment,
    LotStagePrice,
} from '@prisma/client';
import type { ThemeTokens } from '@/lib/theme-tokens';
import { Decimal } from '@prisma/client/runtime/library';

// Regra: IDs expostos para o frontend (em tipos, services, actions) devem ser strings.
// A conversão de BigInt para string deve ocorrer na camada de serviço/repositório.

export type Role = Omit<PmRole, 'id'> & { id: string };
export type Tenant = Omit<PmTenant, 'id'> & { id: string };
export type User = Omit<PmUser, 'id'> & { 
    id: string;
    roles?: (Omit<UsersOnRoles, 'userId' | 'roleId'> & { role: Role })[];
    tenants?: (Omit<UsersOnTenants, 'userId' | 'tenantId'> & { tenant: Tenant })[];
};
export type LotCategory = Omit<PmLotCategory, 'id'> & { id: string; itemCount?: number; _count?: { lots: number, subcategories: number } };
export type Subcategory = Omit<PmSubcategory, 'id' | 'parentCategoryId'> & { id: string; parentCategoryId: string; parentCategoryName?: string; itemCount?: number };
export type AuctioneerProfileInfo = Omit<PmAuctioneer, 'id' | 'userId' | 'tenantId'> & { id: string; userId?: string | null; tenantId: string; auctionsConductedCount?: number; memberSince?: Date; rating?: number };
export type SellerProfileInfo = Omit<PmSeller, 'id' | 'userId' | 'judicialBranchId' | 'tenantId'> & { id: string; userId?: string | null; judicialBranchId?: string | null; tenantId: string; activeLotsCount?: number; memberSince?: Date; auctionsFacilitatedCount?: number; rating?: number };

export type Asset = Omit<PmAsset, 'id' | 'categoryId' | 'subcategoryId' | 'judicialProcessId' | 'sellerId' | 'tenantId' | 'evaluationValue' | 'latitude' | 'longitude' | 'totalArea' | 'builtArea' | 'year' | 'modelYear' | 'mileage' | 'numberOfDoors' | 'pieceCount' | 'bedrooms' | 'suites' | 'bathrooms' | 'parkingSpaces' | 'hoursUsed' | 'imageMediaId'> & { 
  id: string;
  categoryId?: string | null;
  subcategoryId?: string | null;
  judicialProcessId?: string | null;
  sellerId?: string | null;
  tenantId: string;
  imageMediaId?: string | null;
  categoryName?: string;
  subcategoryName?: string | null;
  judicialProcessNumber?: string | null;
  sellerName?: string | null;
  evaluationValue?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  totalArea?: number | null;
  builtArea?: number | null;
  year?: number | null;
  modelYear?: number | null;
  mileage?: number | null;
  numberOfDoors?: number | null;
  pieceCount?: number | null;
  bedrooms?: number | null;
  suites?: number | null;
  bathrooms?: number | null;
  parkingSpaces?: number | null;
  hoursUsed?: number | null;
  occupationStatus?: OccupationStatus | null;
  occupationNotes?: string | null;
  occupationLastVerified?: Date | string | null;
  occupationUpdatedBy?: string | null;
  lotInfo?: string | null;
  lots?: any[];
};

export type Auction = Omit<PmAuction, 'id' | 'auctioneerId' | 'sellerId' | 'cityId' | 'stateId' | 'judicialProcessId' | 'tenantId' | 'categoryId' | 'originalAuctionId' | 'latitude' | 'longitude' | 'initialOffer' | 'estimatedRevenue' | 'achievedRevenue' | 'decrementAmount' | 'floorPrice'> & {
  id: string;
  auctioneerId?: string | null;
  sellerId?: string | null;
  cityId?: string | null;
  stateId?: string | null;
  judicialProcessId?: string | null;
  tenantId: string;
  categoryId?: string | null;
  originalAuctionId?: string | null;
  lots?: Lot[];
  totalLots?: number;
  seller?: SellerProfileInfo;
  auctioneer?: AuctioneerProfileInfo;
  category?: PmLotCategory;
  auctionStages?: AuctionStage[];
  sellerName?: string | null;
  auctioneerName?: string | null;
  categoryName?: string;
  latitude?: number | null;
  longitude?: number | null;
  initialOffer?: number;
  estimatedRevenue?: number;
  achievedRevenue?: number;
  decrementAmount?: number | null;
  floorPrice?: number | null;
  totalHabilitatedUsers?: number;
  isFeaturedOnMarketplace?: boolean;
  additionalTriggers?: string[];
  dataAiHint?: string;
};

export type Lot = Omit<PmLot, 'id' | 'auctionId' | 'categoryId' | 'subcategoryId' | 'sellerId' | 'auctioneerId' | 'cityId' | 'stateId' | 'winnerId' | 'originalLotId' | 'inheritedMediaFromAssetId' | 'tenantId' | 'price' | 'initialPrice' | 'secondInitialPrice' | 'bidIncrementStep' | 'evaluationValue' | 'latitude' | 'longitude'> & {
  id: string;
  auctionId: string;
  categoryId?: string | null;
  subcategoryId?: string | null;
  sellerId?: string | null;
  auctioneerId?: string | null;
  cityId?: string | null;
  stateId?: string | null;
  winnerId?: string | null;
  originalLotId?: string | null;
  inheritedMediaFromAssetId?: string | null;
  tenantId: string;
  auction?: Auction;
  auctionName?: string | null;
  categoryName?: string;
  subcategoryName?: string | null;
  sellerName?: string | null;
  evaluationValue?: number | null;
  price: number;
  initialPrice: number | null;
  secondInitialPrice?: number | null;
  bidIncrementStep: number | null;
  latitude?: number | null;
  longitude?: number | null;
  lotPrices?: LotStagePrice[];
  stageDetails?: LotStageDetails[];
  totalArea?: number | null;
  occupancyStatus?: string | null;
  type?: string | null;
  assets?: Asset[];
  judicialProcesses?: JudicialProcess[];
  lotRisks?: LotRisk[];
  propertyMatricula?: string | null;
  propertyRegistrationNumber?: string | null;
  actionType?: JudicialActionType | null;
  actionDescription?: string | null;
  actionCnjCode?: string | null;
  galleryImageUrls?: string[];
  documents?: LotDocument[];
  requiresDepositGuarantee?: boolean | null;
  depositGuaranteeAmount?: Decimal | null;
  depositGuaranteeInfo?: string | null;
};

export type Review = Omit<PmReview, 'id' | 'lotId' | 'auctionId' | 'userId'> & { 
  id: string; 
  lotId: string; 
  auctionId: string; 
  userId: string; 
};

export type UserWin = Omit<PmUserWin, 'id' | 'lotId' | 'userId' | 'tenantId' | 'value'> & {
  id: string;
  lotId: string;
  userId: string;
  tenantId: string;
  value: number;
  lot?: Lot;
  user?: User;
};

export type BidInfo = Omit<PmBid, 'id' | 'lotId' | 'auctionId' | 'bidderId' | 'tenantId' | 'amount'> & { 
  id: string; 
  lotId: string; 
  auctionId: string; 
  bidderId: string; 
  tenantId: string; 
  amount: number; 
};

export type LotQuestion = Omit<PmLotQuestion, 'id' | 'lotId' | 'auctionId' | 'userId' | 'answeredByUserId'> & { id: string; lotId: string; auctionId: string; userId: string; answeredByUserId?: string | null };
export type LotDocument = {
  id: string;
  lotId: string;
  fileName: string;
  title: string;
  description?: string | null;
  fileUrl: string;
  fileSize?: bigint | null;
  mimeType?: string | null;
  displayOrder: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
};
export type UserDocument = Omit<PmUserDocument, 'id' | 'userId' | 'documentTypeId'> & { id: string; userId: string; documentTypeId: string; documentType: DocumentType };
export type DocumentType = Omit<PmDocumentType, 'id'> & { id: string };
export type DocumentTemplate = {
  id: string;
  name: string;
  description?: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};
export type DocumentTemplateFormData = Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>;
export type DirectSaleOffer = Omit<PmDirectSaleOffer, 'id' | 'tenantId' | 'sellerId' | 'categoryId' | 'price' | 'minimumOfferPrice'> & {
    id: string;
    tenantId: string;
    sellerId: string;
    categoryId: string;
    price?: number | null;
    minimumOfferPrice?: number | null;
    galleryImageUrls?: string[] | null;
    category?: string;
};
export type DirectSaleOfferFormData = Omit<DirectSaleOffer, 'id' | 'publicId' | 'slug' | 'createdAt' | 'updatedAt' | 'category' | 'tenantId'> & {
  tenantId?: string | null;
};
export type UserLotMaxBid = Omit<PmUserLotMaxBid, 'id' | 'userId' | 'lotId' | 'maxAmount'> & { id: string; userId: string; lotId: string; maxAmount: number; };
export type JudicialProcess = Omit<PmJudicialProcess, 'id' | 'tenantId' | 'courtId' | 'districtId' | 'branchId' | 'sellerId'> & { 
  id: string; 
  tenantId: string; 
  courtId?: string | null; 
  districtId?: string | null; 
  branchId?: string | null; 
  sellerId?: string | null; 
  parties: ProcessParty[];
  courtName?: string; 
  districtName?: string; 
  branchName?: string; 
  sellerName?: string; 
  lotCount?: number; 
  assetCount?: number;
  propertyMatricula?: string | null;
  propertyRegistrationNumber?: string | null;
  actionType?: JudicialActionType | null;
  actionDescription?: string | null;
  actionCnjCode?: string | null;
  auctions?: any[];
  lots?: any[];
  assets?: any[];
};
export type Court = Omit<PmCourt, 'id'> & { id: string };
export type JudicialDistrict = Omit<PmJudicialDistrict, 'id' | 'courtId' | 'stateId'> & { id: string; courtId?: string | null; stateId?: string | null; courtName?: string; stateUf?: string };
export type JudicialBranch = Omit<PmJudicialBranch, 'id' | 'districtId'> & { id: string; districtId?: string | null; districtName?: string; stateUf?: string };
export type ProcessParty = Omit<PmJudicialParty, 'id' | 'processId'> & { id: string; processId: string };
export type StateInfo = Omit<PmState, 'id'> & { id: string; cityCount?: number };
export type CityInfo = Omit<PmCity, 'id' | 'stateId' | 'latitude' | 'longitude'> & { 
    id: string;
    stateId: string;
    stateUf?: string,
    latitude?: number | null,
    longitude?: number | null,
};
export type MediaItem = Omit<PmMediaItem, 'id' | 'uploadedByUserId' | 'judicialProcessId'> & { id: string; uploadedByUserId?: string | null; judicialProcessId?: string | null; };
export type DataSource = PmDataSource;
export type Report = Omit<PmReport, 'id' | 'tenantId' | 'createdById'> & { id: string; tenantId: string; createdById: string };
export type ContactMessage = Omit<PmContactMessage, 'id'> & { id: string };
export type VehicleMake = Omit<PmVehicleMake, 'id'> & { id: string };
export type VehicleModel = Omit<PmVehicleModel, 'id' | 'makeId'> & { id: string; makeId: string; makeName?: string };

export type OccupationStatus = 'OCCUPIED' | 'UNOCCUPIED' | 'UNCERTAIN' | 'SHARED_POSSESSION';
export type JudicialActionType = 'USUCAPIAO' | 'REMOCAO' | 'HIPOTECA' | 'DESPEJO' | 'PENHORA' | 'COBRANCA' | 'INVENTARIO' | 'DIVORCIO' | 'OUTROS';
export type LotRiskType = 'OCUPACAO_IRREGULAR' | 'PENHORA' | 'INSCRICAO_DIVIDA' | 'RESTRICAO_AMBIENTAL' | 'DOENCA_ACARAJADO' | 'OUTRO';
export type LotRiskLevel = 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
export type LotRisk = {
  id: string;
  lotId: string;
  tenantId: string;
  riskType: LotRiskType;
  riskLevel: LotRiskLevel;
  riskDescription: string;
  mitigationStrategy?: string | null;
  verified: boolean;
  verifiedBy?: string | null;
  verifiedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};


export type UserCreationData = Omit<UserFormData, 'passwordConfirmation' | 'termsAccepted'> & { roleIds: string[], tenantId?: string | null, habilitationStatus?: UserHabilitationStatus };
export type EditableUserProfileData = Partial<Omit<User, 'id' | 'email' | 'password' | 'createdAt' | 'updatedAt'>>;
export type UserHabilitationStatus = 'PENDING_DOCUMENTS' | 'PENDING_ANALYSIS' | 'HABILITADO' | 'REJECTED_DOCUMENTS' | 'BLOCKED';
export type PaymentStatus = 'PENDENTE' | 'PROCESSANDO' | 'PAGO' | 'FALHOU' | 'REEMBOLSADO' | 'CANCELADO' | 'ATRASADO';
export type AccountType = 'PHYSICAL' | 'LEGAL' | 'DIRECT_SALE_CONSIGNOR';
export type UserDocumentStatus = 'NOT_SENT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PENDING_ANALYSIS';
export type LawyerDocumentStatus = 'NOT_SENT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PENDING_ANALYSIS';
export type AuctionStatus = 'RASCUNHO' | 'EM_PREPARACAO' | 'EM_BREVE' | 'ABERTO' | 'ABERTO_PARA_LANCES' | 'ENCERRADO' | 'FINALIZADO' | 'CANCELADO' | 'SUSPENSO';
export type LotStatus = 'RASCUNHO' | 'EM_BREVE' | 'ABERTO_PARA_LANCES' | 'ENCERRADO' | 'VENDIDO' | 'NAO_VENDIDO' | 'RELISTADO' | 'CANCELADO' | 'RETIRADO';
export type AssetStatus = 'CADASTRO' | 'DISPONIVEL' | 'LOTEADO' | 'VENDIDO' | 'REMOVIDO' | 'INATIVADO';
export type DirectSaleOfferStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'SOLD' | 'EXPIRED' | 'RASCUNHO';
export type DirectSaleOfferType = 'BUY_NOW' | 'ACCEPTS_PROPOSALS';
export type AuctionType = 'JUDICIAL' | 'EXTRAJUDICIAL' | 'PARTICULAR' | 'TOMADA_DE_PRECOS' | 'VENDA_DIRETA';
export type AuctionMethod = 'STANDARD' | 'DUTCH' | 'SILENT';
export type AuctionParticipation = 'ONLINE' | 'PRESENCIAL' | 'HIBRIDO';

export type UserProfileWithPermissions = User & {
    roles: (Omit<UsersOnRoles, 'userId' | 'roleId'> & { role: Role })[];
    tenants: (Omit<UsersOnTenants, 'userId' | 'tenantId'> & { tenant: Tenant })[];
    roleIds?: string[];
    roleNames?: string[];
    permissions: string[];
    roleName?: string;
    sellerId?: string | null;
    auctioneerId?: string | null;
};

export type ThemeSettings = Omit<PmThemeSettings, 'id' | 'platformSettingsId'> & { id: string };
export type IdMasks = Omit<PmIdMasks, 'id' | 'platformSettingsId'> & { id: string };
export type ThemeColors = Omit<PmThemeColors, 'id' | 'themeSettingsId'> & { id: string };
export type NotificationSettings = Omit<PmNotificationSettings, 'id' | 'platformSettingsId'> & { id: string };
export type PlatformSettings = Omit<PmPlatformSettings, 'id' | 'tenantId' | 'crudFormMode' | 'logoMediaId'> & {
  id: string;
  tenantId: string;
  crudFormMode?: 'modal' | 'sheet';
  logoMediaId?: string | null;
  logoMedia?: MediaItem | null;
  themeColorsLight?: ThemeTokens | null;
  themeColorsDark?: ThemeTokens | null;
  themes?: ThemeSettings[] | null;
  platformPublicIdMasks?: IdMasks | null;
  mapSettings?: PmMapSettings | null;
  biddingSettings?: PmBiddingSettings | null;
  paymentGatewaySettings?: PmPaymentGatewaySettings | null;
  notificationSettings?: NotificationSettings | null;
  mentalTriggerSettings?: PmMentalTriggerSettings | null;
  sectionBadgeVisibility?: PmSectionBadgeVisibility | null;
  variableIncrementTable?: PmVariableIncrementRule[];
  realtimeSettings?: RealtimeSettings | null;
};
export type VariableIncrementRule = Omit<PmVariableIncrementRule, 'id' | 'platformSettingsId'> & { id: string };
export type MapSettings = Omit<PmMapSettings, 'id' | 'platformSettingsId'> & { id: string };
export type BiddingSettings = Omit<PmBiddingSettings, 'id' | 'platformSettingsId'> & { id: string };
export type PaymentGatewaySettings = Omit<PmPaymentGatewaySettings, 'id' | 'platformSettingsId'> & { id: string };
export type MentalTriggerSettings = Omit<PmMentalTriggerSettings, 'id' | 'platformSettingsId'> & { id: string };
export type SectionBadgeVisibility = Omit<PmSectionBadgeVisibility, 'id' | 'platformSettingsId'> & { id: string };
export type RealtimeSettings = Omit<PmRealtimeSettings, 'id' | 'platformSettingsId' | 'lawyerRevenueSharePercent'> & { 
  id: string;
  lawyerRevenueSharePercent?: number | null;
};
export type BadgeVisibilitySettings = { [key: string]: boolean | undefined; };

export interface RecentlyViewedLotInfo {
  id: string;
  title: string;
  imageUrl?: string | null;
  auctionId: string;
  publicId?: string | null;
  dataAiHint?: string | null;
}

export type ProcessPartyType = 'AUTOR' | 'REU' | 'ADVOGADO_AUTOR' | 'ADVOGADO_REU' | 'JUIZ' | 'ESCRIVAO' | 'PERITO' | 'ADMINISTRADOR_JUDICIAL' | 'TERCEIRO_INTERESSADO' | 'OUTRO';

export interface CnjHit {
    _index: string;
    _id: string;
    _score: number | null;
    _source: CnjProcessSource;
    sort?: (string | number)[];
}
export interface CnjSearchResponse {
    took: number;
    timed_out: boolean;
    _shards: {
        total: number;
        successful: number;
        skipped: number;
        failed: number;
    };
    hits: {
        total: {
            value: number;
            relation: string;
        };
        max_score: number | null;
        hits: CnjHit[];
    };
}
export interface CnjProcessSource {
    numeroProcesso: string;
    classe: {
        codigo: number;
        nome: string;
    };
    sistema: {
        codigo: number;
        nome: string;
    };
    formato: {
        codigo: number;
        nome: string;
    };
    tribunal: string;
    dataAjuizamento: string;
    orgaoJulgador: {
        codigo: number;
        nome: string;
    };
    assuntos?: any[]; // A estrutura detalhada pode ser adicionada se necessário
}
export type AuctionStage = Omit<PmAuctionStage, 'id' | 'auctionId' | 'discountPercent'> & {
    id: string;
    auctionId: string;
    discountPercent?: number; // Percentual da praça (ex: 100, 60, 50)
};
export type LotStageDetails = { stageId: string, stageName: string, initialBid?: number | null, bidIncrement?: number | null };

export interface AdminReportData {
  users: number;
  auctions: number;
  lots: number;
  sellers: number;
  totalRevenue: number;
  newUsersLast30Days: number;
  activeAuctions: number;
  lotsSoldCount: number;
  salesData: { name: string; Sales: number }[];
  categoryData: { name: string; value: number }[];
  averageBidValue: number;
  auctionSuccessRate: number;
  averageLotsPerAuction: number;
}
export interface AuctionPerformanceData {
  id: string;
  publicId?: string | null;
  title: string;
  status: Auction['status'];
  totalLots: number;
  lotsSoldCount: number;
  totalRevenue: number;
  averageTicket: number;
  salesRate: number;
  sellerName?: string | null;
  auctioneerName?: string | null;
  auctionDate?: Date | string | null;
  auctionStages?: AuctionStage[] | null;
}

export interface AuctionDashboardData {
  totalRevenue: number;
  totalBids: number;
  uniqueBidders: number;
  salesRate: number;
  revenueByCategory: { name: string; Faturamento: number; }[];
  bidsOverTime: { name: string; Lances: number; }[];
}
export interface ConsignorDashboardStats {
    totalLotsConsigned: number;
    activeLots: number;
    soldLots: number;
    totalSalesValue: number;
    salesRate: number;
    salesData: { name: string; sales: number }[];
}

export type SellerFormData = Partial<Omit<SellerProfileInfo, 'id' | 'publicId' | 'slug' | 'createdAt' | 'updatedAt' | 'activeLotsCount' | 'memberSince' | 'auctionsFacilitatedCount' | 'rating' | 'tenantId' | 'cityId' | 'stateId'>> & { 
  name: string; 
  isJudicial?: boolean; 
  userId?: string | null; 
  tenantId?: string; 
  cityId?: string | null; 
  stateId?: string | null; 
  judicialBranchId?: string | null;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  latitude?: number | null;
  longitude?: number | null;
};
export type AuctioneerFormData = Partial<Omit<AuctioneerProfileInfo, 'id' | 'publicId' | 'slug' | 'createdAt' | 'updatedAt' | 'auctionsConductedCount' | 'memberSince' | 'rating' | 'tenantId' | 'cityId' | 'stateId'>> & { 
  name: string; 
  userId?: string | null; 
  tenantId?: string; 
  cityId?: string | null; 
  stateId?: string | null;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  latitude?: number | null;
  longitude?: number | null;
};
export type AuctionFormData = Omit<Auction, 'id' | 'publicId' | 'slug' | 'createdAt' | 'updatedAt' | 'totalLots' | 'seller' | 'auctioneer' | 'category' | 'sellerName' | 'auctioneerName' | 'categoryName' | 'lots' | 'totalHabilitatedUsers' | 'achievedRevenue' | 'imageUrl' | 'tenantId'> & { 
  auctionStages: { name: string, startDate: Date, endDate: Date, discountPercent?: number }[], 
  cityId?: string, 
  stateId?: string, 
  judicialProcessId?: string, 
  tenantId?: string | null,
  street?: string,
  number?: string,
  complement?: string,
  neighborhood?: string,
};
export type LotFormData = Omit<Lot, 'id' | 'publicId' | 'createdAt' | 'updatedAt' | 'auction' | 'assets' | 'categoryName' | 'subcategoryName' | 'sellerName' | 'auctionName' | 'galleryImageUrls' | 'tenantId'> & { type: string, assetIds?: string[], inheritedMediaFromAssetId?: string | null, stageDetails?: LotStageDetails[], originalLotId?: string, isRelisted?: boolean, relistCount?: number, tenantId?: string | null, mediaItemIds?: string[], galleryImageUrls?: string[] };
export type RoleFormData = Omit<Role, 'id' | 'nameNormalized'>;
export type StateFormData = Omit<StateInfo, 'id' | 'slug' | 'cityCount' | 'createdAt' | 'updatedAt'>;
export type CityFormData = Omit<CityInfo, 'id' | 'slug' | 'stateUf' | 'createdAt' | 'updatedAt' | 'lotCount'>;
export type CourtFormData = Omit<Court, 'id' | 'slug' | 'createdAt' | 'updatedAt'>;
export type JudicialDistrictFormData = Omit<JudicialDistrict, 'id' | 'slug' | 'courtName' | 'stateUf' | 'createdAt' | 'updatedAt'>;
export type JudicialBranchFormData = Omit<JudicialBranch, 'id' | 'slug' | 'districtName' | 'stateUf' | 'createdAt' | 'updatedAt'>;
export type JudicialProcessFormData = Omit<JudicialProcess, 'id' | 'publicId' | 'createdAt' | 'updatedAt' | 'courtName' | 'districtName' | 'branchName' | 'sellerName' | 'tenantId'>;
export type AssetFormData = Partial<Omit<Asset, 'id' | 'publicId' | 'createdAt' | 'updatedAt' | 'tenantId' | 'lotInfo' | 'lots' | 'categoryName' | 'subcategoryName' | 'judicialProcessNumber' | 'sellerName'>> & { 
  title: string;
  cityId?: string | null;
  stateId?: string | null;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  zipCode?: string;
};
export type SubcategoryFormData = Omit<Subcategory, 'id' | 'slug' | 'parentCategoryName' | 'itemCount'>;
export type VehicleMakeFormData = Omit<VehicleMake, 'id' | 'slug'>;
export type VehicleModelFormData = Omit<VehicleModel, 'id' | 'slug' | 'makeName'>;
export type UserFormData = Partial<User>;
export type WizardData = {
    auctionType?: 'JUDICIAL' | 'EXTRAJUDICIAL' | 'PARTICULAR' | 'TOMADA_DE_PRECOS';
    judicialProcess?: JudicialProcess;
    auctionDetails?: Partial<Auction>;
    selectedAssets?: Asset[];
    createdLots?: Lot[];
};

export type AssetSourceType = 'PROCESS' | 'CONSIGNOR';

export interface AuctionPreparationAssetSummary {
  id: string;
  title: string;
  categoryName?: string;
  evaluationValue?: number | null;
  status: string;
  sellerName?: string | null;
  judicialProcessNumber?: string | null;
  source: AssetSourceType;
  locationLabel?: string | null;
  createdAt?: string;
}

export interface AuctionPreparationHabilitation {
  userId: string;
  userName: string;
  documentNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  createdAt: string;
}

export interface AuctionPreparationBid {
  id: string;
  lotId: string;
  lotTitle: string;
  lotNumber?: string | null;
  bidderId: string;
  bidderName: string;
  amount: number;
  timestamp: string;
}

export interface AuctionPreparationInstallment {
  id: string;
  amount: number;
  dueDate: string;
  paymentDate?: string | null;
  status: string;
}

export interface AuctionPreparationWin {
  id: string;
  lotId: string;
  lotTitle: string;
  lotNumber?: string | null;
  userId: string;
  userName: string;
  value: number;
  paymentStatus: string;
  winDate: string;
  installments: AuctionPreparationInstallment[];
}

export interface AuctionPreparationData {
  auction: Auction;
  availableAssets: AuctionPreparationAssetSummary[];
  habilitations: AuctionPreparationHabilitation[];
  bids: AuctionPreparationBid[];
  userWins: AuctionPreparationWin[];
}

    

  

    

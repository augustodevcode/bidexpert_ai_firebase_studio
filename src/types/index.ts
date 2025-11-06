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
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Regra: IDs expostos para o frontend (em tipos, services, actions) devem ser strings.
// A conversão de BigInt para string deve ocorrer na camada de serviço/repositório.

export type Role = Omit<PmRole, 'id'> & { id: bigint };
export type Tenant = Omit<PmTenant, 'id'> & { id: bigint };
export type User = Omit<PmUser, 'id'> & { 
    id: bigint;
    roles?: (Omit<UsersOnRoles, 'userId' | 'roleId'> & { role: Role })[];
    tenants?: (Omit<UsersOnTenants, 'userId' | 'tenantId'> & { tenant: Tenant })[];
};
export type LotCategory = Omit<PmLotCategory, 'id'> & { id: bigint; itemCount?: number; _count?: { lots: number, subcategories: number } };
export type Subcategory = Omit<PmSubcategory, 'id' | 'parentCategoryId'> & { id: bigint; parentCategoryId: bigint; parentCategoryName?: string; itemCount?: number };
export type AuctioneerProfileInfo = Omit<PmAuctioneer, 'id' | 'userId' | 'tenantId'> & { id: bigint; userId?: bigint | null; tenantId: bigint; auctionsConductedCount?: number; memberSince?: Date; rating?: number };
export type SellerProfileInfo = Omit<PmSeller, 'id' | 'userId' | 'judicialBranchId' | 'tenantId'> & { id: bigint; userId?: bigint | null; judicialBranchId?: bigint | null; tenantId: bigint; activeLotsCount?: number; memberSince?: Date; auctionsFacilitatedCount?: number; rating?: number };

export type Asset = Omit<PmAsset, 'id' | 'categoryId' | 'subcategoryId' | 'judicialProcessId' | 'sellerId' | 'tenantId' | 'evaluationValue' | 'latitude' | 'longitude' | 'totalArea' | 'builtArea' | 'year' | 'modelYear' | 'mileage' | 'numberOfDoors' | 'pieceCount' | 'bedrooms' | 'suites' | 'bathrooms' | 'parkingSpaces' | 'hoursUsed'> & { 
  id: bigint;
  categoryId?: bigint | null;
  subcategoryId?: bigint | null;
  judicialProcessId?: bigint | null;
  sellerId?: bigint | null;
  tenantId: bigint;
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
  lotInfo?: string | null;
  lots?: any[];
};

export type Auction = Omit<PmAuction, 'id' | 'auctioneerId' | 'sellerId' | 'cityId' | 'stateId' | 'judicialProcessId' | 'tenantId' | 'categoryId' | 'originalAuctionId' | 'latitude' | 'longitude' | 'initialOffer' | 'estimatedRevenue' | 'achievedRevenue' | 'decrementAmount' | 'floorPrice'> & {
  id: bigint;
  auctioneerId?: bigint | null;
  sellerId?: bigint | null;
  cityId?: bigint | null;
  stateId?: bigint | null;
  judicialProcessId?: bigint | null;
  tenantId: bigint;
  categoryId?: bigint | null;
  originalAuctionId?: bigint | null;
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
  autoRelistSettings?: any;
};

export type Lot = Omit<PmLot, 'id' | 'auctionId' | 'categoryId' | 'subcategoryId' | 'sellerId' | 'auctioneerId' | 'cityId' | 'stateId' | 'winnerId' | 'tenantId' | 'originalLotId' | 'price' | 'initialPrice' | 'secondInitialPrice' | 'latitude' | 'longitude' | 'bidIncrementStep' | 'evaluationValue' | 'inheritedMediaFromAssetId'> & {
  id: bigint;
  auctionId: bigint;
  categoryId?: bigint | null;
  subcategoryId?: bigint | null;
  sellerId?: bigint | null;
  auctioneerId?: bigint | null;
  cityId?: bigint | null;
  stateId?: bigint | null;
  winnerId?: bigint | null;
  tenantId: bigint;
  originalLotId?: bigint | null;
  inheritedMediaFromAssetId?: bigint | null;
  assets?: Asset[];
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
  stageDetails?: LotStageDetails[];
};

export type BidInfo = Omit<PmBid, 'id' | 'auctionId' | 'lotId' | 'bidderId' | 'tenantId' | 'amount'> & { id: bigint; auctionId: bigint; lotId: bigint; bidderId: bigint; tenantId: bigint; amount: number; };
export type UserWin = Omit<PmUserWin, 'id' | 'lotId' | 'userId' | 'winningBidAmount'> & { id: bigint; lotId: bigint; userId: bigint; winningBidAmount: number; lot: Lot };
export type Review = Omit<PmReview, 'id' | 'lotId' | 'auctionId' | 'userId'> & { id: bigint; lotId: bigint; auctionId: bigint; userId: bigint; };
export type LotQuestion = Omit<PmLotQuestion, 'id' | 'lotId' | 'auctionId' | 'userId' | 'answeredByUserId'> & { id: bigint; lotId: bigint; auctionId: bigint; userId: bigint; answeredByUserId?: bigint | null };
export type UserDocument = Omit<PmUserDocument, 'id' | 'userId' | 'documentTypeId'> & { id: bigint; userId: bigint; documentTypeId: bigint; documentType: DocumentType };
export type DocumentType = Omit<PmDocumentType, 'id'> & { id: bigint };
export type DirectSaleOffer = Omit<PmDirectSaleOffer, 'id' | 'tenantId' | 'sellerId' | 'categoryId' | 'price' | 'minimumOfferPrice'> & {
    id: bigint;
    tenantId: bigint;
    sellerId: bigint;
    categoryId: bigint;
    price?: number | null;
    minimumOfferPrice?: number | null;
    galleryImageUrls?: string[] | null;
    category?: string;
};
export type UserLotMaxBid = Omit<PmUserLotMaxBid, 'id' | 'userId' | 'lotId' | 'maxAmount'> & { id: bigint; userId: bigint; lotId: bigint; maxAmount: number; };
export type JudicialProcess = Omit<PmJudicialProcess, 'id' | 'tenantId' | 'courtId' | 'districtId' | 'branchId' | 'sellerId'> & { id: bigint; tenantId: bigint; courtId?: bigint | null; districtId?: bigint | null; branchId?: bigint | null; sellerId?: bigint | null; parties: ProcessParty[], courtName?: string, districtName?: string, branchName?: string, sellerName?: string };
export type Court = Omit<PmCourt, 'id'> & { id: bigint };
export type JudicialDistrict = Omit<PmJudicialDistrict, 'id' | 'courtId' | 'stateId'> & { id: bigint; courtId?: bigint | null; stateId?: bigint | null; courtName?: string; stateUf?: string };
export type JudicialBranch = Omit<PmJudicialBranch, 'id' | 'districtId'> & { id: bigint; districtId?: bigint | null; districtName?: string; stateUf?: string };
export type ProcessParty = Omit<PmJudicialParty, 'id' | 'processId'> & { id: bigint; processId: bigint };
export type StateInfo = Omit<PmState, 'id'> & { id: bigint; cityCount?: number };
export type CityInfo = Omit<PmCity, 'id' | 'stateId' | 'latitude' | 'longitude'> & { 
    id: bigint;
    stateId: bigint;
    stateUf?: string,
    latitude?: number | null,
    longitude?: number | null,
};
export type MediaItem = Omit<PmMediaItem, 'id' | 'uploadedByUserId' | 'judicialProcessId'> & { id: bigint; uploadedByUserId?: bigint | null; judicialProcessId?: bigint | null; };
export type DataSource = PmDataSource;
export type Report = Omit<PmReport, 'id' | 'tenantId' | 'createdById'> & { id: bigint; tenantId: bigint; createdById: bigint };
export type ContactMessage = Omit<PmContactMessage, 'id'> & { id: bigint };
export type VehicleMake = Omit<PmVehicleMake, 'id'> & { id: bigint };
export type VehicleModel = Omit<PmVehicleModel, 'id' | 'makeId'> & { id: bigint; makeId: bigint; makeName?: string };


export type UserCreationData = Omit<UserFormData, 'passwordConfirmation' | 'termsAccepted'> & { roleIds: bigint[], tenantId?: bigint | null, habilitationStatus?: UserHabilitationStatus };
export type EditableUserProfileData = Partial<Omit<User, 'id' | 'email' | 'password' | 'createdAt' | 'updatedAt'>>;
export type UserHabilitationStatus = 'PENDING_DOCUMENTS' | 'PENDING_ANALYSIS' | 'HABILITADO' | 'REJECTED_DOCUMENTS' | 'BLOCKED';
export type PaymentStatus = 'PENDENTE' | 'PROCESSANDO' | 'PAGO' | 'FALHOU' | 'REEMBOLSADO' | 'CANCELADO' | 'ATRASADO';
export type AccountType = 'PHYSICAL' | 'LEGAL' | 'DIRECT_SALE_CONSIGNOR';
export type UserDocumentStatus = 'NOT_SENT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PENDING_ANALYSIS';
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
    roleIds?: bigint[];
    roleNames?: string[];
    permissions: string[];
    roleName?: string;
    sellerId?: bigint | null;
    auctioneerId?: bigint | null;
};

export type ThemeSettings = Omit<PmThemeSettings, 'id' | 'platformSettingsId'> & { id: bigint };
export type IdMasks = Omit<PmIdMasks, 'id' | 'platformSettingsId'> & { id: bigint };
export type ThemeColors = Omit<PmThemeColors, 'id' | 'themeSettingsId'> & { id: bigint };
export type NotificationSettings = Omit<PmNotificationSettings, 'id' | 'platformSettingsId'> & { id: bigint };
export type PlatformSettings = Omit<PmPlatformSettings, 'id' | 'tenantId' | 'crudFormMode'> & {
  id: bigint;
  tenantId: bigint;
  crudFormMode?: 'modal' | 'sheet';
  themes?: ThemeSettings | null;
  platformPublicIdMasks?: IdMasks | null;
  mapSettings?: PmMapSettings | null;
  biddingSettings?: PmBiddingSettings | null;
  paymentGatewaySettings?: PmPaymentGatewaySettings | null;
  notificationSettings?: NotificationSettings | null;
  mentalTriggerSettings?: PmMentalTriggerSettings | null;
  sectionBadgeVisibility?: PmSectionBadgeVisibility | null;
  variableIncrementTable?: PmVariableIncrementRule[];
};
export type VariableIncrementRule = Omit<PmVariableIncrementRule, 'id' | 'platformSettingsId'> & { id: bigint };
export type MapSettings = Omit<PmMapSettings, 'id' | 'platformSettingsId'> & { id: bigint };
export type BiddingSettings = Omit<PmBiddingSettings, 'id' | 'platformSettingsId'> & { id: bigint };
export type PaymentGatewaySettings = Omit<PmPaymentGatewaySettings, 'id' | 'platformSettingsId'> & { id: bigint };
export type MentalTriggerSettings = Omit<PmMentalTriggerSettings, 'id' | 'platformSettingsId'> & { id: bigint };
export type SectionBadgeVisibility = Omit<PmSectionBadgeVisibility, 'id' | 'platformSettingsId'> & { id: bigint };
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
export type AuctionStage = Omit<PmAuctionStage, 'id' | 'auctionId' | 'initialPrice'> & {
    id: bigint;
    auctionId: bigint;
    initialPrice?: number | null;
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

export type SellerFormData = Omit<SellerProfileInfo, 'id' | 'publicId' | 'slug' | 'createdAt' | 'updatedAt' | 'activeLotsCount' | 'memberSince' | 'auctionsFacilitatedCount' | 'rating' | 'tenantId'> & { userId?: string | null; tenantId?: string; cityId?: string; stateId?: string; };
export type AuctioneerFormData = Omit<AuctioneerProfileInfo, 'id'| 'publicId' | 'slug' | 'createdAt' | 'updatedAt' | 'auctionsConductedCount' | 'memberSince' | 'rating' | 'tenantId'> & { userId?: string | null; tenantId?: string; cityId?: string; stateId?: string; street?: string; number?: string; complement?: string; neighborhood?: string; latitude?: number; longitude?: number; };
export type AuctionFormData = Omit<Auction, 'id' | 'publicId' | 'slug' | 'createdAt' | 'updatedAt' | 'totalLots' | 'seller' | 'auctioneer' | 'category' | 'sellerName' | 'auctioneerName' | 'categoryName' | 'lots' | 'totalHabilitatedUsers' | 'achievedRevenue' | 'imageUrl' | 'tenantId'> & { auctionStages: { name: string, startDate: Date, endDate: Date, initialPrice?: number | null }[], cityId?: string, stateId?: string, judicialProcessId?: string, tenantId?: string | null };
export type LotFormData = Omit<Lot, 'id' | 'publicId' | 'createdAt' | 'updatedAt' | 'auction' | 'assets' | 'categoryName' | 'subcategoryName' | 'sellerName' | 'auctionName' | 'galleryImageUrls' | 'tenantId'> & { type: string, assetIds?: string[], inheritedMediaFromAssetId?: string | null, stageDetails?: LotStageDetails[], originalLotId?: string, isRelisted?: boolean, relistCount?: number, tenantId?: string | null, mediaItemIds?: string[], galleryImageUrls?: string[] };
export type RoleFormData = Omit<Role, 'id' | 'nameNormalized'>;
export type StateFormData = Omit<StateInfo, 'id' | 'slug' | 'cityCount' | 'createdAt' | 'updatedAt'>;
export type CityFormData = Omit<CityInfo, 'id' | 'slug' | 'stateUf' | 'createdAt' | 'updatedAt' | 'lotCount'>;
export type CourtFormData = Omit<Court, 'id' | 'slug' | 'createdAt' | 'updatedAt'>;
export type JudicialDistrictFormData = Omit<JudicialDistrict, 'id' | 'slug' | 'courtName' | 'stateUf' | 'createdAt' | 'updatedAt'>;
export type JudicialBranchFormData = Omit<JudicialBranch, 'id' | 'slug' | 'districtName' | 'stateUf' | 'createdAt' | 'updatedAt'>;
export type JudicialProcessFormData = Omit<JudicialProcess, 'id' | 'publicId' | 'createdAt' | 'updatedAt' | 'courtName' | 'districtName' | 'branchName' | 'sellerName' | 'tenantId'>;
export type AssetFormData = Partial<Omit<Asset, 'id' | 'publicId' | 'createdAt' | 'updatedAt' | 'tenantId' | 'lotInfo' | 'lots'>>;
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

    

  
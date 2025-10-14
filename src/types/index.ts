// src/types/index.ts

import type { 
    User as PmUser, 
    Role as PmRole, 
    UsersOnRoles,
    UsersOnTenants, // Adicionado para multi-tenancy
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
    Theme as PmTheme,
    ThemeColors as PmThemeColors,
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
    VehicleMake as PmVehicleMake,
    VehicleModel as PmVehicleModel,
    AuctionHabilitation,
    InstallmentPayment,
    AssetMedia, // Adicionado
} from '@prisma/client';

export type Role = PmRole;
export type Tenant = PmTenant;
export type User = PmUser & {
    roles?: (UsersOnRoles & { role: Role })[];
    tenants?: (UsersOnTenants & { tenant: Tenant })[];
};
export type LotCategory = PmLotCategory & { itemCount?: number };
export type Subcategory = PmSubcategory & { parentCategoryName?: string, itemCount?: number };
export type AuctioneerProfileInfo = PmAuctioneer & { auctionsConductedCount?: number, memberSince?: Date, rating?: number };
export type SellerProfileInfo = PmSeller & { activeLotsCount?: number, memberSince?: Date, auctionsFacilitatedCount?: number, rating?: number };
export type Asset = Omit<PmAsset, 'evaluationValue' | 'latitude' | 'longitude'> & { 
  categoryName?: string;
  subcategoryName?: string | null;
  judicialProcessNumber?: string | null;
  sellerName?: string | null;
  gallery?: (AssetMedia & { mediaItem: MediaItem })[]; // Adicionado
  evaluationValue?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  lotInfo?: string | null;
  lots?: any[];
};
export type Auction = Omit<PmAuction, 'latitude' | 'longitude' | 'initialOffer' | 'estimatedRevenue' | 'achievedRevenue' | 'decrementAmount' | 'floorPrice'> & {
  lots?: Lot[];
  totalLots?: number;
  seller?: SellerProfileInfo;
  auctioneer?: AuctioneerProfileInfo;
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
  imageUrl?: string | null; // Adicionado para manter a compatibilidade com a lógica de herança
};
export type Lot = Omit<PmLot, 'price' | 'initialPrice' | 'secondInitialPrice' | 'latitude' | 'longitude' | 'bidIncrementStep' | 'evaluationValue'> & {
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
  inheritedMediaFromAssetId?: string | null;
  galleryImageUrls?: string[] | null;
};
export type BidInfo = PmBid;
export type UserWin = Omit<PmUserWin, 'winningBidAmount'> & { winningBidAmount: number; lot: Lot };
export type Review = PmReview;
export type LotQuestion = PmLotQuestion;
export type UserDocument = PmUserDocument & { documentType: PmDocumentType };
export type DocumentType = PmDocumentType;
export type DirectSaleOffer = Omit<PmDirectSaleOffer, 'price' | 'minimumOfferPrice'> & {
    price?: number | null;
    minimumOfferPrice?: number | null;
    galleryImageUrls?: string[] | null;
};
export type UserLotMaxBid = PmUserLotMaxBid;
export type JudicialProcess = PmJudicialProcess & { parties: PmJudicialParty[], courtName?: string, districtName?: string, branchName?: string, sellerName?: string };
export type Court = PmCourt;
export type JudicialDistrict = PmJudicialDistrict & { courtName?: string, stateUf?: string };
export type JudicialBranch = PmJudicialBranch & { districtName?: string, stateUf?: string };
export type ProcessParty = PmJudicialParty;
export type StateInfo = PmState & { cityCount?: number };
export type CityInfo = Omit<PmCity, 'latitude' | 'longitude'> & { 
    stateUf?: string,
    latitude?: number | null,
    longitude?: number | null,
};
export type MediaItem = PmMediaItem;
export type DataSource = PmDataSource;
export type Report = PmReport;
export type VehicleMake = PmVehicleMake;
export type VehicleModel = PmVehicleModel & { makeName?: string };


export type UserCreationData = Omit<UserFormData, 'passwordConfirmation' | 'termsAccepted'> & { roleIds: string[], tenantId?: string, habilitationStatus?: UserHabilitationStatus };
export type EditableUserProfileData = Partial<Omit<User, 'id' | 'email' | 'password' | 'createdAt' | 'updatedAt'>>;
export type UserHabilitationStatus = 'PENDING_DOCUMENTS' | 'PENDING_ANALYSIS' | 'HABILITADO' | 'REJECTED_DOCUMENTS' | 'BLOCKED';
export type PaymentStatus = 'PENDENTE' | 'PROCESSANDO' | 'PAGO' | 'FALHOU' | 'REEMBOLSADO' | 'CANCELADO';
export type AccountType = 'PHYSICAL' | 'LEGAL' | 'DIRECT_SALE_CONSIGNOR';
export type UserDocumentStatus = 'NOT_SENT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PENDING_ANALYSIS';
export type AuctionStatus = 'RASCUNHO' | 'EM_PREPARACAO' | 'EM_BREVE' | 'ABERTO' | 'ABERTO_PARA_LANCES' | 'ENCERRADO' | 'FINALIZADO' | 'CANCELADO' | 'SUSPENSO';
export type LotStatus = 'RASCUNHO' | 'EM_BREVE' | 'ABERTO_PARA_LANCES' | 'ENCERRADO' | 'VENDIDO' | 'NAO_VENDIDO' | 'RELISTADO' | 'CANCELADO';
export type AssetStatus = 'CADASTRO' | 'DISPONIVEL' | 'LOTEADO' | 'VENDIDO' | 'REMOVIDO' | 'INATIVADO';
export type DirectSaleOfferStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'SOLD' | 'EXPIRED' | 'RASCUNHO';
export type DirectSaleOfferType = 'BUY_NOW' | 'ACCEPTS_PROPOSALS';
export type AuctionType = 'JUDICIAL' | 'EXTRAJUDICIAL' | 'PARTICULAR' | 'TOMADA_DE_PRECOS';
export type AuctionMethod = 'STANDARD' | 'DUTCH' | 'SILENT';
export type AuctionParticipation = 'ONLINE' | 'PRESENCIAL' | 'HIBRIDO';

export type UserProfileWithPermissions = User & {
    roles: (UsersOnRoles & { role: Role })[];
    tenants: (UsersOnTenants & { tenant: Tenant })[];
    roleIds?: string[];
    roleNames?: string[];
    permissions: string[];
    roleName?: string;
};

export type Theme = PmTheme;
export type ThemeColors = PmThemeColors;
export type NotificationSettings = PmNotificationSettings;
export type PlatformSettings = Omit<PmPlatformSettings, 'themes' | 'platformPublicIdMasks' | 'mapSettings' | 'variableIncrementTable' | 'biddingSettings' | 'paymentGatewaySettings' | 'notificationSettings' | 'homepageSections' | 'mentalTriggerSettings' | 'sectionBadgeVisibility'> & {
  isSetupComplete: boolean;
  themes?: Theme[] | null;
  platformPublicIdMasks?: { auctions?: string, lots?: string, auctioneers?: string, sellers?: string } | null;
  mapSettings?: PmMapSettings | null;
  notificationSettings?: NotificationSettings | null;
  variableIncrementTable?: PmVariableIncrementRule[] | null;
  biddingSettings?: PmBiddingSettings | null;
  paymentGatewaySettings?: PmPaymentGatewaySettings | null;
  homepageSections?: any[] | null;
  mentalTriggerSettings?: PmMentalTriggerSettings | null;
  sectionBadgeVisibility?: PmSectionBadgeVisibility | null;
  logoUrl?: string | null;
};
export type VariableIncrementRule = PmVariableIncrementRule;
export type MapSettings = PmMapSettings;
export type BiddingSettings = PmBiddingSettings;
export type PaymentGatewaySettings = PmPaymentGatewaySettings;
export type MentalTriggerSettings = PmMentalTriggerSettings;
export type SectionBadgeVisibility = PmSectionBadgeVisibility;
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
export type AuctionStage = Omit<PmAuctionStage, 'initialPrice'> & {
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

// Para usar em formulários onde não temos o ID completo ainda
export type SellerFormData = Omit<SellerProfileInfo, 'id' | 'publicId' | 'slug' | 'createdAt' | 'updatedAt' | 'activeLotsCount' | 'memberSince' | 'auctionsFacilitatedCount' | 'rating'> & { userId?: string | null };
export type AuctioneerFormData = Omit<AuctioneerProfileInfo, 'id' | 'publicId' | 'slug' | 'createdAt' | 'updatedAt' | 'auctionsConductedCount' | 'memberSince' | 'rating'> & { userId?: string | null };
export type AuctionFormData = Omit<Auction, 'id' | 'publicId' | 'slug' | 'createdAt' | 'updatedAt' | 'totalLots' | 'seller' | 'auctioneer' | 'sellerName' | 'auctioneerName' | 'lots' | 'totalHabilitatedUsers' | 'achievedRevenue' | 'imageUrl'> & { auctionStages: { name: string, startDate: Date, endDate: Date, initialPrice?: number | null }[], cityId?: string, stateId?: string, judicialProcessId?: string, tenantId?: string | null };
export type LotFormData = Omit<Lot, 'id' | 'publicId' | 'createdAt' | 'updatedAt' | 'auction' | 'assets' | 'categoryName' | 'subcategoryName' | 'sellerName' | 'auctionName' | 'galleryImageUrls'> & { type: string, assetIds?: string[], inheritedMediaFromBemId?: string | null, stageDetails?: LotStageDetails[], originalLotId?: string, isRelisted?: boolean, relistCount?: number, tenantId?: string | null, mediaItemIds?: string[], galleryImageUrls?: string[] };
export type RoleFormData = Omit<Role, 'id' | 'nameNormalized'>;
export type StateFormData = Omit<StateInfo, 'id' | 'slug' | 'cityCount' | 'createdAt' | 'updatedAt'>;
export type CityFormData = Omit<CityInfo, 'id' | 'slug' | 'stateUf' | 'createdAt' | 'updatedAt' | 'lotCount'>;
export type CourtFormData = Omit<Court, 'id' | 'slug'>;
export type JudicialDistrictFormData = Omit<JudicialDistrict, 'id' | 'slug' | 'courtName' | 'stateUf'>;
export type JudicialBranchFormData = Omit<JudicialBranch, 'id' | 'slug' | 'districtName' | 'stateUf'>;
export type JudicialProcessFormData = Omit<JudicialProcess, 'id' | 'publicId' | 'createdAt' | 'updatedAt' | 'courtName' | 'districtName' | 'branchName' | 'sellerName'>;
export type AssetFormData = Omit<Asset, 'id' | 'publicId' | 'createdAt' | 'updatedAt' | 'categoryName' | 'subcategoryName' | 'judicialProcessNumber' | 'sellerName' | 'lots' | 'lotInfo' | 'gallery'> & { cityId?: string; stateId?: string; make?: string; model?: string; year?: number; };
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

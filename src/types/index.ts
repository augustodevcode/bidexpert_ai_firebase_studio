// src/types/index.ts
import type { 
    User, Role, UserDocument, DocumentType, Auction as PrismaAuction, Lot as PrismaLot, Bid, 
    UserWin, Seller, Auctioneer, DirectSaleOffer, MediaItem, LotCategory, 
    State as StateInfo, City as CityInfo, Subcategory,
    Court, JudicialDistrict, JudicialBranch, JudicialProcess, ProcessParty, Bem,
    Notification, BlogPost, ContactMessage,
    Review, LotQuestion, UserLotMaxBid,
    Prisma
} from '@prisma/client';
import type { Timestamp as FirebaseAdminTimestamp, FieldValue as FirebaseAdminFieldValue } from 'firebase-admin/firestore';
import type { Timestamp as FirebaseClientTimestamp } from 'firebase/firestore'; // Client SDK Timestamp

// For server-side logic (Admin SDK)
export type ServerTimestamp = FirebaseAdminTimestamp;
export type AdminFieldValue = FirebaseAdminFieldValue;

// For client-side logic or data received from client
export type ClientTimestamp = FirebaseClientTimestamp;

// Generic type for properties that could be any of these, or a JS Date
export type AnyTimestamp = ServerTimestamp | ClientTimestamp | Date | string | null | undefined;

// --- Redefining Prisma types to include relations or computed fields ---

export type Auction = PrismaAuction & {
  lots?: Lot[];
  totalLots?: number;
  auctioneer?: string;
  seller?: string;
  category?: string;
  auctioneerName?: string;
  auctioneerLogoUrl?: string;
};

export type Lot = PrismaLot & {
    auctionName?: string;
    type?: string;
    subcategoryName?: string;
    cityName?: string;
    stateUf?: string;
    isFavorite?: boolean;
    bens?: Bem[];
};

export type Bem = Prisma.BemGetPayload<{
  include: {
    category: true;
    subcategory: true;
    judicialProcess: true;
    seller: true;
  }
}> & {
  categoryName?: string;
  subcategoryName?: string;
  judicialProcessNumber?: string;
  sellerName?: string;
};


// --- EXPORTING PRISMA GENERATED TYPES ---
// This makes it easy to use the exact shape of our database models throughout the app.
export type { 
    User as UserProfileData, Role, UserDocument, DocumentType, Bid as BidInfo, 
    UserWin, Seller as SellerProfileInfo, Auctioneer as AuctioneerProfileInfo, 
    DirectSaleOffer, MediaItem, LotCategory, StateInfo, CityInfo, Subcategory,
    Court, JudicialDistrict, JudicialBranch, JudicialProcess, ProcessParty, // Removed Bem here
    Notification, BlogPost, ContactMessage, // Exporting ContactMessage
    Review, LotQuestion, UserLotMaxBid, // Exporting new types
    Prisma
};


// --- CUSTOM & COMPOSITE TYPES ---

// Adds computed permissions array to the base User type
export type UserProfileWithPermissions = User & {
  permissions: string[];
};

// Represents the data coming from the user registration form
export type UserCreationData = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'roleId' | 'sellerId' | 'badges'>> & {
  email: string;
  password?: string | null;
};

// Represents the fields that a user can edit on their own profile page
export type EditableUserProfileData = Partial<Omit<User, 'id' | 'email' | 'createdAt' | 'updatedAt' | 'roleId' | 'sellerId' | 'password' | 'badges'>>;

export type UserFormValues = Pick<User, 'fullName' | 'email' | 'cpf' | 'cellPhone' | 'dateOfBirth' | 'accountType' | 'razaoSocial' | 'cnpj' | 'inscricaoEstadual' | 'website' | 'zipCode' | 'street' | 'number' | 'complement' | 'neighborhood' | 'city' | 'state' | 'optInMarketing'> & {
  password?: string;
  roleId?: string | null; 
};


export interface UserBid {
    id: string;
    lotId: string;
    auctionId: string;
    lotTitle: string;
    lotImageUrl: string;
    lotImageAiHint?: string;
    userBidAmount: number;
    currentLotPrice: number;
    bidStatus: 'GANHANDO' | 'PERDENDO' | 'SUPERADO_POR_OUTRO' | 'SUPERADO_PELO_PROPRIO_MAXIMO' | 'ARREMATADO' | 'NAO_ARREMATADO' | 'ENCERRADO' | 'CANCELADO';
    bidDate: AnyTimestamp;
    lotEndDate: AnyTimestamp;
    lot: Lot; // Include full lot for linking
}

// --- FORM DATA TYPES ---
// These types define the shape of data coming from forms, before it's processed for the database.

export type CategoryFormData = Omit<LotCategory, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'itemCount' | 'hasSubcategories'>;
export type SubcategoryFormData = Omit<Subcategory, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'itemCount'>;
export type StateFormData = Omit<StateInfo, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'cityCount'>;
export type CityFormData = Omit<CityInfo, 'id' | 'slug' | 'stateUf' | 'createdAt' | 'updatedAt' | 'lotCount'>;
export type AuctioneerFormData = Omit<Auctioneer, 'id' | 'publicId' | 'slug' | 'createdAt' | 'updatedAt' | 'memberSince' | 'rating' | 'auctionsConductedCount' | 'totalValueSold' | 'logoMediaId'>;
export type SellerFormData = Omit<Seller, 'id'| 'publicId' | 'slug' | 'createdAt' | 'updatedAt' | 'memberSince' | 'rating' | 'activeLotsCount' | 'totalSalesValue' | 'auctionsFacilitatedCount' | 'logoMediaId'>;
export type RoleFormData = Omit<Role, 'id' | 'name_normalized' | 'createdAt' | 'updatedAt'>;
export type CourtFormData = Omit<Court, 'id' | 'slug' | 'createdAt' | 'updatedAt'>;
export type JudicialDistrictFormData = Omit<JudicialDistrict, 'id' | 'slug' | 'createdAt' | 'updatedAt'>;
export type JudicialBranchFormData = Omit<JudicialBranch, 'id' | 'slug' | 'createdAt' | 'updatedAt'>;
export type JudicialProcessFormData = Omit<JudicialProcess, 'id' | 'publicId' | 'createdAt' | 'updatedAt'> & {
  parties: Array<Partial<ProcessParty>>; 
};
export type DocumentTemplateFormData = Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>;

export type BemFormData = Omit<Prisma.BemUncheckedCreateInput, 'id' | 'publicId' | 'createdAt' | 'updatedAt' | 'galleryImageUrls' | 'mediaItemIds' | 'amenities'> & {
  galleryImageUrls?: string[];
  mediaItemIds?: string[];
  amenities?: { value: string }[];
};

export type AuctionFormData = Omit<Auction, 'id' | 'publicId' | 'createdAt' | 'updatedAt' | 'totalLots'> & {
  auctionDate: Date; 
  endDate?: Date | null; 
};

export type LotFormData = Omit<Lot, 'id'|'publicId'|'createdAt'|'updatedAt'|'auctionId'|'categoryId'|'number'|'isFavorite'|'views'|'bidsCount'|'status'|'isFeatured'> & {
  auctionId: string;
  type: string; // From form, maps to categoryId
  auctionName?: string;
  bemIds?: string[];
  mediaItemIds?: string[];
  isFeatured?: boolean;
};

export type LotDbData = Omit<LotFormData, 'type' | 'auctionName'> & {
  categoryId: string;
};


export type DirectSaleOfferFormData = Omit<DirectSaleOffer, 'id' | 'publicId' | 'createdAt' | 'updatedAt' | 'views' | 'proposalsCount' | 'galleryImageUrls' | 'itemsIncluded' | 'tags' | 'sellerId' | 'sellerLogoUrl' | 'dataAiHintSellerLogo' | 'latitude' | 'longitude' | 'mapAddress' | 'mapEmbedUrl' | 'mapStaticImageUrl' | 'categoryId'> & {
    expiresAt?: Date | null;
    mediaItemIds?: string[];
    galleryImageUrls?: string[];
    category: string; // The form sends the name, action will resolve ID
    sellerName: string; // Form sends name
};

// --- WIZARD SPECIFIC TYPES ---

export interface WizardData {
  auctionType?: Extract<AuctionType, 'JUDICIAL' | 'EXTRAJUDICIAL' | 'PARTICULAR' | 'TOMADA_DE_PRECOS'>;
  judicialProcess?: JudicialProcess;
  auctionDetails?: Partial<Auction> & {
    auctioneer?: string; // name
    seller?: string;     // name
  };
  selectedBens?: Bem[];
  createdLots?: Partial<Lot>[];
}


// --- GENERIC & UTILITY TYPES ---

// Used for API responses from CNJ
export interface CnjProcessSource {
  numeroProcesso: string;
  classe: { codigo: number; nome: string };
  sistema: { codigo: number; nome: string };
  formato: { codigo: number; nome: string };
  tribunal: string;
  dataHoraUltimaAtualizacao: string;
  grau: string;
  dataAjuizamento: string;
  movimentos: any[];
  id: string;
  nivelSigilo: number;
  orgaoJulgador: {
    codigoMunicipioIBGE: number;
    codigo: number;
    nome: string;
  };
  assuntos: { codigo: number; nome: string }[][];
}
export interface CnjHit {
  _index: string;
  _type: string;
  _id: string;
  _score: number | null;
  _source: CnjProcessSource;
  sort?: (string | number)[];
}
export interface CnjSearchResponse {
  took: number;
  timed_out: boolean;
  hits: {
    total: {
      value: number;
      relation: string;
    };
    max_score: number | null;
    hits: CnjHit[];
  };
}

export type ThemeColors = Record<string, string>;

export interface Theme {
  name: string;
  colors: ThemeColors;
}

export interface MentalTriggerSettings {
    showDiscountBadge?: boolean;
    showUrgencyTimer?: boolean;
    urgencyTimerThresholdDays?: number;
    urgencyTimerThresholdHours?: number;
    showPopularityBadge?: boolean;
    popularityViewThreshold?: number;
    showHotBidBadge?: boolean;
    hotBidThreshold?: number;
    showExclusiveBadge?: boolean;
}

export interface BadgeVisibilitySettings {
  showStatusBadge?: boolean;
  showDiscountBadge?: boolean;
  showUrgencyTimer?: boolean;
  showPopularityBadge?: boolean;
  showHotBidBadge?: boolean;
  showExclusiveBadge?: boolean;
}

export interface SectionBadgeConfig {
  featuredLots?: BadgeVisibilitySettings;
  searchGrid?: BadgeVisibilitySettings;
  searchList?: BadgeVisibilitySettings;
  lotDetail?: BadgeVisibilitySettings; 
}

export type HomepageSectionType = 'hero_carousel' | 'filter_links' | 'featured_lots' | 'active_auctions' | 'promo_banner_1' | 'categories_grid';

export interface PromoCardContent {
    title: string;
    subtitle?: string;
    link: string;
    imageUrl?: string;
    imageAlt?: string;
    dataAiHint?: string;
    bgColorClass?: string;
}

export interface HomepageSectionConfig {
  id: string;
  type: HomepageSectionType;
  title?: string;
  visible: boolean;
  order: number;
  itemCount?: number; 
  categorySlug?: string; 
  promoContent?: PromoCardContent;
}

export interface MapSettings {
  defaultProvider?: 'google' | 'openstreetmap' | 'staticImage';
  googleMapsApiKey?: string | null;
  staticImageMapZoom?: number;
  staticImageMapMarkerColor?: string;
}

export type SearchPaginationType = 'loadMore' | 'numberedPages';

export type StorageProviderType = 'local' | 'firebase';

export interface BiddingSettings {
  instantBiddingEnabled?: boolean;
  getBidInfoInstantly?: boolean;
  biddingInfoCheckIntervalSeconds?: number;
}

export type VariableIncrementRule = Prisma.JsonValue;

export type PlatformSettingsFormData = Omit<PlatformSettings, 'id' | 'updatedAt' | 'variableIncrementTable'> & {
    variableIncrementTable?: { from: number, to: number | null, increment: number }[];
};


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
  averageLotsPerAuction: number;
  auctionSuccessRate: number;
}

export interface AdminDashboardStats {
    users: number;
    auctions: number;
    lots: number;
    sellers: number;
}

export interface ConsignorDashboardStats {
    totalLotsConsigned: number;
    activeLots: number;
    soldLots: number;
    totalSalesValue: number;
    salesRate: number;
    salesData: { name: string; Sales: number }[];
}


export interface RecentlyViewedLotInfo {
  id: string;
  title: string;
  imageUrl: string;
  auctionId: string;
  dataAiHint?: string;
}

export type AuctionStage = Omit<Prisma.JsonValue, 'endDate'> & {
  name: string;
  endDate: AnyTimestamp;
  statusText?: string;
  initialPrice?: number;
};


// Enums for Zod schemas
export const lotStatusValues: [LotStatus, ...LotStatus[]] = [
  'EM_BREVE',
  'ABERTO_PARA_LANCES',
  'ENCERRADO',
  'VENDIDO',
  'NAO_VENDIDO',
];

export const auctionStatusValues: [AuctionStatus, ...AuctionStatus[]] = [
  'RASCUNHO',
  'EM_PREPARACAO',
  'EM_BREVE',
  'ABERTO', 
  'ABERTO_PARA_LANCES',
  'ENCERRADO',
  'FINALIZADO', 
  'CANCELADO',
  'SUSPENSO'
];

export const bemStatusValues: [Bem['status'], ...Bem['status'][]] = [
  'CADASTRO', 'DISPONIVEL', 'LOTEADO', 'VENDIDO', 'REMOVIDO', 'INATIVADO'
];

export const documentTemplateTypeValues: [DocumentTemplate['type'], ...DocumentTemplate['type'][]] = [
  'WINNING_BID_TERM', 'EVALUATION_REPORT', 'AUCTION_CERTIFICATE'
];

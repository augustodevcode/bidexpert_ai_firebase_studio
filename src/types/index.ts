
// src/types/index.ts
import type { Timestamp as FirebaseAdminTimestamp, FieldValue as FirebaseAdminFieldValue } from 'firebase-admin/firestore';
import type { Timestamp as FirebaseClientTimestamp } from 'firebase/firestore'; // Client SDK Timestamp

// For server-side logic (Admin SDK)
export type ServerTimestamp = FirebaseAdminTimestamp;
export type AdminFieldValue = FirebaseAdminFieldValue;

// For client-side logic or data received from client
export type ClientTimestamp = FirebaseClientTimestamp;

// Generic type for properties that could be any of these, or a JS Date
export type AnyTimestamp = ServerTimestamp | ClientTimestamp | Date | string | null | undefined;


export interface LotCategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
    itemCount?: number;
    hasSubcategories?: boolean;
    logoUrl?: string | null;
    logoMediaId?: string | null;
    coverImageUrl?: string | null;
    coverImageMediaId?: string | null;
    megaMenuImageUrl?: string | null;
    megaMenuImageMediaId?: string | null;
    dataAiHintLogo?: string | null;
    dataAiHintCover?: string | null;
    dataAiHintMegaMenu?: string | null;
    createdAt: AnyTimestamp; // Changed from Date
    updatedAt: AnyTimestamp; // Changed from Date
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  parentCategoryId: string;
  parentCategoryName?: string; // For display purposes
  description?: string;
  itemCount?: number;
  displayOrder?: number;
  iconUrl?: string | null;
  iconMediaId?: string | null;
  dataAiHintIcon?: string | null;
  createdAt: AnyTimestamp;
  updatedAt: AnyTimestamp;
}
export type SubcategoryFormData = Omit<Subcategory, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'itemCount' | 'parentCategoryName'>;


export interface StateInfo {
  id: string;
  name: string;
  uf: string;
  slug: string;
  cityCount?: number;
  createdAt: AnyTimestamp;
  updatedAt: AnyTimestamp;
}
export type StateFormData = Omit<StateInfo, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'cityCount'>;

export interface CityInfo {
  id: string; // Pode ser `stateSlug-citySlug` ou um ID numérico do DB
  name: string;
  slug: string;
  stateId: string; // ID/Slug do estado pai
  stateUf: string;
  ibgeCode?: string;
  lotCount?: number;
  createdAt: AnyTimestamp;
  updatedAt: AnyTimestamp;
}
export type CityFormData = Omit<CityInfo, 'id' | 'slug' | 'stateUf' | 'createdAt' | 'updatedAt' | 'lotCount'>;


export interface AuctioneerProfileInfo {
  id: string;
  publicId: string;
  name: string;
  slug: string;
  registrationNumber?: string | null;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  logoMediaId?: string | null;
  dataAiHintLogo?: string | null;
  description?: string | null;
  memberSince?: AnyTimestamp;
  rating?: number | null;
  auctionsConductedCount?: number;
  totalValueSold?: number;
  userId?: string | null; // Link to User model if the auctioneer is a platform user
  createdAt: AnyTimestamp;
  updatedAt: AnyTimestamp;
}

export type AuctioneerFormData = Omit<AuctioneerProfileInfo, 'id' | 'publicId' | 'slug' | 'createdAt' | 'updatedAt' | 'memberSince' | 'rating' | 'auctionsConductedCount' | 'totalValueSold'>;


export interface SellerProfileInfo {
  id: string;
  publicId: string;
  name: string;
  slug: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  logoMediaId?: string | null;
  dataAiHintLogo?: string | null;
  description?: string | null;
  memberSince?: AnyTimestamp;
  rating?: number | null;
  activeLotsCount?: number;
  totalSalesValue?: number;
  auctionsFacilitatedCount?: number;
  userId?: string | null;
  createdAt: AnyTimestamp;
  updatedAt: AnyTimestamp;
  
  cnpj?: string;
  razaoSocial?: string;
  inscricaoEstadual?: string;
}

export type SellerFormData = Omit<SellerProfileInfo, 'id' | 'publicId' | 'slug' | 'createdAt' | 'updatedAt' | 'memberSince' | 'rating' | 'activeLotsCount' | 'totalSalesValue' | 'auctionsFacilitatedCount' | 'userId'> & {
  userId?: string;
};

export interface AuctionStage {
  name: string; // ex: "1ª Praça"
  endDate: AnyTimestamp; // Timestamp ou string ISO
  statusText?: string; // ex: "Encerramento", "Abre em"
  initialPrice?: number; // Lance inicial para esta praça
}

export type AuctionStatus = 'EM_BREVE' | 'ABERTO' | 'ABERTO_PARA_LANCES' | 'ENCERRADO' | 'FINALIZADO' | 'CANCELADO' | 'SUSPENSO' | 'RASCUNHO' | 'EM_PREPARACAO';
export type LotStatus = 'EM_BREVE' | 'ABERTO_PARA_LANCES' | 'ENCERRADO' | 'VENDIDO' | 'NAO_VENDIDO';

export interface Auction {
  id: string;
  publicId: string;
  title: string;
  description?: string;
  status: AuctionStatus;
  auctionType?: 'JUDICIAL' | 'EXTRAJUDICIAL' | 'PARTICULAR' | 'TOMADA_DE_PRECOS';
  category: string; 
  categoryId?: string; 
  auctioneer: string; 
  auctioneerId?: string; 
  seller?: string; 
  sellerId?: string; 
  auctionDate: AnyTimestamp; 
  endDate?: AnyTimestamp | null; 
  auctionStages?: AuctionStage[];
  city?: string;
  state?: string;
  imageUrl?: string;
  imageMediaId?: string | null;
  dataAiHint?: string;
  documentsUrl?: string;
  totalLots?: number;
  visits?: number;
  initialOffer?: number;
  isFavorite?: boolean;
  currentBid?: number;
  bidsCount?: number;
  sellingBranch?: string;
  vehicleLocation?: string; 
  createdAt: AnyTimestamp;
  updatedAt: AnyTimestamp;
  auctioneerLogoUrl?: string;
  auctioneerName?: string;
  automaticBiddingEnabled?: boolean;
  allowInstallmentBids?: boolean;
  estimatedRevenue?: number;
  achievedRevenue?: number;
  totalHabilitatedUsers?: number;
  isFeaturedOnMarketplace?: boolean;
  marketplaceAnnouncementTitle?: string;
  lots?: Lot[]; 
}

export type AuctionFormData = Omit<Auction,
  'id' | 'publicId' | 'createdAt' | 'updatedAt' | 'auctionDate' | 'endDate' |
  'lots' | 'totalLots' | 'visits' | 'isFavorite' |
  'currentBid' | 'bidsCount' | 'auctioneerLogoUrl' | 'auctioneerName' |
  'categoryId' | 'auctioneerId' | 'sellerId' | 'achievedRevenue' | 'totalHabilitatedUsers'
> & {
  auctionDate: Date; 
  endDate?: Date | null; 
  auctionStages?: Array<Omit<AuctionStage, 'endDate'> & {endDate: Date}>;
};

export type AuctionDbData = Omit<AuctionFormData, 'category' | 'auctioneer' | 'seller'> & {
  categoryId?: string;
  auctioneerId?: string;
  sellerId?: string | null; 
  achievedRevenue?: number;
  totalHabilitatedUsers?: number;
  auctionType?: Auction['auctionType'];
  auctionStages?: AuctionStage[];
};


export interface Lot {
  id: string;
  publicId: string;
  auctionId: string;
  title: string;
  number?: string; 
  imageUrl: string;
  imageMediaId?: string | null;
  dataAiHint?: string;
  galleryImageUrls?: string[];
  mediaItemIds?: string[]; 
  status: LotStatus;
  stateId?: string;
  cityId?: string;
  cityName?: string;
  stateUf?: string;
  type: string; // This will be the main category name
  categoryId?: string; // ID of the main LotCategory
  subcategoryId?: string; // ID of the Subcategory
  subcategoryName?: string; // Name of the subcategory for display
  views?: number;
  auctionName?: string; 
  price: number; 
  initialPrice?: number; 
  secondInitialPrice?: number | null; 
  bidIncrementStep?: number; 
  endDate?: AnyTimestamp; 
  auctionDate?: AnyTimestamp; 
  lotSpecificAuctionDate?: AnyTimestamp | null; 
  secondAuctionDate?: AnyTimestamp | null; 
  bidsCount?: number;
  isFavorite?: boolean;
  isFeatured?: boolean;
  description?: string;
  year?: number;
  make?: string; 
  model?: string;
  series?: string;
  stockNumber?: string;
  sellingBranch?: string; 
  vin?: string; 
  vinStatus?: string; 
  lossType?: string; 
  primaryDamage?: string; 
  titleInfo?: string; 
  titleBrand?: string; 
  startCode?: string; 
  hasKey?: boolean; 
  odometer?: string; 
  airbagsStatus?: string; 
  bodyStyle?: string; 
  engineDetails?: string; 
  transmissionType?: string; 
  driveLineType?: string; 
  fuelType?: string; 
  cylinders?: string; 
  restraintSystem?: string; 
  exteriorInteriorColor?: string; 
  options?: string; 
  manufacturedIn?: string; 
  vehicleClass?: string; 
  vehicleLocationInBranch?: string; 
  laneRunNumber?: string; 
  aisleStall?: string; 
  actualCashValue?: string; 
  estimatedRepairCost?: string; 
  sellerName?: string;
  sellerId?: string; 
  auctioneerName?: string;
  auctioneerId?: string; 
  condition?: string;
  createdAt?: AnyTimestamp;
  updatedAt?: AnyTimestamp;
  discountPercentage?: number;
  additionalTriggers?: string[];
  isExclusive?: boolean;
  allowInstallmentBids?: boolean; 
  latitude?: number | null;
  longitude?: number | null;
  mapAddress?: string | null;
  mapEmbedUrl?: string | null;
  mapStaticImageUrl?: string | null;

  // Campos de segurança e due diligence
  judicialProcessNumber?: string | null;
  courtDistrict?: string | null; // Comarca
  courtName?: string | null; // Vara
  publicProcessUrl?: string | null;
  propertyRegistrationNumber?: string | null; // Matrícula do Imóvel
  propertyLiens?: string | null; // Ônus (descrição ou link)
  knownDebts?: string | null; // Dívidas conhecidas (IPTU, Condomínio)
  additionalDocumentsInfo?: string | null; // Campo de texto para outras infos/links de docs
}

export type LotFormData = Omit<Lot,
  'id' |
  'publicId' |
  'createdAt' |
  'updatedAt' |
  'endDate' | // Removido do form, gerenciado pelo leilão
  'auctionDate' | // Removido do form, gerenciado pelo leilão
  'lotSpecificAuctionDate' | // Removido do form, gerenciado pelo leilão
  'secondAuctionDate' | // Removido do form, gerenciado pelo leilão
  'isFavorite' |
  'isFeatured' |
  'views' |           
  'bidsCount' |       
  'galleryImageUrls' | 
  'dataAiHint' |      
  'cityName' |        
  'stateUf' |         
  'auctioneerName' |
  'sellerName' |
  'type' | 
  'auctionName' |
  'subcategoryName'
> & {
  endDate?: Date | null; // Mantido como opcional, mas o formulário não o terá
  type: string; // Main category name (used for display if categoryId is not resolved yet)
  subcategoryId?: string | null;
  views?: number;
  bidsCount?: number;
  mediaItemIds?: string[];
  galleryImageUrls?: string[]; 
  allowInstallmentBids?: boolean;
};

export type LotDbData = Omit<LotFormData, 'type' | 'auctionName' | 'sellerName' | 'auctioneerName' | 'subcategoryName' > & {
  categoryId?: string;
  auctioneerId?: string;
  sellerId?: string;
  subcategoryId?: string;
};

export type BidInfo = {
  id: string;
  lotId: string;
  auctionId: string;
  bidderId: string; 
  bidderDisplay: string; 
  amount: number;
  timestamp: AnyTimestamp;
};

export type Review = {
  id: string;
  lotId: string;
  auctionId: string; 
  userId: string;
  userDisplayName: string;
  rating: number; 
  comment: string;
  createdAt: AnyTimestamp;
  updatedAt?: AnyTimestamp;
};

export type LotQuestion = {
  id: string;
  lotId: string;
  auctionId: string;
  userId: string;
  userDisplayName: string;
  questionText: string;
  createdAt: AnyTimestamp;
  answerText?: string;
  answeredAt?: AnyTimestamp;
  answeredByUserId?: string; 
  answeredByUserDisplayName?: string;
  isPublic?: boolean; 
};

export type UserDocumentStatus = 'NOT_SENT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PENDING_ANALYSIS';
export type UserHabilitationStatus = 'PENDING_DOCUMENTS' | 'PENDING_ANALYSIS' | 'HABILITADO' | 'REJECTED_DOCUMENTS' | 'BLOCKED';

export interface DocumentType {
  id: string;
  name: string;
  description?: string;
  isRequired: boolean;
  allowedFormats?: string[]; 
  displayOrder?: number;
}

export interface UserDocument {
  id: string;
  documentTypeId: string;
  userId: string;
  fileUrl?: string; 
  status: UserDocumentStatus;
  uploadDate?: AnyTimestamp;
  analysisDate?: AnyTimestamp;
  analystId?: string; 
  rejectionReason?: string;
  documentType: DocumentType; 
}

export type UserBidStatus = 'GANHANDO' | 'PERDENDO' | 'SUPERADO' | 'ARREMATADO' | 'NAO_ARREMATADO';
export type PaymentStatus = 'PENDENTE' | 'PROCESSANDO' | 'PAGO' | 'FALHOU' | 'REEMBOLSADO';

export interface UserBid {
  id: string;
  lotId: string;
  auctionId: string;
  lotTitle: string;
  lotImageUrl: string;
  lotImageAiHint?: string;
  userBidAmount: number;
  currentLotPrice: number;
  bidStatus: UserBidStatus;
  bidDate: AnyTimestamp;
  lotEndDate: AnyTimestamp;
}

export interface UserWin {
  id: string;
  lot: Lot; 
  winningBidAmount: number;
  winDate: AnyTimestamp;
  paymentStatus: PaymentStatus;
  invoiceUrl?: string; 
}


export interface UserProfileData {
  uid: string;
  email: string;
  fullName: string | null;
  password?: string; 
  roleId?: string | null;
  roleName?: string; 
  permissions?: string[]; 
  habilitationStatus?: UserHabilitationStatus;
  cpf?: string | null;
  rgNumber?: string | null;
  rgIssuer?: string | null;
  rgIssueDate?: AnyTimestamp | null;
  rgState?: string | null;
  dateOfBirth?: AnyTimestamp | null;
  cellPhone?: string | null;
  homePhone?: string | null;
  gender?: string | null;
  profession?: string | null;
  nationality?: string | null;
  maritalStatus?: string | null;
  propertyRegime?: string | null; 
  spouseName?: string | null;
  spouseCpf?: string | null;
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  status?: string; 
  optInMarketing?: boolean;
  createdAt?: AnyTimestamp;
  updatedAt?: AnyTimestamp;
  avatarUrl?: string | null;
  dataAiHint?: string | null;
  activeBids?: number;
  auctionsWon?: number;
  itemsSold?: number; 
  sellerProfileId?: string; 
  accountType?: 'PHYSICAL' | 'LEGAL' | 'DIRECT_SALE_CONSIGNOR';
  razaoSocial?: string | null;
  cnpj?: string | null;
  inscricaoEstadual?: string | null;
  websiteComitente?: string | null;
}

export type UserProfileWithPermissions = UserProfileData & {
  permissions: string[];
};

export type EditableUserProfileData = Partial<Omit<UserProfileData, 'uid' | 'email' | 'status' | 'createdAt' | 'updatedAt' | 'activeBids' | 'auctionsWon' | 'itemsSold' | 'avatarUrl' | 'dataAiHint' | 'roleId' | 'roleName' | 'sellerProfileId' | 'permissions' | 'habilitationStatus' | 'password' >> & {
  dateOfBirth?: Date | null; 
  rgIssueDate?: Date | null; 
};

export type UserFormValues = Pick<UserProfileData, 'fullName' | 'email' | 'cpf' | 'cellPhone' | 'dateOfBirth' | 'accountType' | 'razaoSocial' | 'cnpj' | 'inscricaoEstadual' | 'websiteComitente' | 'zipCode' | 'street' | 'number' | 'complement' | 'neighborhood' | 'city' | 'state' | 'optInMarketing'> & {
  password?: string;
  roleId?: string | null; 
};

export interface SqlAuthResult {
  success: boolean;
  message: string;
  user?: UserProfileData; 
}

export type DirectSaleOfferType = 'BUY_NOW' | 'ACCEPTS_PROPOSALS';
export type DirectSaleOfferStatus = 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'PENDING_APPROVAL';


export interface DirectSaleOffer {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    dataAiHint?: string;
    galleryImageUrls?: string[];
    offerType: DirectSaleOfferType;
    price?: number; 
    minimumOfferPrice?: number; 
    category: string; 
    locationCity?: string;
    locationState?: string; 
    sellerName: string;
    sellerId?: string; 
    sellerLogoUrl?: string;
    dataAiHintSellerLogo?: string;
    status: DirectSaleOfferStatus;
    itemsIncluded?: string[]; 
    tags?: string[]; 
    views?: number;
    proposalsCount?: number; 
    createdAt: AnyTimestamp;
    updatedAt: AnyTimestamp;
    expiresAt?: AnyTimestamp; 
    latitude?: number | null;
    longitude?: number | null;
    mapAddress?: string | null; 
    mapEmbedUrl?: string | null; 
    mapStaticImageUrl?: string | null; 
}

export interface ThemeColors {
  [colorVariable: string]: string; 
}

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

export interface PlatformSettings {
  id: 'global'; 
  siteTitle?: string;
  siteTagline?: string;
  galleryImageBasePath: string; 
  storageProvider?: StorageProviderType;
  firebaseStorageBucket?: string | null;
  activeThemeName?: string | null;
  themes?: Theme[];
  platformPublicIdMasks?: {
    auctions?: string; 
    lots?: string;     
    auctioneers?: string;
    sellers?: string;
  };
  homepageSections?: HomepageSectionConfig[];
  mentalTriggerSettings?: MentalTriggerSettings;
  sectionBadgeVisibility?: SectionBadgeConfig;
  mapSettings?: MapSettings;
  
  searchPaginationType?: SearchPaginationType;
  searchItemsPerPage?: number;
  searchLoadMoreCount?: number;
  showCountdownOnLotDetail?: boolean;
  showCountdownOnCards?: boolean;
  showRelatedLotsOnLotDetail?: boolean;
  relatedLotsCount?: number;

  updatedAt: AnyTimestamp;
}

export type PlatformSettingsFormData = Omit<PlatformSettings, 'id' | 'updatedAt'> & {
    homepageSections?: HomepageSectionConfig[]; 
    mentalTriggerSettings?: MentalTriggerSettings;
    sectionBadgeVisibility?: SectionBadgeConfig;
    mapSettings?: MapSettings;
    searchPaginationType?: SearchPaginationType;
    searchItemsPerPage?: number;
    searchLoadMoreCount?: number;
    showCountdownOnLotDetail?: boolean;
    showCountdownOnCards?: boolean;
    showRelatedLotsOnLotDetail?: boolean;
    relatedLotsCount?: number;
};


export interface MediaItem {
  id: string;
  fileName: string;
  uploadedAt: AnyTimestamp;
  uploadedBy?: string; 
  storagePath?: string; // Path within the storage provider (e.g., 'uploads/media/file.jpg')
  title?: string | null;
  altText?: string | null;
  caption?: string | null;
  description?: string | null;
  mimeType: string; 
  sizeBytes: number;
  dimensions?: { width: number; height: number }; 
  urlOriginal: string; 
  urlThumbnail?: string | null;
  urlMedium?: string | null;
  urlLarge?: string | null;
  linkedLotIds?: string[]; 
  dataAiHint?: string | null; 
}

export interface Role {
  id: string;
  name: string;
  name_normalized: string; 
  description?: string;
  permissions: string[];
  createdAt: AnyTimestamp;
  updatedAt: AnyTimestamp;
}

export type RoleFormData = Omit<Role, 'id' | 'name_normalized' | 'createdAt' | 'updatedAt'>;

export interface IStorageAdapter {
  upload(fileName: string, contentType: string, buffer: Buffer): Promise<{ publicUrl: string; storagePath: string; }>;
  delete(storagePath: string): Promise<{ success: boolean; message: string; }>;
}


export interface IDatabaseAdapter {
  initializeSchema(): Promise<{ success: boolean; message: string; errors?: any[], rolesProcessed?: number }>;

  createLotCategory(data: { name: string; description?: string }): Promise<{ success: boolean; message: string; categoryId?: string }>;
  getLotCategories(): Promise<LotCategory[]>;
  getLotCategory(idOrSlug: string): Promise<LotCategory | null>; 
  getLotCategoryByName(name: string): Promise<LotCategory | null>;
  updateLotCategory(id: string, data: { name: string; description?: string, hasSubcategories?: boolean }): Promise<{ success: boolean; message: string }>;
  deleteLotCategory(id: string): Promise<{ success: boolean; message: string }>;

  createSubcategory(data: SubcategoryFormData): Promise<{ success: boolean; message: string; subcategoryId?: string; }>;
  getSubcategories(parentCategoryId: string): Promise<Subcategory[]>;
  getSubcategory(id: string): Promise<Subcategory | null>;
  getSubcategoryBySlug(slug: string, parentCategoryId: string): Promise<Subcategory | null>;
  updateSubcategory(id: string, data: Partial<SubcategoryFormData>): Promise<{ success: boolean; message: string; }>;
  deleteSubcategory(id: string): Promise<{ success: boolean; message: string; }>;

  createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string }>;
  getStates(): Promise<StateInfo[]>;
  getState(idOrSlugOrUf: string): Promise<StateInfo | null>;
  updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string }>;
  deleteState(id: string): Promise<{ success: boolean; message: string }>;

  createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string }>;
  getCities(stateIdOrSlugFilter?: string): Promise<CityInfo[]>;
  getCity(idOrCompositeSlug: string): Promise<CityInfo | null>; 
  updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string }>;
  deleteCity(id: string): Promise<{ success: boolean; message: string }>;

  createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; auctioneerPublicId?: string }>;
  getAuctioneers(): Promise<AuctioneerProfileInfo[]>;
  getAuctioneer(idOrPublicId: string): Promise<AuctioneerProfileInfo | null>;
  updateAuctioneer(idOrPublicId: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string }>;
  deleteAuctioneer(idOrPublicId: string): Promise<{ success: boolean; message: string }>;
  getAuctioneerBySlug(slugOrPublicId: string): Promise<AuctioneerProfileInfo | null>;
  getAuctioneerByName(name: string): Promise<AuctioneerProfileInfo | null>;


  createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; sellerPublicId?: string; }>;
  getSellers(): Promise<SellerProfileInfo[]>;
  getSeller(idOrPublicId: string): Promise<SellerProfileInfo | null>;
  updateSeller(idOrPublicId: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string }>;
  deleteSeller(idOrPublicId: string): Promise<{ success: boolean; message: string }>;
  getSellerBySlug(slugOrPublicId: string): Promise<SellerProfileInfo | null>;
  getSellerByName(name: string): Promise<SellerProfileInfo | null>;

  createAuction(data: AuctionDbData): Promise<{ success: boolean; message: string; auctionId?: string; auctionPublicId?: string }>;
  getAuctions(): Promise<Auction[]>;
  getAuction(idOrPublicId: string): Promise<Auction | null>;
  updateAuction(idOrPublicId: string, data: Partial<AuctionDbData>): Promise<{ success: boolean; message: string }>;
  deleteAuction(idOrPublicId: string): Promise<{ success: boolean; message: string }>;
  getAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]>;


  createLot(data: LotDbData): Promise<{ success: boolean; message: string; lotId?: string; lotPublicId?: string; }>;
  getLots(auctionIdParam?: string): Promise<Lot[]>; 
  getLot(idOrPublicId: string): Promise<Lot | null>;
  updateLot(idOrPublicId: string, data: Partial<LotDbData>): Promise<{ success: boolean; message: string }>;
  deleteLot(idOrPublicId: string, auctionId?: string): Promise<{ success: boolean; message: string }>;
  getBidsForLot(lotIdOrPublicId: string): Promise<BidInfo[]>;
  placeBidOnLot(lotIdOrPublicId: string, auctionIdOrPublicId: string, userId: string, userDisplayName: string, bidAmount: number): Promise<{ success: boolean; message: string; updatedLot?: Partial<Pick<Lot, 'price' | 'bidsCount' | 'status'>>; newBid?: BidInfo }>;
  getReviewsForLot(lotIdOrPublicId: string): Promise<Review[]>;
  createReview(review: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; message: string; reviewId?: string }>;
  getQuestionsForLot(lotIdOrPublicId: string): Promise<LotQuestion[]>;
  createQuestion(question: Omit<LotQuestion, 'id' | 'createdAt' | 'answeredAt' | 'answeredByUserId' | 'answeredByUserDisplayName' | 'isPublic'>): Promise<{ success: boolean; message: string; questionId?: string }>;
  answerQuestion(lotId: string, questionId: string, answerText: string, answeredByUserId: string, answeredByUserDisplayName: string): Promise<{ success: boolean; message: string }>;

  getUserProfileData(userId: string): Promise<UserProfileData | null>;
  updateUserProfile(userId: string, data: EditableUserProfileData): Promise<{ success: boolean; message: string; }>;
  ensureUserRole(
    userId: string,
    email: string,
    fullName: string | null,
    targetRoleName: string,
    additionalProfileData?: Partial<Pick<UserProfileData, 'cpf' | 'cellPhone' | 'dateOfBirth' | 'password' | 'accountType' | 'razaoSocial' | 'cnpj' | 'inscricaoEstadual' | 'websiteComitente' | 'zipCode' | 'street' | 'number' | 'complement' | 'neighborhood' | 'city' | 'state' | 'optInMarketing' >>,
    roleIdToAssign?: string
  ): Promise<{ success: boolean; message: string; userProfile?: UserProfileData; }>;
  getUsersWithRoles(): Promise<UserProfileData[]>;
  updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }>;
  deleteUserProfile(userId: string): Promise<{ success: boolean; message: string; }>;
  getUserByEmail(email: string): Promise<UserProfileData | null>;
  
  createRole(data: RoleFormData): Promise<{ success: boolean; message: string; roleId?: string }>;
  getRoles(): Promise<Role[]>;
  getRole(id: string): Promise<Role | null>;
  getRoleByName(name: string): Promise<Role | null>;
  updateRole(id: string, data: Partial<RoleFormData>): Promise<{ success: boolean; message: string }>;
  deleteRole(id: string): Promise<{ success: boolean; message: string }>;
  ensureDefaultRolesExist(): Promise<{ success: boolean; message: string; rolesProcessed?: number }>;

  createMediaItem(data: Omit<MediaItem, 'id' | 'uploadedAt' | 'urlOriginal' | 'urlThumbnail' | 'urlMedium' | 'urlLarge' | 'storagePath'>, filePublicUrl: string, uploadedBy?: string): Promise<{ success: boolean; message: string; item?: MediaItem }>;
  getMediaItems(): Promise<MediaItem[]>;
  updateMediaItemMetadata(id: string, metadata: Partial<Pick<MediaItem, 'title' | 'altText' | 'caption' | 'description'>>): Promise<{ success: boolean; message: string; }>;
  deleteMediaItemFromDb(id: string): Promise<{ success: boolean; message: string; }>;
  linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string; }>;
  unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string; }>;
  
  getPlatformSettings(): Promise<PlatformSettings>;
  updatePlatformSettings(data: PlatformSettingsFormData): Promise<{ success: boolean; message: string; }>;
}

export type UserCreationData = Pick<UserProfileData, 'fullName' | 'email' | 'cpf' | 'cellPhone' | 'dateOfBirth' | 'accountType' | 'razaoSocial' | 'cnpj' | 'inscricaoEstadual' | 'websiteComitente' | 'zipCode' | 'street' | 'number' | 'complement' | 'neighborhood' | 'city' | 'state' | 'optInMarketing'> & {
  password?: string;
  roleId?: string | null; 
};

export interface RecentlyViewedLotInfo {
  id: string;
  title: string;
  imageUrl: string;
  auctionId: string;
  dataAiHint?: string;
}

  

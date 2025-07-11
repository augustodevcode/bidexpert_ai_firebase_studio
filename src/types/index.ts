// src/types/index.ts

export type AuctionStatus = 'RASCUNHO' | 'EM_PREPARACAO' | 'EM_BREVE' | 'ABERTO' | 'ABERTO_PARA_LANCES' | 'ENCERRADO' | 'FINALIZADO' | 'CANCELADO' | 'SUSPENSO';
export const auctionStatusValues: [AuctionStatus, ...AuctionStatus[]] = [
  'RASCUNHO', 'EM_PREPARACAO', 'EM_BREVE', 'ABERTO', 'ABERTO_PARA_LANCES', 'ENCERRADO', 'FINALIZADO', 'CANCELADO', 'SUSPENSO'
];

export type LotStatus = 'RASCUNHO' | 'EM_BREVE' | 'ABERTO_PARA_LANCES' | 'ENCERRADO' | 'VENDIDO' | 'NAO_VENDIDO' | 'CANCELADO';
export const lotStatusValues: [LotStatus, ...LotStatus[]] = [
  'RASCUNHO', 'EM_BREVE', 'ABERTO_PARA_LANCES', 'ENCERRADO', 'VENDIDO', 'NAO_VENDIDO', 'CANCELADO'
];

export type UserHabilitationStatus = 'PENDING_DOCUMENTS' | 'PENDING_ANALYSIS' | 'HABILITADO' | 'REJECTED_DOCUMENTS' | 'BLOCKED';

export type UserDocumentStatus = 'NOT_SENT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PENDING_ANALYSIS';

export type PaymentStatus = 'PENDENTE' | 'PROCESSANDO' | 'PAGO' | 'FALHOU' | 'REEMBOLSADO' | 'CANCELADO';
export const paymentStatusValues: [PaymentStatus, ...PaymentStatus[]] = [
  'PENDENTE', 'PROCESSANDO', 'PAGO', 'FALHOU', 'REEMBOLSADO', 'CANCELADO'
];

export type DirectSaleOfferStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'SOLD' | 'EXPIRED' | 'RASCUNHO';
export type DirectSaleOfferType = 'BUY_NOW' | 'ACCEPTS_PROPOSALS';

export type ProcessPartyType = 'AUTOR' | 'REU' | 'ADVOGADO_AUTOR' | 'ADVOGADO_REU' | 'JUIZ' | 'ESCRIVAO' | 'PERITO' | 'ADMINISTRADOR_JUDICIAL' | 'TERCEIRO_INTERESSADO' | 'OUTRO';

export type AccountType = 'PHYSICAL' | 'LEGAL' | 'DIRECT_SALE_CONSIGNOR';

export type BadgeVisibilitySettings = {
  showStatusBadge?: boolean;
  showDiscountBadge?: boolean;
  showUrgencyTimer?: boolean;
  showPopularityBadge?: boolean;
  showHotBidBadge?: boolean;
  showExclusiveBadge?: boolean;
};

export type MentalTriggerSettings = {
    showDiscountBadge: boolean;
    showUrgencyTimer: boolean;
    urgencyTimerThresholdDays: number;
    urgencyTimerThresholdHours: number;
    showPopularityBadge: boolean;
    popularityViewThreshold: number;
    showHotBidBadge: boolean;
    hotBidThreshold: number;
    showExclusiveBadge: boolean;
}

export type StorageProviderType = 'local' | 'firebase';

export type SearchPaginationType = 'loadMore' | 'numberedPages';

export type MapProvider = 'google' | 'openstreetmap' | 'staticImage';

export interface MapSettings {
  defaultProvider: MapProvider;
  googleMapsApiKey?: string | null;
  staticImageMapZoom: number;
  staticImageMapMarkerColor: string;
}

export interface VariableIncrementRule {
    from: number;
    to: number | null;
    increment: number;
}

export interface BiddingSettings {
    instantBiddingEnabled: boolean;
    getBidInfoInstantly: boolean;
    biddingInfoCheckIntervalSeconds: number;
}


export interface PlatformSettings {
    id: string;
    siteTitle: string;
    siteTagline?: string;
    galleryImageBasePath: string;
    storageProvider: StorageProviderType;
    firebaseStorageBucket?: string | null;
    activeThemeName?: string | null;
    themes: {
        name: string;
        colors: Record<string, string>;
    }[];
    platformPublicIdMasks?: {
        auctions?: string;
        lots?: string;
        auctioneers?: string;
        sellers?: string;
    } | null;
    homepageSections: {
        id: string;
        type: string;
        title: string;
        visible: boolean;
        order: number;
        itemCount?: number;
    }[];
    mentalTriggerSettings?: MentalTriggerSettings;
    sectionBadgeVisibility?: {
        featuredLots?: BadgeVisibilitySettings;
        searchGrid?: BadgeVisibilitySettings;
        searchList?: BadgeVisibilitySettings;
        lotDetail?: BadgeVisibilitySettings;
    };
    mapSettings?: MapSettings;
    searchPaginationType: SearchPaginationType;
    searchItemsPerPage: number;
    searchLoadMoreCount: number;
    showCountdownOnLotDetail: boolean;
    showCountdownOnCards: boolean;
    showRelatedLotsOnLotDetail: boolean;
    relatedLotsCount: number;
    defaultUrgencyTimerHours?: number;
    variableIncrementTable?: VariableIncrementRule[];
    biddingSettings?: BiddingSettings;
    defaultListItemsPerPage?: number;
    updatedAt: string | Date;
}


export interface Lot {
  id: string;
  publicId: string;
  auctionId: string;
  auctionPublicId?: string; // Optional public ID of parent auction
  number: string;
  title: string;
  description?: string;
  price: number;
  initialPrice?: number | null;
  secondInitialPrice?: number | null;
  bidIncrementStep?: number | null;
  status: LotStatus;
  bidsCount?: number;
  views?: number;
  isFeatured?: boolean;
  isFavorite?: boolean;
  isExclusive?: boolean;
  discountPercentage?: number | null;
  additionalTriggers?: string[];
  imageUrl?: string;
  imageMediaId?: string | null;
  galleryImageUrls?: string[];
  mediaItemIds?: string[];
  bemIds?: string[];
  bens?: Bem[]; // Populated on demand
  type: string;
  categoryId?: string;
  subcategoryName?: string;
  subcategoryId?: string;
  auctionName?: string; // Denormalized for display
  sellerName?: string;  // Denormalized for display
  sellerId?: string;
  auctioneerId?: string;
  cityId?: string;
  stateId?: string;
  cityName?: string;
  stateUf?: string;
  latitude?: number | null;
  longitude?: number | null;
  mapAddress?: string | null;
  mapEmbedUrl?: string | null;
  mapStaticImageUrl?: string | null;
  endDate?: string | Date | null;
  auctionDate?: string | Date; // inherited from parent auction
  lotSpecificAuctionDate?: string | Date | null;
  secondAuctionDate?: string | Date | null;
  condition?: string;
  dataAiHint?: string;
  winnerId?: string | null;
  winningBidTermUrl?: string | null;
  allowInstallmentBids?: boolean;
  // Vehicle specific from Bem
  year?: number;
  make?: string;
  model?: string;
  series?: string;
  odometer?: number;
  hasKey?: boolean;
  vin?: string;
  fuelType?: string;
  transmissionType?: string;
  
  // Vehicle condition from Lot
  primaryDamage?: string;
  secondaryDamage?: string;
  lossType?: string;
  titleBrand?: string;
  vinStatus?: string;
  titleInfo?: string;
  bodyStyle?: string;
  driveLineType?: string;
  cylinders?: string;
  restraintSystem?: string;
  exteriorInteriorColor?: string;
  options?: string;
  manufacturedIn?: string;
  vehicleClass?: string;
  vehicleLocationInBranch?: string;
  laneRunNumber?: string;
  aisleStall?: string;
  startCode?: string;
  airbagsStatus?: string;
  // Financial from Lot
  actualCashValue?: number;
  estimatedRepairCost?: number;
  // Judicial Process from Lot
  judicialProcessNumber?: string;
  courtDistrict?: string;
  courtName?: string;
  publicProcessUrl?: string;
  propertyRegistrationNumber?: string;
  propertyLiens?: string;
  knownDebts?: string;
  additionalDocumentsInfo?: string;
  // Bidding from Lot
  reservePrice?: number | null;
  evaluationValue?: number | null;
  debtAmount?: number | null;
  itbiValue?: number | null;
  
  // Timestamps
  createdAt: string | Date;
  updatedAt: string | Date;
}


export interface Auction {
  id: string;
  publicId: string;
  title: string;
  description: string;
  status: AuctionStatus;
  auctionDate: string | Date;
  endDate?: string | Date | null;
  totalLots?: number;
  category?: string;
  auctioneer: string;
  auctioneerId?: string;
  auctioneerLogoUrl?: string; // Denormalized for display
  seller?: string;
  sellerId?: string;
  mapAddress?: string | null;
  imageUrl?: string;
  imageMediaId?: string | null;
  dataAiHint?: string;
  isFavorite?: boolean;
  visits?: number;
  lots?: Lot[]; // Populated on demand
  initialOffer?: number; // Lowest starting price among lots
  auctionType?: 'JUDICIAL' | 'EXTRAJUDICIAL' | 'PARTICULAR' | 'TOMADA_DE_PRECOS' | 'DUTCH' | 'SILENT';
  auctionStages?: AuctionStage[];
  documentsUrl?: string;
  evaluationReportUrl?: string | null;
  auctionCertificateUrl?: string | null;
  sellingBranch?: string;
  automaticBiddingEnabled: boolean;
  silentBiddingEnabled: boolean;
  allowMultipleBidsPerUser: boolean;
  allowInstallmentBids: boolean;
  softCloseEnabled: boolean;
  softCloseMinutes: number;
  estimatedRevenue?: number;
  achievedRevenue?: number;
  totalHabilitatedUsers?: number;
  isFeaturedOnMarketplace: boolean;
  marketplaceAnnouncementTitle?: string | null;
  judicialProcessId?: string;
  additionalTriggers?: string[];
  // Dutch Auction Specific
  decrementAmount?: number | null;
  decrementIntervalSeconds?: number | null;
  floorPrice?: number | null;
  // Timestamps
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AuctionStage {
  name: string;
  endDate: string | Date;
  statusText?: string;
  initialPrice?: number;
}


export interface RecentlyViewedLotInfo {
  id: string;
  title: string;
  imageUrl?: string;
  auctionId: string;
  dataAiHint?: string;
}

export interface UserProfileData {
  uid: string;
  email: string;
  password?: string;
  fullName: string;
  cpf?: string;
  cellPhone?: string;
  razaoSocial?: string;
  cnpj?: string;
  dateOfBirth?: string | Date | null;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  avatarUrl?: string;
  dataAiHint?: string;
  roleId: string | null;
  sellerId?: string | null;
  habilitationStatus: UserHabilitationStatus;
  accountType: AccountType;
  badges?: string[];
  optInMarketing?: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  
  // Detalhes PF
  rgNumber?: string;
  rgIssuer?: string;
  rgIssueDate?: string | Date | null;
  rgState?: string;
  homePhone?: string;
  gender?: string;
  profession?: string;
  nationality?: string;
  maritalStatus?: string;
  propertyRegime?: string;
  spouseName?: string;
  spouseCpf?: string;

  // Detalhes PJ
  inscricaoEstadual?: string;
  website?: string;
  responsibleName?: string;
  responsibleCpf?: string;
}

export interface UserProfileWithPermissions extends UserProfileData {
  roleName?: string;
  permissions: string[];
}

export interface Role {
  id: string;
  name: string;
  name_normalized: string;
  description: string;
  permissions: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
}


export interface UserBid {
  id: string;
  user: UserProfileData;
  amount: number;
  date: string | Date;
  lot: Lot;
  bidStatus: 'GANHANDO' | 'PERDENDO' | 'ARREMATADO' | 'NAO_ARREMATADO' | 'ENCERRADO' | 'CANCELADO';
  userBidAmount: number;
}

export interface BidInfo {
  id: string;
  lotId: string;
  auctionId: string;
  bidderId: string;
  bidderDisplay: string;
  amount: number;
  timestamp: string | Date;
}

export interface UserWin {
    id: string;
    lotId: string;
    userId: string;
    winningBidAmount: number;
    winDate: string | Date;
    paymentStatus: PaymentStatus;
    invoiceUrl?: string;
    lot?: Lot;
}

export interface LotCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  itemCount?: number;
  hasSubcategories: boolean;
  logoUrl?: string;
  logoMediaId?: string | null;
  dataAiHintLogo?: string | null;
  coverImageUrl?: string;
  coverImageMediaId?: string | null;
  dataAiHintCover?: string | null;
  megaMenuImageUrl?: string;
  megaMenuImageMediaId?: string | null;
  dataAiHintMegaMenu?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  parentCategoryId: string;
  parentCategoryName?: string;
  description?: string | null;
  itemCount?: number;
  displayOrder: number;
  iconUrl?: string | null;
  iconMediaId?: string | null;
  dataAiHintIcon?: string | null;
}

export interface StateInfo {
  id: string;
  name: string;
  uf: string;
  slug: string;
  cityCount?: number;
}

export interface CityInfo {
  id: string;
  name: string;
  slug: string;
  stateId: string;
  stateUf: string;
  ibgeCode?: string;
  lotCount?: number;
}

export interface AuctioneerProfileInfo {
  id: string;
  publicId: string;
  slug: string;
  name: string;
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
  userId?: string | null; // User account linked to this auctioneer
  memberSince?: string | Date;
  rating?: number;
  auctionsConductedCount?: number;
  totalValueSold?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface SellerProfileInfo {
  id: string;
  publicId: string;
  slug: string;
  name: string;
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
  userId?: string | null;
  memberSince?: string | Date;
  rating?: number;
  activeLotsCount?: number;
  totalSalesValue?: number;
  auctionsFacilitatedCount?: number;
  isJudicial: boolean;
  judicialBranchId?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface DirectSaleOffer {
    id: string;
    publicId: string;
    title: string;
    description: string;
    offerType: DirectSaleOfferType;
    price?: number;
    minimumOfferPrice?: number;
    status: DirectSaleOfferStatus;
    category: string;
    sellerId: string;
    sellerName: string;
    sellerLogoUrl?: string;
    dataAiHintSellerLogo?: string;
    locationCity?: string;
    locationState?: string;
    imageUrl?: string;
    imageMediaId?: string | null;
    dataAiHint?: string;
    galleryImageUrls?: string[];
    mediaItemIds?: string[];
    itemsIncluded?: string[];
    views?: number;
    expiresAt?: string | Date;
    createdAt: string | Date;
    updatedAt: string | Date;
}

export interface DocumentType {
    id: string;
    name: string;
    description: string;
    isRequired: boolean;
    appliesTo: 'PHYSICAL' | 'LEGAL' | 'ALL';
}

export interface UserDocument {
    id: string;
    userId: string;
    documentTypeId: string;
    status: UserDocumentStatus;
    fileUrl: string;
    rejectionReason?: string | null;
    documentType: DocumentType;
}

export interface Notification {
    id: string;
    userId: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string | Date;
}

export interface UserLotMaxBid {
    id: string;
    userId: string;
    lotId: string;
    maxAmount: number;
    isActive: boolean;
    createdAt: string | Date;
}

export interface MediaItem {
    id: string;
    fileName: string;
    storagePath: string;
    title: string;
    altText?: string;
    caption?: string;
    description?: string;
    mimeType: string;
    sizeBytes: number;
    urlOriginal: string;
    urlThumbnail: string;
    urlMedium?: string;
    urlLarge?: string;
    linkedLotIds: string[];
    dataAiHint?: string;
    uploadedBy: string; // userId
    uploadedAt: string | Date;
}

export interface Court {
  id: string;
  name: string;
  slug: string;
  stateUf: string;
  website: string;
}

export interface JudicialDistrict {
  id: string;
  name: string;
  slug: string;
  courtId: string;
  courtName?: string;
  stateId: string;
  stateUf?: string;
  zipCode?: string;
}

export interface JudicialBranch {
  id: string;
  name: string;
  slug: string;
  districtId: string;
  districtName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
}

export interface ProcessParty {
  id: string;
  name: string;
  documentNumber?: string;
  partyType: ProcessPartyType;
}

export interface JudicialProcess {
  id: string;
  publicId: string;
  processNumber: string;
  isElectronic: boolean;
  courtId: string;
  courtName?: string;
  districtId: string;
  districtName?: string;
  branchId: string;
  branchName?: string;
  sellerId?: string | null; // The associated seller (Comitente)
  sellerName?: string;
  parties: ProcessParty[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Bem {
  id: string;
  publicId: string;
  title: string;
  description?: string | null;
  status: 'CADASTRO' | 'DISPONIVEL' | 'LOTEADO' | 'VENDIDO' | 'REMOVIDO' | 'INATIVADO';
  categoryId: string;
  categoryName?: string;
  subcategoryId?: string | null;
  subcategoryName?: string;
  judicialProcessId?: string | null;
  judicialProcessNumber?: string;
  sellerId?: string | null;
  sellerName?: string;
  evaluationValue?: number | null;
  imageUrl?: string | null;
  imageMediaId?: string | null;
  galleryImageUrls?: string[] | null;
  mediaItemIds?: string[] | null;
  dataAiHint?: string;
  locationCity?: string;
  locationState?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;

  // Veículos
  plate?: string | null;
  make?: string | null;
  model?: string | null;
  version?: string | null;
  year?: number | null;
  modelYear?: number | null;
  mileage?: number | null;
  color?: string | null;
  fuelType?: string | null;
  transmissionType?: string | null;
  bodyType?: string | null;
  vin?: string | null;
  renavam?: string | null;
  enginePower?: string | null;
  numberOfDoors?: number | null;
  vehicleOptions?: string | null;
  detranStatus?: string | null;
  debts?: string | null;
  runningCondition?: string | null;
  bodyCondition?: string | null;
  tiresCondition?: string | null;
  hasKey?: boolean;

  // Imóveis
  propertyType?: string | null;
  propertyRegistrationNumber?: string | null;
  iptuNumber?: string | null;
  isOccupied?: boolean;
  area?: number | null;
  totalArea?: number | null;
  builtArea?: number | null;
  bedrooms?: number | null;
  suites?: number | null;
  bathrooms?: number | null;
  parkingSpaces?: number | null;
  constructionType?: string | null;
  finishes?: string | null;
  infrastructure?: string | null;
  condoDetails?: string | null;
  improvements?: string | null;
  topography?: string | null;
  liensAndEncumbrances?: string | null;
  propertyDebts?: string | null;
  unregisteredRecords?: string | null;
  hasHabiteSe?: boolean;
  zoningRestrictions?: string | null;
  amenities?: { value: string }[];

  // Eletrônicos
  brand?: string | null;
  serialNumber?: string | null;
  itemCondition?: string | null;
  specifications?: string | null;
  includedAccessories?: string | null;
  batteryCondition?: string | null;
  hasInvoice?: boolean;
  hasWarranty?: boolean;
  repairHistory?: string | null;
  
  // Eletrodomésticos
  applianceCapacity?: string | null;
  voltage?: string | null;
  applianceType?: string | null;
  additionalFunctions?: string | null;
  
  // Máquinas e Equipamentos
  hoursUsed?: number | null;
  engineType?: string | null;
  capacityOrPower?: string | null;
  maintenanceHistory?: string | null;
  installationLocation?: string | null;
  compliesWithNR?: string | null;
  operatingLicenses?: string | null;
  
  // Semoventes (Livestock)
  breed?: string | null;
  age?: string | null;
  sex?: 'Macho' | 'Fêmea' | null;
  weight?: string | null;
  individualId?: string | null;
  purpose?: string | null;
  sanitaryCondition?: string | null;
  vaccinationStatus?: string | null;
  lineage?: string | null;
  isPregnant?: boolean;
  specialSkills?: string | null;
  gtaDocument?: string | null;
  breedRegistryDocument?: string | null;
  
  // Timestamps
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CnjProcessSource {
  numeroProcesso: string;
  formato: { nome: string; };
  tribunal: string;
  classe: { codigo: number; nome: string; };
  assuntos: { codigo: number; nome: string; }[][]; // Array of arrays
  dataAjuizamento: string;
  orgaoJulgador: { codigo: number; nome: string; };
}

export interface CnjHit {
  _index: string;
  _id: string;
  _score: number;
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
    max_score: number;
    hits: CnjHit[];
  };
}

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

export interface ConsignorDashboardStats {
    totalLotsConsigned: number;
    activeLots: number;
    soldLots: number;
    totalSalesValue: number;
    salesRate: number;
    salesData: { name: string; sales: number }[];
}

// ============================================================================
// DATABASE ADAPTER INTERFACE
// ============================================================================
export interface SubcategoryFormData {
  name: string;
  parentCategoryId: string;
  description?: string | null;
  displayOrder?: number;
  iconUrl?: string | null;
  iconMediaId?: string | null;
  dataAiHintIcon?: string | null;
}

export interface DatabaseAdapter {
    getLots(auctionId?: string): Promise<Lot[]>;
    getLot(id: string): Promise<Lot | null>;
    createLot(lotData: Partial<Lot>): Promise<{ success: boolean; message: string; lotId?: string; }>;
    updateLot(id: string, updates: Partial<Lot>): Promise<{ success: boolean; message: string; }>;
    deleteLot(id: string): Promise<{ success: boolean; message: string; }>;
    
    getAuctions(): Promise<Auction[]>;
    getAuction(id: string): Promise<Auction | null>;
    createAuction(auctionData: Partial<Auction>): Promise<{ success: boolean; message: string; auctionId?: string; }>;
    updateAuction(id: string, updates: Partial<Auction>): Promise<{ success: boolean; message: string; }>;
    deleteAuction(id: string): Promise<{ success: boolean, message: string }>;

    getLotsByIds(ids: string[]): Promise<Lot[]>;
    getLotCategories(): Promise<LotCategory[]>;
    
    getSubcategoriesByParent(parentCategoryId: string): Promise<Subcategory[]>;
    getSubcategory(id: string): Promise<Subcategory | null>;
    createLotCategory(data: Partial<LotCategory>): Promise<{ success: boolean, message: string }>;
    createSubcategory(data: Partial<Subcategory>): Promise<{ success: boolean, message: string }>;
    updateSubcategory(id: string, data: Partial<SubcategoryFormData>): Promise<{ success: boolean; message: string }>;
    deleteSubcategory(id: string): Promise<{ success: boolean; message: string }>;

    getSellers(): Promise<SellerProfileInfo[]>;
    getAuctioneers(): Promise<AuctioneerProfileInfo[]>;

    getUsersWithRoles(): Promise<UserProfileData[]>;
    getUserProfileData(userId: string): Promise<UserProfileData | null>;
    getRoles(): Promise<Role[]>;
    updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }>;

    getMediaItems(): Promise<MediaItem[]>;
    createMediaItem(item: Partial<Omit<MediaItem, 'id'>>, url: string, userId: string): Promise<{ success: boolean; message: string; item?: MediaItem; }>;

    getPlatformSettings(): Promise<PlatformSettings | null>;
    updatePlatformSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }>;
}

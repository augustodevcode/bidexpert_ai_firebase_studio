
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
    logoUrl?: string;
    faviconUrl?: string;
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
  id: number;
  publicId: string;
  auctionId: number;
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
  bemIds?: number[];
  bens?: Bem[]; // Populated on demand
  type: string;
  categoryId?: number;
  subcategoryName?: string;
  subcategoryId?: number;
  auctionName?: string; // Denormalized for display
  sellerName?: string;  // Denormalized for display
  sellerId?: number;
  auctioneerId?: number;
  cityId?: number;
  stateId?: number;
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
  winnerId?: number | null;
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
  id: number;
  publicId: string;
  title: string;
  description: string;
  status: AuctionStatus;
  auctionDate: string | Date;
  endDate?: string | Date | null;
  totalLots?: number;
  category?: string;
  auctioneer: string;
  auctioneerId?: number;
  auctioneerLogoUrl?: string; // Denormalized for display
  seller?: string;
  sellerId?: number;
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
  judicialProcessId?: number;
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
  id: number;
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
  roleId: number | null;
  sellerId?: number | null;
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
  id: number;
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
  lotId: number;
  auctionId: number;
  bidderId: number;
  bidderDisplay: string;
  amount: number;
  timestamp: string | Date;
}

export interface UserWin {
    id: string;
    lotId: number;
    userId: number;
    winningBidAmount: number;
    winDate: string | Date;
    paymentStatus: PaymentStatus;
    invoiceUrl?: string;
    lot?: Lot;
}

export interface LotCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  itemCount?: number;
  hasSubcategories: boolean;
  iconName?: string | null;
  dataAiHintIcon?: string | null;
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
  id: number;
  name: string;
  slug: string;
  parentCategoryId: number;
  parentCategoryName?: string;
  description?: string | null;
  itemCount?: number;
  displayOrder: number;
  iconUrl?: string | null;
  iconMediaId?: string | null;
  dataAiHintIcon?: string | null;
}

export interface StateInfo {
  id: number;
  name: string;
  uf: string;
  slug: string;
  cityCount?: number;
}

export interface CityInfo {
  id: number;
  name: string;
  slug: string;
  stateId: number;
  stateUf: string;
  ibgeCode?: string;
  lotCount?: number;
}

export interface AuctioneerProfileInfo {
  id: number;
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
  userId?: number | null; // User account linked to this auctioneer
  memberSince?: string | Date;
  rating?: number;
  auctionsConductedCount?: number;
  totalValueSold?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface SellerProfileInfo {
  id: number;
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
  userId?: number | null;
  memberSince?: string | Date;
  rating?: number;
  activeLotsCount?: number;
  totalSalesValue?: number;
  auctionsFacilitatedCount?: number;
  isJudicial: boolean;
  judicialBranchId?: number | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface DirectSaleOffer {
    id: number;
    publicId: string;
    title: string;
    description: string;
    offerType: DirectSaleOfferType;
    price?: number;
    minimumOfferPrice?: number;
    status: DirectSaleOfferStatus;
    category: string;
    sellerId: number;
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
    id: number;
    name: string;
    description: string;
    isRequired: boolean;
    appliesTo: 'PHYSICAL' | 'LEGAL' | 'ALL';
}

export interface UserDocument {
    id: string;
    userId: number;
    documentTypeId: number;
    status: UserDocumentStatus;
    fileUrl: string;
    rejectionReason?: string | null;
    documentType: DocumentType;
}

export interface Notification {
    id: string;
    userId: number;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string | Date;
}

export interface UserLotMaxBid {
    id: string;
    userId: number;
    lotId: number;
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
  id: number;
  name: string;
  slug: string;
  stateUf: string;
  website: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface JudicialDistrict {
  id: number;
  name: string;
  slug: string;
  courtId: number;
  courtName?: string;
  stateId: number;
  stateUf?: string;
  zipCode?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface JudicialBranch {
  id: number;
  name: string;
  slug: string;
  districtId: number;
  districtName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ProcessParty {
  id: string;
  name: string;
  documentNumber?: string;
  partyType: ProcessPartyType;
}

export interface JudicialProcess {
  id: number;
  publicId: string;
  processNumber: string;
  isElectronic: boolean;
  courtId: number;
  courtName?: string;
  districtId: number;
  districtName?: string;
  branchId: number;
  branchName?: string;
  sellerId?: number | null; // The associated seller (Comitente)
  sellerName?: string;
  parties: ProcessParty[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Bem {
  id: number;
  publicId: string;
  title: string;
  description?: string | null;
  status: 'CADASTRO' | 'DISPONIVEL' | 'LOTEADO' | 'VENDIDO' | 'REMOVIDO' | 'INATIVADO';
  categoryId: number;
  categoryName?: string;
  subcategoryId?: number | null;
  subcategoryName?: string;
  judicialProcessId?: number | null;
  judicialProcessNumber?: string;
  sellerId?: number | null;
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
export interface StateFormData {
  name: string;
  uf: string;
}

export interface SubcategoryFormData {
  name: string;
  parentCategoryId: number;
  description?: string | null;
  displayOrder?: number;
  iconUrl?: string | null;
  iconMediaId?: string | null;
  dataAiHintIcon?: string | null;
}

export interface SellerFormData {
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
  dataAiHintLogo?: string | null;
  description?: string | null;
  isJudicial: boolean;
  judicialBranchId?: number | null;
}

export interface AuctioneerFormData {
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
  dataAiHintLogo?: string | null;
  description?: string | null;
  userId?: number | null;
}

export interface CourtFormData {
    name: string;
    stateUf: string;
    website: string;
}

export interface JudicialDistrictFormData {
  name: string;
  courtId: number;
  stateId: number;
  zipCode?: string | null;
}

export interface JudicialBranchFormData {
  name: string;
  districtId: number;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface JudicialProcessFormData {
  processNumber: string;
  isElectronic: boolean;
  courtId: number;
  districtId: number;
  branchId: number;
  sellerId?: number | null;
  parties: ProcessParty[];
}


export interface DatabaseAdapter {
    getLots(auctionId?: number): Promise<Lot[]>;
    getLot(id: number | string): Promise<Lot | null>;
    createLot(lotData: Partial<Lot>): Promise<{ success: boolean; message: string; lotId?: number; }>;
    updateLot(id: number | string, updates: Partial<Lot>): Promise<{ success: boolean; message: string; }>;
    deleteLot(id: number | string): Promise<{ success: boolean; message: string; }>;
    
    getAuctions(): Promise<Auction[]>;
    getAuction(id: number | string): Promise<Auction | null>;
    createAuction(auctionData: Partial<Auction>): Promise<{ success: boolean; message: string; auctionId?: number; }>;
    updateAuction(id: number | string, updates: Partial<Auction>): Promise<{ success: boolean; message: string; }>;
    deleteAuction(id: number | string): Promise<{ success: boolean, message: string }>;

    getLotsByIds(ids: number[] | string[]): Promise<Lot[]>;
    getLotCategories(): Promise<LotCategory[]>;
    
    getSubcategoriesByParent(parentCategoryId: number): Promise<Subcategory[]>;
    getSubcategory(id: number): Promise<Subcategory | null>;
    createLotCategory(data: Partial<LotCategory>): Promise<{ success: boolean, message: string }>;
    createSubcategory(data: Partial<Subcategory>): Promise<{ success: boolean, message: string, subcategoryId?: number }>;
    updateSubcategory(id: number, data: Partial<SubcategoryFormData>): Promise<{ success: boolean; message: string }>;
    deleteSubcategory(id: number): Promise<{ success: boolean; message: string }>;
    
    getStates(): Promise<StateInfo[]>;
    getCities(stateId?: number): Promise<CityInfo[]>;
    createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: number; }>;
    updateState(id: number, data: Partial<StateFormData>): Promise<{ success: boolean; message: string; }>;
    deleteState(id: number): Promise<{ success: boolean; message: string; }>;
    createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: number; }>;
    updateCity(id: number, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }>;
    deleteCity(id: number): Promise<{ success: boolean; message: string; }>;

    getSellers(): Promise<SellerProfileInfo[]>;
    getSeller(id: number | string): Promise<SellerProfileInfo | null>;
    createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: number; }>;
    updateSeller(id: number | string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }>;
    deleteSeller(id: number | string): Promise<{ success: boolean; message: string; }>;

    getAuctioneers(): Promise<AuctioneerProfileInfo[]>;
    getAuctioneer(id: number | string): Promise<AuctioneerProfileInfo | null>;
    createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: number; }>;
    updateAuctioneer(id: number | string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }>;
    deleteAuctioneer(id: number | string): Promise<{ success: boolean; message: string; }>;

    getCourts(): Promise<Court[]>;
    getJudicialDistricts(): Promise<JudicialDistrict[]>;
    getJudicialBranches(): Promise<JudicialBranch[]>;
    getJudicialProcesses(): Promise<JudicialProcess[]>;
    getBem(id: number): Promise<Bem | null>;
    getBens(filter?: { judicialProcessId?: number, sellerId?: number }): Promise<Bem[]>;
    getBensByIds(ids: number[]): Promise<Bem[]>;
    createCourt(data: CourtFormData): Promise<{ success: boolean; message: string; courtId?: number; }>;
    createJudicialDistrict(data: JudicialDistrictFormData): Promise<{ success: boolean; message: string; districtId?: number; }>;
    createJudicialBranch(data: JudicialBranchFormData): Promise<{ success: boolean; message: string; branchId?: number; }>;
    createJudicialProcess(data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: number; }>;
    createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: number; }>;

    getUsersWithRoles(): Promise<UserProfileData[]>;
    getUserProfileData(userId: string): Promise<UserProfileData | null>;
    getRoles(): Promise<Role[]>;
    updateUserRole(userId: string, roleId: number | null): Promise<{ success: boolean; message: string; }>;

    getMediaItems(): Promise<MediaItem[]>;
    createMediaItem(item: Partial<Omit<MediaItem, 'id'>>, url: string, userId: string): Promise<{ success: boolean; message: string; item?: MediaItem; }>;

    getPlatformSettings(): Promise<PlatformSettings | null>;
    updatePlatformSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }>;
    
    close?(): Promise<void>;
}

export type CityFormData = Omit<CityInfo, 'id' | 'slug' | 'stateUf' | 'lotCount'>;

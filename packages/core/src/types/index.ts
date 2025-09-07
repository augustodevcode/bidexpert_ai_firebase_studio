// src/types/index.ts
import { z } from 'zod';

export type AuctionStatus = 'RASCUNHO' | 'EM_PREPARACAO' | 'EM_BREVE' | 'ABERTO' | 'ABERTO_PARA_LANCES' | 'ENCERRADO' | 'FINALIZADO' | 'CANCELADO' | 'SUSPENSO';
export const auctionStatusValues: [AuctionStatus, ...AuctionStatus[]] = [
  'RASCUNHO', 'EM_PREPARACAO', 'EM_BREVE', 'ABERTO', 'ABERTO_PARA_LANCES', 'ENCERRADO', 'FINALIZADO', 'CANCELADO', 'SUSPENSO'
];

export type LotStatus = 'RASCUNHO' | 'EM_BREVE' | 'ABERTO_PARA_LANCES' | 'ENCERRADO' | 'VENDIDO' | 'NAO_VENDIDO' | 'RELISTADO' | 'CANCELADO';

export const lotStatusValues: [LotStatus, ...LotStatus[]] = [
  'RASCUNHO', 'EM_BREVE', 'ABERTO_PARA_LANCES', 'ENCERRADO', 'VENDIDO', 'NAO_VENDIDO', 'RELISTADO', 'CANCELADO'
];

export type UserHabilitationStatus = 'PENDING_DOCUMENTS' | 'PENDING_ANALYSIS' | 'HABILITADO' | 'REJECTED_DOCUMENTS' | 'BLOCKED';

export type UserDocumentStatus = 'NOT_SENT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PENDING_ANALYSIS';

export type PaymentStatus = 'PENDENTE' | 'PROCESSANDO' | 'PAGO' | 'FALHOU' | 'REEMBOLSADO' | 'CANCELADO' | 'ATRASADO';
export const paymentStatusValues: [PaymentStatus, ...PaymentStatus[]] = [
  'PENDENTE', 'PROCESSANDO', 'PAGO', 'FALHOU', 'REEMBOLSADO', 'CANCELADO', 'ATRASADO'
];

export type DirectSaleOfferStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'SOLD' | 'EXPIRED' | 'RASCUNHO';
export type DirectSaleOfferType = 'BUY_NOW' | 'ACCEPTS_PROPOSALS';
export type DocumentTemplateType = 'WINNING_BID_TERM' | 'EVALUATION_REPORT' | 'AUCTION_CERTIFICATE';

export type ProcessPartyType = 'AUTOR' | 'REU' | 'ADVOGADO_AUTOR' | 'ADVOGADO_REU' | 'JUIZ' | 'ESCRIVAO' | 'PERITO' | 'ADMINISTRADOR_JUDICIAL' | 'TERCEIRO_INTERESSADO' | 'OUTRO';

export type AccountType = 'PHYSICAL' | 'LEGAL' | 'DIRECT_SALE_CONSIGNOR';

export type AuctionType = 'JUDICIAL' | 'EXTRAJUDICIAL' | 'PARTICULAR' | 'TOMADA_DE_PRECOS';
export type AuctionMethod = 'STANDARD' | 'DUTCH' | 'SILENT';
export type AuctionParticipation = 'ONLINE' | 'PRESENCIAL' | 'HIBRIDO';

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

export interface PaymentGatewaySettings {
    defaultGateway: 'Pagarme' | 'Stripe' | 'Manual';
    platformCommissionPercentage: number;
    gatewayApiKey?: string | null;
    gatewayEncryptionKey?: string | null;
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
    paymentGatewaySettings?: PaymentGatewaySettings;
    defaultListItemsPerPage?: number;
    updatedAt: string | Date;
}

export interface LotStagePrice {
    id: string;
    auctionStageId: string;
    initialBid: number;
    increment: number;
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
  inheritedMediaFromBemId?: string | null; // NEW: ID of the Bem to inherit media from
  type: string;
  categoryId?: string;
  categoryName?: string;
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
  isRelisted: boolean;
  relistCount: number;
  originalLotId?: string | null;
  evaluationValue?: number | null;
  initialPrice?: number | null;
  secondInitialPrice?: number | null;
  
  // Vehicle specific from Bem
  year?: number;
  make?: string;
  model?: string;
  version?: string; 
  odometer?: number;
  hasKey?: boolean;
  vin?: string;
  fuelType?: string;
  transmissionType?: string;
  
  // Judicial Process from Lot
  judicialProcessNumber?: string;
  courtDistrict?: string;
  courtName?: string;
  publicProcessUrl?: string;
  propertyRegistrationNumber?: string;
  propertyLiens?: string;
  knownDebts?: string;
  additionalDocumentsInfo?: string;
  
  stageDetails?: LotStagePrice[];

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
  categoryId?: string;
  category?: LotCategory;
  auctioneer?: AuctioneerProfileInfo; // Changed to object
  auctioneerId?: string;
  auctioneerName?: string; // Denormalized for display
  auctioneerLogoUrl?: string;
  seller?: SellerProfileInfo; // Changed to object
  sellerId?: string;
  imageUrl?: string;
  imageMediaId?: string | null;
  dataAiHint?: string;
  isFavorite?: boolean;
  visits?: number;
  lots?: Lot[]; // Populated on demand
  initialOffer?: number; // Lowest starting price among lots
  
  // New structured fields
  auctionType?: AuctionType;
  auctionMethod?: AuctionMethod;
  participation?: AuctionParticipation;

  // Location fields for presencial/hibrido
  address?: string | null;
  cityId?: string | null;
  stateId?: string | null;
  zipCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  onlineUrl?: string | null;
  
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
  autoRelistSettings?: {
    enableAutoRelist: boolean;
    recurringAutoRelist: boolean;
    relistIfWinnerNotPaid: boolean;
    relistIfWinnerNotPaidAfterHours?: number | null;
    relistIfNoBids: boolean;
    relistIfNoBidsAfterHours?: number | null;
    relistIfReserveNotMet: boolean;
    relistIfReserveNotMetAfterHours?: number | null;
    relistDurationInHours?: number | null;
  };
  // Timestamps
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AuctionStage {
  id: string;
  name: string;
  endDate: string | Date;
  startDate: string | Date; // Adicionado para timeline
  evaluationValue?: number | null; // Adicionado para avaliação por praça
}


export interface RecentlyViewedLotInfo {
  id: string;
  title: string;
  imageUrl?: string;
  auctionId: string;
  dataAiHint?: string;
}

export interface UserProfileData {
  id: string;
  uid?: string;
  email: string;
  password?: string;
  fullName: string | null;
  cpf?: string | null;
  cellPhone?: string | null;
  razaoSocial?: string | null;
  cnpj?: string | null;
  dateOfBirth?: string | Date | null;
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  avatarUrl?: string | null;
  dataAiHint?: string | null;
  sellerId?: string | null;
  habilitationStatus: UserHabilitationStatus;
  accountType: AccountType;
  badges?: string[];
  optInMarketing?: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  
  // Detalhes PF
  rgNumber?: string | null;
  rgIssuer?: string | null;
  rgIssueDate?: string | Date | null;
  rgState?: string | null;
  homePhone?: string | null;
  gender?: string | null;
  profession?: string | null;
  nationality?: string | null;
  maritalStatus?: string | null;
  propertyRegime?: string | null;
  spouseName?: string | null;
  spouseCpf?: string | null;

  // Detalhes PJ
  inscricaoEstadual?: string | null;
  website?: string | null;
  responsibleName?: string | null;
  responsibleCpf?: string | null;

  // Populated fields from relations
  roles?: { role: Role }[]; // Explicitly match the join table structure
}

export interface UserProfileWithPermissions extends UserProfileData {
  roleName?: string;
  roleNames: string[];
  permissions: string[];
}

export interface Role {
  id: string;
  name: string;
  nameNormalized: string;
  description: string;
  permissions: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
  slug?: string;
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
    installments?: InstallmentPayment[];
}

export interface InstallmentPayment {
  id: string;
  userWinId: string;
  userWin?: UserWin;
  installmentNumber: number;
  amount: number;
  dueDate: string | Date;
  status: PaymentStatus;
  paymentDate?: string | Date | null;
  paymentMethod?: string | null;
  transactionId?: string | null;
}


export interface LotCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  itemCount?: number;
  hasSubcategories: boolean;
  iconName?: string | null;
  dataAiHintIcon?: string | null;
  logoUrl?: string | null;
  logoMediaId?: string | null;
  coverImageUrl?: string | null;
  coverImageMediaId?: string | null;
  dataAiHintCover?: string | null;
  megaMenuImageUrl?: string | null;
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
    categoryId?: string; // Adicionado para o formulário
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
    appliesTo: 'PHYSICAL' | 'LEGAL' | 'ALL' | 'PROCESS';
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
    linkedLotIds?: string[];
    judicialProcessId?: string; // New field to link to a judicial process
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
  createdAt?: string | Date;
  updatedAt?: string | Date;
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
  createdAt?: string | Date;
  updatedAt?: string | Date;
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

  // Vehicle specific
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
  sex?: 'Macho' | 'Femea' | null;
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

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  createdAt: string | Date;
  isRead: boolean;
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

export type EditableUserProfileData = Partial<Omit<UserProfileData, 'id' | 'uid' | 'email' | 'sellerId' | 'habilitationStatus' | 'password' | 'createdAt' | 'updatedAt' | 'roleName' | 'roleNames' | 'permissions'>>;

export type BemFormData = z.infer<typeof import('@/app/admin/bens/bem-form-schema').bemFormSchema>;
export type LotFormData = z.infer<typeof import('@/app/admin/lots/lot-form-schema').lotFormSchema>;
export type AuctionFormData = z.infer<typeof import('@/app/admin/auctions/auction-form-schema').auctionFormSchema>;
export type SellerFormData = z.infer<typeof import('@/app/admin/sellers/seller-form-schema').sellerFormSchema>;
export type AuctioneerFormData = z.infer<typeof import('@/app/admin/auctioneers/auctioneer-form-schema').auctioneerFormSchema>;
export type JudicialProcessFormData = z.infer<typeof import('@/app/admin/judicial-processes/judicial-process-form-schema').judicialProcessFormSchema>;
export type JudicialBranchFormData = z.infer<typeof import('@/app/admin/judicial-branches/judicial-branch-form-schema').judicialBranchFormSchema>;
export type JudicialDistrictFormData = z.infer<typeof import('@/app/admin/judicial-districts/judicial-district-form-schema').judicialDistrictFormSchema>;
export type CourtFormData = z.infer<typeof import('@/app/admin/courts/court-form-schema').courtFormSchema>;
export type StateFormData = z.infer<typeof import('@/app/admin/states/state-form-schema').stateFormSchema>;
export type CityFormData = z.infer<typeof import('@/app/admin/cities/city-form-schema').cityFormSchema>;
export type SubcategoryFormData = z.infer<typeof import('@/app/admin/subcategories/subcategory-form-schema').subcategoryFormSchema>;
export type RoleFormData = z.infer<typeof import('@/app/admin/roles/role-form-schema').roleFormSchema>;
export type UserFormData = z.infer<typeof import('@/app/admin/users/user-form-schema').userFormSchema>;
export type VehicleMakeFormData = z.infer<typeof import('@/app/admin/vehicle-makes/form-schema').vehicleMakeFormSchema>;
export type VehicleModelFormData = z.infer<typeof import('@/app/admin/vehicle-models/form-schema').vehicleModelFormSchema>;

export interface VehicleMake {
  id: string;
  name: string;
  slug: string;
}

export interface VehicleModel {
  id: string;
  name: string;
  slug: string;
  makeId: string;
  makeName?: string;
}


export interface AuctionPerformanceData {
  id: string;
  title: string;
  status: AuctionStatus;
  totalLots: number;
  lotsSoldCount: number;
  totalRevenue: number;
  averageTicket: number;
  salesRate: number;
  auctionDate: Date | string;
  auctionStages: AuctionStage[];
}

export interface AuctionDashboardData {
  totalRevenue: number;
  totalBids: number;
  uniqueBidders: number;
  salesRate: number;
  revenueByCategory: { name: string, Faturamento: number }[];
  bidsOverTime: { name: string, Lances: number }[];
}

// ============================================================================
// DATABASE ADAPTER INTERFACE
// ============================================================================
export interface DatabaseAdapter {
    getLots(auctionId?: string): Promise<Lot[]>;
    getLot(id: string): Promise<Lot | null>;
    createLot(lotData: Partial<Lot>): Promise<{ success: boolean; message: string; lotId?: string; }>;
    updateLot(id: string, updates: Partial<LotFormData>): Promise<{ success: boolean; message: string; }>;
    deleteLot(id: string): Promise<{ success: boolean; message: string; }>;
    
    getAuctions(): Promise<Auction[]>;
    getAuction(id: string): Promise<Auction | null>;
    createAuction(auctionData: Partial<Auction>): Promise<{ success: boolean; message: string; auctionId?: string; }>;
    updateAuction(id: string, updates: Partial<Auction>): Promise<{ success: boolean; message: string; }>;
    deleteAuction(id: string): Promise<{ success: boolean, message: string }>;

    getLotsByIds(ids: string[]): Promise<Lot[]>;
    getLotCategories(): Promise<LotCategory[]>;
    
    getSubcategoriesByParent(parentCategoryId?: string): Promise<Subcategory[]>;
    getSubcategory(id: string): Promise<Subcategory | null>;
    createLotCategory(data: Partial<LotCategory>): Promise<{ success: boolean, message: string }>;
    createSubcategory(data: SubcategoryFormData): Promise<{ success: boolean; message: string, subcategoryId?: string }>;
    updateSubcategory(id: string, data: Partial<SubcategoryFormData>): Promise<{ success: boolean; message: string; }>;
    deleteSubcategory(id: string): Promise<{ success: boolean; message: string; }>;
    
    getStates(): Promise<StateInfo[]>;
    getCities(stateId?: string): Promise<CityInfo[]>;
    createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string; }>;
    updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string; }>;
    deleteState(id: string): Promise<{ success: boolean; message: string; }>;
    createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string; }>;
    updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }>;
    deleteCity(id: string): Promise<{ success: boolean; message: string; }>;

    getSellers(): Promise<SellerProfileInfo[]>;
    getSeller(id: string): Promise<SellerProfileInfo | null>;
    createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; }>;
    updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }>;
    deleteSeller(id: string): Promise<{ success: boolean; message: string; }>;

    getAuctioneers(): Promise<AuctioneerProfileInfo[]>;
    getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null>;
    createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; }>;
    updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }>;
    deleteAuctioneer(id: string): Promise<{ success: boolean; message: string; }>;

    getCourts(): Promise<Court[]>;
    getJudicialDistricts(): Promise<JudicialDistrict[]>;
    getJudicialBranches(): Promise<JudicialBranch[]>;
    getJudicialProcesses(): Promise<JudicialProcess[]>;
    getBem(id: string): Promise<Bem | null>;
    getBens(filter?: { judicialProcessId?: string, sellerId?: string }): Promise<Bem[]>;
    getBensByIds(ids: string[]): Promise<Bem[]>;
    createCourt(data: CourtFormData): Promise<{ success: boolean; message: string; courtId?: string; }>;
    updateCourt(id: string, data: Partial<CourtFormData>): Promise<{ success: boolean; message: string; }>;
    createJudicialDistrict(data: JudicialDistrictFormData): Promise<{ success: boolean; message: string; districtId?: string; }>;
    createJudicialBranch(data: JudicialBranchFormData): Promise<{ success: boolean; message: string; branchId?: string; }>;
    createJudicialProcess(data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: string; }>;
    createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string; }>;
    updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }>;
    deleteBem(id: string): Promise<{ success: boolean, message: string }>;

    getUsersWithRoles(): Promise<UserProfileWithPermissions[]>;
    getUserProfileData(userIdOrEmail: string): Promise<UserProfileWithPermissions | null>;
    createUser(data: UserCreationData): Promise<{ success: boolean; message: string; userId?: string; }>;
    getRoles(): Promise<Role[]>;
    createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<{success: boolean;message: string;}>;
    updateUserRoles(userId: string, roleIds: string[]): Promise<{ success: boolean; message: string; }>;

    getMediaItems(): Promise<MediaItem[]>;
    createMediaItem(item: Partial<Omit<MediaItem, 'id'>>, url: string, userId: string): Promise<{ success: boolean; message: string; item?: MediaItem; }>;

    getPlatformSettings(): Promise<PlatformSettings | null>;
    createPlatformSettings(data: PlatformSettings): Promise<{ success: boolean; message: string; }>;
    updatePlatformSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }>;
    
    saveContactMessage(message: Omit<ContactMessage, 'id' | 'createdAt' | 'isRead'>): Promise<{ success: boolean; message: string }>;

    // Optional methods that may not be on all adapters
    getDirectSaleOffers?(): Promise<DirectSaleOffer[]>;
    getDocumentTemplates?(): Promise<DocumentTemplate[]>;
    getDocumentTemplate?(id: string): Promise<DocumentTemplate | null>;
    saveUserDocument?(userId: string, documentTypeId: string, fileUrl: string, fileName: string): Promise<{ success: boolean, message: string }>;

    close?(): Promise<void>;
}

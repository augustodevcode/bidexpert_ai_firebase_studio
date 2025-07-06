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
    createdAt: AnyTimestamp;
    updatedAt: AnyTimestamp;
}

export type CategoryFormData = Omit<LotCategory, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'itemCount' | 'hasSubcategories'>;

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

export type AuctioneerFormData = Omit<AuctioneerProfileInfo, 'id' | 'publicId' | 'slug' | 'createdAt' | 'updatedAt' | 'memberSince' | 'rating' | 'auctionsConductedCount' | 'totalValueSold' | 'logoMediaId'>;


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
  judicialBranchId?: string | null; // Link to JudicialBranch model
  judicialBranchName?: string; // For display
  isJudicial?: boolean;
  createdAt: AnyTimestamp;
  updatedAt: AnyTimestamp;
  
  cnpj?: string;
  razaoSocial?: string;
  inscricaoEstadual?: string;
}

export type SellerFormData = Omit<SellerProfileInfo, 'id' | 'publicId' | 'slug' | 'createdAt' | 'updatedAt' | 'memberSince' | 'rating' | 'activeLotsCount' | 'totalSalesValue' | 'auctionsFacilitatedCount' | 'userId' | 'logoMediaId' | 'judicialBranchName'> & {
  userId?: string;
};

export interface AuctionStage {
  name: string; // ex: "1ª Praça"
  endDate: AnyTimestamp; // Timestamp ou string ISO
  statusText?: string; // ex: "Encerramento", "Abre em"
  initialPrice?: number; // Lance inicial para esta praça
}

export type AuctionType = 'JUDICIAL' | 'EXTRAJUDICIAL' | 'PARTICULAR' | 'TOMADA_DE_PRECOS';

export interface WizardData {
  auctionType?: AuctionType;
  judicialProcess?: JudicialProcess;
  auctionDetails?: Partial<Auction>;
  selectedBens?: Bem[];
  createdLots?: Lot[];
}


export type AuctionStatus = 'EM_BREVE' | 'ABERTO' | 'ABERTO_PARA_LANCES' | 'ENCERRADO' | 'FINALIZADO' | 'CANCELADO' | 'SUSPENSO' | 'RASCUNHO' | 'EM_PREPARACAO';
export type LotStatus = 'RASCUNHO' | 'EM_BREVE' | 'ABERTO_PARA_LANCES' | 'ENCERRADO' | 'VENDIDO' | 'NAO_VENDIDO' | 'CANCELADO';

export interface AutoRelistSettings {
  enableAutoRelist?: boolean;
  recurringAutoRelist?: boolean;
  relistIfWinnerNotPaid?: boolean;
  relistIfWinnerNotPaidAfterHours?: number | null;
  relistIfNoBids?: boolean;
  relistIfNoBidsAfterHours?: number | null;
  relistIfReserveNotMet?: boolean;
  relistIfReserveNotMetAfterHours?: number | null;
  relistDurationInHours?: number | null;
}

export interface Auction {
  id: string;
  publicId: string;
  title: string;
  description?: string;
  status: AuctionStatus;
  auctionType?: AuctionType | 'DUTCH' | 'SILENT';
  category: string; 
  categoryId?: string; 
  auctioneer: string; 
  auctioneerId?: string; 
  seller?: string; 
  sellerId?: string | null; 
  judicialProcessId?: string | null;
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
  latitude?: number | null;
  longitude?: number | null;
  createdAt: AnyTimestamp;
  updatedAt: AnyTimestamp;
  auctioneerLogoUrl?: string;
  auctioneerName?: string;
  automaticBiddingEnabled?: boolean;
  silentBiddingEnabled?: boolean;
  allowMultipleBidsPerUser?: boolean;
  allowInstallmentBids?: boolean;
  softCloseEnabled?: boolean;
  softCloseMinutes?: number;
  urgencyTimerHours?: number | null;
  estimatedRevenue?: number;
  achievedRevenue?: number;
  totalHabilitatedUsers?: number;
  isFeaturedOnMarketplace?: boolean;
  marketplaceAnnouncementTitle?: string;
  additionalTriggers?: string[];
  lots?: Lot[];
  decrementAmount?: number;
  decrementIntervalSeconds?: number;
  floorPrice?: number;
  autoRelistSettings?: AutoRelistSettings;
  originalAuctionId?: string | null;
  relistCount?: number;
}

export type AuctionFormData = Omit<Auction,
  'id' | 'publicId' | 'createdAt' | 'updatedAt' | 'auctionDate' | 'endDate' |
  'lots' | 'totalLots' | 'visits' | 'isFavorite' |
  'currentBid' | 'bidsCount' | 'auctioneerLogoUrl' | 'auctioneerName' |
  'auctioneerId' | 'sellerId' | 'achievedRevenue' | 'totalHabilitatedUsers' | 'judicialProcessId' |
  'latitude' | 'longitude' | 'originalAuctionId' | 'relistCount' | 'imageMediaId'
> & {
  auctionDate: Date; 
  endDate?: Date | null; 
  auctionStages?: Array<Omit<AuctionStage, 'endDate'> & {endDate: Date}>;
};

export type AuctionDbData = Omit<AuctionFormData, 'category' | 'auctioneer' | 'seller'> & {
  categoryId?: string;
  auctioneerId?: string;
  sellerId?: string | null; 
  judicialProcessId?: string | null;
  imageMediaId?: string | null;
  achievedRevenue?: number;
  totalHabilitatedUsers?: number;
  auctionType?: Auction['auctionType'];
  auctionStages?: AuctionStage[];
  latitude?: number | null;
  longitude?: number | null;
  decrementAmount?: number | null;
  decrementIntervalSeconds?: number | null;
  floorPrice?: number | null;
  originalAuctionId?: string | null;
  relistCount?: number;
};

export type BemStatus = 'CADASTRO' | 'DISPONIVEL' | 'LOTEADO' | 'VENDIDO' | 'REMOVIDO' | 'INATIVADO';

export interface Bem {
  id: string;
  publicId: string;
  title: string;
  description?: string;
  judicialProcessId?: string | null;
  judicialProcessNumber?: string;
  sellerId?: string | null;
  sellerName?: string;
  status: BemStatus;
  categoryId?: string;
  categoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  imageUrl?: string;
  imageMediaId?: string | null;
  dataAiHint?: string;
  galleryImageUrls?: string[];
  mediaItemIds?: string[];
  evaluationValue?: number;
  locationCity?: string;
  locationState?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  createdAt: AnyTimestamp;
  updatedAt: AnyTimestamp;

  // Veículos
  make?: string; model?: string; version?: string;
  year?: number; modelYear?: number;
  plate?: string; vin?: string; renavam?: string | null;
  color?: string; fuelType?: string; mileage?: number;
  enginePower?: string; transmissionType?: string;
  bodyType?: string; numberOfDoors?: number; vehicleOptions?: string;
  detranStatus?: string; debts?: string;
  runningCondition?: string; bodyCondition?: string; tiresCondition?: string;
  hasKey?: boolean;

  // Imóveis
  propertyRegistrationNumber?: string; iptuNumber?: string;
  isOccupied?: boolean; hasHabiteSe?: boolean;
  totalArea?: number; builtArea?: number;
  bedrooms?: number; suites?: number; bathrooms?: number; parkingSpaces?: number;
  constructionType?: string; finishes?: string; infrastructure?: string;
  condoDetails?: string; improvements?: string; topography?: string;
  liensAndEncumbrances?: string; propertyDebts?: string;
  unregisteredRecords?: string; zoningRestrictions?: string;
  amenities?: string[];

  // Eletrônicos
  brand?: string; serialNumber?: string;
  itemCondition?: string; specifications?: string;
  includedAccessories?: string; batteryCondition?: string;
  hasInvoice?: boolean; hasWarranty?: boolean; repairHistory?: string;

  // Eletrodomésticos
  applianceCapacity?: string; voltage?: string; applianceType?: string;
  additionalFunctions?: string;
  
  // Máquinas e Equipamentos
  hoursUsed?: number; engineType?: string;
  capacityOrPower?: string; maintenanceHistory?: string;
  installationLocation?: string; compliesWithNR?: string;
  operatingLicenses?: string;
  
  // Semoventes
  breed?: string; age?: string; sex?: 'Macho' | 'Fêmea'; weight?: string;
  individualId?: string; purpose?: string;
  sanitaryCondition?: string; lineage?: string;
  isPregnant?: boolean; specialSkills?: string;
  gtaDocument?: string; breedRegistryDocument?: string;

  // Móveis
  furnitureType?: string; material?: string; style?: string;
  dimensions?: string; pieceCount?: number;

  // Joias
  jewelryType?: string; metal?: string; gemstones?: string;
  totalWeight?: string; jewelrySize?: string; authenticityCertificate?: string;

  // Obras de Arte e Antiguidades
  workType?: string; artist?: string; period?: string; technique?: string;
  provenance?: string;
  
  // Embarcações
  boatType?: string; boatLength?: string; hullMaterial?: string; onboardEquipment?: string;
  
  // Alimentos
  productName?: string; quantity?: string; packagingType?: string;
  expirationDate?: AnyTimestamp; storageConditions?: string;

  // Metais Preciosos e Pedras
  preciousMetalType?: string; purity?: string;
  
  // Bens Florestais
  forestGoodsType?: string; volumeOrQuantity?: string; species?: string;
  dofNumber?: string;
}

export type BemFormData = Omit<Bem, 'id' | 'publicId' | 'createdAt' | 'updatedAt' | 'categoryName' | 'subcategoryName' | 'judicialProcessNumber' | 'sellerName' | 'galleryImageUrls' | 'mediaItemIds' | 'amenities'> & {
  amenities?: {value: string}[];
  galleryImageUrls?: string[];
  mediaItemIds?: string[];
};

export interface Lot {
  id: string;
  publicId: string;
  auctionId: string;
  auctionPublicId?: string;
  auctionName?: string;
  number: string; 
  order?: number; 
  title: string; 
  description?: string; 
  status: LotStatus;
  bidsCount?: number;
  price: number; 
  initialPrice?: number;
  endDate?: AnyTimestamp;
  isFeatured?: boolean;
  isFavorite?: boolean;
  bemIds?: string[]; // IDs of the assets within this lot
  bens?: Bem[];     // The full asset objects, to be populated when fetching
  imageUrl?: string; 
  imageMediaId?: string | null;
  dataAiHint?: string;
  views?: number;
  type?: string; 
  cityName?: string;
  stateUf?: string;
  subcategoryName?: string;
  createdAt: AnyTimestamp;
  updatedAt: AnyTimestamp;
  galleryImageUrls?: string[];
  mediaItemIds?: string[];
  bidIncrementStep?: number;
  judicialProcessNumber?: string;
  latitude?: number;
  longitude?: number;
  categoryId?: string;
  subcategoryId?: string;
  sellerId?: string;
  sellerName?: string;
  lotSpecificAuctionDate?: AnyTimestamp | null;
  secondAuctionDate?: AnyTimestamp | null;
  secondInitialPrice?: number | null;
  urgencyTimerHours?: number | null;
  isExclusive?: boolean;
  additionalTriggers?: string[];
  discountPercentage?: number;
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
  condition?: string;
  auctioneerId?: string;
  auctioneerName?: string;
  allowInstallmentBids?: boolean;
  courtDistrict?: string;
  courtName?: string;
  publicProcessUrl?: string;
  propertyRegistrationNumber?: string;
  propertyLiens?: string;
  knownDebts?: string;
  additionalDocumentsInfo?: string;
  mapAddress?: string;
  mapEmbedUrl?: string;
  mapStaticImageUrl?: string;
  reservePrice?: number;
  evaluationValue?: number;
  debtAmount?: number;
  itbiValue?: number;
  year?: number;
  make?: string;
  model?: string;
  series?: string;
  stockNumber?: string;
  sellingBranch?: string;
  auctionDate?: AnyTimestamp;
  stateId?: string;
  cityId?: string;
}

export type LotFormData = Omit<Lot,
  'id' | 'publicId' | 'createdAt' | 'updatedAt' | 'endDate' | 'bidsCount' | 'price' | 'status' | 'lotSpecificAuctionDate' | 'secondAuctionDate' |
  'auctionPublicId' | 'isFavorite' | 'views' | 'auctionName' | 'cityName' | 'stateUf' | 'subcategoryName' | 'auctionDate' |
  'bens' // Bens are managed via lotting page, not directly in the form
> & {
  endDate?: Date | null; 
  lotSpecificAuctionDate?: Date | null; 
  secondAuctionDate?: Date | null; 
  price: number;
  type: string; // no form é o categoryId
};

export type LotDbData = Omit<LotFormData, 'type'> & {
  categoryId?: string;
  status: LotStatus;
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

export type UserBidStatus = 'GANHANDO' | 'PERDENDO' | 'SUPERADO' | 'ARREMATADO' | 'NAO_ARREMATADO';
export type PaymentStatus = 'PENDENTE' | 'PROCESSANDO' | 'PAGO' | 'FALHOU' | 'REEMBOLSADO';

export interface UserWin {
  id: string;
  lotId: string;
  lot: Lot; 
  userId: string;
  winningBidAmount: number;
  winDate: AnyTimestamp;
  paymentStatus: PaymentStatus;
  invoiceUrl?: string; 
}

export interface UserBid extends BidInfo {
  lot: Lot;
  bidStatus: UserBidStatus;
}

export interface UserLotMaxBid {
  id: string;
  userId: string;
  lotId: string;
  maxAmount: number;
  isActive: boolean;
  createdAt: AnyTimestamp;
  updatedAt: AnyTimestamp;
}

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
    publicId: string;
    title: string;
    description: string;
    imageUrl: string;
    imageMediaId?: string | null;
    dataAiHint?: string;
    galleryImageUrls?: string[];
    mediaItemIds?: string[];
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

export type DirectSaleOfferFormData = Omit<DirectSaleOffer, 'id' | 'publicId' | 'createdAt' | 'updatedAt' | 'views' | 'proposalsCount' | 'galleryImageUrls' | 'itemsIncluded' | 'tags' | 'sellerId' | 'sellerLogoUrl' | 'dataAiHintSellerLogo' | 'latitude' | 'longitude' | 'mapAddress' | 'mapEmbedUrl' | 'mapStaticImageUrl'> & {
    expiresAt?: Date | null;
    mediaItemIds?: string[];
    galleryImageUrls?: string[];
};

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

export interface BiddingSettings {
  instantBiddingEnabled?: boolean;
  getBidInfoInstantly?: boolean;
  biddingInfoCheckIntervalSeconds?: number;
}

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
  biddingSettings?: BiddingSettings;
  defaultUrgencyTimerHours?: number;
  
  searchPaginationType?: SearchPaginationType;
  searchItemsPerPage?: number;
  searchLoadMoreCount?: number;
  showCountdownOnLotDetail?: boolean;
  showCountdownOnCards?: boolean;
  showRelatedLotsOnLotDetail?: boolean;
  relatedLotsCount?: number;
  variableIncrementTable?: VariableIncrementRule[];
  defaultListItemsPerPage?: number;

  updatedAt: AnyTimestamp;
}

export interface VariableIncrementRule {
  from: number;
  to: number | null;
  increment: number;
}


export type PlatformSettingsFormData = Omit<PlatformSettings, 'id' | 'updatedAt'> & {
    homepageSections?: HomepageSectionConfig[]; 
    mentalTriggerSettings?: MentalTriggerSettings;
    sectionBadgeVisibility?: SectionBadgeConfig;
    mapSettings?: MapSettings;
    biddingSettings?: BiddingSettings;
    searchPaginationType?: SearchPaginationType;
    searchItemsPerPage?: number;
    searchLoadMoreCount?: number;
    showCountdownOnLotDetail?: boolean;
    showCountdownOnCards?: boolean;
    showRelatedLotsOnLotDetail?: boolean;
    relatedLotsCount?: number;
    variableIncrementTable?: VariableIncrementRule[];
    defaultListItemsPerPage?: number;
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

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string; // Markdown or HTML content
  authorName: string;
  authorId?: string;
  category: string;
  tags?: string[];
  imageUrl?: string;
  imageMediaId?: string;
  dataAiHint?: string;
  isPublished: boolean;
  publishedAt?: AnyTimestamp;
  createdAt: AnyTimestamp;
  updatedAt: AnyTimestamp;
}

export type BlogPostFormData = Omit<BlogPost, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'publishedAt'>;

export interface Notification {
  id: string;
  userId: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: AnyTimestamp;
}

export interface IStorageAdapter {
  upload(fileName: string, contentType: string, buffer: Buffer): Promise<{ publicUrl: string; storagePath: string; }>;
  delete(storagePath: string): Promise<{ success: boolean; message: string; }>;
}


// +++ JUDICIAL & CNJ ENTITIES +++

export interface Court {
  id: string;
  name: string;
  slug: string;
  website?: string | null;
  stateUf: string; // e.g., 'SP', 'SE'
  createdAt: AnyTimestamp;
  updatedAt: AnyTimestamp;
}
export type CourtFormData = Omit<Court, 'id' | 'slug' | 'createdAt' | 'updatedAt'>;

export interface JudicialDistrict {
  id: string;
  name: string;
  slug: string;
  courtId: string;
  courtName?: string; // For display
  stateId: string;
  stateUf?: string; // For display
  zipCode?: string | null;
  createdAt: AnyTimestamp;
  updatedAt: AnyTimestamp;
}
export type JudicialDistrictFormData = Omit<JudicialDistrict, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'courtName' | 'stateUf'>;

export interface JudicialBranch {
  id: string;
  name: string;
  slug: string;
  districtId: string;
  districtName?: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  createdAt: AnyTimestamp;
  updatedAt: AnyTimestamp;
}
export type JudicialBranchFormData = Omit<JudicialBranch, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'districtName'>;

export type ProcessPartyType = 'AUTOR' | 'REU' | 'ADVOGADO_AUTOR' | 'ADVOGADO_REU' | 'JUIZ' | 'ESCRIVAO' | 'PERITO' | 'ADMINISTRADOR_JUDICIAL' | 'TERCEIRO_INTERESSADO' | 'OUTRO';

export interface ProcessParty {
  id?: string; // Optional for new parties in form
  name: string;
  documentNumber?: string; // CPF ou CNPJ
  partyType: ProcessPartyType;
}

export interface JudicialProcess {
  id: string;
  publicId: string; // Masked number
  processNumber: string; // Full, unmasked number
  oldProcessNumber?: string | null;
  isElectronic: boolean;
  courtId: string;
  districtId: string;
  branchId: string;
  sellerId?: string | null;
  sellerName?: string;
  parties: ProcessParty[];
  courtName?: string;
  districtName?: string;
  branchName?: string;
  createdAt: AnyTimestamp;
  updatedAt: AnyTimestamp;
}
export type JudicialProcessFormData = Omit<JudicialProcess, 'id' | 'publicId' | 'createdAt' | 'updatedAt' | 'courtName' | 'districtName' | 'branchName' | 'sellerName'> & {
  parties: Array<Partial<ProcessParty>>; // Parties in the form might not have an ID yet
};

// Types for CNJ Datajud API Response
export interface CnjProcessSource {
  numeroProcesso: string;
  classe: { codigo: number; nome: string };
  sistema: { codigo: number; nome: string };
  formato: { codigo: number; nome: string };
  tribunal: string;
  dataHoraUltimaAtualizacao: string;
  grau: string;
  dataAjuizamento: string;
  movimentos: any[]; // Define more strictly if needed
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


// --- END JUDICIAL & CNJ ENTITIES ---


export interface IDatabaseAdapter {
  initializeSchema(): Promise<{ success: boolean; message: string; errors?: any[], rolesProcessed?: number }>;
  disconnect?(): Promise<void>;

  createLotCategory(data: { name: string; description?: string }): Promise<{ success: boolean; message: string; categoryId?: string; }>;
  getLotCategories(): Promise<LotCategory[]>;
  getLotCategory(idOrSlug: string): Promise<LotCategory | null>; 
  getLotCategoryByName(name: string): Promise<LotCategory | null>;
  updateLotCategory(id: string, data: Partial<CategoryFormData>): Promise<{ success: boolean; message: string; }>;
  deleteLotCategory(id: string): Promise<{ success: boolean; message: string; }>;

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
  deleteState(id: string): Promise<{ success: boolean; message: string; }>;

  createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string }>;
  getCities(stateIdOrSlugFilter?: string): Promise<CityInfo[]>;
  getCity(idOrCompositeSlug: string): Promise<CityInfo | null>; 
  updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string }>;
  deleteCity(id: string): Promise<{ success: boolean; message: string; }>;

  createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; auctioneerPublicId?: string; }>;
  getAuctioneers(): Promise<AuctioneerProfileInfo[]>;
  getAuctioneer(idOrPublicId: string): Promise<AuctioneerProfileInfo | null>;
  updateAuctioneer(idOrPublicId: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string }>;
  deleteAuctioneer(idOrPublicId: string): Promise<{ success: boolean; message: string; }>;
  getAuctioneerBySlug(slugOrPublicId: string): Promise<AuctioneerProfileInfo | null>;
  getAuctioneerByName(name: string): Promise<AuctioneerProfileInfo | null>;


  createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; sellerPublicId?: string; }>;
  getSellers(): Promise<SellerProfileInfo[]>;
  getSeller(idOrPublicId: string): Promise<SellerProfileInfo | null>;
  updateSeller(idOrPublicId: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }>;
  deleteSeller(idOrPublicId: string): Promise<{ success: boolean; message: string; }>;
  getSellerBySlug(slugOrPublicId: string): Promise<SellerProfileInfo | null>;
  getSellerByName(name: string): Promise<SellerProfileInfo | null>;

  createAuction(data: AuctionDbData): Promise<{ success: boolean; message: string; auctionId?: string; auctionPublicId?: string; }>;
  createAuctionWithLots(wizardData: WizardData): Promise<{ success: boolean; message: string; auctionId?: string; }>;
  getAuctions(): Promise<Auction[]>;
  getAuctionsByIds(ids: string[]): Promise<Auction[]>;
  getAuction(idOrPublicId: string): Promise<Auction | null>;
  updateAuction(idOrPublicId: string, data: Partial<AuctionDbData>): Promise<{ success: boolean; message: string }>;
  deleteAuction(idOrPublicId: string): Promise<{ success: boolean; message: string; }>;
  getAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]>;
  getAuctionsByAuctioneerSlug(auctioneerSlugOrPublicId: string): Promise<Auction[]>;

  // BENS
  getBens(filter?: { judicialProcessId?: string; sellerId?: string }): Promise<Bem[]>;
  getBensByIds(ids: string[]): Promise<Bem[]>;
  getBem(id: string): Promise<Bem | null>;
  createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string; }>;
  updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }>;
  updateBensStatus(bemIds: string[], status: Bem['status'], connection?: any): Promise<{ success: boolean, message: string }>;
  deleteBem(id: string): Promise<{ success: boolean; message: string; }>;

  createLot(data: LotDbData): Promise<{ success: boolean; message: string; lotId?: string; lotPublicId?: string; }>;
  createLotsFromBens(lotsToCreate: LotDbData[]): Promise<{ success: boolean, message: string, createdLots?: Lot[] }>;
  getLots(auctionIdParam?: string): Promise<Lot[]>;
  getLotsByIds(ids: string[]): Promise<Lot[]>;
  getLot(idOrPublicId: string): Promise<Lot | null>;
  updateLot(idOrPublicId: string, data: Partial<LotDbData>): Promise<{ success: boolean; message: string; }>;
  deleteLot(idOrPublicId: string, auctionId?: string): Promise<{ success: boolean; message: string; }>;
  
  getDirectSaleOffers(): Promise<DirectSaleOffer[]>;
  getDirectSaleOffer(id: string): Promise<DirectSaleOffer | null>;
  createDirectSaleOffer(data: DirectSaleOfferFormData): Promise<{ success: boolean; message: string; offerId?: string; }>;
  updateDirectSaleOffer(id: string, data: Partial<DirectSaleOfferFormData>): Promise<{ success: boolean; message: string; }>;
  deleteDirectSaleOffer(id: string): Promise<{ success: boolean; message: string; }>;

  getBidsForLot(lotIdOrPublicId: string): Promise<BidInfo[]>;
  getBidsForUser?(userId: string): Promise<UserBid[]>;
  placeBidOnLot(lotIdOrPublicId: string, auctionIdOrPublicId: string, userId: string, userDisplayName: string, bidAmount: number): Promise<{ success: boolean; message: string; updatedLot?: Partial<Pick<Lot, "price" | "bidsCount" | "status" | "endDate">>; newBid?: BidInfo }>;
  getWinsForUser(userId: string): Promise<UserWin[]>;
  
  // Proxy Bidding
  createUserLotMaxBid(userId: string, lotId: string, maxAmount: number): Promise<{ success: boolean; message: string; maxBidId?: string; }>;
  getActiveUserLotMaxBid(userId: string, lotId: string): Promise<UserLotMaxBid | null>;

  getReviewsForLot(lotIdOrPublicId: string): Promise<Review[]>;
  createReview(review: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; message: string; reviewId?: string }>;
  
  getQuestionsForLot(lotIdOrPublicId: string): Promise<LotQuestion[]>;
  createQuestion(question: Omit<LotQuestion, 'id' | 'createdAt' | 'answeredAt' | 'answeredByUserId' | 'answeredByUserDisplayName' | 'isPublic'>): Promise<{ success: boolean; message: string; questionId?: string; }>;
  answerQuestion(lotId: string, questionId: string, answerText: string, answeredByUserId: string, answeredByUserDisplayName: string): Promise<{ success: boolean; message: string }>;

  getUserProfileData(userId: string): Promise<UserProfileWithPermissions | null>;
  updateUserProfile(userId: string, data: EditableUserProfileData): Promise<{ success: boolean; message: string; }>;
  ensureUserRole(
    userId: string,
    email: string,
    fullName: string | null,
    targetRoleName: string,
    additionalProfileData?: Partial<Pick<UserProfileData, 'cpf' | 'cellPhone' | 'dateOfBirth' | 'password' | 'accountType' | 'razaoSocial' | 'cnpj' | 'inscricaoEstadual' | 'websiteComitente' | 'zipCode' | 'street' | 'number' | 'complement' | 'neighborhood' | 'city' | 'state' | 'optInMarketing' >>,
    roleIdToAssign?: string
  ): Promise<{ success: boolean; message: string; userProfile?: UserProfileWithPermissions; }>;
  getUsersWithRoles(): Promise<UserProfileData[]>;
  updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }>;
  deleteUserProfile(userId: string): Promise<{ success: boolean; message: string; }>;
  getUserByEmail(email: string): Promise<UserProfileWithPermissions | null>;
  
  createRole(data: RoleFormData): Promise<{ success: boolean; message: string; roleId?: string }>;
  getRoles(): Promise<Role[]>;
  getRole(id: string): Promise<Role | null>;
  getRoleByName(name: string): Promise<Role | null>;
  updateRole(id: string, data: Partial<RoleFormData>): Promise<{ success: boolean; message: string; }>;
  deleteRole(id: string): Promise<{ success: boolean; message: string; }>;
  ensureDefaultRolesExist(connection?: any): Promise<{ success: boolean; message: string; rolesProcessed?: number }>;

  createMediaItem(data: Omit<MediaItem, 'id' | 'uploadedAt' | 'urlOriginal' | 'urlThumbnail' | 'urlMedium' | 'urlLarge' | 'storagePath'>, filePublicUrl: string, uploadedBy?: string): Promise<{ success: boolean; message: string; item?: MediaItem; }>;
  getMediaItems(): Promise<MediaItem[]>;
  getMediaItem(id: string): Promise<MediaItem | null>;
  updateMediaItemMetadata(id: string, metadata: Partial<Pick<MediaItem, 'title' | 'altText' | 'caption' | 'description'>>): Promise<{ success: boolean; message: string; }>;
  deleteMediaItemFromDb(id: string): Promise<{ success: boolean; message: string; }>;
  linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string; }>;
  unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string; }>;
  
  getPlatformSettings(): Promise<PlatformSettings>;
  updatePlatformSettings(data: PlatformSettingsFormData): Promise<{ success: boolean; message: string; }>;

  getNotificationsForUser(userId: string): Promise<Notification[]>;

  getBlogPosts?(): Promise<BlogPost[]>;
  getBlogPost?(idOrSlug: string): Promise<BlogPost | null>;
  createBlogPost?(data: BlogPostFormData): Promise<{ success: boolean; message: string; postId?: string }>;
  updateBlogPost?(id: string, data: Partial<BlogPostFormData>): Promise<{ success: boolean; message: string }>;
  deleteBlogPost?(id: string): Promise<{ success: boolean; message: string; }>;
  
  // New Judicial CRUDs
  getCourts(): Promise<Court[]>;
  getCourt(id: string): Promise<Court | null>;
  createCourt(data: CourtFormData): Promise<{ success: boolean; message: string; courtId?: string; }>;
  updateCourt(id: string, data: Partial<CourtFormData>): Promise<{ success: boolean; message: string; }>;
  deleteCourt(id: string): Promise<{ success: boolean; message: string; }>;
  
  getJudicialDistricts(): Promise<JudicialDistrict[]>;
  getJudicialDistrict(id: string): Promise<JudicialDistrict | null>;
  createJudicialDistrict(data: JudicialDistrictFormData): Promise<{ success: boolean; message: string; districtId?: string; }>;
  updateJudicialDistrict(id: string, data: Partial<JudicialDistrictFormData>): Promise<{ success: boolean; message: string; }>;
  deleteJudicialDistrict(id: string): Promise<{ success: boolean; message: string; }>;

  getJudicialBranches(): Promise<JudicialBranch[]>;
  getJudicialBranch(id: string): Promise<JudicialBranch | null>;
  createJudicialBranch(data: JudicialBranchFormData): Promise<{ success: boolean; message: string; branchId?: string; }>;
  updateJudicialBranch(id: string, data: Partial<JudicialBranchFormData>): Promise<{ success: boolean; message: string; }>;
  deleteJudicialBranch(id: string): Promise<{ success: boolean; message: string; }>;
  
  getJudicialProcesses(): Promise<JudicialProcess[]>;
  getJudicialProcess(id: string): Promise<JudicialProcess | null>;
  createJudicialProcess(data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: string; }>;
  updateJudicialProcess(id: string, data: Partial<JudicialProcessFormData>): Promise<{ success: boolean; message: string; }>;
  deleteJudicialProcess(id: string): Promise<{ success: boolean; message: string; }>;
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

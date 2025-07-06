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

export type UserBidStatus = 'GANHANDO' | 'PERDENDO' | 'SUPERADO_POR_OUTRO' | 'SUPERADO_PELO_PROPRIO_MAXIMO' | 'ARREMATADO' | 'NAO_ARREMATADO';
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
  appliesTo: ('PHYSICAL' | 'LEGAL')[];
}

export interface UserDocument {
  id: string;
  documentTypeId: string;
  userId: string;
  fileUrl?: string; 
  fileName?: string;
  status: UserDocumentStatus;
  uploadDate?: AnyTimestamp;
  analysisDate?: AnyTimestamp;
  analystId?: string; 
  rejectionReason?: string;
  documentType: DocumentType; 
  updatedAt?: AnyTimestamp;
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
  documentUrls?: { [key: string]: string };
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
  updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }>;
  deleteCity(id: string): Promise<{ success: boolean; message: string; }>;

  createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; auctioneerPublicId?: string; }>;
  getAuctioneers(): Promise<AuctioneerProfileInfo[]>;
  getAuctioneer(idOrPublicId: string): Promise<AuctioneerProfileInfo | null>;
  updateAuctioneer(idOrPublicId: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }>;
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
  createReview(review: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; message: string; reviewId?: string; }>;
  
  getQuestionsForLot(lotIdOrPublicId: string): Promise<LotQuestion[]>;
  createQuestion(question: Omit<LotQuestion, "id" | "createdAt" | "answeredAt" | "answeredByUserId" | "answeredByUserDisplayName" | "isPublic">): Promise<{ success: boolean; message: string; questionId?: string; }>;
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
  
  getDocumentTypes(): Promise<DocumentType[]>;
  getUserDocuments(userId: string): Promise<UserDocument[]>;
  saveUserDocument(userId: string, documentTypeId: string, fileUrl: string, fileName: string): Promise<{ success: boolean; message: string; }>;
}

export type UserCreationData = Pick<UserProfileData, 'fullName' | 'email' | 'cpf' | 'cellPhone' | 'dateOfBirth' | 'accountType' | 'razaoSocial' | 'cnpj' | 'inscricaoEstadual' | 'websiteComitente' | 'zipCode' | 'street' | 'number' | 'complement' | 'neighborhood' | 'city' | 'state' | 'optInMarketing'> & {
  password?: string;
  roleId?: string | null; 
  documentUrls?: { [key: string]: string };
};

export interface RecentlyViewedLotInfo {
  id: string;
  title: string;
  imageUrl: string;
  auctionId: string;
  dataAiHint?: string;
}

```
- src/lib/database/mysql.adapter.ts:
```ts
// src/lib/database/mysql.adapter.ts
import { createPool, type RowDataPacket, type Pool, type PoolConnection, type ResultSetHeader } from 'mysql2/promise';
import type {
  IDatabaseAdapter,
  LotCategory, StateInfo, StateFormData,
  CityInfo, CityFormData,
  AuctioneerProfileInfo, AuctioneerFormData,
  SellerProfileInfo, SellerFormData,
  Auction, AuctionFormData, AuctionDbData,
  Lot, LotFormData, LotDbData,
  BidInfo, Review, LotQuestion,
  UserProfileData, EditableUserProfileData, UserHabilitationStatus, UserProfileWithPermissions,
  Role, RoleFormData,
  MediaItem,
  PlatformSettings, PlatformSettingsFormData, Theme,
  Subcategory, SubcategoryFormData,
  MapSettings, SearchPaginationType, MentalTriggerSettings, SectionBadgeConfig, HomepageSectionConfig, AuctionStage,
  DirectSaleOffer, DirectSaleOfferFormData,
  UserLotMaxBid,
  UserWin,
  AuctionStatus, LotStatus,
  Court, CourtFormData,
  JudicialDistrict, JudicialDistrictFormData,
  JudicialBranch, JudicialBranchFormData,
  JudicialProcess, JudicialProcessFormData, ProcessParty,
  Bem, BemFormData,
  DocumentType,
  UserDocument
} from '@/types';
import { samplePlatformSettings } from '@/lib/sample-data';
import { slugify } from '@/lib/sample-data-helpers';
import { v4 as uuidv4 } from 'uuid';
import type { WizardData } from '@/components/admin/wizard/wizard-context';

let pool: Pool | undefined;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.MYSQL_CONNECTION_STRING;
    if (!connectionString || connectionString.trim() === '') {
      throw new Error('MYSQL_CONNECTION_STRING não está definida ou está vazia nas variáveis de ambiente.');
    }
    try {
      const url = new URL(connectionString);
      pool = createPool({
        host: url.hostname,
        port: url.port ? parseInt(url.port, 10) : 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        dateStrings: true, // Keep dates as strings from DB
      });
      console.log('[MySqlAdapter] Pool de conexões MySQL inicializado.');
    } catch (e) {
      console.error("[MySqlAdapter] Erro ao parsear MYSQL_CONNECTION_STRING ou criar pool:", e);
      throw new Error('Formato inválido para MYSQL_CONNECTION_STRING ou falha ao criar pool.');
    }
  }
  return pool;
}

function mapMySqlRowToCamelCase(row: RowDataPacket): any {
    if (!row) return {};
    const newRow: { [key: string]: any } = {};
    for (const key in row) {
        const camelCaseKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        newRow[camelCaseKey] = row[key];
    }
    return newRow;
}

function mapMySqlRowsToCamelCase(rows: RowDataPacket[]): any[] {
    return rows.map(mapMySqlRowToCamelCase);
}

function parseJsonColumn<T>(value: string | null | undefined, defaultValue: T): T {
  if (typeof value === 'string' && value.trim() !== '') {
    try {
      const parsed = JSON.parse(value);
      return parsed;
    } catch (e) {
      console.warn(`[MySqlAdapter] Failed to parse JSON column: ${value}`, e);
      return defaultValue;
    }
  }
  return defaultValue;
}


function mapToLotCategory(row: any): LotCategory {
  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    description: row.description,
    itemCount: Number(row.itemCount || 0),
    hasSubcategories: Boolean(row.hasSubcategories || false),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function mapToSubcategory(row: any): Subcategory {
  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    parentCategoryId: String(row.parentCategoryId),
    description: row.description,
    itemCount: Number(row.itemCount || 0),
    displayOrder: Number(row.displayOrder || 0),
    iconUrl: row.iconUrl,
    dataAiHintIcon: row.dataAiHintIcon,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function mapToStateInfo(row: any): StateInfo {
    return {
        id: String(row.id),
        name: row.name,
        uf: row.uf,
        slug: row.slug,
        cityCount: Number(row.cityCount || 0),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
    };
}

function mapToCityInfo(row: any): CityInfo {
    return {
        id: String(row.id),
        name: row.name,
        slug: row.slug,
        stateId: String(row.stateId),
        stateUf: row.stateUf,
        ibgeCode: row.ibgeCode,
        lotCount: Number(row.lotCount || 0),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
    };
}

function mapToAuctioneerProfileInfo(row: any): AuctioneerProfileInfo {
    return {
        id: String(row.id),
        publicId: row.publicId,
        name: row.name,
        slug: row.slug,
        registrationNumber: row.registrationNumber,
        contactName: row.contactName,
        email: row.email,
        phone: row.phone,
        address: row.address,
        city: row.city,
        state: row.state,
        zipCode: row.zipCode,
        website: row.website,
        logoUrl: row.logoUrl,
        dataAiHintLogo: row.dataAiHintLogo,
        description: row.description,
        memberSince: row.memberSince ? new Date(row.memberSince) : undefined,
        rating: row.rating !== null ? Number(row.rating) : undefined,
        auctionsConductedCount: Number(row.auctionsConductedCount || 0),
        totalValueSold: Number(row.totalValueSold || 0),
        userId: row.userId,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
    };
}

function mapToSellerProfileInfo(row: any): SellerProfileInfo {
    return {
        id: String(row.id),
        publicId: row.publicId,
        name: row.name,
        slug: row.slug,
        contactName: row.contactName,
        email: row.email,
        phone: row.phone,
        address: row.address,
        city: row.city,
        state: row.state,
        zipCode: row.zipCode,
        website: row.website,
        logoUrl: row.logoUrl,
        dataAiHintLogo: row.dataAiHintLogo,
        description: row.description,
        memberSince: row.memberSince ? new Date(row.memberSince) : undefined,
        rating: row.rating !== null ? Number(row.rating) : undefined,
        activeLotsCount: Number(row.activeLotsCount || 0),
        totalSalesValue: Number(row.totalSalesValue || 0),
        auctionsFacilitatedCount: Number(row.auctionsFacilitatedCount || 0),
        userId: row.userId,
        isJudicial: Boolean(row.isJudicial),
        judicialBranchId: row.judicialBranchId ? String(row.judicialBranchId) : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
    };
}


function mapToRole(row: any): Role {
    return {
        id: String(row.id),
        name: row.name,
        name_normalized: row.nameNormalized,
        description: row.description,
        permissions: parseJsonColumn<string[]>(row.permissions, []),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
    };
}

function mapToUserProfileData(row: any, role?: Role | null): UserProfileWithPermissions {
    const profile: UserProfileWithPermissions = {
        uid: row.uid,
        email: row.email,
        fullName: row.fullName,
        password: row.passwordText,
        roleId: row.roleId ? String(row.roleId) : undefined,
        roleName: role?.name || row.roleNameFromJoin || row.roleName || undefined,
        permissions: role?.permissions && role.permissions.length > 0 ? role.permissions : parseJsonColumn<string[]>(row.permissions || row.rolePermissionsFromJoin, []),
        status: row.status,
        habilitationStatus: row.habilitationStatus as UserHabilitationStatus,
        cpf: row.cpf,
        rgNumber: row.rgNumber,
        rgIssuer: row.rgIssuer,
        rgIssueDate: row.rgIssueDate ? new Date(row.rgIssueDate) : undefined,
        rgState: row.rgState,
        dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : undefined,
        cellPhone: row.cellPhone,
        homePhone: row.homePhone,
        gender: row.gender,
        profession: row.profession,
        nationality: row.nationality,
        maritalStatus: row.maritalStatus,
        propertyRegime: row.propertyRegime,
        spouseName: row.spouseName,
        spouseCpf: row.spouseCpf,
        zipCode: row.zipCode,
        street: row.street,
        number: row.number,
        complement: row.complement,
        neighborhood: row.neighborhood,
        city: row.city,
        state: row.state,
        optInMarketing: Boolean(row.optInMarketing),
        avatarUrl: row.avatarUrl,
        dataAiHint: row.dataAiHint,
        accountType: row.accountType as UserProfileData['accountType'],
        razaoSocial: row.razaoSocial,
        cnpj: row.cnpj,
        inscricaoEstadual: row.inscricaoEstadual,
        websiteComitente: row.websiteComitente,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
    };
    return profile;
}

function mapToAuction(row: any): Auction {
    return {
        id: String(row.id),
        publicId: row.publicId,
        title: row.title,
        description: row.description,
        status: row.status as AuctionStatus,
        auctionType: row.auctionType,
        category: row.categoryName || row.category,
        categoryId: row.categoryId ? String(row.categoryId) : undefined,
        auctioneer: row.auctioneerName || row.auctioneer,
        auctioneerId: row.auctioneerId ? String(row.auctioneerId) : undefined,
        seller: row.sellerName || row.seller,
        sellerId: row.sellerId ? String(row.sellerId) : undefined,
        auctionDate: new Date(row.auctionDate),
        endDate: row.endDate ? new Date(row.endDate) : null,
        auctionStages: parseJsonColumn<AuctionStage[]>(row.auctionStages, []),
        city: row.city,
        state: row.state,
        imageUrl: row.imageUrl,
        dataAiHint: row.dataAiHint,
        documentsUrl: row.documentsUrl,
        totalLots: Number(row.totalLotsCount || 0),
        visits: Number(row.visits || 0),
        initialOffer: row.initialOffer !== null ? Number(row.initialOffer) : undefined,
        isFavorite: Boolean(row.isFavorite),
        currentBid: row.currentBid !== null ? Number(row.currentBid) : undefined,
        bidsCount: Number(row.bidsCount || 0),
        sellingBranch: row.sellingBranch,
        vehicleLocation: row.vehicleLocation,
        latitude: row.latitude !== null ? parseFloat(row.latitude) : undefined,
        longitude: row.longitude !== null ? parseFloat(row.longitude) : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
        auctioneerLogoUrl: row.auctioneerLogoUrl,
        lots: [],
        automaticBiddingEnabled: Boolean(row.automaticBiddingEnabled),
        allowInstallmentBids: Boolean(row.allowInstallmentBids),
        softCloseEnabled: Boolean(row.softCloseEnabled),
        softCloseMinutes: row.softCloseMinutes !== null ? Number(row.softCloseMinutes) : undefined,
        estimatedRevenue: row.estimatedRevenue !== null ? Number(row.estimatedRevenue) : undefined,
        achievedRevenue: row.achievedRevenue !== null ? Number(row.achievedRevenue) : undefined,
        totalHabilitatedUsers: Number(row.totalHabilitatedUsers || 0),
        isFeaturedOnMarketplace: Boolean(row.isFeaturedOnMarketplace),
        marketplaceAnnouncementTitle: row.marketplaceAnnouncementTitle,
        autoRelistSettings: parseJsonColumn(row.autoRelistSettings, {}),
        originalAuctionId: row.originalAuctionId ? String(row.originalAuctionId) : undefined,
        relistCount: Number(row.relistCount || 0),
        decrementAmount: row.decrementAmount !== null ? Number(row.decrementAmount) : undefined,
        decrementIntervalSeconds: row.decrementIntervalSeconds !== null ? Number(row.decrementIntervalSeconds) : undefined,
        floorPrice: row.floorPrice !== null ? Number(row.floorPrice) : undefined,
        silentBiddingEnabled: Boolean(row.silentBiddingEnabled),
        allowMultipleBidsPerUser: Boolean(row.allowMultipleBidsPerUser),
    };
}

function mapToLot(row: any): Lot {
  return {
    id: String(row.id),
    publicId: row.publicId,
    auctionId: String(row.auctionId),
    title: row.title,
    number: row.number,
    imageUrl: row.imageUrl,
    dataAiHint: row.dataAiHint,
    galleryImageUrls: parseJsonColumn<string[]>(row.galleryImageUrls, []),
    mediaItemIds: parseJsonColumn<string[]>(row.mediaItemIds, []),
    status: row.status as LotStatus,
    stateId: row.stateId ? String(row.stateId) : undefined,
    cityId: row.cityId ? String(row.cityId) : undefined,
    cityName: row.cityName,
    stateUf: row.stateUf,
    type: row.categoryName || row.type,
    categoryId: row.categoryId ? String(row.categoryId) : undefined,
    subcategoryId: row.subcategoryId ? String(row.subcategoryId) : undefined,
    subcategoryName: row.subcategoryName,
    views: Number(row.views || 0),
    auctionName: row.auctionName,
    price: Number(row.price),
    initialPrice: row.initialPrice !== null ? Number(row.initialPrice) : undefined,
    lotSpecificAuctionDate: row.lotSpecificAuctionDate ? new Date(row.lotSpecificAuctionDate) : null,
    secondAuctionDate: row.secondAuctionDate ? new Date(row.secondAuctionDate) : null,
    secondInitialPrice: row.secondInitialPrice !== null ? Number(row.secondInitialPrice) : undefined,
    endDate: row.endDate ? new Date(row.endDate) : undefined,
    bidsCount: Number(row.bidsCount || 0),
    isFavorite: Boolean(row.isFavorite),
    isFeatured: Boolean(row.isFeatured),
    description: row.description,
    year: row.year !== null ? Number(row.year) : undefined,
    make: row.make,
    model: row.model,
    series: row.series,
    stockNumber: row.stockNumber,
    sellingBranch: row.sellingBranch,
    vin: row.vin,
    vinStatus: row.vinStatus,
    lossType: row.lossType,
    primaryDamage: row.primaryDamage,
    titleInfo: row.titleInfo,
    titleBrand: row.titleBrand,
    startCode: row.startCode,
    hasKey: row.hasKey,
    odometer: row.odometer,
    airbagsStatus: row.airbagsStatus,
    bodyStyle: row.bodyStyle,
    engineDetails: row.engineDetails,
    transmissionType: row.transmissionType,
    driveLineType: row.driveLineType,
    fuelType: row.fuelType,
    cylinders: row.cylinders,
    restraintSystem: row.restraintSystem,
    exteriorInteriorColor: row.exteriorinteriorcolor,
    options: row.options,
    manufacturedIn: row.manufacturedIn,
    vehicleClass: row.vehicleClass,
    vehicleLocationInBranch: row.vehicleLocationInBranch,
    laneRunNumber: row.laneRunNumber,
    aisleStall: row.aisleStall,
    actualCashValue: row.actualCashValue,
    estimatedRepairCost: row.estimatedRepairCost,
    sellerName: row.lotSellerName || row.sellerName,
    sellerId: row.sellerIdFk ? String(row.sellerIdFk) : (row.sellerId ? String(row.sellerId) : undefined),
    auctioneerName: row.lotAuctioneerName || row.auctioneerName,
    auctioneerId: row.auctioneerIdFk ? String(row.auctioneerIdFk) : (row.auctioneerId ? String(row.auctioneerId) : undefined),
    condition: row.condition,
    bidIncrementStep: row.bidIncrementStep !== null ? Number(row.bidIncrementStep) : undefined,
    allowInstallmentBids: Boolean(row.allowInstallmentBids),
    judicialProcessNumber: row.judicialProcessNumber,
    courtDistrict: row.courtDistrict,
    courtName: row.courtName,
    publicProcessUrl: row.publicProcessUrl,
    propertyRegistrationNumber: row.propertyRegistrationNumber,
    propertyLiens: row.propertyLiens,
    knownDebts: row.knownDebts,
    additionalDocumentsInfo: row.additionalDocumentsInfo,
    latitude: row.latitude !== null ? parseFloat(row.latitude) : undefined,
    longitude: row.longitude !== null ? parseFloat(row.longitude) : undefined,
    mapAddress: row.mapAddress,
    mapEmbedUrl: row.mapEmbedUrl,
    mapStaticImageUrl: row.mapStaticImageUrl,
    reservePrice: row.reservePrice !== null ? Number(row.reservePrice) : undefined,
    evaluationValue: row.evaluationValue !== null ? Number(row.evaluationValue) : undefined,
    debtAmount: row.debtAmount !== null ? Number(row.debtAmount) : undefined,
    itbiValue: row.itbiValue !== null ? Number(row.itbiValue) : undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function mapToJudicialProcess(row: any, parties: ProcessParty[] = []): JudicialProcess {
  return {
    id: String(row.id),
    publicId: row.publicId,
    processNumber: row.processNumber,
    oldProcessNumber: row.oldProcessNumber,
    isElectronic: Boolean(row.isElectronic),
    courtId: String(row.courtId),
    districtId: String(row.districtId),
    branchId: String(row.branchId),
    courtName: row.courtName,
    districtName: row.districtName,
    branchName: row.branchName,
    parties,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function mapToBem(row: any): Bem {
    return {
        id: String(row.id),
        publicId: row.publicId,
        title: row.title,
        description: row.description,
        judicialProcessId: row.judicialProcessId ? String(row.judicialProcessId) : undefined,
        judicialProcessNumber: row.judicialProcessNumber,
        status: row.status,
        categoryId: row.categoryId ? String(row.categoryId) : undefined,
        subcategoryId: row.subcategoryId ? String(row.subcategoryId) : undefined,
        categoryName: row.categoryName,
        subcategoryName: row.subcategoryName,
        imageUrl: row.imageUrl,
        imageMediaId: row.imageMediaId,
        dataAiHint: row.dataAiHint,
        evaluationValue: row.evaluationValue !== null ? Number(row.evaluationValue) : undefined,
        locationCity: row.locationCity,
        locationState: row.locationState,
        address: row.address,
        latitude: row.latitude !== null ? Number(row.latitude) : undefined,
        longitude: row.longitude !== null ? Number(row.longitude) : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
    };
}


function mapToBidInfo(row: any): BidInfo {
    return {
        id: String(row.id),
        lotId: String(row.lotId),
        auctionId: String(row.auctionId),
        bidderId: row.bidderId,
        bidderDisplay: row.bidderDisplayName,
        amount: parseFloat(row.amount),
        timestamp: new Date(row.timestamp),
    };
}

function mapToUserLotMaxBid(row: any): UserLotMaxBid {
    return {
        id: String(row.id),
        userId: row.userId,
        lotId: String(row.lotId),
        maxAmount: parseFloat(row.maxAmount),
        isActive: Boolean(row.isActive),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
    };
}

function mapToMediaItem(row: any): MediaItem {
  return {
    id: String(row.id),
    fileName: row.fileName,
    uploadedAt: new Date(row.uploadedAt),
    uploadedBy: row.uploadedBy,
    storagePath: row.storagePath,
    title: row.title,
    altText: row.altText,
    caption: row.caption,
    description: row.description,
    mimeType: row.mimeType,
    sizeBytes: Number(row.sizeBytes),
    dimensions: row.dimensionsWidth && row.dimensionsHeight ? { width: Number(row.dimensionsWidth), height: Number(row.dimensionsHeight) } : undefined,
    urlOriginal: row.urlOriginal,
    urlThumbnail: row.urlThumbnail,
    urlMedium: row.urlMedium,
    urlLarge: row.urlLarge,
    linkedLotIds: parseJsonColumn<string[]>(row.linkedLotIds, []),
    dataAiHint: row.dataAiHint,
  };
}

function mapToPlatformSettings(row: any): PlatformSettings {
    return {
        id: String(row.id),
        siteTitle: row.siteTitle,
        siteTagline: row.siteTagline,
        galleryImageBasePath: row.galleryImageBasePath,
        storageProvider: row.storageProvider as PlatformSettings['storageProvider'],
        firebaseStorageBucket: row.firebaseStorageBucket,
        activeThemeName: row.activeThemeName,
        themes: parseJsonColumn<Theme[]>(row.themes, []),
        platformPublicIdMasks: parseJsonColumn<PlatformSettings['platformPublicIdMasks']>(row.platformPublicIdMasks, {}),
        mapSettings: parseJsonColumn<MapSettings>(row.mapSettings, samplePlatformSettings.mapSettings),
        searchPaginationType: row.searchPaginationType as SearchPaginationType || samplePlatformSettings.searchPaginationType,
        searchItemsPerPage: Number(row.searchItemsPerPage || samplePlatformSettings.searchItemsPerPage),
        searchLoadMoreCount: Number(row.searchLoadMoreCount || samplePlatformSettings.searchLoadMoreCount),
        showCountdownOnLotDetail: row.showCountdownOnLotDetail === null ? samplePlatformSettings.showCountdownOnLotDetail : Boolean(row.showCountdownOnLotDetail),
        showCountdownOnCards: row.showCountdownOnCards === null ? samplePlatformSettings.showCountdownOnCards : Boolean(row.showCountdownOnCards),
        showRelatedLotsOnLotDetail: row.showRelatedLotsOnLotDetail === null ? samplePlatformSettings.showRelatedLotsOnLotDetail : Boolean(row.showRelatedLotsOnLotDetail),
        relatedLotsCount: Number(row.relatedLotsCount || samplePlatformSettings.relatedLotsCount),
        mentalTriggerSettings: parseJsonColumn<MentalTriggerSettings>(row.mentalTriggerSettings, samplePlatformSettings.mentalTriggerSettings),
        sectionBadgeVisibility: parseJsonColumn<SectionBadgeConfig>(row.sectionBadgeVisibility, samplePlatformSettings.sectionBadgeVisibility),
        homepageSections: parseJsonColumn<HomepageSectionConfig[]>(row.homepageSections, samplePlatformSettings.homepageSections),
        updatedAt: new Date(row.updatedAt)
    };
}

function mapToReview(row: any): Review {
  return {
    id: String(row.id),
    lotId: String(row.lotId),
    auctionId: String(row.auctionId),
    userId: row.userId,
    userDisplayName: row.userDisplayName,
    rating: Number(row.rating),
    comment: row.comment,
    createdAt: new Date(row.createdAt),
    updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined,
  };
}

function mapToLotQuestion(row: any): LotQuestion {
  return {
    id: String(row.id),
    lotId: String(row.lotId),
    auctionId: String(row.auctionId),
    userId: row.userId,
    userDisplayName: row.userDisplayName,
    questionText: row.questionText,
    createdAt: new Date(row.createdAt),
    answerText: row.answerText,
    answeredAt: row.answeredAt ? new Date(row.answeredAt) : undefined,
    answeredByUserId: row.answeredByUserId,
    answeredByUserDisplayName: row.answeredByUserDisplayName,
    isPublic: Boolean(row.isPublic),
  };
}

const defaultRolesData: RoleFormData[] = [
  { name: 'ADMINISTRATOR', description: 'Acesso total à plataforma.', permissions: ['manage_all'] },
  { name: 'USER', description: 'Usuário padrão.', permissions: ['view_auctions', 'place_bids', 'view_lots'] },
  { name: 'CONSIGNOR', description: 'Comitente.', permissions: ['auctions:manage_own', 'lots:manage_own', 'view_reports', 'media:upload'] },
  { name: 'AUCTIONEER', description: 'Leiloeiro.', permissions: ['auctions:manage_assigned', 'lots:read', 'lots:update', 'conduct_auctions'] },
  { name: 'AUCTION_ANALYST', description: 'Analista de Leilões.', permissions: ['categories:read', 'states:read', 'users:read', 'view_reports'] }
];

export class MySqlAdapter implements IDatabaseAdapter {
  constructor() {
    getPool();
  }
  
  async getDocumentTypes(): Promise<DocumentType[]> {
    console.warn("[MySqlAdapter] getDocumentTypes not implemented.");
    return [];
  }
  async getUserDocuments(userId: string): Promise<UserDocument[]> {
    console.warn("[MySqlAdapter] getUserDocuments not implemented.");
    return [];
  }
  async saveUserDocument(userId: string, documentTypeId: string, fileUrl: string, fileName: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] saveUserDocument not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
  }

  async createAuctionWithLots(wizardData: WizardData): Promise<{ success: boolean; message: string; auctionId?: string; }> {
    console.warn("[MySqlAdapter] createAuctionWithLots is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async updateBensStatus(bemIds: string[], status: "DISPONIVEL" | "LOTEADO" | "VENDIDO" | "REMOVIDO", connection?: any): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateBensStatus is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async createLotsFromBens(lotsToCreate: LotDbData[]): Promise<{ success: boolean; message: string; createdLots?: Lot[]; }> {
    console.warn("[MySqlAdapter] createLotsFromBens is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getAuction(idOrPublicId: string): Promise<Auction | null> {
    console.warn("[MySqlAdapter] getAuction is not yet implemented for MySQL.");
    return null;
  }
  async getBem(id: string): Promise<Bem | null> {
    console.warn("[MySqlAdapter] getBem is not yet implemented for MySQL.");
    return null;
  }
  async getBens(judicialProcessId?: string | undefined): Promise<Bem[]> {
    console.warn("[MySqlAdapter] getBens is not yet implemented for MySQL.");
    return [];
  }
  async getBensByIds(ids: string[]): Promise<Bem[]> {
    console.warn("[MySqlAdapter] getBensByIds is not yet implemented for MySQL.");
    return [];
  }
  async createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string; }> {
    console.warn("[MySqlAdapter] createBem is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateBem is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteBem(id: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteBem is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getCourts(): Promise<Court[]> {
    console.warn("[MySqlAdapter] getCourts is not yet implemented for MySQL.");
    return [];
  }
  async getCourt(id: string): Promise<Court | null> {
    console.warn("[MySqlAdapter] getCourt is not yet implemented for MySQL.");
    return null;
  }
  async createCourt(data: CourtFormData): Promise<{ success: boolean; message: string; courtId?: string; }> {
    console.warn("[MySqlAdapter] createCourt is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async updateCourt(id: string, data: Partial<CourtFormData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateCourt is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteCourt(id: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteCourt is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getJudicialDistricts(): Promise<JudicialDistrict[]> {
    console.warn("[MySqlAdapter] getJudicialDistricts is not yet implemented for MySQL.");
    return [];
  }
  async getJudicialDistrict(id: string): Promise<JudicialDistrict | null> {
    console.warn("[MySqlAdapter] getJudicialDistrict is not yet implemented for MySQL.");
    return null;
  }
  async createJudicialDistrict(data: JudicialDistrictFormData): Promise<{ success: boolean; message: string; districtId?: string; }> {
    console.warn("[MySqlAdapter] createJudicialDistrict is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async updateJudicialDistrict(id: string, data: Partial<JudicialDistrictFormData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateJudicialDistrict is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteJudicialDistrict(id: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteJudicialDistrict is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getJudicialBranches(): Promise<JudicialBranch[]> {
    console.warn("[MySqlAdapter] getJudicialBranches is not yet implemented for MySQL.");
    return [];
  }
  async getJudicialBranch(id: string): Promise<JudicialBranch | null> {
    console.warn("[MySqlAdapter] getJudicialBranch is not yet implemented for MySQL.");
    return null;
  }
  async createJudicialBranch(data: JudicialBranchFormData): Promise<{ success: boolean; message: string; branchId?: string; }> {
    console.warn("[MySqlAdapter] createJudicialBranch is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async updateJudicialBranch(id: string, data: Partial<JudicialBranchFormData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateJudicialBranch is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteJudicialBranch(id: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteJudicialBranch is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getJudicialProcesses(): Promise<JudicialProcess[]> {
    console.warn("[MySqlAdapter] getJudicialProcesses is not yet implemented for MySQL.");
    return [];
  }
  async getJudicialProcess(id: string): Promise<JudicialProcess | null> {
    console.warn("[MySqlAdapter] getJudicialProcess is not yet implemented for MySQL.");
    return null;
  }
  async createJudicialProcess(data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: string; }> {
    console.warn("[MySqlAdapter] createJudicialProcess is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async updateJudicialProcess(id: string, data: Partial<JudicialProcessFormData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateJudicialProcess is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteJudicialProcess(id: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteJudicialProcess is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  
  async disconnect(): Promise<void> {
    if (pool) {
        await pool.end();
        pool = undefined;
        console.log('[MySqlAdapter] Pool de conexões MySQL encerrado.');
    }
  }
  
  async getWinsForUser(userId: string): Promise<UserWin[]> {
    console.warn("[MySqlAdapter] getWinsForUser is not yet implemented for MySQL.");
    return Promise.resolve([]);
  }
  
  async answerQuestion(lotId: string, questionId: string, answerText: string, answeredByUserId: string, answeredByUserDisplayName: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] answerQuestion is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada para MySQL." };
  }

  async createUserLotMaxBid(userId: string, lotId: string, maxAmount: number): Promise<{ success: boolean; message: string; maxBidId?: string; }> {
    console.warn("[MySqlAdapter] createUserLotMaxBid is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada para MySQL." };
  }

  async getActiveUserLotMaxBid(userId: string, lotId: string): Promise<UserLotMaxBid | null> {
    console.warn("[MySqlAdapter] getActiveUserLotMaxBid is not yet implemented for MySQL.");
    return null;
  }
  
  async getAuctioneerByName(name: string): Promise<AuctioneerProfileInfo | null> {
    const [rows] = await getPool().execute<RowDataPacket[]>('SELECT * FROM auctioneers WHERE name = ? LIMIT 1', [name]);
    if (rows.length === 0) return null;
    return mapToAuctioneerProfileInfo(mapMySqlRowToCamelCase(rows[0]));
  }
  
  async getAuctioneerBySlug(slug: string): Promise<AuctioneerProfileInfo | null> {
    const [rows] = await getPool().execute<RowDataPacket[]>('SELECT * FROM auctioneers WHERE slug = ? OR public_id = ? LIMIT 1', [slug, slug]);
    if (rows.length === 0) return null;
    return mapToAuctioneerProfileInfo(mapMySqlRowToCamelCase(rows[0]));
  }

  async getSellerByName(name: string): Promise<SellerProfileInfo | null> {
    const [rows] = await getPool().execute<RowDataPacket[]>('SELECT * FROM sellers WHERE name = ? LIMIT 1', [name]);
    if (rows.length === 0) return null;
    return mapToSellerProfileInfo(mapMySqlRowToCamelCase(rows[0]));
  }

  async getSellerBySlug(slug: string): Promise<SellerProfileInfo | null> {
    const [rows] = await getPool().execute<RowDataPacket[]>('SELECT * FROM sellers WHERE slug = ? OR public_id = ? LIMIT 1', [slug, slug]);
    if (rows.length === 0) return null;
    return mapToSellerProfileInfo(mapMySqlRowToCamelCase(rows[0]));
  }

  async getAuctionsByAuctioneerSlug(auctioneerSlugOrPublicId: string): Promise<Auction[]> {
    console.warn("[MySqlAdapter] getAuctionsByAuctioneerSlug is not yet implemented for MySQL.");
    return Promise.resolve([]);
  }

  async getDirectSaleOffers(): Promise<DirectSaleOffer[]> {
    console.warn("[MySqlAdapter] getDirectSaleOffers is not yet implemented for MySQL.");
    return Promise.resolve([]);
  }
  
  async getDirectSaleOffer(id: string): Promise<DirectSaleOffer | null> {
    console.warn("[MySqlAdapter] getDirectSaleOffer not implemented.");
    return null;
  }
  
  async createDirectSaleOffer(data: DirectSaleOfferFormData): Promise<{ success: boolean; message: string; offerId?: string; }> {
    console.warn("[MySqlAdapter] createDirectSaleOffer not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async updateDirectSaleOffer(id: string, data: Partial<DirectSaleOfferFormData>): Promise<{ success: boolean; message: string; }> {
      console.warn("[MySqlAdapter] updateDirectSaleOffer not implemented.");
      return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteDirectSaleOffer(id: string): Promise<{ success: boolean; message: string; }> {
      console.warn("[MySqlAdapter] deleteDirectSaleOffer not implemented.");
      return { success: false, message: "Funcionalidade não implementada." };
  }

  async getAuctionsByIds(ids: string[]): Promise<Auction[]> {
    console.warn("[MySqlAdapter] getAuctionsByIds is not yet implemented for MySQL.");
    return Promise.resolve([]);
  }
  
  async getLotsByIds(ids: string[]): Promise<Lot[]> {
    console.warn("[MySqlAdapter] getLotsByIds is not yet implemented for MySQL.");
    return Promise.resolve([]);
  }
  
  async initializeSchema(): Promise<{ success: boolean; message: string; errors?: any[], rolesProcessed?: number }> {
    const connection = await getPool().getConnection();
    const errors: any[] = [];
    
    // Lista de todas as queries de criação de tabela
    const queries = [
        `CREATE TABLE IF NOT EXISTS roles ( id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE, name_normalized VARCHAR(100) NOT NULL UNIQUE, description TEXT, permissions JSON, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP );`,
        `CREATE TABLE IF NOT EXISTS users ( uid VARCHAR(255) PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE, full_name VARCHAR(255), password_text VARCHAR(255), role_id INT, status VARCHAR(50), habilitation_status VARCHAR(50), cpf VARCHAR(20), rg_number VARCHAR(20), rg_issuer VARCHAR(50), rg_issue_date DATE, rg_state VARCHAR(2), date_of_birth DATE, cell_phone VARCHAR(20), home_phone VARCHAR(20), gender VARCHAR(50), profession VARCHAR(100), nationality VARCHAR(100), marital_status VARCHAR(50), property_regime VARCHAR(50), spouse_name VARCHAR(255), spouse_cpf VARCHAR(20), zip_code VARCHAR(10), street VARCHAR(255), number VARCHAR(20), complement VARCHAR(100), neighborhood VARCHAR(100), city VARCHAR(100), state VARCHAR(100), opt_in_marketing BOOLEAN DEFAULT FALSE, avatar_url TEXT, data_ai_hint VARCHAR(255), account_type VARCHAR(50), razao_social VARCHAR(255), cnpj VARCHAR(20), inscricao_estadual VARCHAR(50), website_comitente VARCHAR(255), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL );`,
        `CREATE TABLE IF NOT EXISTS lot_categories ( id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, slug VARCHAR(255) NOT NULL UNIQUE, description TEXT, item_count INT DEFAULT 0, has_subcategories BOOLEAN DEFAULT FALSE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP );`,
        `CREATE TABLE IF NOT EXISTS subcategories ( id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, slug VARCHAR(255) NOT NULL, parent_category_id INT NOT NULL, description TEXT, item_count INT DEFAULT 0, display_order INT DEFAULT 0, icon_url TEXT, data_ai_hint_icon VARCHAR(255), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (parent_category_id) REFERENCES lot_categories(id) ON DELETE CASCADE, UNIQUE (parent_category_id, slug) );`,
        `CREATE TABLE IF NOT EXISTS states ( id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, uf VARCHAR(2) NOT NULL UNIQUE, slug VARCHAR(100) NOT NULL UNIQUE, city_count INT DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP );`,
        `CREATE TABLE IF NOT EXISTS cities ( id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) NOT NULL, slug VARCHAR(150) NOT NULL, state_id INT NOT NULL, state_uf VARCHAR(2), ibge_code VARCHAR(10), lot_count INT DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE );`,
        `CREATE TABLE IF NOT EXISTS auctioneers ( id INT AUTO_INCREMENT PRIMARY KEY, public_id VARCHAR(255) UNIQUE, name VARCHAR(150) NOT NULL, slug VARCHAR(150) NOT NULL UNIQUE, registration_number VARCHAR(50), contact_name VARCHAR(150), email VARCHAR(150), phone VARCHAR(20), address VARCHAR(200), city VARCHAR(100), state VARCHAR(50), zip_code VARCHAR(10), website TEXT, logo_url TEXT, data_ai_hint_logo VARCHAR(50), description TEXT, member_since DATETIME, rating DECIMAL(3, 2), auctions_conducted_count INT DEFAULT 0, total_value_sold DECIMAL(15, 2) DEFAULT 0, user_id VARCHAR(255), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP );`,
        `CREATE TABLE IF NOT EXISTS sellers ( id INT AUTO_INCREMENT PRIMARY KEY, public_id VARCHAR(255) UNIQUE, name VARCHAR(150) NOT NULL, slug VARCHAR(150) NOT NULL UNIQUE, contact_name VARCHAR(150), email VARCHAR(150), phone VARCHAR(20), address VARCHAR(200), city VARCHAR(100), state VARCHAR(50), zip_code VARCHAR(10), website TEXT, logo_url TEXT, data_ai_hint_logo VARCHAR(50), description TEXT, member_since DATETIME, rating DECIMAL(3, 2), active_lots_count INT, total_sales_value DECIMAL(15, 2), auctions_facilitated_count INT, user_id VARCHAR(255), is_judicial BOOLEAN DEFAULT FALSE, cnpj VARCHAR(20), razao_social VARCHAR(255), inscricao_estadual VARCHAR(50), judicial_branch_id INT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP );`,
        `CREATE TABLE IF NOT EXISTS auctions ( id INT AUTO_INCREMENT PRIMARY KEY, public_id VARCHAR(255) UNIQUE, title VARCHAR(255) NOT NULL, description TEXT, status VARCHAR(50), auction_type VARCHAR(50), category_id INT, auctioneer_id INT, seller_id INT, judicial_process_id INT, auction_date DATETIME NOT NULL, end_date DATETIME, city VARCHAR(100), state VARCHAR(2), image_url TEXT, data_ai_hint VARCHAR(255), documents_url TEXT, visits INT DEFAULT 0, initial_offer DECIMAL(15, 2), soft_close_enabled BOOLEAN DEFAULT FALSE, soft_close_minutes INT, automatic_bidding_enabled BOOLEAN DEFAULT FALSE, silent_bidding_enabled BOOLEAN DEFAULT FALSE, allow_multiple_bids_per_user BOOLEAN DEFAULT TRUE, allow_installment_bids BOOLEAN, estimated_revenue DECIMAL(15, 2), achieved_revenue DECIMAL(15, 2), total_habilitated_users INT, total_lots INT, is_featured_on_marketplace BOOLEAN, marketplace_announcement_title VARCHAR(150), auction_stages JSON, auto_relist_settings JSON, decrement_amount DECIMAL(15, 2), decrement_interval_seconds INT, floor_price DECIMAL(15, 2), original_auction_id INT, relist_count INT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (category_id) REFERENCES lot_categories(id), FOREIGN KEY (auctioneer_id) REFERENCES auctioneers(id), FOREIGN KEY (seller_id) REFERENCES sellers(id), FOREIGN KEY (original_auction_id) REFERENCES auctions(id) );`,
        `CREATE TABLE IF NOT EXISTS lots ( id INT AUTO_INCREMENT PRIMARY KEY, public_id VARCHAR(255) UNIQUE, auction_id INT, bem_ids JSON, number VARCHAR(50), title VARCHAR(255) NOT NULL, description TEXT, status VARCHAR(50), price DECIMAL(15, 2), initial_price DECIMAL(15, 2), bid_increment_step DECIMAL(15,2), category_id INT, subcategory_id INT, bids_count INT DEFAULT 0, is_featured BOOLEAN DEFAULT FALSE, reserve_price DECIMAL(15, 2), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE SET NULL );`,
        `CREATE TABLE IF NOT EXISTS platform_settings ( id INT AUTO_INCREMENT PRIMARY KEY, site_title VARCHAR(255), site_tagline TEXT, gallery_image_base_path VARCHAR(255), storage_provider VARCHAR(50), firebase_storage_bucket VARCHAR(255), active_theme_name VARCHAR(100), themes JSON, platform_public_id_masks JSON, map_settings JSON, search_pagination_type VARCHAR(50), search_items_per_page INT, search_load_more_count INT, show_countdown_on_lot_detail BOOLEAN, show_countdown_on_cards BOOLEAN, show_related_lots_on_lot_detail BOOLEAN, related_lots_count INT, mental_trigger_settings JSON, section_badge_visibility JSON, homepage_sections JSON, variable_increment_table JSON, bidding_settings JSON, default_list_items_per_page INT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP );`,
        `CREATE TABLE IF NOT EXISTS courts ( id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) NOT NULL, slug VARCHAR(150) NOT NULL UNIQUE, website TEXT, state_uf VARCHAR(2) NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP );`,
        `CREATE TABLE IF NOT EXISTS judicial_districts ( id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) NOT NULL, slug VARCHAR(150) NOT NULL, court_id INT NOT NULL, state_id INT NOT NULL, zip_code VARCHAR(10), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (court_id) REFERENCES courts(id), FOREIGN KEY (state_id) REFERENCES states(id), UNIQUE (slug, state_id) );`,
        `CREATE TABLE IF NOT EXISTS judicial_branches ( id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) NOT NULL, slug VARCHAR(150) NOT NULL, district_id INT NOT NULL, contact_name VARCHAR(150), phone VARCHAR(20), email VARCHAR(150), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (district_id) REFERENCES judicial_districts(id), UNIQUE (slug, district_id) );`,
        `CREATE TABLE IF NOT EXISTS judicial_processes ( id INT AUTO_INCREMENT PRIMARY KEY, public_id VARCHAR(255) UNIQUE, process_number VARCHAR(100) NOT NULL UNIQUE, old_process_number VARCHAR(100), is_electronic BOOLEAN, court_id INT NOT NULL, district_id INT NOT NULL, branch_id INT NOT NULL, seller_id INT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (court_id) REFERENCES courts(id), FOREIGN KEY (district_id) REFERENCES judicial_districts(id), FOREIGN KEY (branch_id) REFERENCES judicial_branches(id), FOREIGN KEY (seller_id) REFERENCES sellers(id) );`,
        `CREATE TABLE IF NOT EXISTS process_parties ( id INT AUTO_INCREMENT PRIMARY KEY, process_id INT NOT NULL, name VARCHAR(255) NOT NULL, document_number VARCHAR(50), party_type VARCHAR(50) NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (process_id) REFERENCES judicial_processes(id) ON DELETE CASCADE );`,
        `CREATE TABLE IF NOT EXISTS bens ( id INT AUTO_INCREMENT PRIMARY KEY, public_id VARCHAR(255) UNIQUE, title VARCHAR(255) NOT NULL, description TEXT, judicial_process_id INT, status VARCHAR(50) DEFAULT 'DISPONIVEL', category_id INT, subcategory_id INT, image_url TEXT, image_media_id VARCHAR(255), data_ai_hint VARCHAR(255), evaluation_value DECIMAL(15, 2), location_city VARCHAR(100), location_state VARCHAR(100), address VARCHAR(255), latitude DECIMAL(10, 8), longitude DECIMAL(11, 8), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (judicial_process_id) REFERENCES judicial_processes(id), FOREIGN KEY (category_id) REFERENCES lot_categories(id), FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) );`,
        `CREATE TABLE IF NOT EXISTS user_wins ( id INT AUTO_INCREMENT PRIMARY KEY, user_id VARCHAR(255) NOT NULL, lot_id INT NOT NULL, winning_bid_amount DECIMAL(15, 2) NOT NULL, win_date DATETIME NOT NULL, payment_status VARCHAR(50) DEFAULT 'PENDENTE', invoice_url TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(uid), FOREIGN KEY (lot_id) REFERENCES lots(id) );`,
        `CREATE TABLE IF NOT EXISTS bids ( id INT AUTO_INCREMENT PRIMARY KEY, lot_id INT NOT NULL, auction_id INT, bidder_id VARCHAR(255) NOT NULL, bidder_display_name VARCHAR(255), amount DECIMAL(15,2) NOT NULL, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE CASCADE );`
    ];

    try {
        await connection.beginTransaction();
        console.log('[MySqlAdapter] Executing schema creation queries...');
        for (const [index, query] of queries.entries()) {
            try {
                // Remove trailing semicolon if exists
                const cleanQuery = query.trim().endsWith(';') ? query.trim().slice(0, -1) : query.trim();
                await connection.execute(cleanQuery);
                console.log(`  - Query ${index + 1}/${queries.length} executed successfully.`);
            } catch (err: any) {
                console.error(`  - FAILED to execute Query ${index + 1}: ${err.message}`);
                errors.push({ query: query.substring(0, 50) + '...', error: err.message });
            }
        }

        if (errors.length > 0) {
            await connection.rollback();
            return { success: false, message: 'Falha ao criar uma ou mais tabelas.', errors };
        }
        
        console.log('[MySqlAdapter] Tables created. Ensuring default roles...');
        const rolesResult = await this.ensureDefaultRolesExist(connection);
        
        if (!rolesResult.success) {
            await connection.rollback();
            return { success: false, message: rolesResult.message, errors: rolesResult.errors };
        }
        
        await connection.commit();
        return { success: true, message: `Esquema MySQL inicializado ou verificado com sucesso.`, rolesProcessed: rolesResult.rolesProcessed };
    } catch (error: any) {
        await connection.rollback();
        console.error('[MySqlAdapter - initializeSchema] Erro de transação:', error);
        return { success: false, message: `Erro na transação do banco de dados: ${error.message}`, errors: [error] };
    } finally {
        connection.release();
    }
  }

  async ensureDefaultRolesExist(connection: PoolConnection | Pool): Promise<{ success: boolean; message: string; errors?: any[], rolesProcessed?: number }> {
    let rolesProcessed = 0;
    const errors: any[] = [];
    for (const roleData of defaultRolesData) {
      try {
        const [rows] = await connection.execute<RowDataPacket[]>('SELECT id FROM roles WHERE name_normalized = ?', [roleData.name]);
        if (rows.length === 0) {
          const permissionsJson = JSON.stringify(roleData.permissions);
          await connection.execute(
            'INSERT INTO roles (name, name_normalized, description, permissions) VALUES (?, ?, ?, ?)',
            [roleData.name, roleData.name, roleData.description, permissionsJson]
          );
          rolesProcessed++;
        } else {
          const permissionsJson = JSON.stringify(roleData.permissions);
          await connection.execute(
            'UPDATE roles SET description = ?, permissions = ? WHERE id = ?',
            [roleData.description, permissionsJson, rows[0].id]
          );
        }
      } catch(err: any) {
        errors.push({ role: roleData.name, error: err.message });
      }
    }
    if (errors.length > 0) {
      return { success: false, message: "Erro ao processar perfis padrão.", errors, rolesProcessed };
    }
    return { success: true, message: 'Perfis padrão garantidos.', rolesProcessed };
  }
  
  // Stubs for other methods
  async createLotCategory(data: { name: string; }): Promise<{ success: boolean; message: string; categoryId?: string; }> {
    console.warn("[MySqlAdapter] createLotCategory is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getLotCategories(): Promise<LotCategory[]> {
    console.warn("[MySqlAdapter] getLotCategories is not yet implemented for MySQL.");
    return [];
  }
  async getLotCategory(idOrSlug: string): Promise<LotCategory | null> {
    console.warn("[MySqlAdapter] getLotCategory is not yet implemented for MySQL.");
    return null;
  }
  async getLotCategoryByName(name: string): Promise<LotCategory | null> {
    console.warn("[MySqlAdapter] getLotCategoryByName is not yet implemented for MySQL.");
    return null;
  }
  async updateLotCategory(id: string, data: Partial<CategoryFormData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateLotCategory is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteLotCategory(id: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteLotCategory is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async createSubcategory(data: SubcategoryFormData): Promise<{ success: boolean; message: string; subcategoryId?: string; }> {
    console.warn("[MySqlAdapter] createSubcategory is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getSubcategories(parentCategoryId: string): Promise<Subcategory[]> {
    console.warn("[MySqlAdapter] getSubcategories is not yet implemented for MySQL.");
    return [];
  }
  async getSubcategory(id: string): Promise<Subcategory | null> {
    console.warn("[MySqlAdapter] getSubcategory is not yet implemented for MySQL.");
    return null;
  }
  async getSubcategoryBySlug(slug: string, parentCategoryId: string): Promise<Subcategory | null> {
    console.warn("[MySqlAdapter] getSubcategoryBySlug is not yet implemented for MySQL.");
    return null;
  }
  async updateSubcategory(id: string, data: Partial<SubcategoryFormData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateSubcategory is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteSubcategory(id: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteSubcategory is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string; }> {
    console.warn("[MySqlAdapter] createState is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getStates(): Promise<StateInfo[]> {
    console.warn("[MySqlAdapter] getStates is not yet implemented for MySQL.");
    return [];
  }
  async getState(idOrSlugOrUf: string): Promise<StateInfo | null> {
    console.warn("[MySqlAdapter] getState is not yet implemented for MySQL.");
    return null;
  }
  async updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateState is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteState(id: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteState is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string; }> {
    console.warn("[MySqlAdapter] createCity is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getCities(stateIdOrSlugFilter?: string): Promise<CityInfo[]> {
    console.warn("[MySqlAdapter] getCities is not yet implemented for MySQL.");
    return [];
  }
  async getCity(idOrCompositeSlug: string): Promise<CityInfo | null> {
    console.warn("[MySqlAdapter] getCity is not yet implemented for MySQL.");
    return null;
  }
  async updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateCity is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteCity(id: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteCity is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; auctioneerPublicId?: string; }> {
    console.warn("[MySqlAdapter] createAuctioneer is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
    console.warn("[MySqlAdapter] getAuctioneers is not yet implemented for MySQL.");
    return [];
  }
  async getAuctioneer(idOrPublicId: string): Promise<AuctioneerProfileInfo | null> {
    console.warn("[MySqlAdapter] getAuctioneer is not yet implemented for MySQL.");
    return null;
  }
  async updateAuctioneer(idOrPublicId: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateAuctioneer is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteAuctioneer(idOrPublicId: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteAuctioneer is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; sellerPublicId?: string; }> {
    console.warn("[MySqlAdapter] createSeller is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getSellers(): Promise<SellerProfileInfo[]> {
    console.warn("[MySqlAdapter] getSellers is not yet implemented for MySQL.");
    return [];
  }
  async getSeller(idOrPublicId: string): Promise<SellerProfileInfo | null> {
    console.warn("[MySqlAdapter] getSeller is not yet implemented for MySQL.");
    return null;
  }
  async updateSeller(idOrPublicId: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateSeller is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteSeller(idOrPublicId: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteSeller is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async createAuction(data: AuctionDbData): Promise<{ success: boolean; message: string; auctionId?: string; auctionPublicId?: string; }> {
    console.warn("[MySqlAdapter] createAuction is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getAuctions(): Promise<Auction[]> {
    console.warn("[MySqlAdapter] getAuctions is not yet implemented for MySQL.");
    return [];
  }
  async updateAuction(idOrPublicId: string, data: Partial<AuctionDbData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateAuction is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteAuction(idOrPublicId: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteAuction is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async createLot(data: LotDbData): Promise<{ success: boolean; message: string; lotId?: string; lotPublicId?: string; }> {
    console.warn("[MySqlAdapter] createLot is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getLots(auctionIdParam?: string): Promise<Lot[]> {
    console.warn("[MySqlAdapter] getLots is not yet implemented for MySQL.");
    return [];
  }
  async getLot(idOrPublicId: string): Promise<Lot | null> {
    console.warn("[MySqlAdapter] getLot is not yet implemented for MySQL.");
    return null;
  }
  async updateLot(idOrPublicId: string, data: Partial<LotDbData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateLot is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteLot(idOrPublicId: string, auctionId?: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteLot is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getBidsForLot(lotIdOrPublicId: string): Promise<BidInfo[]> {
    console.warn("[MySqlAdapter] getBidsForLot is not yet implemented for MySQL.");
    return [];
  }
  async placeBidOnLot(lotIdOrPublicId: string, auctionIdOrPublicId: string, userId: string, userDisplayName: string, bidAmount: number): Promise<{ success: boolean; message: string; updatedLot?: Partial<Pick<Lot, "price" | "bidsCount" | "status" | "endDate">>; newBid?: BidInfo; }> {
    console.warn("[MySqlAdapter] placeBidOnLot is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getReviewsForLot(lotIdOrPublicId: string): Promise<Review[]> {
    console.warn("[MySqlAdapter] getReviewsForLot is not yet implemented for MySQL.");
    return [];
  }
  async createReview(review: Omit<Review, "id" | "createdAt" | "updatedAt">): Promise<{ success: boolean; message: string; reviewId?: string; }> {
    console.warn("[MySqlAdapter] createReview is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getQuestionsForLot(lotIdOrPublicId: string): Promise<LotQuestion[]> {
    console.warn("[MySqlAdapter] getQuestionsForLot is not yet implemented for MySQL.");
    return [];
  }
  async createQuestion(question: Omit<LotQuestion, "id" | "createdAt" | "answeredAt" | "answeredByUserId" | "answeredByUserDisplayName" | "isPublic">): Promise<{ success: boolean; message: string; questionId?: string; }> {
    console.warn("[MySqlAdapter] createQuestion is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getUserProfileData(userId: string): Promise<UserProfileWithPermissions | null> {
    console.warn("[MySqlAdapter] getUserProfileData is not yet implemented for MySQL.");
    return null;
  }
  async updateUserProfile(userId: string, data: EditableUserProfileData): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateUserProfile is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async ensureUserRole(userId: string, email: string, fullName: string | null, targetRoleName: string, additionalProfileData?: Partial<Pick<UserProfileData, "cpf" | "cellPhone" | "dateOfBirth" | "password" | "accountType" | "razaoSocial" | "cnpj" | "inscricaoEstadual" | "websiteComitente" | "zipCode" | "street" | "number" | "complement" | "neighborhood" | "city" | "state" | "optInMarketing">>, roleIdToAssign?: string): Promise<{ success: boolean; message: string; userProfile?: UserProfileWithPermissions; }> {
    console.warn("[MySqlAdapter] ensureUserRole is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getUsersWithRoles(): Promise<UserProfileData[]> {
    console.warn("[MySqlAdapter] getUsersWithRoles is not yet implemented for MySQL.");
    return [];
  }
  async updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateUserRole is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteUserProfile(userId: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteUserProfile is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async createRole(data: RoleFormData): Promise<{ success: boolean; message: string; roleId?: string; }> {
    console.warn("[MySqlAdapter] createRole is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getRoles(): Promise<Role[]> {
    console.warn("[MySqlAdapter] getRoles is not yet implemented for MySQL.");
    return [];
  }
  async getRole(id: string): Promise<Role | null> {
    console.warn("[MySqlAdapter] getRole is not yet implemented for MySQL.");
    return null;
  }
  async updateRole(id: string, data: Partial<RoleFormData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateRole is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteRole(id: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteRole is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async createMediaItem(data: Omit<MediaItem, "id" | "uploadedAt" | "urlOriginal" | "urlThumbnail" | "urlMedium" | "urlLarge" | "storagePath">, filePublicUrl: string, uploadedBy?: string): Promise<{ success: boolean; message: string; item?: MediaItem; }> {
    console.warn("[MySqlAdapter] createMediaItem is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getMediaItems(): Promise<MediaItem[]> {
    console.warn("[MySqlAdapter] getMediaItems is not yet implemented for MySQL.");
    return [];
  }
  async getMediaItem(id: string): Promise<MediaItem | null> {
    console.warn("[MySqlAdapter] getMediaItem is not yet implemented for MySQL.");
    return null;
  }
  async updateMediaItemMetadata(id: string, metadata: Partial<Pick<MediaItem, "title" | "altText" | "caption" | "description">>): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateMediaItemMetadata is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteMediaItemFromDb(id: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteMediaItemFromDb is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] linkMediaItemsToLot is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] unlinkMediaItemFromLot is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  
  private async insertDefaultSettings(connection: PoolConnection): Promise<{ success: boolean; message: string; }> {
    const { id, updatedAt, ...defaults } = samplePlatformSettings as any;
    const columns = Object.keys(defaults).map(key => key.replace(/([A-Z])/g, '_$1').toLowerCase());
    const values = Object.values(defaults).map(val => typeof val === 'object' ? JSON.stringify(val) : val);
    
    const placeholders = values.map(() => '?').join(', ');
    
    const insertQuery = `INSERT INTO platform_settings (id, ${columns.join(', ')}) VALUES (?, ${placeholders})`;
    
    try {
        await connection.execute(insertQuery, [1, ...values]);
        return { success: true, message: "Default settings inserted." };
    } catch(error: any) {
        return { success: false, message: error.message };
    }
  }

  async getPlatformSettings(): Promise<PlatformSettings> {
    const connection = await getPool().getConnection();
    try {
        const [rows] = await connection.execute<RowDataPacket[]>('SELECT * FROM platform_settings ORDER BY id LIMIT 1');
        
        if (rows.length > 0) {
            return mapToPlatformSettings(mapMySqlRowToCamelCase(rows[0]));
        } else {
            console.log('[MySqlAdapter] No platform settings found, creating default settings...');
            const result = await this.insertDefaultSettings(connection);
            if (result.success) {
                const [newRows] = await connection.execute<RowDataPacket[]>('SELECT * FROM platform_settings WHERE id = 1 LIMIT 1');
                if (newRows.length > 0) {
                    return mapToPlatformSettings(mapMySqlRowToCamelCase(newRows[0]));
                }
            }
            console.error("[MySqlAdapter] Failed to insert or retrieve default settings:", result.message);
            return samplePlatformSettings as PlatformSettings;
        }
    } catch (error: any) {
        console.error("[MySqlAdapter - getPlatformSettings] Error:", error);
        return samplePlatformSettings as PlatformSettings; // Fallback
    } finally {
        connection.release();
    }
  }

  async updatePlatformSettings(data: PlatformSettingsFormData): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    try {
        const setClauses: string[] = [];
        const values: any[] = [];
        for (const [key, value] of Object.entries(data)) {
            const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            setClauses.push(`${snakeCaseKey} = ?`);
            values.push(value === null ? null : typeof value === 'object' ? JSON.stringify(value) : value);
        }
        
        if (setClauses.length === 0) {
            return { success: true, message: 'Nenhuma alteração para salvar.' };
        }
        
        const updateQuery = `UPDATE platform_settings SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = 1`;
        
        const [result] = await connection.execute(updateQuery, values);
        
        if ((result as any).affectedRows > 0) {
            return { success: true, message: 'Configurações da plataforma atualizadas com sucesso!' };
        } else {
            return { success: false, message: 'Nenhuma configuração foi encontrada para atualizar. Verifique se as configurações iniciais existem.' };
        }
    } catch (error: any) {
        console.error("[MySqlAdapter - updatePlatformSettings] Error:", error);
        return { success: false, message: `Erro no banco de dados: ${error.message}` };
    } finally {
        connection.release();
    }
  }
  
  async getRoleByName(name: string): Promise<Role | null> {
    console.warn("[MySqlAdapter] getRoleByName is not yet implemented for MySQL.");
    return null;
  }
  
  async getUserByEmail(email: string): Promise<UserProfileWithPermissions | null> {
    console.warn("[MySqlAdapter] getUserByEmail is not yet implemented for MySQL.");
    return null;
  }
}
```
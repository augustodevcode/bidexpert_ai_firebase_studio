
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
  
  // Semoventes (Livestock)
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
- src/lib/storage/interface.ts:
```ts

// src/lib/storage/interface.ts
// This file is now part of src/types/index.ts to avoid circular dependencies
// with types used in the interface methods.
// You can delete this file if it's empty or move its contents to src/types/index.ts
// if you prefer to keep them separate. For now, it's assumed to be merged.
// The IStorageAdapter interface is now defined in src/types/index.ts.

// Placeholder to make the file non-empty if it was accidentally created.
// console.log("Storage interface is defined in src/types/index.ts");
export {};

```
- src/lib/storage/local.adapter.js:
```js
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStorageAdapter = void 0;
var fs_1 = require("fs");
var path_1 = require("path");
var LocalStorageAdapter = /** @class */ (function () {
    function LocalStorageAdapter() {
        // Define the public path without leading/trailing slashes for joining
        this.publicPath = 'uploads/media';
        this.uploadDir = path_1.default.join(process.cwd(), 'public', this.publicPath);
        // Ensures the upload directory exists
        if (!fs_1.default.existsSync(this.uploadDir)) {
            console.log("[LocalStorageAdapter] Creating upload directory at: ".concat(this.uploadDir));
            fs_1.default.mkdirSync(this.uploadDir, { recursive: true });
        }
        console.log('[LocalStorageAdapter] Initialized. Uploads will be saved to:', this.uploadDir);
    }
    LocalStorageAdapter.prototype.upload = function (fileName, contentType, buffer) {
        return __awaiter(this, void 0, void 0, function () {
            var filePath, publicUrl, storagePath, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        filePath = path_1.default.join(this.uploadDir, fileName);
                        return [4 /*yield*/, fs_1.default.promises.writeFile(filePath, buffer)];
                    case 1:
                        _a.sent();
                        publicUrl = "/".concat(this.publicPath, "/").concat(fileName);
                        storagePath = publicUrl; // For local, public URL and storage path are the same relative to /public
                        console.log("[LocalStorageAdapter] File saved successfully to ".concat(filePath));
                        return [2 /*return*/, { publicUrl: publicUrl, storagePath: storagePath }];
                    case 2:
                        error_1 = _a.sent();
                        console.error("[LocalStorageAdapter - upload] Error saving file:", error_1);
                        throw new Error("Failed to save file locally: ".concat(error_1.message));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    LocalStorageAdapter.prototype.delete = function (storagePath) {
        return __awaiter(this, void 0, void 0, function () {
            var filePath, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        filePath = path_1.default.join(process.cwd(), 'public', storagePath);
                        if (!fs_1.default.existsSync(filePath)) return [3 /*break*/, 2];
                        return [4 /*yield*/, fs_1.default.promises.unlink(filePath)];
                    case 1:
                        _a.sent();
                        console.log("[LocalStorageAdapter] File deleted successfully from ".concat(filePath));
                        return [2 /*return*/, { success: true, message: 'Arquivo local excluído com sucesso.' }];
                    case 2:
                        console.warn("[LocalStorageAdapter - delete] File not found at path: ".concat(filePath));
                        return [2 /*return*/, { success: true, message: 'Arquivo local não encontrado, mas a operação é considerada bem-sucedida.' }];
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        console.error("[LocalStorageAdapter - delete] Error deleting file:", error_2);
                        return [2 /*return*/, { success: false, message: "Falha ao excluir arquivo local: ".concat(error_2.message) }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    return LocalStorageAdapter;
}());
exports.LocalStorageAdapter = LocalStorageAdapter;

```
- storage.rules:
```
rules_version = '2';

// Default rule: Deny all reads and writes
service firebase.storage {
  match /b/{bucket}/o {
    
    // Allow public read access to the 'media_uploads' directory.
    // This is useful for images and other public assets.
    match /media_uploads/{allPaths=**} {
      allow read;
      // Write access should be restricted to authenticated users,
      // and potentially only specific roles or owners.
      // This example allows any authenticated user to write.
      // For production, tighten this rule.
      allow write: if request.auth != null;
    }
    
    // Restrict 'documents' directory to only be readable by the user who owns them.
    // The path contains the user's UID.
    match /documents/{userId}/{allPaths=**} {
      allow read: if request.auth != null && request.auth.uid == userId;
      // Allow write only for the specific user.
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // You can add more specific rules for other paths as needed.
    // Example: allow only admins to write to a 'config' directory.
    // match /config/{configFile} {
    //   allow read, write: if request.auth.token.admin == true;
    // }
  }
}
```
- tailwind.config.ts:
```ts
import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['Open Sans', 'sans-serif'],
        headline: ['Open Sans', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

```
- .env.local:
```sh
# Sample environment variables for local development.
# Duplicate this file as .env.local and fill in your actual values.
# IMPORTANT: .env.local is ignored by Git. DO NOT commit your secret keys.

# =========================================================
# === CHOOSE YOUR DATABASE & STORAGE FOR LOCAL DEVELOPMENT ===
# =========================================================
# Set the active database system for the server. Options:
# SAMPLE_DATA (default, in-memory, no persistence)
# FIRESTORE (requires Firebase config below)
# MYSQL (requires MYSQL_CONNECTION_STRING)
# POSTGRES (requires POSTGRES_CONNECTION_STRING)
ACTIVE_DATABASE_SYSTEM=MYSQL

# Set the active storage system for file uploads. Options:
# local (default, saves to /public/uploads/media)
# firebase (requires Firebase config below)
STORAGE_PROVIDER=local


# ==================================
# === NEXT.JS Public Variables ===
# ==================================
# These variables are exposed to the browser.
# DO NOT put sensitive keys here.
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# The public environment variable for the DB system, used by the client-side
# DevDbIndicator component to show what the server is configured to use.
NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM=${ACTIVE_DATABASE_SYSTEM}

# ==================================
# === DATABASE CONNECTION STRINGS ===
# ==================================
# Only one of these is needed, depending on ACTIVE_DATABASE_SYSTEM.
# Format: mysql://user:password@host:port/database
MYSQL_CONNECTION_STRING="mysql://root:123456@localhost:3306/bidexpert"

# Format: postgresql://user:password@host:port/database
POSTGRES_CONNECTION_STRING="postgresql://postgres:123456@localhost:5432/bidexpert"


# ==================================
# === FIREBASE CONFIGURATION ===
# ==================================
# Used if ACTIVE_DATABASE_SYSTEM is 'FIRESTORE' or STORAGE_PROVIDER is 'firebase'.
#
# 1. Path to your Firebase Admin SDK service account key file.
#    The path should be absolute from the project root.
#    Example: /home/user/studio/your-project-firebase-adminsdk.json
#    This is used by the server-side code (Admin SDK).
# IMPORTANT: The file name below MUST match your actual key file name.
FIREBASE_ADMIN_SDK_PATH="./bidexpert-630df-firebase-adminsdk-fbsvc-a827189ca4.json"

# 2. Public Firebase configuration for the client-side SDK.
#    You can get this from your Firebase project settings.
#    These variables start with NEXT_PUBLIC_ so they are available in the browser.
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=


# ==================================
# === AI (GENKIT/GOOGLE AI) CONFIGURATION ===
# ==================================
# Google AI API Key for using Genkit with Gemini models.
# Get your key from Google AI Studio: https://aistudio.google.com/app/apikey
GOOGLEAI_API_KEY=

# Optional: For advanced tracing and debugging with Jaeger.
OTEL_EXPORTER_JAEGER_AGENT_HOST=localhost
OTEL_EXPORTER_JAEGER_AGENT_PORT=6832

# ==================================
# === CNJ (DATAJUD) API KEY ===
# ==================================
# API Key for accessing the Conselho Nacional de Justiça's public data API.
DATAJUD_API_KEY=


```
- package.json:
```json
{
  "name": "nextn",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "genkit:dev": "genkit start -- tsx /home/user/studio/src/ai/dev.ts",
    "genkit:watch": "genkit start -- tsx --watch src/ai/dev.ts",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "seed:firestore": "tsx ./scripts/seed-firestore.ts",
    "seed:lotes-data": "tsx ./scripts/seed-lotes-data.ts",
    "rename:lotes-to-lots": "tsx /home/user/studio/scripts/rename-lotes-to-lots.ts",
    "seed:lotes-images": "tsx ./scripts/seed-lotes-with-images.ts",
    "db:init": "tsx ./scripts/initialize-db.ts",
    "db:init:mysql": "tsx ./scripts/initialize-db.ts --db=mysql",
    "db:init:postgres": "tsx ./scripts/initialize-db.ts --db=postgres",
    "db:setup-admin": "tsx ./scripts/setup-admin-user.ts",
    "db:setup-admin:mysql": "tsx ./scripts/setup-admin-user.ts --db=mysql",
    "db:setup-admin:postgres": "tsx ./scripts/setup-admin-user.ts --db=postgres",
    "seed:media": "tsx ./scripts/seed-media-library.ts"
  },
  "dependencies": {
    "@genkit-ai/googleai": "^1.8.0",
    "@genkit-ai/next": "^1.8.0",
    "@hookform/resolvers": "^4.1.3",
    "@opentelemetry/exporter-jaeger": "^1.25.0",
    "@radix-ui/react-accordion": "^1.2.3",
    "@radix-ui/react-alert-dialog": "^1.1.6",
    "@radix-ui/react-avatar": "^1.1.3",
    "@radix-ui/react-checkbox": "^1.1.4",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-dropdown-menu": "^2.1.6",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-menubar": "^1.1.6",
    "@radix-ui/react-navigation-menu": "^1.2.0",
    "@radix-ui/react-popover": "^1.1.6",
    "@radix-ui/react-progress": "^1.1.2",
    "@radix-ui/react-radio-group": "^1.2.3",
    "@radix-ui/react-scroll-area": "^1.2.3",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-slider": "^1.2.3",
    "@radix-ui/react-slot": "^1.1.2",
    "@radix-ui/react-switch": "^1.1.3",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-toast": "^1.2.6",
    "@radix-ui/react-tooltip": "^1.1.8",
    "@tanstack-query-firebase/react": "^1.0.5",
    "@tanstack/react-query": "^5.66.0",
    "@tanstack/react-table": "^8.19.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "0.2.1",
    "date-fns": "^3.6.0",
    "embla-carousel-autoplay": "^8.2.0",
    "embla-carousel-react": "^8.2.0",
    "firebase": "^11.8.1",
    "firebase-admin": "^12.7.0",
    "genkit": "^1.8.0",
    "leaflet": "^1.9.4",
    "lucide-react": "^0.475.0",
    "mysql2": "^3.14.1",
    "next": "15.2.3",
    "patch-package": "^8.0.0",
    "pg": "^8.16.0",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-dropzone": "^14.2.3",
    "react-hook-form": "^7.54.2",
    "react-leaflet": "^4.2.1",
    "reactflow": "^11.11.3",
    "recharts": "^2.15.1",
    "tailwind-merge": "^3.0.1",
    "tailwindcss-animate": "^1.0.7",
    "uuid": "^9.0.1",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@firecms/cli": "^3.0.0-beta.13",
    "@types/leaflet": "^1.9.12",
    "@types/node": "^22.15.30",
    "@types/pg": "^8.11.6",
    "@types/react": "19.1.8",
    "@types/uuid": "^9.0.8",
    "@types/yargs": "^17.0.32",
    "dotenv": "^16.5.0",
    "dotenv-cli": "^8.0.0",
    "genkit-cli": "^1.8.0",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "tsx": "^4.16.0",
    "typescript": "^5",
    "yargs": "^17.7.2"
  },
  "packageManager": "yarn@4.4.1"
}

```
- .env:
```sh
# Sample environment variables for local development.
# Duplicate this file as .env.local and fill in your actual values.
# IMPORTANT: .env.local is ignored by Git. DO NOT commit your secret keys.

# =========================================================
# === CHOOSE YOUR DATABASE & STORAGE FOR LOCAL DEVELOPMENT ===
# =========================================================
# Set the active database system for the server. Options:
# SAMPLE_DATA (default, in-memory, no persistence)
# FIRESTORE (requires Firebase config below)
# MYSQL (requires MYSQL_CONNECTION_STRING)
# POSTGRES (requires POSTGRES_CONNECTION_STRING)
ACTIVE_DATABASE_SYSTEM=MYSQL

# Set the active storage system for file uploads. Options:
# local (default, saves to /public/uploads/media)
# firebase (requires Firebase config below)
STORAGE_PROVIDER=local


# ==================================
# === NEXT.JS Public Variables ===
# ==================================
# These variables are exposed to the browser.
# DO NOT put sensitive keys here.
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# The public environment variable for the DB system, used by the client-side
# DevDbIndicator component to show what the server is configured to use.
NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM=${ACTIVE_DATABASE_SYSTEM}

# ==================================
# === DATABASE CONNECTION STRINGS ===
# ==================================
# Only one of these is needed, depending on ACTIVE_DATABASE_SYSTEM.
# Format: mysql://user:password@host:port/database
MYSQL_CONNECTION_STRING="mysql://root:123456@localhost:3306/bidexpert"

# Format: postgresql://user:password@host:port/database
POSTGRES_CONNECTION_STRING="postgresql://postgres:123456@localhost:5432/bidexpert"


# ==================================
# === FIREBASE CONFIGURATION ===
# ==================================
# Used if ACTIVE_DATABASE_SYSTEM is 'FIRESTORE' or STORAGE_PROVIDER is 'firebase'.
#
# 1. Path to your Firebase Admin SDK service account key file.
#    The path should be absolute from the project root.
#    Example: /home/user/studio/your-project-firebase-adminsdk.json
#    This is used by the server-side code (Admin SDK).
# IMPORTANT: The file name below MUST match your actual key file name.
FIREBASE_ADMIN_SDK_PATH="./bidexpert-630df-firebase-adminsdk-fbsvc-a827189ca4.json"

# 2. Public Firebase configuration for the client-side SDK.
#    You can get this from your Firebase project settings.
#    These variables start with NEXT_PUBLIC_ so they are available in the browser.
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=


# ==================================
# === AI (GENKIT/GOOGLE AI) CONFIGURATION ===
# ==================================
# Google AI API Key for using Genkit with Gemini models.
# Get your key from Google AI Studio: https://aistudio.google.com/app/apikey
GOOGLEAI_API_KEY=

# Optional: For advanced tracing and debugging with Jaeger.
OTEL_EXPORTER_JAEGER_AGENT_HOST=localhost
OTEL_EXPORTER_JAEGER_AGENT_PORT=6832

# ==================================
# === CNJ (DATAJUD) API KEY ===
# ==================================
# API Key for accessing the Conselho Nacional de Justiça's public data API.
DATAJUD_API_KEY=


```

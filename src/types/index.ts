
export interface Bid {
  bidder: string;
  amount: number;
  timestamp: Date;
}

export interface AuctionStage {
  name: string; // ex: "1ª Praça"
  endDate: Date;
  statusText?: string; // ex: "Encerramento"
}

export type AuctionStatus = 'EM_BREVE' | 'ABERTO_PARA_LANCES' | 'ENCERRADO' | 'FINALIZADO' | 'ABERTO' | 'CANCELADO' | 'SUSPENSO';
export type LotStatus = 'ABERTO_PARA_LANCES' | 'EM_BREVE' | 'ENCERRADO' | 'VENDIDO' | 'NAO_VENDIDO';
export type UserDocumentStatus = 'NOT_SENT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PENDING_ANALYSIS';
export type UserHabilitationStatus = 'PENDING_DOCUMENTS' | 'PENDING_ANALYSIS' | 'HABILITATED' | 'REJECTED_DOCUMENTS' | 'BLOCKED';
export type UserBidStatus = 'GANHANDO' | 'PERDENDO' | 'SUPERADO' | 'ARREMATADO' | 'NAO_ARREMATADO';
export type PaymentStatus = 'PENDENTE' | 'PROCESSANDO' | 'PAGO' | 'FALHOU' | 'REEMBOLSADO';

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
  uploadDate?: Date;
  analysisDate?: Date;
  analystId?: string; 
  rejectionReason?: string;
  documentType: DocumentType; 
}

export interface LotCategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
    itemCount?: number; 
    createdAt: Date;
    updatedAt: Date;
}

export interface MediaItem {
  id: string; 
  fileName: string; 
  uploadedAt: Date;
  uploadedBy?: string; 
  title?: string; 
  altText?: string; 
  caption?: string; 
  description?: string; 
  mimeType: string; 
  sizeBytes: number; 
  dimensions?: { width: number; height: number };
  urlOriginal: string; 
  urlThumbnail: string; 
  urlMedium: string; 
  urlLarge: string; 
  linkedLotIds?: string[]; 
  dataAiHint?: string; 
}

export interface Lot {
  id: string; 
  auctionId: string; 
  title: string; 
  number?: string; 
  imageUrl: string; 
  dataAiHint?: string;
  galleryImageUrls?: string[]; 
  mediaItemIds?: string[]; 
  status: LotStatus;
  stateId?: string; 
  cityId?: string; 
  cityName?: string; 
  stateUf?: string; 
  type: string; 
  views?: number;
  auctionName?: string; 
  price: number; 
  initialPrice?: number; 
  auctionDate?: Date | null; 
  secondAuctionDate?: Date | null;
  secondInitialPrice?: number;
  endDate: Date;
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

  lotSpecificAuctionDate?: Date | null;
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
  createdAt?: Date;
  updatedAt?: Date;
}

export type LotFormData = Omit<Lot, 'id' | 'createdAt' | 'updatedAt' | 'endDate' | 'lotSpecificAuctionDate' | 'secondAuctionDate' | 'isFavorite' | 'isFeatured' | 'views' | 'bidsCount' | 'galleryImageUrls' | 'dataAiHint' | 'auctionDate' | 'auctioneerName' | 'cityName' | 'stateUf' | 'auctioneerId' | 'mediaItemIds'> & {
  endDate: Date;
  lotSpecificAuctionDate?: Date | null;
  secondAuctionDate?: Date | null;
  stateId?: string | null; 
  cityId?: string | null;  
  sellerId?: string;
  galleryImageUrls?: string[]; 
  mediaItemIds?: string[]; 
};


export interface Auction {
  id: string; 
  title: string; 
  fullTitle?: string; 
  description?: string;
  status: AuctionStatus;
  auctionType?: 'JUDICIAL' | 'EXTRAJUDICIAL' | 'PARTICULAR'; 
  category: string; 
  auctioneer: string; 
  auctioneerId?: string; 
  seller?: string; 
  sellerId?: string; 
  auctionDate: Date;
  endDate?: Date | null;
  auctionStages?: AuctionStage[]; 
  city?: string;
  state?: string; 
  imageUrl?: string; 
  dataAiHint?: string;
  documentsUrl?: string; 
  totalLots?: number; 
  visits?: number; 
  
  lots?: Lot[]; 
  initialOffer?: number; 
  isFavorite?: boolean; 
  currentBid?: number; 
  bidsCount?: number; 
  sellingBranch?: string; 
  vehicleLocation?: string; 
  
  createdAt: Date;
  updatedAt: Date;
  auctioneerLogoUrl?: string;
  auctioneerName?: string; 
}

export type AuctionFormData = Omit<Auction, 'id' | 'createdAt' | 'updatedAt' | 'auctionDate' | 'endDate' | 'lots' | 'totalLots' | 'visits' | 'auctionStages' | 'initialOffer' | 'isFavorite' | 'currentBid' | 'bidsCount' | 'auctioneerLogoUrl' | 'auctioneerName' | 'category' | 'auctioneer' | 'seller'> & {
  auctionDate: Date;
  endDate?: Date | null;
  category: string; 
  auctioneer: string; 
  seller?: string;
  auctioneerId?: string;
  sellerId?: string;
};


export type UserRoleType = 'ADMINISTRATOR' | 'AUCTION_ANALYST' | 'USER' | 'CONSIGNOR' | 'AUCTIONEER';

export interface Role {
  id: string;
  name: string; // e.g., "Administrator", "Comitente", "Usuário Padrão"
  description?: string;
  permissions: string[]; // e.g., ["manage_auctions", "view_users", "edit_lot_category:vehicles"]
  createdAt: Date;
  updatedAt: Date;
}

export type RoleFormData = Omit<Role, 'id' | 'createdAt' | 'updatedAt'>;


export interface UserProfileData {
  uid: string;
  email: string;
  fullName: string;
  roleId?: string; // FK to Role
  roleName?: string; // Denormalized role name for easier display
  cpf?: string;
  rgNumber?: string;
  rgIssuer?: string;
  rgIssueDate?: Date | null;
  rgState?: string;
  dateOfBirth?: Date | null;
  cellPhone?: string;
  homePhone?: string;
  gender?: string;
  profession?: string;
  nationality?: string;
  maritalStatus?: string;
  propertyRegime?: string;
  spouseName?: string;
  spouseCpf?: string;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  status?: string; 
  optInMarketing?: boolean;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  avatarUrl?: string;
  dataAiHint?: string; 

  activeBids?: number;
  auctionsWon?: number;
  itemsSold?: number; 

  sellerProfileId?: string; 
}

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
  bidDate: Date;
  lotEndDate: Date;
}

export interface BidInfo {
  id: string;
  lotId: string;
  bidderId: string; 
  bidderDisplay: string; 
  amount: number;
  timestamp: Date;
}

export interface UserWin {
  id: string;
  lot: Lot; 
  winningBidAmount: number;
  winDate: Date;
  paymentStatus: PaymentStatus;
  invoiceUrl?: string; 
}

export interface SellerProfileInfo {
  id: string; 
  name: string;
  slug: string;
  contactName?: string;
  email?: string; 
  phone?: string;
  address?: string;
  city?: string;
  state?: string; 
  zipCode?: string;
  website?: string;
  logoUrl?: string;
  dataAiHintLogo?: string;
  description?: string; 
  memberSince?: Date; 
  rating?: number; 
  activeLotsCount?: number; 
  totalSalesValue?: number; 
  auctionsFacilitatedCount?: number; 
  userId?: string; 
  createdAt: Date;
  updatedAt: Date;
}

export type SellerFormData = Omit<SellerProfileInfo, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'memberSince' | 'rating' | 'activeLotsCount' | 'totalSalesValue' | 'auctionsFacilitatedCount' | 'userId'> & {
  userId?: string; 
};


export interface AuctioneerProfileInfo {
  id: string; 
  name: string;
  slug: string;
  registrationNumber?: string; 
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string; 
  zipCode?: string;
  website?: string;
  logoUrl?: string;
  dataAiHintLogo?: string;
  description?: string; 
  memberSince?: Date; 
  rating?: number; 
  auctionsConductedCount?: number; 
  totalValueSold?: number; 
  userId?: string; 
  createdAt: Date;
  updatedAt: Date;
}

export type AuctioneerFormData = Omit<AuctioneerProfileInfo, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'memberSince' | 'rating' | 'auctionsConductedCount' | 'totalValueSold' | 'userId'> & {
  userId?: string;
};


export interface RecentlyViewedLotInfo {
  id: string;
  title: string;
  imageUrl: string;
  auctionId: string; 
  dataAiHint?: string;
}

export interface StateInfo {
  id: string;
  name: string;
  uf: string; 
  slug: string;
  cityCount?: number; 
  createdAt: Date;
  updatedAt: Date;
}

export type StateFormData = Omit<StateInfo, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'cityCount'>;


export interface CityInfo {
  id: string;
  name: string;
  slug: string;
  stateId: string; 
  stateUf: string; 
  ibgeCode?: string; 
  lotCount?: number; 
  createdAt: Date;
  updatedAt: Date;
}

export type CityFormData = Omit<CityInfo, 'id' | 'slug' | 'stateUf' | 'createdAt' | 'updatedAt' | 'lotCount'>;
    
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
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export type EditableUserProfileData = Omit<UserProfileData, 'uid' | 'email' | 'status' | 'createdAt' | 'updatedAt' | 'activeBids' | 'auctionsWon' | 'itemsSold' | 'avatarUrl' | 'dataAiHint' | 'roleId' | 'roleName' | 'sellerProfileId'> & {
  roleId?: string;
  roleName?: string;
  sellerProfileId?: string;
};

export interface PlatformSettings {
  id: 'global'; 
  galleryImageBasePath: string;
  updatedAt: Date;
}

export type PlatformSettingsFormData = Omit<PlatformSettings, 'id' | 'updatedAt'>;


    
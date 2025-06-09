
import type { Timestamp as AdminTimestamp, FieldValue as AdminFieldValue } from 'firebase-admin/firestore';
import type { Timestamp as ClientTimestamp } from 'firebase/firestore';

export type AnyTimestamp = AdminTimestamp | ClientTimestamp | Date | null | undefined;
export type AnyServerTimestamp = AdminFieldValue | Date | AnyTimestamp;


export interface Bid {
  bidder: string;
  amount: number;
  timestamp: AnyTimestamp;
}

export interface AuctionStage {
  name: string; // ex: "1ª Praça"
  endDate: AnyTimestamp;
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
  uploadDate?: AnyTimestamp;
  analysisDate?: AnyTimestamp;
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
    createdAt: AnyTimestamp;
    updatedAt: AnyTimestamp;
}

export interface MediaItem {
  id: string; 
  fileName: string; 
  uploadedAt: AnyTimestamp;
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
  auctionDate?: AnyTimestamp | null; 
  secondAuctionDate?: AnyTimestamp | null;
  secondInitialPrice?: number;
  endDate: AnyTimestamp;
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

  lotSpecificAuctionDate?: AnyTimestamp | null;
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
}

export type LotFormData = Omit<Lot, 'id' | 'createdAt' | 'updatedAt' | 'endDate' | 'lotSpecificAuctionDate' | 'secondAuctionDate' | 'isFavorite' | 'isFeatured' | 'views' | 'bidsCount' | 'galleryImageUrls' | 'dataAiHint' | 'auctionDate' | 'auctioneerName' | 'cityName' | 'stateUf' | 'auctioneerId' | 'mediaItemIds'> & {
  endDate: Date; // For form input, always Date
  lotSpecificAuctionDate?: Date | null; // For form input
  secondAuctionDate?: Date | null; // For form input
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
  auctionDate: AnyTimestamp;
  endDate?: AnyTimestamp | null;
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
  
  createdAt: AnyTimestamp;
  updatedAt: AnyTimestamp;
  auctioneerLogoUrl?: string;
  auctioneerName?: string; 
}

export type AuctionFormData = Omit<Auction, 'id' | 'createdAt' | 'updatedAt' | 'auctionDate' | 'endDate' | 'lots' | 'totalLots' | 'visits' | 'auctionStages' | 'initialOffer' | 'isFavorite' | 'currentBid' | 'bidsCount' | 'auctioneerLogoUrl' | 'auctioneerName' | 'category' | 'auctioneer' | 'seller'> & {
  auctionDate: Date; // For form input, always Date
  endDate?: Date | null; // For form input
  category: string; 
  auctioneer: string; 
  seller?: string;
  auctioneerId?: string;
  sellerId?: string;
};


export type UserRoleType = 'ADMINISTRATOR' | 'AUCTION_ANALYST' | 'USER' | 'CONSIGNOR' | 'AUCTIONEER';

export interface Role {
  id: string;
  name: string; 
  name_normalized?: string;
  description?: string;
  permissions: string[]; 
  createdAt: AnyTimestamp;
  updatedAt: AnyTimestamp;
}

export type RoleFormData = Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'name_normalized'>;


export interface UserProfileData {
  uid: string;
  email: string;
  fullName: string;
  roleId?: string; 
  roleName?: string; 
  permissions?: string[];
  habilitationStatus?: UserHabilitationStatus;
  cpf?: string;
  rgNumber?: string;
  rgIssuer?: string;
  rgIssueDate?: AnyTimestamp;
  rgState?: string;
  dateOfBirth?: AnyTimestamp;
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
  createdAt?: AnyTimestamp;
  updatedAt?: AnyTimestamp;
  avatarUrl?: string;
  dataAiHint?: string; 

  activeBids?: number;
  auctionsWon?: number;
  itemsSold?: number; 

  sellerProfileId?: string; 
}


export type UserProfileWithPermissions = UserProfileData & {
    // permissions are already in UserProfileData as optional
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
  bidStatus: UserBidStatus;
  bidDate: AnyTimestamp;
  lotEndDate: AnyTimestamp;
}

export interface BidInfo {
  id: string;
  lotId: string;
  auctionId: string;
  bidderId: string; 
  bidderDisplay: string; 
  amount: number;
  timestamp: AnyTimestamp;
}

export interface UserWin {
  id: string;
  lot: Lot; 
  winningBidAmount: number;
  winDate: AnyTimestamp;
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
  memberSince?: AnyTimestamp; 
  rating?: number; 
  activeLotsCount?: number; 
  totalSalesValue?: number; 
  auctionsFacilitatedCount?: number; 
  userId?: string; 
  createdAt: AnyTimestamp;
  updatedAt: AnyTimestamp;
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
  memberSince?: AnyTimestamp; 
  rating?: number; 
  auctionsConductedCount?: number; 
  totalValueSold?: number; 
  userId?: string; 
  createdAt: AnyTimestamp;
  updatedAt: AnyTimestamp;
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
  createdAt: AnyTimestamp;
  updatedAt: AnyTimestamp;
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
  createdAt: AnyTimestamp;
  updatedAt: AnyTimestamp;
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
  createdAt: AnyTimestamp;
  updatedAt: AnyTimestamp;
  expiresAt?: AnyTimestamp;
}

export type EditableUserProfileData = Omit<UserProfileData, 'uid' | 'email' | 'status' | 'createdAt' | 'updatedAt' | 'activeBids' | 'auctionsWon' | 'itemsSold' | 'avatarUrl' | 'dataAiHint' | 'roleId' | 'roleName' | 'sellerProfileId' | 'permissions' | 'habilitationStatus' > & {
  roleId?: string;
  roleName?: string;
  sellerProfileId?: string;
  permissions?: string[];
  habilitationStatus?: UserHabilitationStatus;
};

export interface PlatformSettings {
  id: 'global'; 
  galleryImageBasePath: string;
  updatedAt: AnyTimestamp;
}

export type PlatformSettingsFormData = Omit<PlatformSettings, 'id' | 'updatedAt'>;
    

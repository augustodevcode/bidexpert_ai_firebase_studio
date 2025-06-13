
import type { Timestamp as FirebaseAdminTimestamp, FieldValue as FirebaseAdminFieldValue } from 'firebase-admin/firestore';
import type { Timestamp as FirebaseClientTimestamp } from 'firebase/firestore'; // Client SDK Timestamp

// For server-side logic (Admin SDK)
export type ServerTimestamp = FirebaseAdminTimestamp;
export type AdminFieldValue = FirebaseAdminFieldValue;

// For client-side logic or data received from client
export type ClientTimestamp = FirebaseClientTimestamp;

// Generic type for properties that could be any of these, or a JS Date
export type AnyTimestamp = ServerTimestamp | ClientTimestamp | Date | null | undefined;

export interface ThemeColors {
  [colorVariable: string]: string; // e.g., '--primary': 'hsl(25, 95%, 53%)'
}

export interface Theme {
  name: string;
  colors: ThemeColors;
}

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
export type UserHabilitationStatus = 'PENDING_DOCUMENTS' | 'PENDING_ANALYSIS' | 'HABILITADO' | 'REJECTED_DOCUMENTS' | 'BLOCKED';
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
  publicId: string;
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
  type: string; // Nome da Categoria
  categoryId?: string; // ID da Categoria
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

// Este tipo é usado pelo formulário, que envia nomes
export type LotFormData = Omit<Lot,
  'id' |
  'publicId' |
  'createdAt' |
  'updatedAt' |
  'endDate' |
  'lotSpecificAuctionDate' |
  'secondAuctionDate' |
  'isFavorite' |
  'isFeatured' |
  'views' |
  'bidsCount' |
  'galleryImageUrls' |
  'dataAiHint' |
  'auctionDate' |
  'cityName' |
  'stateUf' |
  'auctioneerId' |
  'mediaItemIds' |
  'categoryId'
> & {
  endDate: Date;
  lotSpecificAuctionDate?: Date | null;
  secondAuctionDate?: Date | null;
  stateId?: string | null;
  cityId?: string | null;
  galleryImageUrls?: string[];
  mediaItemIds?: string[];
  categoryId?: string;
};


export interface Auction {
  id: string;
  publicId: string;
  title: string;
  fullTitle?: string;
  description?: string;
  status: AuctionStatus;
  auctionType?: 'JUDICIAL' | 'EXTRAJUDICIAL' | 'PARTICULAR';
  category: string; // Nome da Categoria
  categoryId?: string; // ID da Categoria
  auctioneer: string; // Nome do Leiloeiro
  auctioneerId?: string; // ID do Leiloeiro
  seller?: string; // Nome do Comitente
  sellerId?: string; // ID do Comitente
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

// Este tipo é usado pelo formulário, que envia nomes
export type AuctionFormValues = Omit<Auction, 'id' | 'publicId' | 'createdAt' | 'updatedAt' | 'auctionDate' | 'endDate' | 'lots' | 'totalLots' | 'visits' | 'auctionStages' | 'initialOffer' | 'isFavorite' | 'currentBid' | 'bidsCount' | 'auctioneerLogoUrl' | 'auctioneerName' | 'categoryId' | 'auctioneerId' | 'sellerId'> & {
  auctionDate: Date;
  endDate?: Date | null;
};

// Este tipo é o que a action vai preparar para o adapter, com IDs resolvidos
export type AuctionDbData = Omit<AuctionFormValues, 'category' | 'auctioneer' | 'seller'> & {
  categoryId?: string;
  auctioneerId?: string;
  sellerId?: string | null;
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
  password?: string;
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

  // Novos campos para PJ e Comitente
  accountType?: 'PHYSICAL' | 'LEGAL' | 'DIRECT_SALE_CONSIGNOR';
  razaoSocial?: string;
  cnpj?: string;
  inscricaoEstadual?: string;
  websiteComitente?: string;
}


export type UserProfileWithPermissions = UserProfileData & {
  // Se houver campos específicos que combinam UserProfileData e Role,
  // eles podem ser definidos aqui, mas a herança básica já inclui permissions e roleName.
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
  publicId: string;
  name: string; // Pode ser nome fantasia para PJ ou nome do comitente pessoa física
  slug: string;
  contactName?: string; // Nome do responsável, se PJ
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
  userId?: string; // UID do usuário da plataforma associado, se houver
  createdAt: AnyTimestamp;
  updatedAt: AnyTimestamp;
  // Campos específicos de PJ (opcional, pode estar no UserProfile se o Seller é um User)
  cnpj?: string;
  razaoSocial?: string;
  inscricaoEstadual?: string;
}

export type SellerFormData = Omit<SellerProfileInfo, 'id' | 'publicId' | 'slug' | 'createdAt' | 'updatedAt' | 'memberSince' | 'rating' | 'activeLotsCount' | 'totalSalesValue' | 'auctionsFacilitatedCount' | 'userId'> & {
  userId?: string;
};


export interface AuctioneerProfileInfo {
  id: string;
  publicId: string;
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

export type AuctioneerFormData = Omit<AuctioneerProfileInfo, 'id' | 'publicId' | 'slug' | 'createdAt' | 'updatedAt' | 'memberSince' | 'rating' | 'auctionsConductedCount' | 'totalValueSold' | 'userId'> & {
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

export type EditableUserProfileData = Partial<Omit<UserProfileData, 'uid' | 'email' | 'status' | 'createdAt' | 'updatedAt' | 'activeBids' | 'auctionsWon' | 'itemsSold' | 'avatarUrl' | 'dataAiHint' | 'roleId' | 'roleName' | 'sellerProfileId' | 'permissions' | 'habilitationStatus' | 'password' >> & {
  // Role fields can be updated via specific user-role actions
  // habilitationStatus is updated via specific actions
  // password would be handled by a separate "change password" flow
  dateOfBirth?: Date | null;
  rgIssueDate?: Date | null;
};

export interface PlatformSettings {
  id: 'global';
  siteTitle?: string;
  siteTagline?: string;
  galleryImageBasePath: string;
  activeThemeName?: string | null;
  themes?: Theme[];
  platformPublicIdMasks?: {
    auctions?: string;
    lots?: string;
    auctioneers?: string;
    sellers?: string;
  };
  updatedAt: AnyTimestamp;
}

export type PlatformSettingsFormData = Omit<PlatformSettings, 'id' | 'updatedAt'>;

export interface SqlAuthResult {
  success: boolean;
  message: string;
  user?: UserProfileData;
}

export interface IDatabaseAdapter {
  // Schema Initialization
  initializeSchema(): Promise<{ success: boolean; message: string; errors?: any[]; rolesProcessed?: number }>;

  // Categories
  createLotCategory(data: { name: string; description?: string }): Promise<{ success: boolean; message: string; categoryId?: string }>;
  getLotCategories(): Promise<LotCategory[]>;
  getLotCategory(id: string): Promise<LotCategory | null>;
  updateLotCategory(id: string, data: { name: string; description?: string }): Promise<{ success: boolean; message: string }>;
  deleteLotCategory(id: string): Promise<{ success: boolean; message: string }>;

  // States
  createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string }>;
  getStates(): Promise<StateInfo[]>;
  getState(id: string): Promise<StateInfo | null>;
  updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string }>;
  deleteState(id: string): Promise<{ success: boolean; message: string }>;

  // Cities
  createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string }>;
  getCities(stateIdFilter?: string): Promise<CityInfo[]>;
  getCity(id: string): Promise<CityInfo | null>;
  updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string }>;
  deleteCity(id: string): Promise<{ success: boolean; message: string }>;

  // Auctioneers
  createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; auctioneerPublicId?: string; }>;
  getAuctioneers(): Promise<AuctioneerProfileInfo[]>;
  getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null>; // id can be numeric or publicId
  updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string }>;
  deleteAuctioneer(id: string): Promise<{ success: boolean; message: string }>;
  getAuctioneerBySlug(slugOrPublicId: string): Promise<AuctioneerProfileInfo | null>;

  // Sellers
  createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; sellerPublicId?: string; }>;
  getSellers(): Promise<SellerProfileInfo[]>;
  getSeller(id: string): Promise<SellerProfileInfo | null>; // id can be numeric or publicId
  updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string }>;
  deleteSeller(id: string): Promise<{ success: boolean; message: string }>;
  getSellerBySlug(slugOrPublicId: string): Promise<SellerProfileInfo | null>;

  // Auctions
  createAuction(data: AuctionDbData): Promise<{ success: boolean; message: string; auctionId?: string; auctionPublicId?: string; }>;
  getAuctions(): Promise<Auction[]>;
  getAuction(id: string): Promise<Auction | null>; // id can be numeric or publicId
  updateAuction(id: string, data: Partial<AuctionDbData>): Promise<{ success: boolean; message: string }>;
  deleteAuction(id: string): Promise<{ success: boolean; message: string }>;
  getAuctionsBySellerSlug(sellerPublicId: string): Promise<Auction[]>;

  // Lots
  createLot(data: LotDbData): Promise<{ success: boolean; message: string; lotId?: string; lotPublicId?: string; }>;
  getLots(auctionIdParam?: string): Promise<Lot[]>;
  getLot(id: string): Promise<Lot | null>; // id can be numeric or publicId
  updateLot(id: string, data: Partial<LotDbData>): Promise<{ success: boolean; message: string; }>;
  deleteLot(id: string, auctionId?: string): Promise<{ success: boolean; message: string; }>;
  getBidsForLot(lotId: string): Promise<BidInfo[]>;
  placeBidOnLot(lotId: string, auctionId: string, userId: string, userDisplayName: string, bidAmount: number): Promise<{ success: boolean; message: string; updatedLot?: Partial<Pick<Lot, 'price' | 'bidsCount' | 'status'>>; newBid?: BidInfo }>;

  // Users
  getUserProfileData(userId: string): Promise<UserProfileData | null>;
  updateUserProfile(userId: string, data: EditableUserProfileData): Promise<{ success: boolean; message: string; }>;
  ensureUserRole(
    userId: string,
    email: string,
    fullName: string | null,
    targetRoleName: string,
    additionalProfileData?: Partial<Pick<UserProfileData, 'cpf' | 'cellPhone' | 'dateOfBirth' | 'password' | 'accountType' | 'razaoSocial' | 'cnpj' | 'inscricaoEstadual' | 'websiteComitente' | 'zipCode' | 'street' | 'number' | 'complement' | 'neighborhood' | 'city' | 'state' | 'optInMarketing' >>,
    roleIdToAssign?: string
  ): Promise<{ success: boolean; message: string; userProfile?: UserProfileData }>;
  getUsersWithRoles(): Promise<UserProfileData[]>;
  updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }>;
  deleteUserProfile(userId: string): Promise<{ success: boolean; message: string; }>;
  getUserByEmail(email: string): Promise<UserProfileData | null>;


  // Roles
  createRole(data: RoleFormData): Promise<{ success: boolean; message: string; roleId?: string }>;
  getRoles(): Promise<Role[]>;
  getRole(id: string): Promise<Role | null>;
  getRoleByName(name: string): Promise<Role | null>;
  updateRole(id: string, data: Partial<RoleFormData>): Promise<{ success: boolean; message: string }>;
  deleteRole(id: string): Promise<{ success: boolean; message: string }>;
  ensureDefaultRolesExist(): Promise<{ success: boolean; message: string; rolesProcessed?: number }>;

  // Media Items
  createMediaItem(data: Omit<MediaItem, 'id' | 'uploadedAt' | 'urlOriginal' | 'urlThumbnail' | 'urlMedium' | 'urlLarge'>, filePublicUrl: string, uploadedBy?: string): Promise<{ success: boolean; message: string; item?: MediaItem }>;
  getMediaItems(): Promise<MediaItem[]>;
  updateMediaItemMetadata(id: string, metadata: Partial<Pick<MediaItem, 'title' | 'altText' | 'caption' | 'description'>>): Promise<{ success: boolean; message: string; }>;
  deleteMediaItemFromDb(id: string): Promise<{ success: boolean; message: string; }>;
  linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string; }>;
  unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string; }>;

  // Settings
  getPlatformSettings(): Promise<PlatformSettings>;
  updatePlatformSettings(data: PlatformSettingsFormData): Promise<{ success: boolean; message: string; }>;
}

// Helper types for SQL adapters (can be expanded)
export type QueryResult<T> = {
  rows: T[];
  rowCount: number;
};

// Type for data from UserForm, to be processed by createUser action
export type UserFormValues = Pick<UserProfileData, 'fullName' | 'email' | 'cpf' | 'cellPhone' | 'dateOfBirth' | 'accountType' | 'razaoSocial' | 'cnpj' | 'inscricaoEstadual' | 'websiteComitente' | 'zipCode' | 'street' | 'number' | 'complement' | 'neighborhood' | 'city' | 'state' | 'optInMarketing'> & {
  password?: string;
  roleId?: string | null;
};


// Type for data passed from Lot actions to DB adapters (includes categoryId)
export type LotDbData = Omit<LotFormData, 'type' | 'auctionName'> & {
  categoryId?: string; // Resolved category ID
};

// Type for data returned from DB adapters for Lots (includes category name if joined)
export type LotWithCategoryName = Lot & {
  categoryName?: string;
};
    

    
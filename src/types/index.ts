
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
  name: string; // e.g., "Documento de Identidade (Frente)"
  description?: string; // e.g., "Foto nítida da frente do seu RG ou CNH"
  isRequired: boolean;
  allowedFormats?: string[]; // e.g., ["PDF", "JPG", "PNG"]
  displayOrder?: number;
}

export interface UserDocument {
  id: string;
  documentTypeId: string; // Links to DocumentType
  userId: string; // Links to User
  fileUrl?: string; // URL of the uploaded file
  status: UserDocumentStatus;
  uploadDate?: Date;
  analysisDate?: Date;
  analystId?: string; // User ID of the analyst
  rejectionReason?: string;
  documentType: DocumentType; // Populated for convenience from DocumentType definition
}

export interface LotCategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
    itemCount?: number; // Optional: to store how many lots use this category
    createdAt: Date;
    updatedAt: Date;
}

export interface Lot {
  id: string; // e.g., LOTE001
  auctionId: string; // ID do leilão ao qual pertence
  title: string; // e.g., "CASA COM 129,30 M² - CENTRO" ou "2013 AUDI A4 PREMIUM PLUS"
  number?: string; // Número do lote dentro do leilão
  imageUrl: string; // Imagem principal
  dataAiHint?: string;
  galleryImageUrls?: string[]; // URLs para a galeria de imagens
  status: LotStatus;
  location: string; // e.g., "TEOTÔNIO VILELA - AL" ou "Englishtown (NJ)"
  type: string; // Categoria do lote (será o nome da categoria de LotCategory)
  views?: number;
  auctionName?: string; // e.g., "Leilão Único" ou nome do leilão principal
  price: number; // Lance mínimo/atual
  initialPrice?: number; // Lance inicial (se diferente do preço atual)
  secondAuctionDate?: Date | null;
  secondInitialPrice?: number;
  endDate: Date;
  bidsCount?: number;
  isFavorite?: boolean;
  isFeatured?: boolean;
  description?: string; // Descrição mais detalhada

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
  sellerName?: string; // Este campo será populado pelo nome do Comitente/Seller selecionado

  condition?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Renamed from LotFormData as it now represents the core data for the Lot model being saved/retrieved
export type LotFormData = Omit<Lot, 'id' | 'createdAt' | 'updatedAt' | 'endDate' | 'lotSpecificAuctionDate' | 'secondAuctionDate' | 'isFavorite' | 'isFeatured' | 'views' | 'bidsCount' | 'galleryImageUrls' | 'dataAiHint'> & {
  endDate: Date; // Make sure these are Date objects from the form
  lotSpecificAuctionDate?: Date | null;
  secondAuctionDate?: Date | null;
};


export interface Auction {
  id: string; // Gerado automaticamente ou customizado
  title: string; // Ex: Leilão Judicial TJSP - Comarca de Campinas
  fullTitle?: string; // Título mais descritivo se necessário
  description?: string;
  status: AuctionStatus;
  auctionType?: 'JUDICIAL' | 'EXTRAJUDICIAL' | 'PARTICULAR'; // Tipo do leilão
  category: string; // Categoria principal (será o nome da categoria de LotCategory)
  auctioneer: string; // Nome do leiloeiro (pode se tornar auctioneerId depois)
  auctioneerId?: string;
  seller?: string; // Nome do comitente vendedor principal (pode se tornar sellerId depois)
  sellerId?: string;
  auctionDate: Date;
  endDate?: Date | null;
  auctionStages?: AuctionStage[]; // Para múltiplas praças/etapas
  location?: string; // Local físico do leilão ou dos bens
  city?: string;
  state?: string; // UF
  imageUrl?: string; // Imagem de capa para o leilão
  dataAiHint?: string;
  documentsUrl?: string; // Link para edital e outros documentos
  totalLots?: number; // Calculado ou manual
  visits?: number; // Contador de visitas à página do leilão
  
  lots?: Lot[]; 
  initialOffer?: number; 
  isFavorite?: boolean; 
  currentBid?: number; 
  bidsCount?: number; 
  sellingBranch?: string; 
  vehicleLocation?: string; 
  
  createdAt?: Date;
  updatedAt?: Date;
  auctioneerLogoUrl?: string; // Adicionado para consistência com sampleData
  auctioneerName?: string; // Adicionado para consistência com sampleData
}

export type AuctionFormData = Omit<Auction, 'id' | 'createdAt' | 'updatedAt' | 'auctionDate' | 'endDate' | 'lots' | 'totalLots' | 'visits' | 'auctionStages' | 'initialOffer' | 'isFavorite' | 'currentBid' | 'bidsCount' | 'auctioneerLogoUrl' | 'auctioneerName'> & {
  auctionDate: Date;
  endDate?: Date | null;
};


export type UserRole = 'ADMINISTRATOR' | 'AUCTION_ANALYST' | 'USER';

export interface UserProfileData {
  uid: string;
  email: string;
  fullName: string;
  role?: UserRole; 
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
  status?: string; // e.g. 'ACTIVE', 'PENDING_VALIDATION', 'SUSPENDED'
  optInMarketing?: boolean;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  avatarUrl?: string;
  dataAiHint?: string; // For AI image search for avatar

  // Stats for profile page
  activeBids?: number;
  auctionsWon?: number;
  itemsSold?: number; // If user can also be a seller
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

export interface UserWin {
  id: string;
  lot: Lot; // Embed Lot data for convenience
  winningBidAmount: number;
  winDate: Date;
  paymentStatus: PaymentStatus;
  invoiceUrl?: string; // Link to invoice PDF
}

// For Seller/Comitente public profile and admin management
export interface SellerProfileInfo {
  id: string; // Firestore document ID
  name: string;
  slug: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string; // UF
  zipCode?: string;
  website?: string;
  logoUrl?: string;
  dataAiHintLogo?: string;
  description?: string; // Description of the seller/company
  memberSince?: Date; // Date they became a seller on the platform
  rating?: number; // Overall rating, 0-5
  activeLotsCount?: number; // Dynamically calculated or admin-set
  totalSalesValue?: number; // For stats
  auctionsFacilitatedCount?: number; // Number of auctions they've been part of
  createdAt: Date;
  updatedAt: Date;
}

export type SellerFormData = Omit<SellerProfileInfo, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'memberSince' | 'rating' | 'activeLotsCount' | 'totalSalesValue' | 'auctionsFacilitatedCount'>;


export interface RecentlyViewedLotInfo {
  id: string;
  title: string;
  imageUrl: string;
  auctionId: string; // Needed to construct the link
  dataAiHint?: string;
}

    
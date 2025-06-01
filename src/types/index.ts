
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

export type AuctionStatus = 'EM_BREVE' | 'ABERTO_PARA_LANCES' | 'ENCERRADO' | 'FINALIZADO' | 'ABERTO';
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


export interface Lot {
  id: string; // e.g., LOTE001
  auctionId: string; // ID do leilão ao qual pertence
  title: string; // e.g., "CASA COM 129,30 M² - CENTRO" ou "2013 AUDI A4 PREMIUM PLUS"
  imageUrl: string; // Imagem principal
  dataAiHint?: string;
  galleryImageUrls?: string[]; // URLs para a galeria de imagens
  status: LotStatus;
  location: string; // e.g., "TEOTÔNIO VILELA - AL" ou "Englishtown (NJ)"
  type: string; // e.g., "CASA", "APARTAMENTO", "Automobile"
  views: number;
  auctionName: string; // e.g., "Leilão Único" ou nome do leilão principal
  price: number; // Lance mínimo/atual
  endDate: Date; // Data de encerramento do lote específico
  bidsCount: number;
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
  
  lotSpecificAuctionDate?: Date; 
  vehicleLocationInBranch?: string; 
  laneRunNumber?: string; 
  aisleStall?: string; 
  actualCashValue?: string; 
  estimatedRepairCost?: string;
  sellerName?: string; 
  
  condition?: string; 
}

export interface Auction {
  id: string; 
  title: string; 
  fullTitle?: string; 
  auctionDate: Date; 
  totalLots: number;
  status: AuctionStatus; 
  auctioneer: string; 
  category: string; 
  auctioneerLogoUrl?: string; 
  visits?: number;
  lots: Lot[]; 

  description?: string; 
  imageUrl?: string; 
  dataAiHint?: string; 
  seller?: string; 
  initialOffer?: number; 
  auctionStages?: AuctionStage[]; 
  isFavorite?: boolean; 
  currentBid?: number;
  endDate?: Date; 
  bidsCount?: number; 
  
  sellingBranch?: string; 
  vehicleLocation?: string; 
}

export interface UserProfileData {
  uid: string;
  email: string; 
  fullName: string;
  cpf?: string;
  rgNumber?: string;
  rgIssuer?: string;
  rgIssueDate?: Date | any; 
  rgState?: string;
  dateOfBirth?: Date | any; 
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
  createdAt?: Date | any; 
  updatedAt?: Date | any; 
  avatarUrl?: string;
  dataAiHint?: string; 

  activeBids?: number;
  auctionsWon?: number;
  itemsSold?: number;
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
  lot: Lot; 
  winningBidAmount: number;
  winDate: Date; 
  paymentStatus: PaymentStatus;
  invoiceUrl?: string; 
}

export interface SellerProfileInfo {
  name: string;
  slug: string;
  memberSince: Date;
  rating: number; 
  activeLotsCount: number;
  logoUrl: string; 
  dataAiHint: string;
}

export interface RecentlyViewedLotInfo {
  id: string;
  title: string;
  imageUrl: string;
  auctionId: string;
  dataAiHint?: string;
}

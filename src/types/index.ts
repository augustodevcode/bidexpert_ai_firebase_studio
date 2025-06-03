
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
  type: string; // e.g., "CASA", "APARTAMENTO", "Automobile" // This will relate to LotCategory.name or LotCategory.slug
  views?: number;
  auctionName?: string; // e.g., "Leilão Único" ou nome do leilão principal
  price: number; // Lance mínimo/atual
  initialPrice?: number; // Lance inicial (se diferente do preço atual)
  secondAuctionDate?: Date | any; // Data para segunda praça
  secondInitialPrice?: number; // Lance inicial para segunda praça
  endDate: Date | any; // Data de encerramento do lote específico (pode ser Firestore Timestamp)
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

  lotSpecificAuctionDate?: Date | any;
  vehicleLocationInBranch?: string;
  laneRunNumber?: string;
  aisleStall?: string;
  actualCashValue?: string;
  estimatedRepairCost?: string;
  sellerName?: string;

  condition?: string;
  createdAt?: Date | any; // Firestore timestamp or Date
  updatedAt?: Date | any; // Firestore timestamp or Date
}

export interface Auction {
  id: string; // Gerado automaticamente ou customizado
  title: string; // Ex: Leilão Judicial TJSP - Comarca de Campinas
  fullTitle?: string; // Título mais descritivo se necessário
  description?: string;
  status: AuctionStatus;
  auctionType?: 'JUDICIAL' | 'EXTRAJUDICIAL' | 'PARTICULAR'; // Tipo do leilão
  category: string; // Categoria principal (Imóveis, Veículos, Arte) - pode ser texto ou ID de LotCategory
  auctioneer: string; // Nome do leiloeiro
  auctioneerId?: string; // ID do leiloeiro se tiver uma entidade para isso
  seller?: string; // Nome do comitente vendedor principal
  sellerId?: string; // ID do comitente
  auctionDate: Date | any; // Data principal do evento do leilão (para 1ª praça ou data única)
  endDate?: Date | any; // Data de encerramento geral, se aplicável
  auctionStages?: AuctionStage[]; // Para múltiplas praças/etapas
  location?: string; // Local físico do leilão ou dos bens
  city?: string;
  state?: string; // UF
  imageUrl?: string; // Imagem de capa para o leilão
  dataAiHint?: string;
  documentsUrl?: string; // Link para edital e outros documentos
  totalLots?: number; // Calculado ou manual
  visits?: number; // Contador de visitas à página do leilão
  
  // Campos de controle do Firestore
  lots?: Lot[]; // Não armazenar no documento do leilão, mas sim associar lotes a auctions pelo auctionId no lote
  initialOffer?: number; // Não é comum ter um lance inicial para o leilão como um todo
  isFavorite?: boolean; // Específico do usuário
  currentBid?: number; // Não aplicável ao leilão, mas sim aos lotes
  bidsCount?: number; // Não aplicável ao leilão
  sellingBranch?: string; // Pode ser o mesmo que location ou mais específico
  vehicleLocation?: string; // Redundante com location, escolher um
  
  createdAt?: Date | any;
  updatedAt?: Date | any;
}


export type UserRole = 'ADMINISTRATOR' | 'AUCTION_ANALYST' | 'USER';

export interface UserProfileData {
  uid: string;
  email: string;
  fullName: string;
  role?: UserRole; // Added user role
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
  lotEndDate: Date | any;
}

export interface UserWin {
  id: string;
  lot: Lot;
  winningBidAmount: number;
  winDate: Date | any;
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

export interface LotCategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
    itemCount?: number; // Optional: to store how many lots use this category
    createdAt: Date | any; // Firestore timestamp or Date
    updatedAt: Date | any; // Firestore timestamp or Date
}

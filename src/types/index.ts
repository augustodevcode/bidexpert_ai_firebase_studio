
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
  // displayOrder?: number; // Removido pois não usamos mais na versão sample-data
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
  documentType?: DocumentType; // Populated for convenience from DocumentType definition
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
  description?: string; // Descrição mais detalhada
  
  // Campos detalhados do veículo (baseado na imagem)
  year?: number;
  make?: string; // e.g., "AUDI"
  model?: string; // e.g., "A4" (usado em sample data, compatível com modelName da OCR)
  series?: string; // e.g., "PREMIUM PLUS"

  stockNumber?: string;
  sellingBranch?: string;
  vin?: string;
  vinStatus?: string; // e.g., "WAUFFAFL3DA****** (OK)"
  lossType?: string; // e.g., "Other"
  primaryDamage?: string; // e.g., "Front End"
  titleInfo?: string; // e.g., "CLEAR (New Jersey)"
  titleBrand?: string; // e.g., "REASSIGNMENT"
  startCode?: string; // e.g., "Stationary" (com info icon)
  hasKey?: boolean; // e.g., "Present" (com info icon)
  odometer?: string; // e.g., "140,846 mi (Actual)"
  airbagsStatus?: string; // e.g., "Intact"
  
  // Vehicle Description section
  bodyStyle?: string; // e.g., "SEDAN 4 DOOR"
  engineDetails?: string; // e.g., "2.0L I4 FI DOHC 16V NF4"
  transmissionType?: string; // e.g., "Automatic Transmission"
  driveLineType?: string; // e.g., "All Wheel Drive"
  fuelType?: string; // e.g., "Flexible Fuel"
  cylinders?: string; // e.g., "4 Cylinders"
  restraintSystem?: string; // e.g., "Du Frnt/Sd/Hd Air Bgs/Rr Hd Ar Bgs/Act Belts"
  exteriorInteriorColor?: string; // e.g., "Black/ Unknown"
  options?: string; // e.g., "Console Display"
  manufacturedIn?: string; // e.g., "Germany"
  vehicleClass?: string; // e.g., "Compact Luxury Car"
  
  // Sale Information section
  lotSpecificAuctionDate?: Date; // e.g., Mon Jun 2, 8:30am (CDT)
  vehicleLocationInBranch?: string; // e.g., "At the branch"
  laneRunNumber?: string; // e.g., "A - #112"
  aisleStall?: string; // e.g., "BB - 222"
  actualCashValue?: string; // e.g., "$4,000 USD"
  estimatedRepairCost?: string;
  sellerName?: string; // Nome do vendedor específico do lote, se diferente do leilão
  
  condition?: string; // "Novo", "Usado - Como Novo", etc. (Já existe no sample-data)
}

export interface Auction {
  id: string; // ID do Leilão Principal, ex: "100625bra"
  title: string; // Título principal do leilão, ex: "Leilão 100625bra" (pode ser o ID ou um nome)
  fullTitle?: string; // Título completo do leilão, ex: "Leilão do Bradesco Imóveis Residenciais"
  auctionDate: Date; // Data e hora do leilão principal
  totalLots: number;
  status: AuctionStatus; // Status do leilão principal
  auctioneer: string; // Leiloeiro: VICENTE PAULO - JUCEMA N° 12/96
  category: string; // Categoria: Extrajudicial
  auctioneerLogoUrl?: string; // URL do logo do leiloeiro (Bradesco no exemplo)
  visits?: number;
  lots: Lot[]; // Lista de lotes pertencentes a este leilão

  description?: string; // Descrição geral do leilão, se houver
  imageUrl?: string; // Imagem principal do leilão (se aplicável, talvez o logo do leiloeiro)
  dataAiHint?: string; // Para imagem principal do leilão
  seller?: string; // Nome do vendedor/comitente principal
  initialOffer?: number; // Pode não ser aplicável no nível do leilão se os lotes têm seus próprios preços
  auctionStages?: AuctionStage[]; // Praças do leilão principal, se houver
  isFavorite?: boolean; // Para favoritar o leilão inteiro
  currentBid?: number;
  endDate?: Date; // Data de encerramento geral do leilão (último lote)
  bidsCount?: number; // Total de lances em todos os lotes
  
  // Informações que podem ser comuns a todos os lotes em um leilão
  sellingBranch?: string; // e.g., "Englishtown (NJ)"
  vehicleLocation?: string; // e.g., "At the branch" - Se for o mesmo para todos. Caso contrário, no Lot.
}

// UserProfileData for displaying and editing user information
export interface UserProfileData {
  uid: string;
  email: string; // Usually not editable directly by user in a simple form
  fullName: string;
  cpf?: string;
  rgNumber?: string;
  rgIssuer?: string;
  rgIssueDate?: Date | any; // Allow Firestore Timestamp
  rgState?: string;
  dateOfBirth?: Date | any; // Allow Firestore Timestamp
  cellPhone?: string;
  homePhone?: string;
  gender?: string;
  profession?: string;
  nationality?: string;
  maritalStatus?: string;
  propertyRegime?: string; // Regime de bens
  spouseName?: string;
  spouseCpf?: string;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string; // UF for address
  status?: string; // Account status e.g., 'HABILITATED', 'REGISTERED'
  optInMarketing?: boolean;
  createdAt?: Date | any; // Allow Firestore Timestamp
  updatedAt?: Date | any; // Allow Firestore Timestamp
  avatarUrl?: string;
  dataAiHint?: string; // For avatar image

  // Placeholders for auction activity, not directly editable here
  activeBids?: number;
  auctionsWon?: number;
  itemsSold?: number;
}

export interface UserBid {
  id: string; // ID do lance
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
  id: string; // ID do arremate (pode ser o lotId se um usuário só pode arrematar um lote uma vez)
  lot: Lot; // Dados completos do lote arrematado
  winningBidAmount: number;
  winDate: Date; // Geralmente a lot.endDate
  paymentStatus: PaymentStatus;
  invoiceUrl?: string; // Link para a nota fiscal/fatura
}

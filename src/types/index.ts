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
    createdAt: AnyTimestamp;
    updatedAt: AnyTimestamp;
    subcategories?: string[];
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

export type AuctioneerFormData = Omit<AuctioneerProfileInfo, 'id' | 'publicId' | 'slug' | 'createdAt' | 'updatedAt' | 'memberSince' | 'rating' | 'auctionsConductedCount' | 'totalValueSold'>;


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
  dataAiHintLogo?: string | null;
  description?: string | null;
  memberSince?: AnyTimestamp;
  rating?: number | null;
  activeLotsCount?: number;
  totalSalesValue?: number;
  auctionsFacilitatedCount?: number;
  userId?: string | null; 
  createdAt: AnyTimestamp;
  updatedAt: AnyTimestamp;
  
  cnpj?: string;
  razaoSocial?: string;
  inscricaoEstadual?: string;
}

export type SellerFormData = Omit<SellerProfileInfo, 'id' | 'publicId' | 'slug' | 'createdAt' | 'updatedAt' | 'memberSince' | 'rating' | 'activeLotsCount' | 'totalSalesValue' | 'auctionsFacilitatedCount' | 'userId'> & {
  userId?: string;
};

export interface AuctionStage {
  name: string; // ex: "1ª Praça"
  endDate: AnyTimestamp; // Timestamp ou string ISO
  statusText?: string; // ex: "Encerramento", "Abre em"
  // Outros campos específicos da praça, se necessário
  initialPrice?: number; // Lance inicial para esta praça
}

export type AuctionStatus = 'EM_BREVE' | 'ABERTO' | 'ABERTO_PARA_LANCES' | 'ENCERRADO' | 'FINALIZADO' | 'CANCELADO' | 'SUSPENSO';
export type LotStatus = 'EM_BREVE' | 'ABERTO_PARA_LANCES' | 'ENCERRADO' | 'VENDIDO' | 'NAO_VENDIDO';

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
  auctionDate: AnyTimestamp; // Data principal do leilão (e.g., 1ª praça)
  endDate?: AnyTimestamp | null; // Encerramento geral do leilão (e.g. fim 2ª praça)
  auctionStages?: AuctionStage[];
  city?: string;
  state?: string;
  imageUrl?: string;
  dataAiHint?: string;
  documentsUrl?: string;
  totalLots?: number;
  visits?: number;
  lots?: Lot[]; // Agora é opcional no tipo principal para evitar redundância se já buscado
  initialOffer?: number;
  isFavorite?: boolean;
  currentBid?: number;
  bidsCount?: number;
  sellingBranch?: string;
  vehicleLocation?: string; // Para leilões de veículos, local principal
  createdAt: AnyTimestamp;
  updatedAt: AnyTimestamp;
  auctioneerLogoUrl?: string;
  auctioneerName?: string; // Redundante se auctioneerId está presente e resolvido
}

// Usado para forms, onde IDs podem ser nomes/slugs inicialmente
export type AuctionFormData = Omit<Auction, 
  'id' | 'publicId' | 'createdAt' | 'updatedAt' | 'auctionDate' | 'endDate' | 
  'lots' | 'totalLots' | 'visits' | 'auctionStages' | 'isFavorite' | 
  'currentBid' | 'bidsCount' | 'auctioneerLogoUrl' | 'auctioneerName' |
  'categoryId' | 'auctioneerId' | 'sellerId' 
> & {
  auctionDate: Date; // Para o form, esperamos um objeto Date
  endDate?: Date | null; // Para o form, esperamos um objeto Date ou null
  auctionStages?: Array<Omit<AuctionStage, 'endDate'> & {endDate: Date}>;
  // category, auctioneer, seller são strings que serão resolvidas para IDs
};

// Usado para o DB Adapter, onde IDs já devem estar resolvidos
export type AuctionDbData = Omit<AuctionFormData, 'category' | 'auctioneer' | 'seller'> & {
  categoryId?: string;
  auctioneerId?: string;
  sellerId?: string | null; // pode ser opcional
};


export interface Lot {
  id: string;
  publicId: string;
  auctionId: string;
  title: string;
  number?: string; // Número do lote dentro do leilão
  imageUrl: string;
  dataAiHint?: string;
  galleryImageUrls?: string[];
  mediaItemIds?: string[]; // IDs de MediaItem da galeria
  status: LotStatus;
  stateId?: string; 
  cityId?: string;  
  cityName?: string;
  stateUf?: string;
  type: string; // Nome da Categoria
  categoryId?: string; // ID da Categoria
  views?: number;
  auctionName?: string; // Nome do leilão pai (para display)
  
  // Preços e Lances
  price: number; // Lance atual ou inicial se não houver lances
  initialPrice?: number; // Lance inicial da 1ª praça / valor base
  secondInitialPrice?: number | null; // Lance inicial da 2ª praça

  // Datas
  endDate: AnyTimestamp; // Data de encerramento deste lote específico
  auctionDate?: AnyTimestamp; // Data principal do leilão (pode vir do Auction)
  lotSpecificAuctionDate?: AnyTimestamp | null; // Se o lote tem data/hora de início específica
  secondAuctionDate?: AnyTimestamp | null; // Data da segunda praça, se aplicável
  
  bidsCount?: number;
  isFavorite?: boolean;
  isFeatured?: boolean;
  description?: string;
  
  // Campos específicos de veículos
  year?: number;
  make?: string; // Marca
  model?: string;
  series?: string;

  // Outros campos comuns
  stockNumber?: string;
  sellingBranch?: string; // Filial de venda

  // Detalhes do veículo (extraídos do HTML de exemplo da Land.com)
  vin?: string; // Chassi
  vinStatus?: string; // Status do Chassi (ex: Remarcado)
  lossType?: string; // Tipo de Sinistro (ex: Colisão, Roubo/Furto)
  primaryDamage?: string; // Dano Principal (ex: Dianteiro, Traseiro)
  titleInfo?: string; // Informação do Título/Documento (ex: Aguardando Documento, Em Branco)
  titleBrand?: string; // Marca do Título (ex: Salvado, Recuperado de Financiamento)
  startCode?: string; // Código de Partida (ex: Funciona e Anda, Não Liga)
  hasKey?: boolean; // Possui Chave? (Sim/Não)
  odometer?: string; // Hodômetro (ex: 120545 MILHAS)
  airbagsStatus?: string; // Status dos Airbags (ex: Intactos, Deflagrados)

  // Detalhes da propriedade/item
  bodyStyle?: string; // Estilo da Carroceria (ex: SEDAN 4 PORTAS)
  engineDetails?: string; // Motor (ex: 2.0L 4)
  transmissionType?: string; // Transmissão (ex: AUTOMÁTICA)
  driveLineType?: string; // Tração (ex: DIANTEIRA)
  fuelType?: string; // Combustível (ex: GASOLINA)
  cylinders?: string; // Cilindros (ex: 4 CILINDROS)
  restraintSystem?: string; // Sistema de Retenção (ex: Airbags Duplos Frontais/Laterais)
  exteriorInteriorColor?: string; // Cor Externa/Interna (ex: AZUL/PRETO)
  options?: string; // Opcionais (ex: AR CONDICIONADO,TETO SOLAR)
  manufacturedIn?: string; // Fabricado Em (ex: ESTADOS UNIDOS)
  vehicleClass?: string; // Classe do Veículo

  // Informações logísticas específicas do lote/local
  vehicleLocationInBranch?: string; // Localização do Veículo na Filial (ex: Pátio A, Setor 3)
  laneRunNumber?: string; // Pista / Número de Corrida
  aisleStall?: string; // Corredor / Vaga

  // Valores adicionais
  actualCashValue?: string; // Valor Real em Dinheiro (VCV)
  estimatedRepairCost?: string; // Custo Estimado de Reparo

  // Informações de Vendedor e Leiloeiro diretamente no lote, se necessário
  sellerName?: string;
  sellerId?: string; // ID do Comitente/Vendedor associado
  auctioneerName?: string;
  auctioneerId?: string; // ID do Leiloeiro associado

  condition?: string;
  createdAt?: AnyTimestamp;
  updatedAt?: AnyTimestamp;

  discountPercentage?: number;
  additionalTriggers?: string[];
  isExclusive?: boolean;

  // Campos de localização para mapa
  latitude?: number | null;
  longitude?: number | null;
  mapAddress?: string | null; 
  mapEmbedUrl?: string | null; 
  mapStaticImageUrl?: string | null; 
}

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
  'views' |           // Gerenciado pelo sistema
  'bidsCount' |       // Gerenciado pelo sistema
  'galleryImageUrls' | // Será gerenciado por mediaItemIds
  'dataAiHint' |      // Será gerenciado por mediaItems
  'cityName' |        // Derivado de cityId
  'stateUf' |         // Derivado de stateId
  'auctioneerName' |
  'sellerName' |
  'type' |
  'auctionName'       // auctionName virá de auctionId selecionado
> & {
  endDate: Date;
  lotSpecificAuctionDate?: Date | null;
  secondAuctionDate?: Date | null;
  type: string; // No form, usamos o nome da categoria para popular o select, que será o categoryId.
  views?: number;
  bidsCount?: number;
  mediaItemIds?: string[];
  galleryImageUrls?: string[]; // Mantemos para conveniência, mas a fonte da verdade será mediaItemIds
};

// Tipo para inserir/atualizar no banco, onde nomes de categoria/leiloeiro são IDs
export type LotDbData = Omit<LotFormData, 'type' | 'auctionName' | 'sellerName' | 'auctioneerName' > & {
  categoryId?: string;
  auctioneerId?: string;
  sellerId?: string;
};

export type BidInfo = {
  id: string;
  lotId: string;
  auctionId: string;
  bidderId: string; // UID do usuário
  bidderDisplay: string; // Nome para exibição (pode ser anônimo ou nome real)
  amount: number;
  timestamp: AnyTimestamp;
};

export type Review = {
  id: string;
  lotId: string;
  auctionId: string; // Contexto do leilão pode ser útil
  userId: string;
  userDisplayName: string;
  rating: number; // e.g., 1-5
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
  answeredByUserId?: string; // UID do admin/vendedor que respondeu
  answeredByUserDisplayName?: string;
  isPublic?: boolean; // Se a pergunta/resposta deve ser visível para outros
};

export type UserDocumentStatus = 'NOT_SENT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PENDING_ANALYSIS';
export type UserHabilitationStatus = 'PENDING_DOCUMENTS' | 'PENDING_ANALYSIS' | 'HABILITADO' | 'REJECTED_DOCUMENTS' | 'BLOCKED';

export interface DocumentType {
  id: string;
  name: string;
  description?: string;
  isRequired: boolean;
  allowedFormats?: string[]; // e.g., ['PDF', 'JPG', 'PNG']
  displayOrder?: number;
}

export interface UserDocument {
  id: string;
  documentTypeId: string;
  userId: string;
  fileUrl?: string; // URL para o arquivo no storage
  status: UserDocumentStatus;
  uploadDate?: AnyTimestamp;
  analysisDate?: AnyTimestamp;
  analystId?: string; // Quem analisou
  rejectionReason?: string;
  documentType: DocumentType; // Dados do tipo de documento para facilitar a exibição
}

export type UserBidStatus = 'GANHANDO' | 'PERDENDO' | 'SUPERADO' | 'ARREMATADO' | 'NAO_ARREMATADO';
export type PaymentStatus = 'PENDENTE' | 'PROCESSANDO' | 'PAGO' | 'FALHOU' | 'REEMBOLSADO';

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

export interface UserWin {
  id: string;
  lot: Lot; // Dados completos do lote arrematado
  winningBidAmount: number;
  winDate: AnyTimestamp;
  paymentStatus: PaymentStatus;
  invoiceUrl?: string; // Link para a nota de arremate/fatura
  // Outros detalhes como taxas, comissões podem ser adicionados aqui
}


export interface UserProfileData {
  uid: string;
  email: string;
  fullName: string | null;
  password?: string; // Campo para uso interno do adapter SQL, NUNCA RETORNADO AO CLIENTE
  roleId?: string | null;
  roleName?: string; // Nome do perfil para exibição
  permissions?: string[]; // Permissões herdadas do perfil
  habilitationStatus?: UserHabilitationStatus;
  
  // Dados Pessoais Adicionais
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
  propertyRegime?: string | null; // Regime de bens (para casados)
  spouseName?: string | null;
  spouseCpf?: string | null;

  // Endereço
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  
  status?: string; // Ex: ATIVO, INATIVO, SUSPENSO, PENDENTE_VALIDACAO
  optInMarketing?: boolean;
  createdAt?: AnyTimestamp;
  updatedAt?: AnyTimestamp;
  avatarUrl?: string | null;
  dataAiHint?: string | null;

  // Estatísticas e Relações (podem ser calculadas ou referências)
  activeBids?: number;
  auctionsWon?: number;
  itemsSold?: number; // Se o usuário também for um comitente

  sellerProfileId?: string; // Se este usuário também é um Seller

  // Campos para PJ e Comitente Venda Direta
  accountType?: 'PHYSICAL' | 'LEGAL' | 'DIRECT_SALE_CONSIGNOR';
  razaoSocial?: string | null;
  cnpj?: string | null;
  inscricaoEstadual?: string | null;
  websiteComitente?: string | null;
}

export type UserProfileWithPermissions = UserProfileData & {
  // permissions já está em UserProfileData, mas podemos reforçar aqui
  permissions: string[]; 
};

export type EditableUserProfileData = Partial<Omit<UserProfileData, 'uid' | 'email' | 'status' | 'createdAt' | 'updatedAt' | 'activeBids' | 'auctionsWon' | 'itemsSold' | 'avatarUrl' | 'dataAiHint' | 'roleId' | 'roleName' | 'sellerProfileId' | 'permissions' | 'habilitationStatus' | 'password' >> & {
  dateOfBirth?: Date | null; // Formulário usará Date
  rgIssueDate?: Date | null; // Formulário usará Date
};

// Type for data from UserForm, to be processed by createUser action in users/actions.ts
export type UserFormValues = Pick<UserProfileData, 'fullName' | 'email' | 'cpf' | 'cellPhone' | 'dateOfBirth' | 'accountType' | 'razaoSocial' | 'cnpj' | 'inscricaoEstadual' | 'websiteComitente' | 'zipCode' | 'street' | 'number' | 'complement' | 'neighborhood' | 'city' | 'state' | 'optInMarketing'> & {
  password?: string;
  roleId?: string | null; // ID do perfil, opcional
};

export interface SqlAuthResult {
  success: boolean;
  message: string;
  user?: UserProfileData; // Ou UserProfileWithPermissions se já vier com permissões
}

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
    price?: number; // Obrigatório se offerType for BUY_NOW
    minimumOfferPrice?: number; // Opcional, relevante para ACCEPTS_PROPOSALS
    category: string; // Slug da categoria
    locationCity?: string;
    locationState?: string; // UF
    sellerName: string;
    sellerId?: string; // ID do comitente/vendedor
    sellerLogoUrl?: string;
    dataAiHintSellerLogo?: string;
    status: DirectSaleOfferStatus;
    itemsIncluded?: string[]; // Para descrever o que vem no "pacote"
    tags?: string[]; // Palavras-chave para busca
    views?: number;
    proposalsCount?: number; // Se aceita propostas
    createdAt: AnyTimestamp;
    updatedAt: AnyTimestamp;
    expiresAt?: AnyTimestamp; // Data de expiração da oferta
}

// --- Settings Types ---
export interface ThemeColors {
  [colorVariable: string]: string; // e.g., '--primary': 'hsl(25, 95%, 53%)'
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
  // Outras seções podem ser adicionadas aqui
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
  itemCount?: number; // Para seções de lista, como lotes em destaque
  categorySlug?: string; // Para seções baseadas em categoria
  promoContent?: PromoCardContent;
}

export interface MapSettings {
  defaultProvider?: 'google' | 'openstreetmap' | 'staticImage';
  googleMapsApiKey?: string | null;
  staticImageMapZoom?: number;
  staticImageMapMarkerColor?: string;
}

export interface PlatformSettings {
  id: 'global'; // Sempre 'global' para o documento único de configurações
  siteTitle?: string;
  siteTagline?: string;
  galleryImageBasePath: string; // Ex: /uploads/lotes/
  activeThemeName?: string | null;
  themes?: Theme[];
  platformPublicIdMasks?: {
    auctions?: string; // Ex: "LEIL-"
    lots?: string;     // Ex: "LOTE-"
    auctioneers?: string;
    sellers?: string;
  };
  homepageSections?: HomepageSectionConfig[];
  mentalTriggerSettings?: MentalTriggerSettings;
  sectionBadgeVisibility?: SectionBadgeConfig; 
  mapSettings?: MapSettings; // Adicionado para configurações de mapa
  updatedAt: AnyTimestamp;
}

export type PlatformSettingsFormData = Omit<PlatformSettings, 'id' | 'updatedAt'> & {
    homepageSections?: HomepageSectionConfig[]; // Garantir que seja parte do form
    mentalTriggerSettings?: MentalTriggerSettings;
    sectionBadgeVisibility?: SectionBadgeConfig;
    mapSettings?: MapSettings;
};


export interface IDatabaseAdapter {
  initializeSchema(): Promise<{ success: boolean; message: string; errors?: any[], rolesProcessed?: number }>;

  createLotCategory(data: { name: string; description?: string }): Promise<{ success: boolean; message: string; categoryId?: string }>;
  getLotCategories(): Promise<LotCategory[]>;
  getLotCategory(idOrSlug: string): Promise<LotCategory | null>; // Pode buscar por ID ou Slug
  getLotCategoryByName(name: string): Promise<LotCategory | null>;
  updateLotCategory(id: string, data: { name: string; description?: string }): Promise<{ success: boolean; message: string }>;
  deleteLotCategory(id: string): Promise<{ success: boolean; message: string }>;

  createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string }>;
  getStates(): Promise<StateInfo[]>;
  getState(idOrSlugOrUf: string): Promise<StateInfo | null>;
  updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string }>;
  deleteState(id: string): Promise<{ success: boolean; message: string }>;

  createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string }>;
  getCities(stateIdOrSlugFilter?: string): Promise<CityInfo[]>;
  getCity(idOrCompositeSlug: string): Promise<CityInfo | null>; // id pode ser "stateSlug-citySlug" ou ID numérico
  updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string }>;
  deleteCity(id: string): Promise<{ success: boolean; message: string }>;

  createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; auctioneerPublicId?: string }>;
  getAuctioneers(): Promise<AuctioneerProfileInfo[]>;
  getAuctioneer(idOrPublicId: string): Promise<AuctioneerProfileInfo | null>;
  updateAuctioneer(idOrPublicId: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string }>;
  deleteAuctioneer(idOrPublicId: string): Promise<{ success: boolean; message: string }>;
  getAuctioneerBySlug(slugOrPublicId: string): Promise<AuctioneerProfileInfo | null>;
  getAuctioneerByName(name: string): Promise<AuctioneerProfileInfo | null>;


  createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; sellerPublicId?: string; }>;
  getSellers(): Promise<SellerProfileInfo[]>;
  getSeller(idOrPublicId: string): Promise<SellerProfileInfo | null>;
  updateSeller(idOrPublicId: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string }>;
  deleteSeller(idOrPublicId: string): Promise<{ success: boolean; message: string }>;
  getSellerBySlug(slugOrPublicId: string): Promise<SellerProfileInfo | null>;
  getSellerByName(name: string): Promise<SellerProfileInfo | null>;

  createAuction(data: AuctionDbData): Promise<{ success: boolean; message: string; auctionId?: string; auctionPublicId?: string }>;
  getAuctions(): Promise<Auction[]>;
  getAuction(idOrPublicId: string): Promise<Auction | null>;
  updateAuction(idOrPublicId: string, data: Partial<AuctionDbData>): Promise<{ success: boolean; message: string }>;
  deleteAuction(idOrPublicId: string): Promise<{ success: boolean; message: string }>;
  getAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]>;


  createLot(data: LotDbData): Promise<{ success: boolean; message: string; lotId?: string; lotPublicId?: string; }>;
  getLots(auctionIdParam?: string): Promise<Lot[]>; // auctionIdParam pode ser ID numérico ou publicId
  getLot(idOrPublicId: string): Promise<Lot | null>;
  updateLot(idOrPublicId: string, data: Partial<LotDbData>): Promise<{ success: boolean; message: string }>;
  deleteLot(idOrPublicId: string, auctionId?: string): Promise<{ success: boolean; message: string }>;
  getBidsForLot(lotIdOrPublicId: string): Promise<BidInfo[]>;
  placeBidOnLot(lotIdOrPublicId: string, auctionIdOrPublicId: string, userId: string, userDisplayName: string, bidAmount: number): Promise<{ success: boolean; message: string; updatedLot?: Partial<Pick<Lot, 'price' | 'bidsCount' | 'status'>>; newBid?: BidInfo }>;
  getReviewsForLot(lotIdOrPublicId: string): Promise<Review[]>;
  createReview(review: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; message: string; reviewId?: string }>;
  getQuestionsForLot(lotIdOrPublicId: string): Promise<LotQuestion[]>;
  createQuestion(question: Omit<LotQuestion, 'id' | 'createdAt' | 'answeredAt' | 'answeredByUserId' | 'answeredByUserDisplayName' | 'isPublic'>): Promise<{ success: boolean; message: string; questionId?: string }>;
  answerQuestion(questionId: string, answerText: string, answeredByUserId: string, answeredByUserDisplayName: string): Promise<{ success: boolean; message: string }>;


  // User and Role Management
  getUserProfileData(userId: string): Promise<UserProfileData | null>;
  updateUserProfile(userId: string, data: EditableUserProfileData): Promise<{ success: boolean; message: string; }>;
  ensureUserRole(
    userId: string, 
    email: string, 
    fullName: string | null, 
    targetRoleName: string, 
    additionalProfileData?: Partial<Pick<UserProfileData, 'cpf' | 'cellPhone' | 'dateOfBirth' | 'password' | 'accountType' | 'razaoSocial' | 'cnpj' | 'inscricaoEstadual' | 'websiteComitente' | 'zipCode' | 'street' | 'number' | 'complement' | 'neighborhood' | 'city' | 'state' | 'optInMarketing' >>,
    roleIdToAssign?: string 
  ): Promise<{ success: boolean; message: string; userProfile?: UserProfileData; }>;
  getUsersWithRoles(): Promise<UserProfileData[]>;
  updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }>;
  deleteUserProfile(userId: string): Promise<{ success: boolean; message: string; }>;
  getUserByEmail(email: string): Promise<UserProfileData | null>;
  
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

  // Platform Settings
  getPlatformSettings(): Promise<PlatformSettings>;
  updatePlatformSettings(data: PlatformSettingsFormData): Promise<{ success: boolean; message: string; }>;
}


// Type for data from UserForm, to be processed by createUser action in users/actions.ts
export type UserCreationData = Pick<UserProfileData, 'fullName' | 'email' | 'cpf' | 'cellPhone' | 'dateOfBirth' | 'accountType' | 'razaoSocial' | 'cnpj' | 'inscricaoEstadual' | 'websiteComitente' | 'zipCode' | 'street' | 'number' | 'complement' | 'neighborhood' | 'city' | 'state' | 'optInMarketing'> & {
  password?: string;
  roleId?: string | null; // ID do perfil, opcional
};

export type MegaMenuLinkItem = {
  href: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
};

export type MegaMenuGroup = {
  title?: string;
  items: MegaMenuLinkItem[];
};


export interface RecentlyViewedLotInfo {
  id: string;
  title: string;
  imageUrl: string;
  auctionId: string;
  dataAiHint?: string;
}
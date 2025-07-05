// src/lib/sample-data.ts
import type {
  Bem, Lot, LotCategory, Auction, AuctioneerProfileInfo, SellerProfileInfo,
  StateInfo, CityInfo, UserProfileWithPermissions, Role, MediaItem, Subcategory,
  PlatformSettings, DirectSaleOffer, UserWin, BidInfo, LotQuestion, Review, UserLotMaxBid, AuctionStage,
  UserDocument, DocumentType, Court, JudicialDistrict, JudicialBranch, JudicialProcess, ProcessParty, Notification, BlogPost
} from '@/types';
import { slugify } from './sample-data-helpers';
import { v4 as uuidv4 } from 'uuid';
import { predefinedPermissions } from '@/app/admin/roles/role-form-schema';

// ==================================
// PURE HELPER FUNCTIONS
// ==================================
const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]);
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start: Date, end: Date): Date => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const randomCoord = (base: number, range: number): number => base + (Math.random() - 0.5) * range;

// ==================================
// BASE STATIC DATA
// ==================================
export const sampleRoles: Role[] = [
  { id: 'role-admin', name: 'ADMINISTRATOR', name_normalized: 'ADMINISTRATOR', description: 'Acesso total.', permissions: ['manage_all'], createdAt: new Date(), updatedAt: new Date() },
  { id: 'role-user', name: 'USER', name_normalized: 'USER', description: 'Usuário padrão.', permissions: ['view_auctions', 'place_bids', 'view_lots'], createdAt: new Date(), updatedAt: new Date() },
  { id: 'role-consignor', name: 'CONSIGNOR', name_normalized: 'CONSIGNOR', description: 'Comitente.', permissions: ['auctions:manage_own', 'lots:manage_own'], createdAt: new Date(), updatedAt: new Date() },
  { id: 'role-arrematante', name: 'ARREMATANTE', name_normalized: 'ARREMATANTE', description: 'Usuário que arrematou lotes.', permissions: ['view_wins', 'manage_payments', 'schedule_retrieval'], createdAt: new Date(), updatedAt: new Date() }
];

export const sampleStates: StateInfo[] = [
  { id: 'state-sp', name: 'São Paulo', uf: 'SP', slug: 'sao-paulo', cityCount: 2, createdAt: new Date(), updatedAt: new Date() },
  { id: 'state-ba', name: 'Bahia', uf: 'BA', slug: 'bahia', cityCount: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 'state-rj', name: 'Rio de Janeiro', uf: 'RJ', slug: 'rio-de-janeiro', cityCount: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 'state-mg', name: 'Minas Gerais', uf: 'MG', slug: 'minas-gerais', cityCount: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 'state-se', name: 'Sergipe', uf: 'SE', slug: 'sergipe', cityCount: 1, createdAt: new Date(), updatedAt: new Date() },
];

export const sampleCities: CityInfo[] = [
  { id: 'city-sp-sao-paulo', name: 'São Paulo', slug: 'sao-paulo', stateId: 'state-sp', stateUf: 'SP', lotCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'city-sp-campinas', name: 'Campinas', slug: 'campinas', stateId: 'state-sp', stateUf: 'SP', lotCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'city-ba-salvador', name: 'Salvador', slug: 'salvador', stateId: 'state-ba', stateUf: 'BA', lotCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'city-rj-rio', name: 'Rio de Janeiro', slug: 'rio-de-janeiro', stateId: 'state-rj', stateUf: 'RJ', lotCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'city-mg-bh', name: 'Belo Horizonte', slug: 'belo-horizonte', stateId: 'state-mg', stateUf: 'MG', lotCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'city-se-lagarto', name: 'Lagarto', slug: 'lagarto', stateId: 'state-se', stateUf: 'SE', lotCount: 0, createdAt: new Date(), updatedAt: new Date() },
];

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  'sao-paulo': { lat: -23.5505, lon: -46.6333 }, 'campinas': { lat: -22.9099, lon: -47.0626 },
  'salvador': { lat: -12.9777, lon: -38.5016 }, 'rio-de-janeiro': { lat: -22.9068, lon: -43.1729 },
  'belo-horizonte': { lat: -19.9167, lon: -43.9345 }, 'lagarto': { lat: -10.9167, lon: -37.65 },
};

export const sampleAuctioneers: AuctioneerProfileInfo[] = [
  { id: 'auct-augusto-leiloeiro', publicId: 'AUCT-PUB-1', name: 'Augusto Leiloeiro Oficial', slug: 'augusto-leiloeiro', logoUrl: 'https://placehold.co/100x100/f97316/ffffff/png?text=AL', city: 'São Paulo', state: 'SP', createdAt: new Date(), updatedAt: new Date(), userId: 'admin-bidexpert-platform-001' },
  { id: 'auct-sodre-santoro', publicId: 'AUCT-PUB-2', name: 'Sodré Santoro Leilões', slug: 'sodre-santoro', logoUrl: 'https://placehold.co/100x100/1e40af/ffffff/png?text=SS', city: 'Guarulhos', state: 'SP', createdAt: new Date(), updatedAt: new Date() },
  { id: 'auct-freitas-leiloeiro', publicId: 'AUCT-PUB-3', name: 'Freitas Leiloeiro Oficial', slug: 'freitas-leiloeiro', logoUrl: 'https://placehold.co/100x100/166534/ffffff/png?text=FL', city: 'Curitiba', state: 'PR', createdAt: new Date(), updatedAt: new Date() },
  { id: 'auct-zukerman-leiloes', publicId: 'AUCT-PUB-4', name: 'Zukerman Leilões', slug: 'zukerman-leiloes', logoUrl: 'https://placehold.co/100x100/be123c/ffffff/png?text=ZK', city: 'São Paulo', state: 'SP', createdAt: new Date(), updatedAt: new Date() },
  { id: 'auct-pestana-leiloes', publicId: 'AUCT-PUB-5', name: 'Pestana Leilões', slug: 'pestana-leiloes', logoUrl: 'https://placehold.co/100x100/ca8a04/ffffff/png?text=PL', city: 'Porto Alegre', state: 'RS', createdAt: new Date(), updatedAt: new Date() },
  { id: 'auct-lance-certo', publicId: 'AUCT-PUB-6', name: 'Lance Certo Leilões', slug: 'lance-certo-leiloes', logoUrl: 'https://placehold.co/100x100/6d28d9/ffffff/png?text=LC', city: 'Belo Horizonte', state: 'MG', createdAt: new Date(), updatedAt: new Date() }
];

export const sampleSellers: SellerProfileInfo[] = [
  { id: 'seller-banco-bradesco', publicId: 'SELL-PUB-1', name: 'Banco Bradesco S.A.', slug: 'banco-bradesco-s-a', logoUrl: 'https://placehold.co/100x100/dc2626/ffffff/png?text=B', city: 'Osasco', state: 'SP', createdAt: new Date(), updatedAt: new Date() },
  { id: 'seller-itau-unibanco', publicId: 'SELL-PUB-2', name: 'Itaú Unibanco S.A.', slug: 'itau-unibanco', logoUrl: 'https://placehold.co/100x100/ea580c/ffffff/png?text=I', city: 'São Paulo', state: 'SP', createdAt: new Date(), updatedAt: new Date() },
  { id: 'seller-construtora-mrv', publicId: 'SELL-PUB-3', name: 'Construtora MRV', slug: 'construtora-mrv', logoUrl: 'https://placehold.co/100x100/16a34a/ffffff/png?text=MRV', city: 'Belo Horizonte', state: 'MG', createdAt: new Date(), updatedAt: new Date() },
  { id: 'seller-tjsp', publicId: 'SELL-PUB-4', name: 'Tribunal de Justiça do Estado de São Paulo', slug: 'tjsp', logoUrl: 'https://placehold.co/100x100/7c3aed/ffffff/png?text=TJ', city: 'São Paulo', state: 'SP', createdAt: new Date(), updatedAt: new Date() },
  { id: 'seller-receita-federal', publicId: 'SELL-PUB-5', name: 'Receita Federal', slug: 'receita-federal', logoUrl: 'https://placehold.co/100x100/047857/ffffff/png?text=RF', city: 'Brasília', state: 'DF', createdAt: new Date(), updatedAt: new Date() },
  { id: 'seller-vale', publicId: 'SELL-PUB-6', name: 'Vale S.A.', slug: 'vale-sa', logoUrl: 'https://placehold.co/100x100/0369a1/ffffff/png?text=V', city: 'Rio de Janeiro', state: 'RJ', createdAt: new Date(), updatedAt: new Date() },
  { id: 'seller-prefeitura-campinas', publicId: 'SELL-PUB-7', name: 'Prefeitura de Campinas', slug: 'prefeitura-campinas', logoUrl: 'https://placehold.co/100x100/065f46/ffffff/png?text=PC', city: 'Campinas', state: 'SP', createdAt: new Date(), updatedAt: new Date() },
  { id: 'seller-agro-brasil', publicId: 'SELL-PUB-8', name: 'Fazenda Agro Brasil', slug: 'fazenda-agro-brasil', logoUrl: 'https://placehold.co/100x100/84cc16/ffffff/png?text=AB', city: 'Rondonópolis', state: 'MT', createdAt: new Date(), updatedAt: new Date() }
];

export const sampleLotCategories: LotCategory[] = [
  { id: 'cat-imoveis', name: 'Imóveis', slug: 'imoveis', hasSubcategories: true, itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat-veiculos', name: 'Veículos', slug: 'veiculos', hasSubcategories: true, itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat-maquinas-e-equipamentos', name: 'Máquinas e Equipamentos', slug: 'maquinas-e-equipamentos', hasSubcategories: true, itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat-eletronicos-e-tecnologia', name: 'Eletrônicos e Tecnologia', slug: 'eletronicos-e-tecnologia', hasSubcategories: true, itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat-arte-e-antiguidades', name: 'Arte e Antiguidades', slug: 'arte-e-antiguidades', hasSubcategories: false, itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat-bens-diversos', name: 'Bens Diversos', slug: 'bens-diversos', hasSubcategories: false, itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat-veiculos-pesados', name: 'Veículos Pesados e Utilitários', slug: 'veiculos-pesados-e-utilitarios', hasSubcategories: true, itemCount: 0, createdAt: new Date(), updatedAt: new Date() }
];

export const sampleSubcategories: Subcategory[] = [
  { id: 'subcat-imoveis-apartamentos', name: 'Apartamentos', slug: 'apartamentos', parentCategoryId: 'cat-imoveis', itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'subcat-imoveis-casas', name: 'Casas', slug: 'casas', parentCategoryId: 'cat-imoveis', itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'subcat-veiculos-carros', name: 'Carros', slug: 'carros', parentCategoryId: 'cat-veiculos', itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'subcat-veiculos-motos', name: 'Motos', slug: 'motos', parentCategoryId: 'cat-veiculos', itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'subcat-maquinas-agricolas', name: 'Máquinas Agrícolas', slug: 'maquinas-agricolas', parentCategoryId: 'cat-maquinas-e-equipamentos', itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'subcat-maquinas-construcao', name: 'Equipamentos de Construção', slug: 'equipamentos-construcao', parentCategoryId: 'cat-maquinas-e-equipamentos', itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'subcat-eletronicos-celulares', name: 'Celulares e Smartphones', slug: 'celulares-e-smartphones', parentCategoryId: 'cat-eletronicos-e-tecnologia', itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'subcat-pesados-caminhoes', name: 'Caminhões', slug: 'caminhoes', parentCategoryId: 'cat-veiculos-pesados', itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'subcat-pesados-onibus', name: 'Ônibus', slug: 'onibus', parentCategoryId: 'cat-veiculos-pesados', itemCount: 0, createdAt: new Date(), updatedAt: new Date() }
];

export const sampleMediaItems: MediaItem[] = [
  { id: 'media-car-1', fileName: 'ford-ka.jpg', uploadedAt: new Date(), mimeType: 'image/jpeg', sizeBytes: 120000, urlOriginal: 'https://placehold.co/800x600/f87171/ffffff/png?text=Ford+Ka', dataAiHint: 'carro ford ka' },
  { id: 'media-moto-1', fileName: 'honda-cg.jpg', uploadedAt: new Date(), mimeType: 'image/jpeg', sizeBytes: 110000, urlOriginal: 'https://placehold.co/800x600/fb923c/ffffff/png?text=Honda+CG', dataAiHint: 'moto honda' },
  { id: 'media-apt-1', fileName: 'apartamento-sp.jpg', uploadedAt: new Date(), mimeType: 'image/jpeg', sizeBytes: 150000, urlOriginal: 'https://placehold.co/800x600/60a5fa/ffffff/png?text=Apto+SP', dataAiHint: 'apartamento sao paulo' },
  { id: 'media-house-1', fileName: 'casa-salvador.jpg', uploadedAt: new Date(), mimeType: 'image/jpeg', sizeBytes: 160000, urlOriginal: 'https://placehold.co/800x600/34d399/ffffff/png?text=Casa+Salvador', dataAiHint: 'casa salvador' },
  { id: 'media-trator-1', fileName: 'trator-jd.jpg', uploadedAt: new Date(), mimeType: 'image/jpeg', sizeBytes: 180000, urlOriginal: 'https://placehold.co/800x600/a3e635/ffffff/png?text=Trator+JD', dataAiHint: 'trator john deere' },
  { id: 'media-iphone-1', fileName: 'iphone-15.jpg', uploadedAt: new Date(), mimeType: 'image/jpeg', sizeBytes: 95000, urlOriginal: 'https://placehold.co/800x600/c084fc/ffffff/png?text=iPhone', dataAiHint: 'celular iphone' },
  { id: 'media-quadro-1', fileName: 'quadro-abstrato.jpg', uploadedAt: new Date(), mimeType: 'image/jpeg', sizeBytes: 130000, urlOriginal: 'https://placehold.co/800x600/facc15/ffffff/png?text=Arte', dataAiHint: 'arte quadro' },
  { id: 'media-escavadeira-1', fileName: 'escavadeira.jpg', uploadedAt: new Date(), mimeType: 'image/jpeg', sizeBytes: 190000, urlOriginal: 'https://placehold.co/800x600/fdba74/ffffff/png?text=Escavadeira', dataAiHint: 'maquina escavadeira' },
  { id: 'media-macbook-1', fileName: 'macbook.jpg', uploadedAt: new Date(), mimeType: 'image/jpeg', sizeBytes: 140000, urlOriginal: 'https://placehold.co/800x600/94a3b8/ffffff/png?text=MacBook', dataAiHint: 'laptop macbook' },
  { id: 'media-relogio-1', fileName: 'relogio-luxo.jpg', uploadedAt: new Date(), mimeType: 'image/jpeg', sizeBytes: 105000, urlOriginal: 'https://placehold.co/800x600/fde047/ffffff/png?text=Relogio', dataAiHint: 'relogio luxo' },
  { id: 'media-caminhao-1', fileName: 'caminhao-volvo.jpg', uploadedAt: new Date(), mimeType: 'image/jpeg', sizeBytes: 210000, urlOriginal: 'https://placehold.co/800x600/3b82f6/ffffff/png?text=Caminhao', dataAiHint: 'caminhao carga' },
  { id: 'media-retroescavadeira-1', fileName: 'retroescavadeira-case.jpg', uploadedAt: new Date(), mimeType: 'image/jpeg', sizeBytes: 220000, urlOriginal: 'https://placehold.co/800x600/f59e0b/ffffff/png?text=Retroescavadeira', dataAiHint: 'retroescavadeira amarela' },
  { id: 'media-colheitadeira-1', fileName: 'colheitadeira-jd.jpg', uploadedAt: new Date(), mimeType: 'image/jpeg', sizeBytes: 250000, urlOriginal: 'https://placehold.co/800x600/4d7c0f/ffffff/png?text=Colheitadeira', dataAiHint: 'colheitadeira agricola' },
];

export const samplePlatformSettings: PlatformSettings = {
  id: 'global',
  siteTitle: 'BidExpert',
  siteTagline: 'Sua plataforma especialista em leilões online.',
  galleryImageBasePath: '/uploads/media/',
  storageProvider: 'local',
  firebaseStorageBucket: null,
  activeThemeName: 'default',
  themes: [],
  platformPublicIdMasks: {
    auctions: 'LEIL-',
    lots: 'LOTE-',
    auctioneers: 'LEILOE-',
    sellers: 'COMI-'
  },
  mapSettings: {
    defaultProvider: 'openstreetmap',
    googleMapsApiKey: '',
    staticImageMapZoom: 15,
    staticImageMapMarkerColor: 'blue'
  },
  searchPaginationType: 'loadMore',
  searchItemsPerPage: 12,
  searchLoadMoreCount: 12,
  showCountdownOnLotDetail: true,
  showCountdownOnCards: true,
  showRelatedLotsOnLotDetail: true,
  relatedLotsCount: 4,
  mentalTriggerSettings: {
    showDiscountBadge: true,
    showUrgencyTimer: true,
    urgencyTimerThresholdDays: 1,
    urgencyTimerThresholdHours: 0,
    showPopularityBadge: true,
    popularityViewThreshold: 500,
    showHotBidBadge: true,
    hotBidThreshold: 10,
    showExclusiveBadge: true
  },
  sectionBadgeVisibility: {
    featuredLots: { showStatusBadge: true, showDiscountBadge: true, showUrgencyTimer: true, showPopularityBadge: true, showHotBidBadge: true, showExclusiveBadge: true },
    searchGrid: { showStatusBadge: true, showDiscountBadge: true, showUrgencyTimer: true, showPopularityBadge: true, showHotBidBadge: true, showExclusiveBadge: true },
    searchList: { showStatusBadge: true, showDiscountBadge: true, showUrgencyTimer: true, showPopularityBadge: true, showHotBidBadge: true, showExclusiveBadge: true },
    lotDetail: { showStatusBadge: true, showDiscountBadge: true, showUrgencyTimer: true, showPopularityBadge: true, showHotBidBadge: true, showExclusiveBadge: true }
  },
  homepageSections: [
    { id: 'hero', type: 'hero_carousel', visible: true, order: 1 },
    { id: 'filter_links', type: 'filter_links', title: 'Explorar por Tipo', visible: true, order: 2 },
    { id: 'featured_lots', type: 'featured_lots', title: 'Lotes em Destaque', visible: true, order: 3 },
    { id: 'active_auctions', type: 'active_auctions', title: 'Leilões Ativos', visible: true, order: 4 },
  ],
  variableIncrementTable: [
    { from: 0, to: 100, increment: 5 },
    { from: 100, to: 500, increment: 10 },
    { from: 500, to: 1000, increment: 25 },
    { from: 1000, to: 5000, increment: 50 },
    { from: 5000, to: 10000, increment: 100 },
    { from: 10000, to: null, increment: 250 },
  ],
  biddingSettings: {
    instantBiddingEnabled: true,
    getBidInfoInstantly: true,
    biddingInfoCheckIntervalSeconds: 2,
  },
  updatedAt: new Date(),
};

// Document Types
export const sampleDocumentTypes: DocumentType[] = [
  { id: 'doc-type-1', name: 'Documento de Identidade (Frente)', description: 'RG ou CNH (frente)', isRequired: true, displayOrder: 1 },
  { id: 'doc-type-2', name: 'Documento de Identidade (Verso)', description: 'RG ou CNH (verso)', isRequired: true, displayOrder: 2 },
  { id: 'doc-type-3', name: 'Comprovante de Residência', description: 'Conta de água, luz ou telefone recente', isRequired: true, displayOrder: 3 },
  { id: 'doc-type-4', name: 'Selfie com Documento', description: 'Uma foto sua segurando o documento de identidade', isRequired: true, displayOrder: 4 },
  { id: 'doc-type-5', name: 'Contrato Social / MEI', description: 'Para Pessoas Jurídicas', isRequired: false, displayOrder: 5 },
];

// User Documents
export const sampleUserDocuments: UserDocument[] = [
  {
    id: 'user-doc-1',
    documentTypeId: 'doc-type-1',
    userId: 'user123', // Corresponds to the mock userId in the page
    status: 'APPROVED',
    fileUrl: 'https://placehold.co/600x400.png?text=Frente+Aprovada',
    uploadDate: new Date('2024-05-10T10:00:00Z'),
    analysisDate: new Date('2024-05-10T14:00:00Z'),
    documentType: sampleDocumentTypes[0]!
  },
  {
    id: 'user-doc-2',
    documentTypeId: 'doc-type-2',
    userId: 'user123',
    status: 'REJECTED',
    fileUrl: 'https://placehold.co/600x400.png?text=Verso+Ilegivel',
    uploadDate: new Date('2024-05-10T10:01:00Z'),
    analysisDate: new Date('2024-05-10T14:05:00Z'),
    rejectionReason: 'A imagem do verso do documento está ilegível. Por favor, envie uma foto mais nítida.',
    documentType: sampleDocumentTypes[1]!
  },
  {
    id: 'user-doc-3',
    documentTypeId: 'doc-type-3',
    userId: 'user123',
    status: 'PENDING_ANALYSIS',
    fileUrl: 'https://placehold.co/600x400.png?text=Comprovante',
    uploadDate: new Date('2024-05-11T09:30:00Z'),
    analysisDate: undefined,
    rejectionReason: undefined,
    documentType: sampleDocumentTypes[2]!
  },
];

// ==================================
// DYNAMIC DATA GENERATION
// ==================================
export const sampleUserProfiles: UserProfileWithPermissions[] = [
  {
    uid: 'admin-bidexpert-platform-001',
    email: 'admin@bidexpert.com.br',
    password: '@dmin2025',
    fullName: 'Administrador BidExpert',
    roleId: 'role-admin',
    roleName: 'ADMINISTRATOR',
    permissions: ['manage_all'],
    status: 'ATIVO',
    habilitationStatus: 'HABILITADO',
    cpf: '000.000.000-00',
    cellPhone: '(11) 99999-9999',
    dateOfBirth: new Date('1990-01-01T00:00:00Z'),
    createdAt: new Date('2023-01-01T12:00:00Z'),
    updatedAt: new Date(),
    accountType: 'PHYSICAL',
  },
  {
    uid: 'consignor@bidexpert.com',
    email: 'consignor@bidexpert.com',
    password: 'password123',
    fullName: 'Bradesco Comitente',
    roleId: 'role-consignor',
    roleName: 'CONSIGNOR',
    permissions: ['auctions:manage_own', 'lots:manage_own'],
    status: 'ATIVO',
    habilitationStatus: 'HABILITADO',
    createdAt: new Date('2023-01-01T12:00:00Z'),
    updatedAt: new Date(),
    accountType: 'LEGAL',
  }
];

export const sampleCourts: Court[] = [
  { id: 'court-tjsp', name: 'Tribunal de Justiça de São Paulo', slug: 'tjsp', stateUf: 'SP', website: 'https://www.tjsp.jus.br', createdAt: new Date(), updatedAt: new Date() },
  { id: 'court-tjrj', name: 'Tribunal de Justiça do Rio de Janeiro', slug: 'tjrj', stateUf: 'RJ', website: 'https://www.tjrj.jus.br', createdAt: new Date(), updatedAt: new Date() },
  { id: 'court-tjmg', name: 'Tribunal de Justiça de Minas Gerais', slug: 'tjmg', stateUf: 'MG', website: 'https://www.tjmg.jus.br', createdAt: new Date(), updatedAt: new Date() },
  { id: 'court-tjse', name: 'Tribunal de Justiça de Sergipe', slug: 'tjse', stateUf: 'SE', website: 'https://www.tjse.jus.br', createdAt: new Date(), updatedAt: new Date() },
  { id: 'court-trt2', name: 'Tribunal Regional do Trabalho da 2ª Região', slug: 'trt2-sp', stateUf: 'SP', website: 'https://ww2.trt2.jus.br', createdAt: new Date(), updatedAt: new Date() },
];

export const sampleJudicialDistricts: JudicialDistrict[] = [
  { id: 'dist-sp-capital', name: 'Comarca da Capital', slug: 'sao-paulo-capital', courtId: 'court-tjsp', stateId: 'state-sp', zipCode: '01010-000', createdAt: new Date(), updatedAt: new Date() },
  { id: 'dist-sp-campinas', name: 'Comarca de Campinas', slug: 'campinas', courtId: 'court-tjsp', stateId: 'state-sp', zipCode: '13010-000', createdAt: new Date(), updatedAt: new Date() },
  { id: 'dist-rj-capital', name: 'Comarca da Capital', slug: 'rio-de-janeiro-capital', courtId: 'court-tjrj', stateId: 'state-rj', zipCode: '20010-000', createdAt: new Date(), updatedAt: new Date() },
  { id: 'dist-se-lagarto', name: 'Comarca de Lagarto', slug: 'lagarto', courtId: 'court-tjse', stateId: 'state-se', zipCode: '49400-000', createdAt: new Date(), updatedAt: new Date() },
  { id: 'dist-sp-sao-paulo-trt', name: 'Comarca de São Paulo (TRT)', slug: 'sao-paulo-trt', courtId: 'court-trt2', stateId: 'state-sp', zipCode: '01139-003', createdAt: new Date(), updatedAt: new Date() },
];

export const sampleJudicialBranches: JudicialBranch[] = [
    { id: 'branch-1', name: '1ª Vara Cível', slug: '1a-vara-civel', districtId: 'dist-sp-capital', contactName: 'José da Silva', phone: '11 1234-5678', email: 'vara1.sp@tj.jus.br', createdAt: new Date(), updatedAt: new Date() },
    { id: 'branch-2', name: '2ª Vara da Fazenda Pública', slug: '2a-vara-da-fazenda-publica', districtId: 'dist-rj-capital', contactName: 'Maria Oliveira', phone: '21 9876-5432', email: 'vara2.rj@tj.jus.br', createdAt: new Date(), updatedAt: new Date() },
    { id: 'branch-3', name: 'Vara Única de Lagarto', slug: 'vara-unica-lagarto', districtId: 'dist-se-lagarto', contactName: 'Ana Costa', phone: '79 3631-1111', email: 'vara.lagarto@tjse.jus.br', createdAt: new Date(), updatedAt: new Date() },
    { id: 'branch-4', name: '15ª Vara do Trabalho de São Paulo', slug: '15-vara-trabalho-sp', districtId: 'dist-sp-sao-paulo-trt', contactName: 'Paulo Lima', phone: '11 3525-2015', email: 'vt15.sp@trt2.jus.br', createdAt: new Date(), updatedAt: new Date() },
];

const sampleParties: ProcessParty[] = [
    { id: 'party-1', name: 'João da Silva', documentNumber: '111.222.333-44', partyType: 'AUTOR' },
    { id: 'party-2', name: 'Empresa X Ltda', documentNumber: '12.345.678/0001-99', partyType: 'REU' },
    { id: 'party-3', name: 'Dr. Carlos Advogado', documentNumber: 'OAB/SP 12345', partyType: 'ADVOGADO_AUTOR' },
    { id: 'party-4', name: 'Dra. Advogada Santos', documentNumber: 'OAB/RJ 54321', partyType: 'ADVOGADO_REU' },
    { id: 'party-5', name: 'Meta Metais Ltda', documentNumber: '98.765.432/0001-11', partyType: 'AUTOR' },
    { id: 'party-6', name: 'Banco Fictício S.A.', documentNumber: '11.222.333/0001-44', partyType: 'REU' },
];

export const sampleJudicialProcesses: JudicialProcess[] = [
    { 
        id: 'proc-1', publicId: 'PROC-12345-2024', processNumber: '0012345-67.2024.8.26.0001', isElectronic: true, 
        courtId: 'court-tjsp', districtId: 'dist-sp-capital', branchId: 'branch-1', 
        parties: [sampleParties[0]!, sampleParties[1]!, sampleParties[2]!], 
        createdAt: new Date(), updatedAt: new Date()
    },
    { 
        id: 'proc-2', publicId: 'PROC-98765-2023', processNumber: '0098765-43.2023.8.19.0001', isElectronic: true,
        courtId: 'court-tjrj', districtId: 'dist-rj-capital', branchId: 'branch-2',
        parties: [sampleParties[0]!, sampleParties[3]!],
        createdAt: new Date(), updatedAt: new Date()
    },
     { 
        id: 'proc-3', publicId: 'PROC-55555-2022', processNumber: '0055555-22.2022.2.02.0015', isElectronic: true,
        courtId: 'court-trt2', districtId: 'dist-sp-sao-paulo-trt', branchId: 'branch-4',
        parties: [sampleParties[4]!, sampleParties[5]!],
        createdAt: new Date(), updatedAt: new Date()
    }
];

export const sampleBens: Bem[] = [
    { id: `bem-1`, publicId: `BEM-PUB-1`, title: `Mesa de Escritório em L`, judicialProcessId: 'proc-3', judicialProcessNumber: '0055555-22.2022.2.02.0015', status: 'DISPONIVEL', categoryId: 'cat-bens-diversos', evaluationValue: 350, imageUrl: 'https://placehold.co/600x400.png?text=Mesa', imageMediaId: 'media-desk-1', createdAt: new Date(), updatedAt: new Date() },
    { id: `bem-2`, publicId: `BEM-PUB-2`, title: `Cadeira de Escritório Giratória`, judicialProcessId: 'proc-3', judicialProcessNumber: '0055555-22.2022.2.02.0015', status: 'DISPONIVEL', categoryId: 'cat-bens-diversos', evaluationValue: 200, imageUrl: 'https://placehold.co/600x400.png?text=Cadeira', imageMediaId: 'media-chair-1', createdAt: new Date(), updatedAt: new Date() },
    { id: `bem-3`, publicId: `BEM-PUB-3`, title: `Veículo Fiat Uno 2010`, judicialProcessId: 'proc-1', judicialProcessNumber: '0012345-67.2024.8.26.0001', status: 'DISPONIVEL', categoryId: 'cat-veiculos', subcategoryId: 'subcat-veiculos-carros', evaluationValue: 12000, imageUrl: 'https://placehold.co/600x400.png?text=Fiat+Uno', imageMediaId: 'media-uno-1', createdAt: new Date(), updatedAt: new Date() },
    { id: `bem-4`, publicId: `BEM-PUB-4`, title: `Apartamento em Campinas`, judicialProcessId: 'proc-1', judicialProcessNumber: '0012345-67.2024.8.26.0001', status: 'DISPONIVEL', categoryId: 'cat-imoveis', subcategoryId: 'subcat-imoveis-apartamentos', evaluationValue: 280000, imageUrl: 'https://placehold.co/600x400.png?text=Apto+Campinas', imageMediaId: 'media-apt-campinas', createdAt: new Date(), updatedAt: new Date() },
    { id: `bem-5`, publicId: `BEM-PUB-5`, title: `Trator Valtra A950 4x4 2018`, judicialProcessId: undefined, status: 'DISPONIVEL', categoryId: 'cat-maquinas-e-equipamentos', subcategoryId: 'subcat-maquinas-agricolas', evaluationValue: 95000, imageUrl: 'https://placehold.co/600x400.png?text=Trator+Valtra', imageMediaId: 'media-trator-valtra', createdAt: new Date(), updatedAt: new Date() },
];

export const sampleLots: Lot[] = [];
export const sampleAuctions: Auction[] = [];

export const sampleDirectSaleOffers: DirectSaleOffer[] = [
    { id: 'ds-1', publicId: 'DS-PUB-1', title: 'Sofá Retrátil 3 Lugares', description: 'Sofá em suede cinza, em ótimo estado, pouco uso. Medidas: 2.20m x 1.10m.', imageUrl: 'https://placehold.co/800x600/64748b/ffffff/png?text=Sofa', offerType: 'BUY_NOW', price: 1200, category: 'Casa e Decoração', sellerName: 'João da Silva (Particular)', status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() },
    { id: 'ds-2', publicId: 'DS-PUB-2', title: 'Geladeira Brastemp Frost Free 400L', description: 'Geladeira com freezer, funcionando perfeitamente. Algumas marcas de uso na porta.', imageUrl: 'https://placehold.co/800x600/e2e8f0/000000/png?text=Geladeira', offerType: 'ACCEPTS_PROPOSALS', minimumOfferPrice: 800, category: 'Casa e Decoração', sellerName: 'Maria Oliveira (Particular)', status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() }
];

export const sampleBlogPosts: BlogPost[] = [
  { id: 'blog-1', slug: 'como-comprar-imovel-leilao', title: 'Guia Completo: Como Comprar seu Primeiro Imóvel em Leilão', content: '...', authorName: 'Equipe BidExpert', category: 'Dicas', isPublished: true, publishedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
  { id: 'blog-2', slug: 'leiloes-judiciais-vs-extrajudiciais', title: 'Leilões Judiciais vs. Extrajudiciais: Entenda as Diferenças', content: '...', authorName: 'Equipe BidExpert', category: 'Mercado', isPublished: true, publishedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
  { id: 'blog-3', slug: 'dicas-avaliar-veiculo-leilao', title: '5 Dicas para Avaliar um Veículo em Leilão', content: '...', authorName: 'Equipe BidExpert', category: 'Veículos', isPublished: true, publishedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
];

export const sampleNotifications: Notification[] = [
  { id: 'notif-1', userId: 'admin-bidexpert-platform-001', message: 'Seu lance de R$ 5.200 no lote "Fiat Toro 2019" foi superado.', link: '/dashboard/bids', isRead: false, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: 'notif-2', userId: 'admin-bidexpert-platform-001', message: 'Parabéns! Você arrematou o lote "Apartamento em Moema". Pagamento pendente.', link: '/dashboard/wins', isRead: false, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
  { id: 'notif-3', userId: 'admin-bidexpert-platform-001', message: 'Sua documentação foi aprovada! Você já pode dar lances.', link: '/dashboard/documents', isRead: true, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
];


// ==================================
// FINAL EXPORT OBJECT
// ==================================
export const sampleUserWins: UserWin[] = [];
export const sampleBids: BidInfo[] = [];
export const sampleLotQuestions: LotQuestion[] = [];
export const sampleLotReviews: Review[] = [];
export const sampleUserLotMaxBids: UserLotMaxBid[] = [];
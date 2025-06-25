// src/lib/sample-data.ts
import type { 
  Lot, LotCategory, Auction, AuctioneerProfileInfo, SellerProfileInfo, 
  StateInfo, CityInfo, UserProfileWithPermissions, Role, MediaItem, Subcategory,
  PlatformSettings, DirectSaleOffer, UserWin, UserBid, LotQuestion, Review, UserLotMaxBid 
} from '@/types';
import { slugify, getAuctionStatusText } from './sample-data-helpers';
import { v4 as uuidv4 } from 'uuid';

// ==================================
// MEDIA ITEMS
// ==================================
export const sampleMediaItems: MediaItem[] = [
  { id: 'media-car-1', fileName: 'ford-ka.jpg', uploadedAt: new Date(), mimeType: 'image/jpeg', sizeBytes: 120000, urlOriginal: 'https://placehold.co/800x600.png?text=Ford+Ka', dataAiHint: 'carro ford ka' },
  { id: 'media-moto-1', fileName: 'honda-cg.jpg', uploadedAt: new Date(), mimeType: 'image/jpeg', sizeBytes: 110000, urlOriginal: 'https://placehold.co/800x600.png?text=Honda+CG', dataAiHint: 'moto honda' },
  { id: 'media-apt-1', fileName: 'apartamento-sp.jpg', uploadedAt: new Date(), mimeType: 'image/jpeg', sizeBytes: 150000, urlOriginal: 'https://placehold.co/800x600.png?text=Apto+SP', dataAiHint: 'apartamento sao paulo' },
  { id: 'media-house-1', fileName: 'casa-salvador.jpg', uploadedAt: new Date(), mimeType: 'image/jpeg', sizeBytes: 160000, urlOriginal: 'https://placehold.co/800x600.png?text=Casa+Salvador', dataAiHint: 'casa salvador' },
  { id: 'media-logo-bradesco', fileName: 'logo-bradesco.png', uploadedAt: new Date(), mimeType: 'image/png', sizeBytes: 15000, urlOriginal: 'https://placehold.co/100x100.png?text=B', dataAiHint: 'logo banco' },
  { id: 'media-logo-augusto', fileName: 'logo-augusto.png', uploadedAt: new Date(), mimeType: 'image/png', sizeBytes: 12000, urlOriginal: 'https://placehold.co/100x100.png?text=A', dataAiHint: 'logo leiloeiro' },
  { id: 'media-rolex', fileName: 'rolex.jpg', uploadedAt: new Date(), mimeType: 'image/jpeg', sizeBytes: 95000, urlOriginal: 'https://placehold.co/800x600.png?text=Relogio+Rolex', dataAiHint: 'relogio rolex' },
];

// ==================================
// ROLES & USERS
// ==================================
export const sampleRoles: Role[] = [
  { id: 'role-admin', name: 'ADMINISTRATOR', name_normalized: 'ADMINISTRATOR', description: 'Acesso total.', permissions: ['manage_all'], createdAt: new Date(), updatedAt: new Date() },
  { id: 'role-user', name: 'USER', name_normalized: 'USER', description: 'Usuário padrão.', permissions: ['view_auctions', 'place_bids', 'view_lots'], createdAt: new Date(), updatedAt: new Date() },
  { id: 'role-consignor', name: 'CONSIGNOR', name_normalized: 'CONSIGNOR', description: 'Comitente.', permissions: ['auctions:manage_own', 'lots:manage_own'], createdAt: new Date(), updatedAt: new Date() },
];

export const sampleUserProfiles: UserProfileWithPermissions[] = [
  { uid: 'admin-bidexpert-platform-001', email: 'admin@bidexpert.com.br', fullName: 'Admin BidExpert', roleId: 'role-admin', roleName: 'ADMINISTRATOR', permissions: ['manage_all'], habilitationStatus: 'HABILITADO', createdAt: new Date(), updatedAt: new Date(), password: '@dmin2025' },
  { uid: 'consignor-user-001', email: 'consignor@bidexpert.com', fullName: 'Comitente Exemplo', roleId: 'role-consignor', roleName: 'CONSIGNOR', permissions: ['auctions:manage_own', 'lots:manage_own'], habilitationStatus: 'HABILITADO', createdAt: new Date(), updatedAt: new Date(), sellerProfileId: 'seller-banco-bradesco-s-a' },
  { uid: 'regular-user-001', email: 'user@example.com', fullName: 'Usuário de Teste', roleId: 'role-user', roleName: 'USER', permissions: ['view_auctions', 'place_bids'], habilitationStatus: 'PENDENTE_DOCUMENTOS', createdAt: new Date(), updatedAt: new Date() },
];

// ==================================
// GEOGRAPHY
// ==================================
export const sampleStates: StateInfo[] = [
  { id: 'state-sp', name: 'São Paulo', uf: 'SP', slug: 'sao-paulo', cityCount: 2, createdAt: new Date(), updatedAt: new Date() },
  { id: 'state-ba', name: 'Bahia', uf: 'BA', slug: 'bahia', cityCount: 1, createdAt: new Date(), updatedAt: new Date() },
];

export const sampleCities: CityInfo[] = [
  { id: 'city-sp-sao-paulo', name: 'São Paulo', slug: 'sao-paulo', stateId: 'state-sp', stateUf: 'SP', lotCount: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 'city-sp-campinas', name: 'Campinas', slug: 'campinas', stateId: 'state-sp', stateUf: 'SP', lotCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'city-ba-salvador', name: 'Salvador', slug: 'salvador', stateId: 'state-ba', stateUf: 'BA', lotCount: 1, createdAt: new Date(), updatedAt: new Date() },
];

// ==================================
// ENTITIES
// ==================================
export const sampleAuctioneers: AuctioneerProfileInfo[] = [
  { id: 'auct-augusto-leiloeiro', publicId: 'AUCT-PUB-1', name: 'Augusto Leiloeiro', slug: 'augusto-leiloeiro', logoMediaId: 'media-logo-augusto', createdAt: new Date(), updatedAt: new Date() },
];

export const sampleSellers: SellerProfileInfo[] = [
  { id: 'seller-banco-bradesco-s-a', publicId: 'SELL-PUB-1', name: 'Banco Bradesco S.A.', slug: 'banco-bradesco-s-a', logoMediaId: 'media-logo-bradesco', city: 'São Paulo', state: 'SP', createdAt: new Date(), updatedAt: new Date() },
];

export const sampleLotCategories: LotCategory[] = [
  { id: 'cat-imoveis', name: 'Imóveis', slug: 'imoveis', hasSubcategories: true, itemCount: 2, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat-veiculos', name: 'Veículos', slug: 'veiculos', hasSubcategories: true, itemCount: 2, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat-arte', name: 'Arte e Antiguidades', slug: 'arte-e-antiguidades', hasSubcategories: false, itemCount: 1, createdAt: new Date(), updatedAt: new Date() },
];

export const sampleSubcategories: Subcategory[] = [
  { id: 'subcat-imoveis-apartamentos', name: 'Apartamentos', slug: 'apartamentos', parentCategoryId: 'cat-imoveis', itemCount: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 'subcat-imoveis-casas', name: 'Casas', slug: 'casas', parentCategoryId: 'cat-imoveis', itemCount: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 'subcat-veiculos-carros', name: 'Carros', slug: 'carros', parentCategoryId: 'cat-veiculos', itemCount: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 'subcat-veiculos-motos', name: 'Motos', slug: 'motos', parentCategoryId: 'cat-veiculos', itemCount: 1, createdAt: new Date(), updatedAt: new Date() },
];

// ==================================
// CORE DATA
// ==================================
export const sampleAuctions: Auction[] = [
  { id: 'auc-1', publicId: 'AUC-PUB-XYZ', title: 'Leilão de Veículos Recuperados - Bradesco', status: 'ABERTO_PARA_LANCES', categoryId: 'cat-veiculos', category: 'Veículos', auctioneerId: 'auct-augusto-leiloeiro', auctioneer: 'Augusto Leiloeiro', sellerId: 'seller-banco-bradesco-s-a', seller: 'Banco Bradesco S.A.', auctionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), createdAt: new Date(), updatedAt: new Date() },
  { id: 'auc-2', publicId: 'AUC-PUB-ABC', title: 'Grande Leilão de Imóveis Residenciais', status: 'EM_BREVE', categoryId: 'cat-imoveis', category: 'Imóveis', auctioneerId: 'auct-augusto-leiloeiro', auctioneer: 'Augusto Leiloeiro', sellerId: 'seller-banco-bradesco-s-a', seller: 'Banco Bradesco S.A.', auctionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), createdAt: new Date(), updatedAt: new Date() },
];

export const sampleLots: Lot[] = [
  { id: 'lot-1', publicId: 'LOT-PUB-001', auctionId: 'auc-1', title: 'Ford Ka 2019 1.0', number: '001', imageUrl: 'https://placehold.co/800x600.png?text=Ford+Ka', imageMediaId: 'media-car-1', status: 'ABERTO_PARA_LANCES', categoryId: 'cat-veiculos', type: 'Veículos', subcategoryId: 'subcat-veiculos-carros', subcategoryName: 'Carros', cityId: 'city-sp-sao-paulo', cityName: 'São Paulo', stateUf: 'SP', price: 25000, bidsCount: 5, endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
  { id: 'lot-2', publicId: 'LOT-PUB-002', auctionId: 'auc-1', title: 'Honda CG 160 2022', number: '002', imageUrl: 'https://placehold.co/800x600.png?text=Honda+CG', imageMediaId: 'media-moto-1', status: 'ABERTO_PARA_LANCES', categoryId: 'cat-veiculos', type: 'Veículos', subcategoryId: 'subcat-veiculos-motos', subcategoryName: 'Motos', cityId: 'city-sp-campinas', cityName: 'Campinas', stateUf: 'SP', price: 12000, bidsCount: 2, endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
  { id: 'lot-3', publicId: 'LOT-PUB-003', auctionId: 'auc-2', title: 'Apartamento 2 Quartos - São Paulo', number: '001', imageUrl: 'https://placehold.co/800x600.png?text=Apto+SP', imageMediaId: 'media-apt-1', status: 'EM_BREVE', categoryId: 'cat-imoveis', type: 'Imóveis', subcategoryId: 'subcat-imoveis-apartamentos', subcategoryName: 'Apartamentos', cityId: 'city-sp-sao-paulo', cityName: 'São Paulo', stateUf: 'SP', price: 350000, endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
  { id: 'lot-4', publicId: 'LOT-PUB-004', auctionId: 'auc-2', title: 'Casa 3 Quartos com Piscina - Salvador', number: '002', imageUrl: 'https://placehold.co/800x600.png?text=Casa+Salvador', imageMediaId: 'media-house-1', status: 'EM_BREVE', categoryId: 'cat-imoveis', type: 'Imóveis', subcategoryId: 'subcat-imoveis-casas', subcategoryName: 'Casas', cityId: 'city-ba-salvador', cityName: 'Salvador', stateUf: 'BA', price: 500000, endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
  { id: 'lot-5', publicId: 'LOT-PUB-005', auctionId: 'auc-1', title: 'Relógio Rolex Antigo', number: '003', imageUrl: 'https://placehold.co/800x600.png?text=Relogio+Rolex', imageMediaId: 'media-rolex', status: 'ABERTO_PARA_LANCES', categoryId: 'cat-arte', type: 'Arte e Antiguidades', price: 15000, bidsCount: 8, endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) },
];

// ==================================
// INTERACTION DATA (can be empty)
// ==================================
export const sampleDirectSaleOffers: DirectSaleOffer[] = [];
export const sampleUserWins: UserWin[] = [];
export const sampleBids: BidInfo[] = [];
export const sampleUserLotMaxBids: UserLotMaxBid[] = [];
export const sampleLotQuestions: LotQuestion[] = [];
export const sampleLotReviews: Review[] = [];

// ==================================
// PLATFORM SETTINGS
// ==================================
export const samplePlatformSettings: PlatformSettings = {
  id: 'global',
  siteTitle: 'BidExpert',
  siteTagline: 'Sua Plataforma de Leilões Especializada',
  galleryImageBasePath: '/media/gallery/',
  storageProvider: 'local',
  updatedAt: new Date(),
  mapSettings: { defaultProvider: 'openstreetmap' },
  searchPaginationType: 'loadMore',
  searchItemsPerPage: 12,
  searchLoadMoreCount: 12,
  showCountdownOnCards: true,
  showCountdownOnLotDetail: true,
  showRelatedLotsOnLotDetail: true,
  relatedLotsCount: 5,
  mentalTriggerSettings: {
    showDiscountBadge: true,
    showUrgencyTimer: true,
    urgencyTimerThresholdDays: 2,
    urgencyTimerThresholdHours: 0,
    showPopularityBadge: true,
    popularityViewThreshold: 100,
    showHotBidBadge: true,
    hotBidThreshold: 10,
    showExclusiveBadge: true
  },
  sectionBadgeVisibility: {
    featuredLots: { showDiscountBadge: true, showPopularityBadge: true },
    searchGrid: { showDiscountBadge: true, showUrgencyTimer: true },
    searchList: { showDiscountBadge: true, showUrgencyTimer: true, showPopularityBadge: true, showHotBidBadge: true },
    lotDetail: { showDiscountBadge: true, showUrgencyTimer: true, showPopularityBadge: true, showHotBidBadge: true, showExclusiveBadge: true },
  }
};

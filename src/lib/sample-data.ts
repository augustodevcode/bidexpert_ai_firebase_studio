// src/lib/sample-data.ts
import type {
  Lot, LotCategory, Auction, AuctioneerProfileInfo, SellerProfileInfo,
  StateInfo, CityInfo, UserProfileWithPermissions, Role, MediaItem, Subcategory,
  PlatformSettings, DirectSaleOffer, UserWin, UserBid, LotQuestion, Review, UserLotMaxBid
} from '@/types';
import { slugify } from './sample-data-helpers';
import { v4 as uuidv4 } from 'uuid';
import { predefinedPermissions } from '@/app/admin/roles/role-form-schema';

// ==================================
// PURE HELPER FUNCTIONS
// ==================================
const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - 1 - min + 1)) + min;
const randomDate = (start: Date, end: Date): Date => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const BRAZIL_BOUNDS = { latMin: -33.7, latMax: 5.2, lonMin: -73.9, lonMax: -34.8 };
const randomCoord = (min: number, max: number): number => min + Math.random() * (max - min);


// ==================================
// BASE STATIC DATA
// ==================================
const sampleRolesData: Role[] = [
  { id: 'role-admin', name: 'ADMINISTRATOR', name_normalized: 'ADMINISTRATOR', description: 'Acesso total.', permissions: ['manage_all'], createdAt: new Date(), updatedAt: new Date() },
  { id: 'role-user', name: 'USER', name_normalized: 'USER', description: 'Usuário padrão.', permissions: ['view_auctions', 'place_bids', 'view_lots'], createdAt: new Date(), updatedAt: new Date() },
  { id: 'role-consignor', name: 'CONSIGNOR', name_normalized: 'CONSIGNOR', description: 'Comitente.', permissions: ['auctions:manage_own', 'lots:manage_own'], createdAt: new Date(), updatedAt: new Date() },
  { id: 'role-arrematante', name: 'ARREMATANTE', name_normalized: 'ARREMATANTE', description: 'Usuário que arrematou lotes.', permissions: ['view_wins', 'manage_payments', 'schedule_retrieval'], createdAt: new Date(), updatedAt: new Date() }
];

const sampleStatesData: StateInfo[] = [
  { id: 'state-sp', name: 'São Paulo', uf: 'SP', slug: 'sao-paulo', cityCount: 2, createdAt: new Date(), updatedAt: new Date() },
  { id: 'state-ba', name: 'Bahia', uf: 'BA', slug: 'bahia', cityCount: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 'state-rj', name: 'Rio de Janeiro', uf: 'RJ', slug: 'rio-de-janeiro', cityCount: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 'state-mg', name: 'Minas Gerais', uf: 'MG', slug: 'minas-gerais', cityCount: 1, createdAt: new Date(), updatedAt: new Date() },
];

const sampleCitiesData: CityInfo[] = [
  { id: 'city-sp-sao-paulo', name: 'São Paulo', slug: 'sao-paulo', stateId: 'state-sp', stateUf: 'SP', lotCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'city-sp-campinas', name: 'Campinas', slug: 'campinas', stateId: 'state-sp', stateUf: 'SP', lotCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'city-ba-salvador', name: 'Salvador', slug: 'salvador', stateId: 'state-ba', stateUf: 'BA', lotCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'city-rj-rio', name: 'Rio de Janeiro', slug: 'rio-de-janeiro', stateId: 'state-rj', stateUf: 'RJ', lotCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'city-mg-bh', name: 'Belo Horizonte', slug: 'belo-horizonte', stateId: 'state-mg', stateUf: 'MG', lotCount: 0, createdAt: new Date(), updatedAt: new Date() },
];

const sampleAuctioneersData: AuctioneerProfileInfo[] = [
  { id: 'auct-augusto-leiloeiro', publicId: 'AUCT-PUB-1', name: 'Augusto Leiloeiro', slug: 'augusto-leiloeiro', logoUrl: 'https://placehold.co/100x100.png?text=A', city: 'São Paulo', state: 'SP', createdAt: new Date(), updatedAt: new Date(), userId: 'admin-bidexpert-platform-001' },
  { id: 'auct-sodre-santoro', publicId: 'AUCT-PUB-2', name: 'Sodré Santoro', slug: 'sodre-santoro', logoUrl: 'https://placehold.co/100x100.png?text=SS', city: 'São Paulo', state: 'SP', createdAt: new Date(), updatedAt: new Date() },
];

const sampleSellersData: SellerProfileInfo[] = [
  { id: 'seller-banco-bradesco-s-a', publicId: 'SELL-PUB-1', name: 'Banco Bradesco S.A.', slug: 'banco-bradesco-s-a', logoUrl: 'https://placehold.co/100x100.png?text=B', city: 'São Paulo', state: 'SP', createdAt: new Date(), updatedAt: new Date() },
  { id: 'seller-itau-unibanco', publicId: 'SELL-PUB-2', name: 'Itaú Unibanco', slug: 'itau-unibanco', logoUrl: 'https://placehold.co/100x100.png?text=I', city: 'São Paulo', state: 'SP', createdAt: new Date(), updatedAt: new Date() },
];

const sampleLotCategoriesData: LotCategory[] = [
  { id: 'cat-imoveis', name: 'Imóveis', slug: 'imoveis', hasSubcategories: true, itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat-veiculos', name: 'Veículos', slug: 'veiculos', hasSubcategories: true, itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat-maquinas', name: 'Máquinas e Equipamentos', slug: 'maquinas-e-equipamentos', hasSubcategories: true, itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat-arte', name: 'Arte e Antiguidades', slug: 'arte-e-antiguidades', hasSubcategories: false, itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
];

const sampleSubcategoriesData: Subcategory[] = [
  { id: 'subcat-imoveis-apartamentos', name: 'Apartamentos', slug: 'apartamentos', parentCategoryId: 'cat-imoveis', itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'subcat-imoveis-casas', name: 'Casas', slug: 'casas', parentCategoryId: 'cat-imoveis', itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'subcat-veiculos-carros', name: 'Carros', slug: 'carros', parentCategoryId: 'cat-veiculos', itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'subcat-veiculos-motos', name: 'Motos', slug: 'motos', parentCategoryId: 'cat-veiculos', itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'subcat-maquinas-agricolas', name: 'Máquinas Agrícolas', slug: 'maquinas-agricolas', parentCategoryId: 'cat-maquinas', itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
];

const sampleMediaItemsData: MediaItem[] = [
  { id: 'media-car-1', fileName: 'ford-ka.jpg', uploadedAt: new Date(), mimeType: 'image/jpeg', sizeBytes: 120000, urlOriginal: 'https://placehold.co/800x600.png?text=Ford+Ka', dataAiHint: 'carro ford ka' },
  { id: 'media-moto-1', fileName: 'honda-cg.jpg', uploadedAt: new Date(), mimeType: 'image/jpeg', sizeBytes: 110000, urlOriginal: 'https://placehold.co/800x600.png?text=Honda+CG', dataAiHint: 'moto honda' },
  { id: 'media-apt-1', fileName: 'apartamento-sp.jpg', uploadedAt: new Date(), mimeType: 'image/jpeg', sizeBytes: 150000, urlOriginal: 'https://placehold.co/800x600.png?text=Apto+SP', dataAiHint: 'apartamento sao paulo' },
  { id: 'media-house-1', fileName: 'casa-salvador.jpg', uploadedAt: new Date(), mimeType: 'image/jpeg', sizeBytes: 160000, urlOriginal: 'https://placehold.co/800x600.png?text=Casa+Salvador', dataAiHint: 'casa salvador' },
];

const fictionalBidders: UserProfileWithPermissions[] = Array.from({ length: 15 }, (_, i) => {
    const userRole = sampleRolesData.find(r => r.name === 'USER');
    return {
        uid: `bidder-${i + 1}`,
        email: `licitante${i + 1}@bidexpert.com.br`,
        fullName: `Licitante Fictício ${i + 1}`,
        roleId: userRole?.id || 'role-user',
        roleName: userRole?.name || 'USER',
        permissions: userRole?.permissions || [],
        habilitationStatus: 'HABILITADO',
        createdAt: new Date(),
        updatedAt: new Date(),
    };
});

const sampleUserProfilesData: UserProfileWithPermissions[] = [
  { uid: 'admin-bidexpert-platform-001', email: 'admin@bidexpert.com.br', fullName: 'Admin BidExpert', roleId: 'role-admin', roleName: 'ADMINISTRATOR', permissions: ['manage_all'], habilitationStatus: 'HABILITADO', createdAt: new Date(), updatedAt: new Date(), password: '@dmin2025' },
  { uid: 'consignor-user-001', email: 'consignor@bidexpert.com', fullName: 'Comitente Exemplo', roleId: 'role-consignor', roleName: 'CONSIGNOR', permissions: ['auctions:manage_own', 'lots:manage_own'], habilitationStatus: 'HABILITADO', createdAt: new Date(), updatedAt: new Date(), sellerProfileId: 'seller-banco-bradesco-s-a' },
  ...fictionalBidders
];

// ==================================
// DYNAMIC DATA GENERATION
// ==================================
const generatedAuctions: Auction[] = [];
const generatedLots: Lot[] = [];
const generatedBids: BidInfo[] = [];
const generatedUserWins: UserWin[] = [];
let auctionCounter = 1;
let lotCounter = 1;

const auctionTypes: Auction['auctionType'][] = ['JUDICIAL', 'EXTRAJUDICIAL', 'PARTICULAR', 'TOMADA_DE_PRECOS'];

auctionTypes.forEach(type => {
  for (let i = 1; i <= 10; i++) {
    const startOffsetDays = randomInt(-20, 20);
    const startDate = new Date(Date.now() + startOffsetDays * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + randomInt(5, 15) * 24 * 60 * 60 * 1000);
    const status = startDate > new Date() ? 'EM_BREVE' : (endDate < new Date() ? 'ENCERRADO' : 'ABERTO_PARA_LANCES');
    const selectedCategory = randomItem(sampleLotCategoriesData);
    const auctioneer = randomItem(sampleAuctioneersData);
    const seller = randomItem(sampleSellersData);
    const auctionId = `auc-${auctionCounter++}`;
    const city = randomItem(sampleCitiesData);

    const auction: Auction = {
      id: auctionId, publicId: `AUC-PUB-${auctionId}`,
      title: `Leilão ${type.replace(/_/g, ' ')} de ${selectedCategory.name} #${i}`,
      status: status, auctionType: type, categoryId: selectedCategory.id, category: selectedCategory.name,
      auctioneerId: auctioneer.id, auctioneer: auctioneer.name, sellerId: seller.id, seller: seller.name,
      city: city.name, state: city.stateUf, auctionDate: startDate, endDate: endDate,
      latitude: randomCoord(BRAZIL_BOUNDS.latMin, BRAZIL_BOUNDS.latMax),
      longitude: randomCoord(BRAZIL_BOUNDS.lonMin, BRAZIL_BOUNDS.lonMax),
      createdAt: new Date(), updatedAt: new Date(), totalLots: 0,
      initialOffer: randomInt(50000, 200000), visits: randomInt(100, 2000),
      isFeaturedOnMarketplace: Math.random() > 0.8, lots: []
    };
    generatedAuctions.push(auction);

    const numLots = randomInt(2, 10);
    auction.totalLots = numLots;
    for (let j = 1; j <= numLots; j++) {
      const lotId = `lot-${lotCounter++}`;
      const possibleSubcats = sampleSubcategoriesData.filter(sc => sc.parentCategoryId === auction.categoryId);
      const selectedSubcat = possibleSubcats.length > 0 ? randomItem(possibleSubcats) : null;
      const media = randomItem(sampleMediaItemsData);
      const lotEndDate = new Date(auction.endDate!.getTime() - randomInt(0, 2) * 24 * 60 * 60 * 1000);
      const lotStatus = auction.status === 'EM_BREVE' ? 'EM_BREVE' : (lotEndDate < new Date() ? 'ENCERRADO' : 'ABERTO_PARA_LANCES');
      const initialPrice = randomInt(1000, 50000);
      let currentPrice = initialPrice;
      let bidsCount = 0;
      let winner: UserProfileWithPermissions | null = null;

      if (lotStatus !== 'EM_BREVE') {
        const numBids = randomInt(0, 25);
        for (let k = 0; k < numBids; k++) {
          const bidder = randomItem(fictionalBidders);
          currentPrice += randomInt(100, 1000);
          generatedBids.push({ id: `bid-${lotId}-${k}`, lotId: lotId, auctionId: auction.id, bidderId: bidder.uid, bidderDisplay: bidder.fullName!, amount: currentPrice, timestamp: new Date(lotEndDate.getTime() - randomInt(10, 300) * 60 * 1000) });
          winner = bidder; // Last bidder is potential winner
        }
        bidsCount = numBids;
      }

      const finalLotStatus = lotStatus === 'ENCERRADO' && bidsCount > 0 ? 'VENDIDO' : (lotStatus === 'ENCERRADO' ? 'NAO_VENDIDO' : lotStatus);
      if (finalLotStatus === 'VENDIDO' && winner) {
        const arrematanteRole = sampleRolesData.find(r => r.name === 'ARREMATANTE');
        generatedUserWins.push({ id: `win-${lotId}`, lot: {} as Lot, // Will be populated later
            userId: winner.uid, winningBidAmount: currentPrice, winDate: lotEndDate, paymentStatus: 'PENDENTE'
        });
        // Update user role in main list
        const winnerIndex = sampleUserProfilesData.findIndex(u => u.uid === winner!.uid);
        if (winnerIndex > -1 && arrematanteRole) {
            sampleUserProfilesData[winnerIndex].roleId = arrematanteRole.id;
            sampleUserProfilesData[winnerIndex].roleName = arrematanteRole.name;
            sampleUserProfilesData[winnerIndex].permissions = arrematanteRole.permissions;
        }
      }

      const lot: Lot = {
        id: lotId, publicId: `LOT-PUB-${lotId}`, auctionId: auction.id,
        title: `Item ${selectedSubcat ? selectedSubcat.name : selectedCategory.name} - Lote ${j}`,
        number: `${j}`, imageUrl: media.urlOriginal, imageMediaId: media.id,
        status: finalLotStatus, categoryId: selectedCategory.id, type: selectedCategory.name,
        subcategoryId: selectedSubcat?.id, subcategoryName: selectedSubcat?.name,
        price: currentPrice, bidsCount: bidsCount, endDate: lotEndDate,
        latitude: (auction.latitude || 0) + (Math.random() - 0.5) * 0.5,
        longitude: (auction.longitude || 0) + (Math.random() - 0.5) * 0.5,
        views: randomInt(50, 1000), cityName: city.name, stateUf: city.stateUf,
        isFeatured: Math.random() > 0.85, initialPrice: initialPrice,
        auctionName: auction.title,
      };
      generatedLots.push(lot);
      auction.lots!.push(lot);
    }
  }
});

// Post-process UserWins to include full lot object
generatedUserWins.forEach(win => {
    const lotData = generatedLots.find(l => l.id === win.id.replace('win-', ''));
    if (lotData) {
        win.lot = lotData;
    }
});


// ==================================
// EXPORT FINAL DATA
// ==================================
export const sampleRoles: Role[] = sampleRolesData;
export const sampleStates: StateInfo[] = sampleStatesData;
export const sampleCities: CityInfo[] = sampleCitiesData;
export const sampleAuctioneers: AuctioneerProfileInfo[] = sampleAuctioneersData;
export const sampleSellers: SellerProfileInfo[] = sampleSellersData;
export const sampleLotCategories: LotCategory[] = sampleLotCategoriesData;
export const sampleSubcategories: Subcategory[] = sampleSubcategoriesData;
export const sampleMediaItems: MediaItem[] = sampleMediaItemsData;
export const sampleAuctions: Auction[] = generatedAuctions;
export const sampleLots: Lot[] = generatedLots;
export const sampleBids: BidInfo[] = generatedBids;
export const sampleUserWins: UserWin[] = generatedUserWins;
export const sampleLotQuestions: LotQuestion[] = [];
export const sampleLotReviews: Review[] = [];
export const sampleUserLotMaxBids: UserLotMaxBid[] = [];
export const sampleUserProfiles: UserProfileWithPermissions[] = sampleUserProfilesData;
export const sampleDirectSaleOffers: DirectSaleOffer[] = [];
export const samplePlatformSettings: PlatformSettings = {
  id: 'global', siteTitle: 'BidExpert', siteTagline: 'Sua Plataforma de Leilões Especializada',
  galleryImageBasePath: '/media/gallery/', storageProvider: 'local', updatedAt: new Date(),
  mapSettings: { defaultProvider: 'openstreetmap' }, searchPaginationType: 'loadMore',
  searchItemsPerPage: 12, searchLoadMoreCount: 12,
  showCountdownOnCards: true, showCountdownOnLotDetail: true,
  showRelatedLotsOnLotDetail: true, relatedLotsCount: 5,
  mentalTriggerSettings: {
    showDiscountBadge: true, showUrgencyTimer: true, urgencyTimerThresholdDays: 2, urgencyTimerThresholdHours: 0,
    showPopularityBadge: true, popularityViewThreshold: 100, showHotBidBadge: true, hotBidThreshold: 10, showExclusiveBadge: true
  },
  sectionBadgeVisibility: {
    featuredLots: { showDiscountBadge: true, showPopularityBadge: true },
    searchGrid: { showDiscountBadge: true, showUrgencyTimer: true },
    searchList: { showDiscountBadge: true, showUrgencyTimer: true, showPopularityBadge: true, showHotBidBadge: true },
    lotDetail: { showDiscountBadge: true, showUrgencyTimer: true, showPopularityBadge: true, showHotBidBadge: true, showExclusiveBadge: true },
  }
};

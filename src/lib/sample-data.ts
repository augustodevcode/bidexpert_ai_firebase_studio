
// src/lib/sample-data.ts
import type { 
  Lot, LotCategory, Auction, AuctioneerProfileInfo, SellerProfileInfo, 
  StateInfo, CityInfo, UserProfileWithPermissions, Role, MediaItem, Subcategory,
  PlatformSettings, DirectSaleOffer, UserWin, UserBid, LotQuestion, Review, UserLotMaxBid 
} from '@/types';
import { slugify } from './sample-data-helpers';
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
  { id: 'media-caminhao-1', fileName: 'caminhao-volvo.jpg', uploadedAt: new Date(), mimeType: 'image/jpeg', sizeBytes: 180000, urlOriginal: 'https://placehold.co/800x600.png?text=Caminhao+Volvo', dataAiHint: 'caminhao volvo' },
  { id: 'media-maquina-1', fileName: 'trator-case.jpg', uploadedAt: new Date(), mimeType: 'image/jpeg', sizeBytes: 200000, urlOriginal: 'https://placehold.co/800x600.png?text=Trator+Case', dataAiHint: 'trator case' },
  { id: 'media-arte-1', fileName: 'quadro-abstrato.jpg', uploadedAt: new Date(), mimeType: 'image/jpeg', sizeBytes: 130000, urlOriginal: 'https://placehold.co/800x600.png?text=Quadro+Abstrato', dataAiHint: 'quadro abstrato' },
  { id: 'media-joia-1', fileName: 'colar-diamantes.jpg', uploadedAt: new Date(), mimeType: 'image/jpeg', sizeBytes: 80000, urlOriginal: 'https://placehold.co/800x600.png?text=Colar+Diamantes', dataAiHint: 'colar diamantes' },
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
  { uid: 'user1', email: 'joao.silva@example.com', fullName: 'João Silva', roleId: 'role-user', roleName: 'USER', permissions: ['view_auctions', 'place_bids'], habilitationStatus: 'HABILITADO', createdAt: new Date(), updatedAt: new Date() },
  { uid: 'user2', email: 'maria.santos@example.com', fullName: 'Maria Santos', roleId: 'role-user', roleName: 'USER', permissions: ['view_auctions', 'place_bids'], habilitationStatus: 'PENDENTE_DOCUMENTOS', createdAt: new Date(), updatedAt: new Date() },
];

// ==================================
// GEOGRAPHY
// ==================================
export const sampleStates: StateInfo[] = [
  { id: 'state-sp', name: 'São Paulo', uf: 'SP', slug: 'sao-paulo', cityCount: 2, createdAt: new Date(), updatedAt: new Date() },
  { id: 'state-ba', name: 'Bahia', uf: 'BA', slug: 'bahia', cityCount: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 'state-rj', name: 'Rio de Janeiro', uf: 'RJ', slug: 'rio-de-janeiro', cityCount: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 'state-mg', name: 'Minas Gerais', uf: 'MG', slug: 'minas-gerais', cityCount: 1, createdAt: new Date(), updatedAt: new Date() },
];

export const sampleCities: CityInfo[] = [
  { id: 'city-sp-sao-paulo', name: 'São Paulo', slug: 'sao-paulo', stateId: 'state-sp', stateUf: 'SP', lotCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'city-sp-campinas', name: 'Campinas', slug: 'campinas', stateId: 'state-sp', stateUf: 'SP', lotCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'city-ba-salvador', name: 'Salvador', slug: 'salvador', stateId: 'state-ba', stateUf: 'BA', lotCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'city-rj-rio', name: 'Rio de Janeiro', slug: 'rio-de-janeiro', stateId: 'state-rj', stateUf: 'RJ', lotCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'city-mg-bh', name: 'Belo Horizonte', slug: 'belo-horizonte', stateId: 'state-mg', stateUf: 'MG', lotCount: 0, createdAt: new Date(), updatedAt: new Date() },
];

// ==================================
// ENTITIES
// ==================================
export const sampleAuctioneers: AuctioneerProfileInfo[] = [
  { id: 'auct-augusto-leiloeiro', publicId: 'AUCT-PUB-1', name: 'Augusto Leiloeiro', slug: 'augusto-leiloeiro', logoUrl: 'https://placehold.co/100x100.png?text=A', city: 'São Paulo', state: 'SP', createdAt: new Date(), updatedAt: new Date() },
  { id: 'auct-sodre-santoro', publicId: 'AUCT-PUB-2', name: 'Sodré Santoro', slug: 'sodre-santoro', logoUrl: 'https://placehold.co/100x100.png?text=SS', city: 'São Paulo', state: 'SP', createdAt: new Date(), updatedAt: new Date() },
];

export const sampleSellers: SellerProfileInfo[] = [
  { id: 'seller-banco-bradesco-s-a', publicId: 'SELL-PUB-1', name: 'Banco Bradesco S.A.', slug: 'banco-bradesco-s-a', logoUrl: 'https://placehold.co/100x100.png?text=B', city: 'São Paulo', state: 'SP', createdAt: new Date(), updatedAt: new Date() },
  { id: 'seller-itau-unibanco', publicId: 'SELL-PUB-2', name: 'Itaú Unibanco', slug: 'itau-unibanco', logoUrl: 'https://placehold.co/100x100.png?text=I', city: 'São Paulo', state: 'SP', createdAt: new Date(), updatedAt: new Date() },
];

export const sampleLotCategories: LotCategory[] = [
  { id: 'cat-imoveis', name: 'Imóveis', slug: 'imoveis', hasSubcategories: true, itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat-veiculos', name: 'Veículos', slug: 'veiculos', hasSubcategories: true, itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat-maquinas', name: 'Máquinas e Equipamentos', slug: 'maquinas-e-equipamentos', hasSubcategories: true, itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat-arte', name: 'Arte e Antiguidades', slug: 'arte-e-antiguidades', hasSubcategories: false, itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
];

export const sampleSubcategories: Subcategory[] = [
  { id: 'subcat-imoveis-apartamentos', name: 'Apartamentos', slug: 'apartamentos', parentCategoryId: 'cat-imoveis', itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'subcat-imoveis-casas', name: 'Casas', slug: 'casas', parentCategoryId: 'cat-imoveis', itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'subcat-veiculos-carros', name: 'Carros', slug: 'carros', parentCategoryId: 'cat-veiculos', itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'subcat-veiculos-motos', name: 'Motos', slug: 'motos', parentCategoryId: 'cat-veiculos', itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'subcat-maquinas-agricolas', name: 'Máquinas Agrícolas', slug: 'maquinas-agricolas', parentCategoryId: 'cat-maquinas', itemCount: 0, createdAt: new Date(), updatedAt: new Date() },
];


// ==================================
// DATA GENERATION HELPERS
// ==================================
const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start: Date, end: Date): Date => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// ==================================
// GENERATED DATA
// ==================================
const generatedAuctions: Auction[] = [];
const generatedLots: Lot[] = [];
const generatedBids: BidInfo[] = [];
const generatedQuestions: LotQuestion[] = [];
const generatedReviews: Review[] = [];
const generatedDirectSales: DirectSaleOffer[] = [];
let auctionCounter = 1;
let lotCounter = 1;

const auctionTypes: Auction['auctionType'][] = ['JUDICIAL', 'EXTRAJUDICIAL', 'PARTICULAR', 'TOMADA_DE_PRECOS'];

for (const type of auctionTypes) {
    for (let i = 1; i <= 10; i++) {
        const startOffsetDays = randomInt(-20, 20);
        const startDate = new Date(Date.now() + startOffsetDays * 24 * 60 * 60 * 1000);
        const endDate = new Date(startDate.getTime() + randomInt(5, 15) * 24 * 60 * 60 * 1000);
        const status = startDate > new Date() ? 'EM_BREVE' : (endDate < new Date() ? 'ENCERRADO' : 'ABERTO_PARA_LANCES');
        const selectedCategory = randomItem(sampleLotCategories);
        const auctioneer = randomItem(sampleAuctioneers);
        const seller = randomItem(sampleSellers);
        const auctionId = `auc-${auctionCounter++}`;
        const city = randomItem(sampleCities);

        const auction: Auction = {
            id: auctionId,
            publicId: `AUC-PUB-${auctionId}`,
            title: `Leilão ${type.replace(/_/g, ' ')} de ${selectedCategory.name} #${i}`,
            status: status,
            auctionType: type,
            categoryId: selectedCategory.id,
            category: selectedCategory.name,
            auctioneerId: auctioneer.id,
            auctioneer: auctioneer.name,
            sellerId: seller.id,
            seller: seller.name,
            city: city.name,
            state: city.stateUf,
            auctionDate: startDate,
            endDate: endDate,
            createdAt: new Date(),
            updatedAt: new Date(),
            totalLots: 0,
            initialOffer: randomInt(50000, 200000),
            visits: randomInt(100, 2000),
            isFeaturedOnMarketplace: Math.random() > 0.8,
            lots: []
        };
        generatedAuctions.push(auction);

        // Lot Generation for this Auction
        const numLots = randomInt(2, 10);
        auction.totalLots = numLots;
        for (let j = 1; j <= numLots; j++) {
            const lotId = `lot-${lotCounter++}`;
            const possibleSubcats = sampleSubcategories.filter(sc => sc.parentCategoryId === auction.categoryId);
            const selectedSubcat = possibleSubcats.length > 0 ? randomItem(possibleSubcats) : null;
            const media = randomItem(sampleMediaItems);
            const lotEndDate = new Date(auction.endDate!.getTime() - randomInt(0, 2) * 24 * 60 * 60 * 1000);
            const lotStatus = auction.status === 'EM_BREVE' ? 'EM_BREVE' : (lotEndDate < new Date() ? 'ENCERRADO' : 'ABERTO_PARA_LANCES');
            const initialPrice = randomInt(1000, 50000);
            let currentPrice = initialPrice;
            let numBids = 0;

            const lot: Lot = {
                id: lotId, publicId: `LOT-PUB-${lotId}`, auctionId: auction.id,
                title: `Item ${selectedSubcat ? selectedSubcat.name : selectedCategory.name} - Lote ${j}`,
                number: `${j}`, imageUrl: media.urlOriginal, imageMediaId: media.id,
                status: lotStatus, categoryId: selectedCategory.id, type: selectedCategory.name,
                subcategoryId: selectedSubcat?.id, subcategoryName: selectedSubcat?.name,
                price: currentPrice, bidsCount: numBids, endDate: lotEndDate,
                views: randomInt(50, 1000), cityName: city.name, stateUf: city.stateUf,
                isFeatured: Math.random() > 0.85
            };
            generatedLots.push(lot);
            auction.lots!.push(lot); // Add lot to auction object

            if (lotStatus !== 'EM_BREVE') {
                numBids = randomInt(0, 15);
                for (let k = 0; k < numBids; k++) {
                    const bidder = randomItem(sampleUserProfiles);
                    currentPrice += randomInt(100, 1000);
                    generatedBids.push({
                        id: `bid-${lotId}-${k}`, lotId: lotId, auctionId: auction.id,
                        bidderId: bidder.uid, bidderDisplay: bidder.fullName!, amount: currentPrice,
                        timestamp: new Date(lotEndDate.getTime() - randomInt(10, 300) * 60 * 1000)
                    });
                }
                lot.price = currentPrice;
                lot.bidsCount = numBids;
                if (lotStatus === 'ENCERRADO' && numBids > 0) lot.status = 'VENDIDO';
                else if (lotStatus === 'ENCERRADO' && numBids === 0) lot.status = 'NAO_VENDIDO';
            }

            if (Math.random() > 0.7) {
                generatedQuestions.push({
                    id: `qst-${lotId}`, lotId: lotId, auctionId: auction.id,
                    userId: randomItem(sampleUserProfiles).uid, userDisplayName: randomItem(sampleUserProfiles).fullName!,
                    questionText: `Qual o estado de conservação real deste item?`, createdAt: new Date(), isPublic: true,
                    ...(Math.random() > 0.5 && {
                        answerText: `O item está em bom estado, com marcas de uso normais.`, answeredAt: new Date(),
                        answeredByUserId: sampleAuctioneers[0].userId!, answeredByUserDisplayName: sampleAuctioneers[0].name
                    })
                });
            }
            if (lot.status === 'VENDIDO' && Math.random() > 0.5) {
                 generatedReviews.push({
                    id: `rev-${lotId}`, lotId: lotId, auctionId: auction.id,
                    userId: randomItem(sampleUserProfiles).uid, userDisplayName: randomItem(sampleUserProfiles).fullName!,
                    rating: randomInt(3, 5), comment: `Excelente compra, item conforme descrito! Recomendo.`, createdAt: new Date()
                 });
            }
        }
    }
}

for (let i = 1; i <= 10; i++) {
    const media = randomItem(sampleMediaItems);
    const category = randomItem(sampleLotCategories);
    const seller = randomItem(sampleSellers);
    const offerType = Math.random() > 0.5 ? 'BUY_NOW' : 'ACCEPTS_PROPOSALS';
    const city = randomItem(sampleCities);

    generatedDirectSales.push({
        id: `direct-${i}`, publicId: `DIRECT-PUB-${i}`,
        title: `Oferta de Venda Direta: ${category.name} #${i}`,
        description: `Descrição detalhada da oferta de venda direta para o item ${i}. Disponível para compra imediata ou proposta.`,
        imageUrl: media.urlOriginal, offerType: offerType,
        price: offerType === 'BUY_NOW' ? randomInt(500, 10000) : undefined,
        minimumOfferPrice: offerType === 'ACCEPTS_PROPOSALS' ? randomInt(400, 8000) : undefined,
        category: category.name, sellerName: seller.name, sellerId: seller.id,
        status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date(),
        locationCity: city.name, locationState: city.stateUf
    });
}

// Update counts
sampleLotCategories.forEach(cat => {
  cat.itemCount = generatedLots.filter(l => l.categoryId === cat.id).length;
});
sampleSubcategories.forEach(sub => {
  sub.itemCount = generatedLots.filter(l => l.subcategoryId === sub.id).length;
});
sampleStates.forEach(st => {
  st.cityCount = sampleCities.filter(c => c.stateId === st.id).length;
});
sampleCities.forEach(city => {
  city.lotCount = generatedLots.filter(l => l.cityId === city.id).length;
});


export const sampleAuctions: Auction[] = generatedAuctions;
export const sampleLots: Lot[] = generatedLots;
export const sampleBids: BidInfo[] = generatedBids;
export const sampleLotQuestions: LotQuestion[] = generatedQuestions;
export const sampleLotReviews: Review[] = generatedReviews;
export const sampleDirectSaleOffers: DirectSaleOffer[] = generatedDirectSales;
export const sampleUserLotMaxBids: UserLotMaxBid[] = [];
export const sampleUserWins: UserWin[] = [];
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

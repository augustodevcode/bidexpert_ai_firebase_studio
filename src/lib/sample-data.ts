
// src/lib/sample-data.ts
import type {
  Lot, LotCategory, Auction, AuctioneerProfileInfo, SellerProfileInfo,
  StateInfo, CityInfo, UserProfileWithPermissions, Role, MediaItem, Subcategory,
  PlatformSettings, DirectSaleOffer, UserWin, BidInfo, LotQuestion, Review, UserLotMaxBid, AuctionStage
} from '@/types';
import { slugify } from './sample-data-helpers';
import { v4 as uuidv4 } from 'uuid';
import { predefinedPermissions } from '@/app/admin/roles/role-form-schema';

// ==================================
// PURE HELPER FUNCTIONS
// ==================================
const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
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
];

export const sampleCities: CityInfo[] = [
  { id: 'city-sp-sao-paulo', name: 'São Paulo', slug: 'sao-paulo', stateId: 'state-sp', stateUf: 'SP', lotCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'city-sp-campinas', name: 'Campinas', slug: 'campinas', stateId: 'state-sp', stateUf: 'SP', lotCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'city-ba-salvador', name: 'Salvador', slug: 'salvador', stateId: 'state-ba', stateUf: 'BA', lotCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'city-rj-rio', name: 'Rio de Janeiro', slug: 'rio-de-janeiro', stateId: 'state-rj', stateUf: 'RJ', lotCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'city-mg-bh', name: 'Belo Horizonte', slug: 'belo-horizonte', stateId: 'state-mg', stateUf: 'MG', lotCount: 0, createdAt: new Date(), updatedAt: new Date() },
];

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  'sao-paulo': { lat: -23.5505, lon: -46.6333 }, 'campinas': { lat: -22.9099, lon: -47.0626 },
  'salvador': { lat: -12.9777, lon: -38.5016 }, 'rio-de-janeiro': { lat: -22.9068, lon: -43.1729 },
  'belo-horizonte': { lat: -19.9167, lon: -43.9345 },
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

// ==================================
// DYNAMIC DATA GENERATION
// ==================================
const generatedAuctions: Auction[] = [];
const generatedLots: Lot[] = [];
const sampleBids: BidInfo[] = []; // This will be populated and exported
const generatedUserWins: UserWin[] = [];
const generatedDirectSales: DirectSaleOffer[] = [];
const generatedQuestions: LotQuestion[] = [];
const generatedReviews: Review[] = [];
const now = new Date(); 

let auctionCounter = 1;
let lotCounter = 1;

const auctionTypes: Auction['auctionType'][] = ['JUDICIAL', 'EXTRAJUDICIAL', 'PARTICULAR', 'TOMADA_DE_PRECOS', 'DUTCH', 'SILENT'];

// Main generation loop for Auctions
auctionTypes.forEach(type => {
  for (let i = 1; i <= 3; i++) { // Create 3 auctions of each type
    const auctionStartDate = new Date(Date.now() + randomInt(-20, 20) * 24 * 60 * 60 * 1000);
    const firstStageEndDate = new Date(auctionStartDate.getTime() + randomInt(5, 10) * 24 * 60 * 60 * 1000);
    const secondStageEndDate = new Date(firstStageEndDate.getTime() + randomInt(2, 5) * 24 * 60 * 60 * 1000);
    
    const auctionStages: AuctionStage[] = [
        { name: '1ª Praça', endDate: firstStageEndDate, statusText: 'Encerramento' },
        { name: '2ª Praça', endDate: secondStageEndDate, statusText: 'Encerramento' }
    ];

    const selectedCategory = randomItem(sampleLotCategories);
    const auctioneer = randomItem(sampleAuctioneers);
    const seller = type === 'JUDICIAL' ? sampleSellers.find(s => s.slug === 'tjsp')! : randomItem(sampleSellers);
    const auctionId = `auc-${auctionCounter++}`;
    const city = randomItem(sampleCities);
    const cityCoords = CITY_COORDS[city.slug as keyof typeof CITY_COORDS] || { lat: -15.78, lon: -47.92 };

    const auction: Auction = {
      id: auctionId, publicId: `AUC-PUB-${auctionId}`,
      title: `Leilão ${type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} de ${selectedCategory.name} #${i}`,
      status: 'EM_BREVE', auctionType: type, categoryId: selectedCategory.id, category: selectedCategory.name,
      auctioneerId: auctioneer.id, auctioneer: auctioneer.name, sellerId: seller.id, seller: seller.name,
      city: city.name, state: city.stateUf, auctionDate: auctionStartDate, endDate: secondStageEndDate,
      auctionStages: auctionStages,
      latitude: cityCoords.lat, longitude: cityCoords.lon,
      createdAt: new Date(), updatedAt: new Date(), totalLots: 0,
      initialOffer: randomInt(10000, 100000), visits: randomInt(50, 1500),
      isFeaturedOnMarketplace: Math.random() > 0.8, lots: [],
      automaticBiddingEnabled: true,
      softCloseEnabled: true,
      softCloseMinutes: 2,
      autoRelistSettings: {
        enableAutoRelist: true,
        relistIfNoBids: true,
        relistIfNoBidsAfterHours: 2,
        relistDurationInHours: 72,
      },
    };
    
    if (type === 'DUTCH') {
        auction.decrementAmount = 1000;
        auction.decrementIntervalSeconds = 60;
        auction.floorPrice = 50000;
    }


    const numLots = randomInt(2, 5);
    auction.totalLots = numLots;

    for (let j = 1; j <= numLots; j++) {
      const lotId = `lot-${lotCounter++}`;
      const media = randomItem(sampleMediaItems);
      
      let lotStatus: LotStatus;
      let lotEndDate: Date = firstStageEndDate;
      if (now < auctionStartDate) lotStatus = 'EM_BREVE';
      else if (now >= auctionStartDate && now < secondStageEndDate) lotStatus = 'ABERTO_PARA_LANCES';
      else lotStatus = 'ENCERRADO';
      
      if (lotStatus === 'ABERTO_PARA_LANCES' && now >= firstStageEndDate) lotEndDate = secondStageEndDate;

      const lot: Lot = {
        id: lotId, publicId: `LOT-PUB-${lotId}`, auctionId: auction.id,
        title: `Item de ${selectedCategory.name} - ${lotId}`,
        number: `${lotCounter}`, imageUrl: media.urlOriginal, imageMediaId: media.id,
        status: lotStatus, categoryId: selectedCategory.id, type: selectedCategory.name,
        price: randomInt(500, 25000), bidsCount: 0, endDate: lotEndDate,
        latitude: randomCoord(cityCoords.lat, 0.05), longitude: randomCoord(cityCoords.lon, 0.05),
        mapAddress: `Rua Fictícia, ${randomInt(10, 500)}, ${city.name}`,
        views: randomInt(10, 500), isFeatured: Math.random() > 0.9, auctionName: auction.title,
        cityName: city.name, stateUf: city.stateUf
      };

      if (lot.status === 'ABERTO_PARA_LANCES') {
        const numBids = randomInt(0, 10);
        lot.bidsCount = numBids;
        for (let k = 0; k < numBids; k++) {
          lot.price += randomInt(50, 500);
          sampleBids.push({ id: `bid-${lotId}-${k}`, lotId: lotId, auctionId: auction.id, bidderId: `bidder-${k+1}`, bidderDisplay: `Licitante ${k+1}`, amount: lot.price, timestamp: new Date() });
        }
      }

      if (Math.random() > 0.7) { // 30% chance of having questions/reviews
        generatedQuestions.push({id: `q-${lotId}`, lotId: lotId, auctionId: auction.id, userId: 'user-2', userDisplayName: 'Joana S.', questionText: 'O produto vem na caixa original?', createdAt: new Date(), answerText: 'Sim, acompanha caixa e todos os acessórios originais.', answeredAt: new Date(), answeredByUserId: 'admin-1', answeredByUserDisplayName: seller.name, isPublic: true});
        generatedReviews.push({id: `r-${lotId}`, lotId: lotId, auctionId: auction.id, userId: 'user-3', userDisplayName: 'Carlos P.', rating: 5, comment: 'Excelente estado, como descrito. Recomendo!', createdAt: new Date()});
      }

      generatedLots.push(lot);
      auction.lots!.push(lot);
    }

    if (now >= secondStageEndDate) {
        auction.status = 'ENCERRADO';
    } else if (now >= auctionStartDate) {
        auction.status = 'ABERTO_PARA_LANCES';
    }
    
    generatedAuctions.push(auction);
  }
});

// Direct Sales Generation
for (let i = 1; i <= 8; i++) {
    const seller = randomItem(sampleSellers);
    const category = randomItem(sampleLotCategories);
    const media = randomItem(sampleMediaItems);
    const offer: DirectSaleOffer = {
        id: `dso-${i}`, publicId: `DSO-PUB-${i}`, title: `Oferta Direta: ${category.name} em Perfeito Estado`,
        description: `Descrição detalhada para a oferta de ${category.name}. Item de alta qualidade, diretamente do nosso parceiro ${seller.name}.`,
        imageUrl: media.urlOriginal, dataAiHint: media.dataAiHint,
        offerType: Math.random() > 0.5 ? 'BUY_NOW' : 'ACCEPTS_PROPOSALS',
        price: randomInt(100, 5000), minimumOfferPrice: randomInt(80, 4800),
        category: category.name, locationCity: randomItem(sampleCities).name, locationState: randomItem(sampleStates).uf,
        sellerName: seller.name, sellerId: seller.id, sellerLogoUrl: seller.logoUrl, dataAiHintSellerLogo: seller.dataAiHintLogo,
        status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date(),
    };
    generatedDirectSales.push(offer);
}

// ==================================
// EXPORT FINAL DATA
// ==================================
export const sampleAuctions: Auction[] = generatedAuctions;
export const sampleLots: Lot[] = generatedLots;
export const sampleUserWins: UserWin[] = generatedUserWins;
export const sampleDirectSaleOffers: DirectSaleOffer[] = generatedDirectSales;
export const sampleLotQuestions: LotQuestion[] = generatedQuestions;
export const sampleLotReviews: Review[] = generatedReviews;
export const sampleUserLotMaxBids: UserLotMaxBid[] = [];
export { samplePlatformSettings } from './sample-data-helpers';
export const sampleUserProfiles: UserProfileWithPermissions[] = [];
export { sampleBids };

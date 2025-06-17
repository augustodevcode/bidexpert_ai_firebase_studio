
import type { Auction, Lot, AuctionStatus, LotStatus, DocumentType, UserDocument, UserHabilitationStatus, UserDocumentStatus, UserBid, UserBidStatus, UserWin, PaymentStatus, SellerProfileInfo, RecentlyViewedLotInfo, AuctioneerProfileInfo, DirectSaleOffer, DirectSaleOfferType, DirectSaleOfferStatus, BidInfo, Review, LotQuestion, LotCategory, StateInfo, CityInfo, MediaItem, PlatformSettings, MentalTriggerSettings, HomepageSectionConfig } from '@/types';
import { format, differenceInDays, differenceInHours, differenceInMinutes, subYears, subMonths, subDays, addDays as dateFnsAddDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Clock, FileWarning, CheckCircle2, ShieldAlert, HelpCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';


const now = new Date();

const createFutureDate = (days: number, hours: number = 0, minutes: number = 0) => {
  const date = new Date(now);
  date.setDate(now.getDate() + days);
  date.setHours(now.getHours() + hours);
  date.setMinutes(now.getMinutes() + minutes);
  return date;
};

const createPastDate = (days: number, hours: number = 0, minutes: number = 0, fromDate?: Date) => {
    const baseDate = fromDate || now;
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() - days);
    date.setHours(baseDate.getHours() - hours);
    date.setMinutes(baseDate.getMinutes() - minutes);
    return date;
};

export const slugify = (text: string): string => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/\s+/g, '-') // Substitui espaços por -
    .replace(/[^\w-]+/g, '') // Remove caracteres não alfanuméricos (exceto hífen)
    .replace(/--+/g, '-'); // Remove hífens múltiplos
};

// ============================================================================
// 1. STATIC & RAW SAMPLE DATA DEFINITIONS
// ============================================================================

export const sampleLotCategoriesStatic: Omit<LotCategory, 'id' | 'createdAt' | 'updatedAt' | 'itemCount' | 'subcategories'>[] = [
  { name: 'Imóveis', slug: 'imoveis', description: 'Casas, apartamentos, terrenos, salas comerciais, galpões, fazendas, sítios e chácaras.' },
  { name: 'Veículos', slug: 'veiculos', description: 'Carros, motos, caminhões, ônibus, utilitários e outros veículos terrestres.' },
  { name: 'Máquinas e Equipamentos', slug: 'maquinas-e-equipamentos', description: 'Máquinas pesadas, agrícolas, industriais, equipamentos de construção e diversos.' },
  { name: 'Eletrônicos e Informática', slug: 'eletronicos-e-informatica', description: 'Celulares, computadores, notebooks, televisores, áudio, componentes e peças.' },
  { name: 'Casa e Decoração', slug: 'casa-e-decoracao', description: 'Móveis, eletrodomésticos, utensílios de cozinha, itens de decoração e iluminação.' },
  { name: 'Arte e Antiguidades', slug: 'arte-e-antiguidades', description: 'Obras de arte como pinturas e esculturas, móveis antigos e itens colecionáveis.' },
  { name: 'Joias e Acessórios de Luxo', slug: 'joias-e-acessorios-de-luxo', description: 'Joias, relógios de pulso e bolso, bolsas de grife, canetas e artigos de luxo.' },
  { name: 'Semoventes', slug: 'semoventes', description: 'Animais como bovinos, equinos, ovinos, caprinos e outros animais de produção ou estimação.' },
  { name: 'Materiais e Sucatas', slug: 'materiais-e-sucatas', description: 'Materiais de construção civil, sucatas metálicas, resíduos industriais e recicláveis.' },
  { name: 'Industrial (Geral)', slug: 'industrial-geral', description: 'Estoques industriais, matéria-prima, equipamentos de escritório (de empresas), e outros bens industriais.' },
  { name: 'Outros Itens', slug: 'outros-itens', description: 'Consórcios, energia solar, direitos creditórios, itens diversos e oportunidades únicas.' },
];


export const sampleStatesStatic: Omit<StateInfo, 'createdAt' | 'updatedAt' | 'cityCount'>[] = [
    { id: 'state-al', name: 'Alagoas', uf: 'AL', slug: 'alagoas' },
    { id: 'state-ba', name: 'Bahia', uf: 'BA', slug: 'bahia' },
    { id: 'state-sp', name: 'São Paulo', uf: 'SP', slug: 'sao-paulo' },
    { id: 'state-rj', name: 'Rio de Janeiro', uf: 'RJ', slug: 'rio-de-janeiro'},
    { id: 'state-mg', name: 'Minas Gerais', uf: 'MG', slug: 'minas-gerais'},
    { id: 'state-pr', name: 'Paraná', uf: 'PR', slug: 'parana'},
    { id: 'state-rs', name: 'Rio Grande do Sul', uf: 'RS', slug: 'rio-grande-do-sul'},
    { id: 'state-go', name: 'Goiás', uf: 'GO', slug: 'goias'},
    { id: 'state-ms', name: 'Mato Grosso do Sul', uf: 'MS', slug: 'mato-grosso-do-sul'},
    { id: 'state-ce', name: 'Ceará', uf: 'CE', slug: 'ceara'},
];

export const sampleCitiesStatic: Omit<CityInfo, 'createdAt' | 'updatedAt' | 'lotCount'>[] = [
    { id: 'city-maceio-al', name: 'Maceió', slug: 'maceio', stateId: 'state-al', stateUf: 'AL', ibgeCode: '2704302' },
    { id: 'city-salvador-ba', name: 'Salvador', slug: 'salvador', stateId: 'state-ba', stateUf: 'BA', ibgeCode: '2927408' },
    { id: 'city-sao-paulo-sp', name: 'São Paulo', slug: 'sao-paulo', stateId: 'state-sp', stateUf: 'SP', ibgeCode: '3550308' },
    { id: 'city-campinas-sp', name: 'Campinas', slug: 'campinas', stateId: 'state-sp', stateUf: 'SP', ibgeCode: '3509502' },
    { id: 'city-rio-de-janeiro-rj', name: 'Rio de Janeiro', slug: 'rio-de-janeiro', stateId: 'state-rj', stateUf: 'RJ', ibgeCode: '3304557'},
    { id: 'city-belo-horizonte-mg', name: 'Belo Horizonte', slug: 'belo-horizonte', stateId: 'state-mg', stateUf: 'MG', ibgeCode: '3106200'},
    { id: 'city-curitiba-pr', name: 'Curitiba', slug: 'curitiba', stateId: 'state-pr', stateUf: 'PR', ibgeCode: '4106902'},
    { id: 'city-porto-alegre-rs', name: 'Porto Alegre', slug: 'porto-alegre', stateId: 'state-rs', stateUf: 'RS', ibgeCode: '4314902'},
    { id: 'city-rio-verde-go', name: 'Rio Verde', slug: 'rio-verde', stateId: 'state-go', stateUf: 'GO', ibgeCode: '5218805'},
    { id: 'city-campo-grande-ms', name: 'Campo Grande', slug: 'campo-grande', stateId: 'state-ms', stateUf: 'MS', ibgeCode: '5002704'},
    { id: 'city-fortaleza-ce', name: 'Fortaleza', slug: 'fortaleza', stateId: 'state-ce', stateUf: 'CE', ibgeCode: '2304400'},
    { id: 'city-lauro-de-freitas-ba', name: 'Lauro de Freitas', slug: 'lauro-de-freitas', stateId: 'state-ba', stateUf: 'BA', ibgeCode: '2919207'},
    { id: 'city-niteroi-rj', name: 'Niterói', slug: 'niteroi', stateId: 'state-rj', stateUf: 'RJ', ibgeCode: '3303302'},
    { id: 'city-teotonio-vilela-al', name: 'Teotônio Vilela', slug: 'teotonio-vilela', stateId: 'state-al', stateUf: 'AL', ibgeCode: '2709152' },
];

export const sampleSellersStatic: Omit<SellerProfileInfo, 'id'| 'publicId' | 'slug' | 'createdAt' | 'updatedAt' | 'memberSince' | 'rating' | 'activeLotsCount' | 'totalSalesValue' | 'auctionsFacilitatedCount'>[] = [
    { name: 'Banco Bradesco S.A.', logoUrl: 'https://placehold.co/100x100.png?text=B', dataAiHint: 'banco logo', city: 'São Paulo', state: 'SP' },
    { name: 'Proprietário Particular 1', city: 'São Paulo', state: 'SP' },
    { name: 'Colecionadores RJ', city: 'Rio de Janeiro', state: 'RJ' },
    { name: 'Colecionadores Clássicos PR', city: 'Curitiba', state: 'PR' },
    { name: 'Fazenda Boa Esperança', city: 'Rio Verde', state: 'GO' },
    { name: 'Produtores Rurais MS', city: 'Campo Grande', state: 'MS' },
    { name: 'Galeria de Arte SP', city: 'São Paulo', state: 'SP' },
    { name: 'Restauradores Clássicos MG', city: 'Belo Horizonte', state: 'MG' },
    { name: 'Logística RS Ltda', city: 'Porto Alegre', state: 'RS' },
    { name: 'Banco XYZ', city: 'Rio de Janeiro', state: 'RJ', logoUrl: 'https://placehold.co/100x100.png?text=XYZ', dataAiHint: 'banco moderno' },
    { name: 'Diversos Comitentes Agro', city: 'Nacional', state: 'BR' },
    { name: 'Diversos Proprietários e Financeiras', city: 'Nacional', state: 'BR' },
    { name: 'Tribunal de Justiça SP', city: 'São Paulo', state: 'SP', logoUrl: 'https://placehold.co/100x100.png?text=TJ', dataAiHint: 'justica balanca' },
    { name: 'Colecionadores Particulares', city: 'Nacional', state: 'BR' },
    { name: 'Proprietários Diversos Clássicos', city: 'Nacional', state: 'BR' },
    { name: 'Antiguidades Imperial', city: 'Rio de Janeiro', state: 'RJ', logoUrl: 'https://placehold.co/100x100.png?text=AI', dataAiHint: 'antigo imperial' },
    { name: 'Tech Revenda SP', city: 'São Paulo', state: 'SP' },
    { name: 'Digital Boost Consultoria', city: 'Remoto', state: 'BR' },
    { name: 'Garagem Clássicos PR', city: 'Curitiba', state: 'PR' },
    { name: 'Fitness Total Equipamentos', city: 'Belo Horizonte', state: 'MG' },
    { name: 'Galeria Pampa Arte', city: 'Porto Alegre', state: 'RS' },
];

export const sampleAuctioneersStatic: Omit<AuctioneerProfileInfo, 'id'|'publicId'|'slug'|'createdAt'|'updatedAt'|'memberSince'|'rating'|'auctionsConductedCount'|'totalValueSold'>[] = [
  { name: 'VICENTE PAULO - JUCEMA N° 12/96', logoUrl: 'https://placehold.co/150x50.png?text=VP&font=roboto', dataAiHint: 'leiloeiro martelo', city: 'São Luís', state: 'MA'},
  { name: 'AGROLEILÕES LTDA - MATRICULA XYZ/00', logoUrl: 'https://placehold.co/150x75.png?text=AgroLeiloes&font=roboto', dataAiHint: 'trator campo', city: 'Rio Verde', state: 'GO'},
  { name: 'SUPERBID Leilões - JUCESP Nº 123', logoUrl: 'https://placehold.co/150x75.png?text=SuperBid&font=roboto', dataAiHint: 'logo empresa moderno', city: 'São Paulo', state: 'SP'},
  { name: 'Bomvalor Judicial', city: 'Ribeirão Preto', state: 'SP'},
  { name: 'Galeria Antika - Leiloeiro Oficial A.Silva', logoUrl: 'https://placehold.co/150x75.png?text=Galeria+Antika&font=merriweather', dataAiHint: 'arte quadro antigo', city: 'São Paulo', state: 'SP'},
  { name: 'Clássicos Leilões BR - Leiloeiro J.Pimenta', logoUrl: 'https://placehold.co/150x75.png?text=Classicos+BR&font=playfair+display', dataAiHint: 'carro classico perfil', city: 'Curitiba', state: 'PR'},
  { name: 'Leiloeiro XYZ Oficial', city: 'Rio de Janeiro', state: 'RJ'},
  { name: 'Leiloeiro Oficial Bradesco', logoUrl: 'https://placehold.co/150x50.png?text=Bradesco&font=roboto', dataAiHint: 'banco logo', city: 'São Paulo', state: 'SP'},
];

export const sampleLotsRaw: Omit<Lot, 'createdAt' | 'updatedAt' | 'auctionName' | 'sellerName' | 'cityName' | 'stateUf' | 'type' | 'bids' | 'reviews' | 'questions'>[] = [
  { id: 'LOTE001', auctionId: '100625bra', publicId: 'LOT-CASACENT-ABC123X1', title: 'CASA COM 129,30 M² - CENTRO', imageUrl: 'https://placehold.co/800x600.png?text=Casa+Centro', dataAiHint: 'casa residencial', galleryImageUrls: ['https://placehold.co/150x100.png?text=Casa+Frente'], mediaItemIds: ['media-casa-frente'], status: 'ABERTO_PARA_LANCES', cityId: 'city-teotonio-vilela-al', stateId: 'state-al', categoryId: 'imoveis', views: 1018, price: 45000, endDate: createFutureDate(10, 2), bidsCount: 0, description: 'Casa residencial bem localizada no centro da cidade.', sellerId: 'Banco Bradesco S.A.', lotSpecificAuctionDate: createFutureDate(10, 2) },
  { id: 'LOTEVEI001', auctionId: '300724car', publicId: 'LOT-2013AUDI-DEF456Y2', title: '2013 AUDI A4 PREMIUM PLUS', year: 2013, make: 'AUDI', model: 'A4', imageUrl: 'https://placehold.co/800x600.png?text=Audi+A4+2013', dataAiHint: 'carro sedan preto', galleryImageUrls: ['https://placehold.co/150x100.png?text=Audi+A4+Frente'], mediaItemIds: ['media-audi-frente'], status: 'ABERTO_PARA_LANCES', cityId: 'city-sao-paulo-sp', stateId: 'state-sp', categoryId: 'veiculos', views: 1560, price: 68500, endDate: createFutureDate(5, 10), bidsCount: 25, description: 'Audi A4 Premium Plus 2013, completo.', sellerId: 'Proprietário Particular 1', lotSpecificAuctionDate: createFutureDate(5,10), isExclusive: true },
  { id: 'LOTE003', auctionId: '100625bra', publicId: 'LOT-APTOCABU-GHI789Z3', title: 'APARTAMENTO COM 54,25 M² - CABULA', imageUrl: 'https://placehold.co/800x600.png?text=Apto+Cabula', dataAiHint: 'apartamento predio residencial', status: 'ENCERRADO', cityId: 'city-salvador-ba', stateId: 'state-ba', categoryId: 'imoveis', views: 754, price: 105000, endDate: createPastDate(2), bidsCount: 12, description: 'Apartamento funcional no Cabula.', sellerId: 'Banco Bradesco S.A.' },
  { id: 'LOTEART001', auctionId: 'ART001ANTIQ', publicId: 'LOT-PINTURAO-JKL012A4', title: 'Pintura a Óleo "Paisagem Toscana" - Séc. XIX', imageUrl: 'https://placehold.co/800x600.png?text=Paisagem+Toscana', dataAiHint: 'pintura oleo paisagem', status: 'ABERTO_PARA_LANCES', cityId: 'city-rio-de-janeiro-rj', stateId: 'state-rj', categoryId: 'arte-e-antiguidades', views: 320, price: 7500, endDate: createFutureDate(8, 0), bidsCount: 3, description: 'Belíssima pintura a óleo.', sellerId: 'Colecionadores RJ' },
  { id: 'LOTEVCLASS001', auctionId: 'CLASSICVEH24', publicId: 'LOT-1967FORD-MNO345B5', title: '1967 FORD MUSTANG FASTBACK', year: 1967, make: 'FORD', model: 'MUSTANG', imageUrl: 'https://placehold.co/800x600.png?text=Mustang+1967', dataAiHint: 'carro classico vermelho', status: 'ABERTO_PARA_LANCES', cityId: 'city-curitiba-pr', stateId: 'state-pr', categoryId: 'veiculos', views: 1850, price: 250000, endDate: createFutureDate(12, 0), bidsCount: 18, description: 'Icônico Ford Mustang Fastback 1967.', sellerId: 'Colecionadores Clássicos PR', initialPrice: 280000, secondInitialPrice: 250000 },
  { id: 'LOTE005', auctionId: '20301vei', publicId: 'LOT-TRATORAG-PQR678C6', title: 'TRATOR AGRÍCOLA NEW HOLLAND T7', year: 2018, make: 'NEW HOLLAND', model: 'T7.245', imageUrl: 'https://images.unsplash.com/photo-1633153627433-b15010a9b2f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHx0cmFjdG9yJTIwbmglMjB0N3xlbnwwfHx8fDE3NDk5MjQ1Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080', dataAiHint: 'trator agricola campo', galleryImageUrls: ['https://placehold.co/150x100.png?text=Trator+Frente'], mediaItemIds: ['media-trator-frente'], status: 'ABERTO_PARA_LANCES', cityId: 'city-rio-verde-go', stateId: 'state-go', categoryId: 'maquinas-e-equipamentos', views: 650, price: 180000, endDate: createFutureDate(7, 1), bidsCount: 7, isFeatured: true, description: 'Trator New Holland T7.245, ano 2018.', sellerId: 'Fazenda Boa Esperança' },
  { id: 'LOTE002', auctionId: '100625bra', publicId: 'LOT-CASAPORT-STU901D7', title: 'CASA COM 234,50 M² - PORTÃO', imageUrl: 'https://placehold.co/800x600.png?text=Casa+Portao', dataAiHint: 'casa moderna suburbio', status: 'ABERTO_PARA_LANCES', cityId: 'city-lauro-de-freitas-ba', stateId: 'state-ba', categoryId: 'imoveis', views: 681, price: 664000, endDate: createFutureDate(10, 5), bidsCount: 1, description: 'Espaçosa casa em Lauro de Freitas.', sellerId: 'Banco Bradesco S.A.' },
  { id: 'LOTE004', auctionId: '100625bra', publicId: 'LOT-CASAVILA-VWX234E8', title: 'CASA COM 133,04 M² - VILA PERI', imageUrl: 'https://placehold.co/800x600.png?text=Casa+Vila+Peri', dataAiHint: 'casa terrea simples', status: 'EM_BREVE', cityId: 'city-fortaleza-ce', stateId: 'state-ce', categoryId: 'imoveis', views: 527, price: 238000, endDate: createFutureDate(3, 0), bidsCount: 0, description: 'Casa em Fortaleza, boa localização.', sellerId: 'Banco Bradesco S.A.' },
  { id: 'LOTE006', auctionId: '20301vei', publicId: 'LOT-COLHEITA-YZA567F9', title: 'COLHEITADEIRA JOHN DEERE S680', imageUrl: 'https://placehold.co/800x600.png?text=Colheitadeira+JD', dataAiHint: 'colheitadeira graos campo', status: 'ENCERRADO', cityId: 'city-campo-grande-ms', stateId: 'state-ms', categoryId: 'maquinas-e-equipamentos', views: 450, price: 365000, endDate: createPastDate(5), bidsCount: 22, description: 'Colheitadeira John Deere S680, usada.', sellerId: 'Produtores Rurais MS' },
  { id: 'LOTEART002', auctionId: 'ART001ANTIQ', publicId: 'LOT-ESCULTUR-BCD890G0', title: 'Escultura em Bronze "O Pensador" - Réplica Assinada', imageUrl: 'https://placehold.co/800x600.png?text=Escultura+Pensador', dataAiHint: 'escultura bronze pensador', status: 'EM_BREVE', cityId: 'city-sao-paulo-sp', stateId: 'state-sp', categoryId: 'arte-e-antiguidades', views: 150, price: 3200, endDate: createFutureDate(15, 0), bidsCount: 0, description: 'Réplica em bronze da famosa escultura.', sellerId: 'Galeria de Arte SP' },
  { id: 'LOTEVCLASS002', auctionId: 'CLASSICVEH24', publicId: 'LOT-1955PORS-EFG123H1', title: '1955 PORSCHE 356 SPEEDSTER - RÉPLICA', year: 1955, make: 'PORSCHE', model: '356 SPEEDSTER (RÉPLICA)', imageUrl: 'https://placehold.co/800x600.png?text=Porsche+356+Replica', dataAiHint: 'carro conversivel prata antigo', status: 'ABERTO_PARA_LANCES', cityId: 'city-belo-horizonte-mg', stateId: 'state-mg', categoryId: 'veiculos', views: 990, price: 180000, endDate: createFutureDate(10, 0), bidsCount: 0, description: 'Excelente réplica do Porsche 356 Speedster.', sellerId: 'Restauradores Clássicos MG', isFeatured: true },
  { id: 'LOTEUTIL001', auctionId: '300724car', publicId: 'LOT-2019FIAT-HIJ456I2', title: '2019 FIAT FIORINO 1.4 FLEX', year: 2019, make: 'FIAT', model: 'FIORINO', imageUrl: 'https://placehold.co/800x600.png?text=Fiat+Fiorino+2019', dataAiHint: 'furgoneta branca cidade', status: 'ABERTO_PARA_LANCES', cityId: 'city-porto-alegre-rs', stateId: 'state-rs', categoryId: 'veiculos', views: 720, price: 55000, endDate: createFutureDate(3, 5), bidsCount: 0, description: 'Fiat Fiorino 2019, ideal para trabalho.', sellerId: 'Logística RS Ltda' },
  { id: 'LOTEFIN001', auctionId: 'XYZBANK001', publicId: 'LOT-APTOCABE-KLM789J3', title: 'Apartamento 3 Quartos - Cobertura - Barra da Tijuca', imageUrl: 'https://placehold.co/800x600.png?text=Cobertura+Barra', dataAiHint: 'cobertura vista mar', status: 'ABERTO_PARA_LANCES', cityId: 'city-rio-de-janeiro-rj', stateId: 'state-rj', categoryId: 'imoveis', views: 500, price: 1200000, endDate: createFutureDate(15, 0), bidsCount: 0, description: 'Cobertura duplex com vista para o mar.', sellerId: 'Banco XYZ', isFeatured: true },
  { id: 'LOTE007', auctionId: 'XYZBANK001', publicId: 'LOT-CASATEST-TST123A0', title: 'Casa Teste Leilão XYZ', imageUrl: 'https://placehold.co/800x600.png?text=Casa+Teste', dataAiHint: 'casa simples teste', status: 'EM_BREVE', cityId: 'city-niteroi-rj', stateId: 'state-rj', categoryId: 'imoveis', views: 10, price: 150000, endDate: createFutureDate(16,0), bidsCount: 0, description: 'Casa para teste no leilão do Banco XYZ.', sellerId: 'Banco XYZ', isExclusive: true },
  { id: 'LOTE008', auctionId: 'BRADESCO-IMV-2024-07-A', publicId: 'LOT-TERRENOBH-BH001', title: 'Terreno Comercial em Contagem', imageUrl: 'https://placehold.co/800x600.png?text=Terreno+BH', dataAiHint: 'terreno comercial urbano', status: 'ABERTO_PARA_LANCES', cityId: 'city-belo-horizonte-mg', stateId: 'state-mg', categoryId: 'imoveis', views: 850, price: 750000, endDate: createFutureDate(25,0), bidsCount: 2, description: 'Terreno comercial de esquina, 1000m², Contagem/MG.', sellerId: 'Banco XYZ', isFeatured: true, initialPrice: 800000, secondInitialPrice: 750000 },
  { id: 'LOTE009', auctionId: 'BRADESCO-IMV-2024-07-A', publicId: 'LOT-APTOSP-SP002', title: 'Apartamento 2 Quartos Pinheiros', imageUrl: 'https://placehold.co/800x600.png?text=Apto+Pinheiros', dataAiHint: 'apartamento moderno interno', status: 'ABERTO_PARA_LANCES', cityId: 'city-sao-paulo-sp', stateId: 'state-sp', categoryId: 'imoveis', views: 1200, price: 650000, endDate: createFutureDate(28,0), bidsCount: 5, description: 'Apto 2q, 70m², Pinheiros, São Paulo. Próximo ao metrô.', sellerId: 'Banco XYZ' },
];

export const sampleDirectSaleOffersRaw: Omit<DirectSaleOffer, 'createdAt' | 'updatedAt' | 'expiresAt'>[] = [
  { id: 'DSO001', title: 'Coleção Completa de Selos Raros do Brasil Império', description: 'Uma oportunidade única para colecionadores...', imageUrl: 'https://placehold.co/800x600.png?text=Selos+Raros', dataAiHint: 'selos antigos colecao', offerType: 'ACCEPTS_PROPOSALS', minimumOfferPrice: 25000, category: 'Arte e Antiguidades', locationCity: 'Rio de Janeiro', locationState: 'RJ', sellerName: 'Antiguidades Imperial', status: 'ACTIVE' },
  { id: 'DSO002', title: 'MacBook Pro 16" M1 Max - Seminovo', description: 'MacBook Pro de 16 polegadas com chip M1 Max...', imageUrl: 'https://placehold.co/800x600.png?text=MacBook+Pro+16', dataAiHint: 'macbook pro aberto', offerType: 'BUY_NOW', price: 18500, category: 'Eletrônicos e Informática', locationCity: 'São Paulo', locationState: 'SP', sellerName: 'Tech Revenda SP', status: 'ACTIVE' },
  { id: 'DSO003', title: 'Serviço de Consultoria em Marketing Digital', description: 'Pacote de consultoria completo para startups...', imageUrl: 'https://placehold.co/800x600.png?text=Consultoria+Marketing', dataAiHint: 'marketing digital reuniao', offerType: 'BUY_NOW', price: 4500, category: 'Outros Itens', locationCity: 'Remoto', locationState: 'BR', sellerName: 'Digital Boost Consultoria', status: 'ACTIVE' },
  { id: 'DSO004', title: 'Ford Mustang 1968 Conversível', description: 'Raro Ford Mustang conversível de 1968...', imageUrl: 'https://placehold.co/800x600.png?text=Mustang+68+Conv', dataAiHint: 'mustang conversivel vermelho', offerType: 'ACCEPTS_PROPOSALS', minimumOfferPrice: 320000, category: 'Veículos', locationCity: 'Curitiba', locationState: 'PR', sellerName: 'Garagem Clássicos PR', status: 'PENDING_APPROVAL' },
  { id: 'DSO005', title: 'Lote de Equipamentos de Academia Profissional', description: 'Lote completo de equipamentos de academia profissional...', imageUrl: 'https://placehold.co/800x600.png?text=Equip+Academia', dataAiHint: 'academia equipamentos profissional', offerType: 'BUY_NOW', price: 75000, category: 'Máquinas e Equipamentos', locationCity: 'Belo Horizonte', locationState: 'MG', sellerName: 'Fitness Total Equipamentos', status: 'SOLD' },
  { id: 'DSO006', title: 'Obra de Arte Contemporânea - "Abstração Urbana"', description: 'Pintura acrílica sobre tela de grandes dimensões...', imageUrl: 'https://placehold.co/800x600.png?text=Arte+Abstrata', dataAiHint: 'pintura abstrata colorida', offerType: 'ACCEPTS_PROPOSALS', minimumOfferPrice: 12000, category: 'Arte e Antiguidades', locationCity: 'Porto Alegre', locationState: 'RS', sellerName: 'Galeria Pampa Arte', status: 'EXPIRED' },
];

export const sampleMediaItemsRaw: Omit<MediaItem, 'uploadedAt' | 'linkedLotIds'>[] = [
    { id: 'media001', fileName: 'casa_centro_frente.jpg', title: 'Frente da Casa no Centro', mimeType: 'image/jpeg', sizeBytes: 102400, urlOriginal: 'https://placehold.co/800x600.png?text=Casa+Centro', urlThumbnail: 'https://placehold.co/150x100.png?text=Casa+Frente', urlMedium: 'https://placehold.co/400x300.png?text=Casa+Frente', urlLarge: 'https://placehold.co/800x600.png?text=Casa+Frente', dataAiHint: 'fachada casa cidade' },
    { id: 'media002', fileName: 'audi_a4_2013_perfil.png', title: 'Audi A4 2013 Perfil', mimeType: 'image/png', sizeBytes: 204800, urlOriginal: 'https://placehold.co/800x600.png?text=Audi+A4+2013', urlThumbnail: 'https://placehold.co/150x100.png?text=Audi+A4+Frente', urlMedium: 'https://placehold.co/400x300.png?text=Audi+A4+Frente', urlLarge: 'https://placehold.co/800x600.png?text=Audi+A4+2013', dataAiHint: 'carro audi perfil' },
    { id: 'media003', fileName: 'edital_leilao_bradesco.pdf', title: 'Edital Leilão Bradesco 100625bra', mimeType: 'application/pdf', sizeBytes: 512000, urlOriginal: '#', urlThumbnail: 'https://placehold.co/150x100.png?text=PDF', urlMedium: '#', urlLarge: '#', dataAiHint: 'documento edital' },
    { id: 'media-casa-frente', fileName: 'casa_frente_detalhe.jpg', title: 'Detalhe Fachada Casa Centro', mimeType: 'image/jpeg', sizeBytes: 120000, urlOriginal: 'https://placehold.co/800x600.png?text=Casa+Detalhe', urlThumbnail: 'https://placehold.co/150x100.png?text=Casa+Detalhe', urlMedium: 'https://placehold.co/400x300.png?text=Casa+Detalhe', urlLarge: 'https://placehold.co/800x600.png?text=Casa+Detalhe', dataAiHint: 'detalhe fachada' },
    { id: 'media-audi-frente', fileName: 'audi_a4_frente_total.jpg', title: 'Audi A4 2013 Vista Frontal', mimeType: 'image/jpeg', sizeBytes: 180000, urlOriginal: 'https://placehold.co/800x600.png?text=Audi+Frente+Total', urlThumbnail: 'https://placehold.co/150x100.png?text=Audi+Frente+T', urlMedium: 'https://placehold.co/400x300.png?text=Audi+Frente+T', urlLarge: 'https://placehold.co/800x600.png?text=Audi+Frente+Total', dataAiHint: 'audi carro frente' },
    { id: 'media-trator-frente', fileName: 'trator_nh_vista_frontal.jpg', title: 'Trator New Holland T7 Frontal', mimeType: 'image/jpeg', sizeBytes: 220000, urlOriginal: 'https://images.unsplash.com/photo-1633153627433-b15010a9b2f5?w=150', urlThumbnail: 'https://images.unsplash.com/photo-1633153627433-b15010a9b2f5?w=150', urlMedium: 'https://images.unsplash.com/photo-1633153627433-b15010a9b2f5?w=400', urlLarge: 'https://images.unsplash.com/photo-1633153627433-b15010a9b2f5?w=800', dataAiHint: 'trator campo frente' },
];

// ============================================================================
// 2. UTILITY FUNCTIONS (Continuam aqui, pois são puras e usadas para processar os dados acima)
// ============================================================================

export const getAuctionStatusText = (status: AuctionStatus | LotStatus | UserDocumentStatus | UserHabilitationStatus | DirectSaleOfferStatus ): string => {
  switch (status) {
    case 'ABERTO_PARA_LANCES': return 'Aberto para Lances';
    case 'EM_BREVE': return 'Em Breve';
    case 'ENCERRADO': return 'Encerrado';
    case 'FINALIZADO': return 'Finalizado';
    case 'ABERTO': return 'Aberto';
    case 'CANCELADO': return 'Cancelado';
    case 'SUSPENSO': return 'Suspenso';
    case 'VENDIDO': return 'Vendido';
    case 'NAO_VENDIDO': return 'Não Vendido';
    case 'NOT_SENT': return 'Não Enviado';
    case 'SUBMITTED': return 'Enviado';
    case 'APPROVED': return 'Aprovado';
    case 'REJECTED': return 'Rejeitado';
    case 'PENDING_ANALYSIS': return 'Em Análise';
    case 'PENDING_DOCUMENTS': return 'Documentação Pendente';
    case 'HABILITATED': return 'Habilitado'; // Mudado para "HABILITADO"
    case 'REJECTED_DOCUMENTS': return 'Documentos Rejeitados';
    case 'BLOCKED': return 'Bloqueado';
    case 'ACTIVE': return 'Ativa'; // Para DirectSaleOffer
    case 'SOLD': return 'Vendido'; // Para DirectSaleOffer
    case 'EXPIRED': return 'Expirada'; // Para DirectSaleOffer
    case 'PENDING_APPROVAL': return 'Pendente Aprovação'; // Para DirectSaleOffer
    default: {
      const exhaustiveCheck: never = status; // This will error if a case is missed
      return String(status).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  }
};

export const getBidStatusText = (status: UserBidStatus): string => {
  switch (status) {
    case 'GANHANDO': return 'Ganhando';
    case 'PERDENDO': return 'Perdendo';
    case 'SUPERADO': return 'Lance Superado';
    case 'ARREMATADO': return 'Arrematado';
    case 'NAO_ARREMATADO': return 'Não Arrematado';
    default: {
      const exhaustiveCheck: never = status;
      return exhaustiveCheck;
    }
  }
};

export const getPaymentStatusText = (status: PaymentStatus): string => {
    switch (status) {
        case 'PENDENTE': return 'Pendente';
        case 'PROCESSANDO': return 'Processando';
        case 'PAGO': return 'Pago';
        case 'FALHOU': return 'Falha no Pagamento';
        case 'REEMBOLSADO': return 'Reembolsado';
        default: {
            const exhaustiveCheck: never = status;
            return exhaustiveCheck;
        }
    }
};

export const getLotStatusColor = (status: LotStatus | DirectSaleOfferStatus): string => {
    switch (status) {
      case 'ABERTO_PARA_LANCES':
      case 'ACTIVE': // Para DirectSaleOffer
        return 'bg-green-600 text-white';
      case 'EM_BREVE':
      case 'PENDING_APPROVAL': // Para DirectSaleOffer
        return 'bg-blue-500 text-white';
      case 'ENCERRADO':
      case 'VENDIDO':
      case 'NAO_VENDIDO':
      case 'SOLD': // Para DirectSaleOffer
      case 'EXPIRED': // Para DirectSaleOffer
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-300 text-gray-800';
    }
  };

export const getUserDocumentStatusColor = (status: UserDocumentStatus): string => {
  switch (status) {
    case 'APPROVED':
      return 'bg-green-100 text-green-700 border-green-300';
    case 'REJECTED':
      return 'bg-red-100 text-red-700 border-red-300';
    case 'PENDING_ANALYSIS':
    case 'SUBMITTED':
      return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    case 'NOT_SENT':
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300';
  }
};

export const getBidStatusColor = (status: UserBidStatus): string => {
  switch (status) {
    case 'GANHANDO':
      return 'bg-green-100 text-green-700 border-green-300';
    case 'ARREMATADO':
      return 'bg-sky-100 text-sky-700 border-sky-300';
    case 'PERDENDO':
    case 'SUPERADO':
      return 'bg-red-100 text-red-700 border-red-300';
    case 'NAO_ARREMATADO':
      return 'bg-gray-100 text-gray-700 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300';
  }
};

export const getPaymentStatusColor = (status: PaymentStatus): string => {
    switch (status) {
        case 'PAGO':
            return 'bg-green-100 text-green-700 border-green-300';
        case 'PENDENTE':
            return 'bg-yellow-100 text-yellow-700 border-yellow-300';
        case 'PROCESSANDO':
            return 'bg-blue-100 text-blue-700 border-blue-300';
        case 'FALHOU':
            return 'bg-red-100 text-red-700 border-red-300';
        case 'REEMBOLSADO':
            return 'bg-purple-100 text-purple-700 border-purple-300';
        default:
            return 'bg-gray-100 text-gray-700 border-gray-300';
    }
};

export const getUserHabilitationStatusInfo = (status: UserHabilitationStatus): { text: string; color: string; progress: number, icon?: React.ElementType } => {
  switch (status) {
    case 'PENDING_DOCUMENTS':
      return { text: 'Documentação Pendente', color: 'text-orange-600 dark:text-orange-400', progress: 25, icon: FileText };
    case 'PENDING_ANALYSIS':
      return { text: 'Documentos em Análise', color: 'text-yellow-600 dark:text-yellow-400', progress: 50, icon: Clock };
    case 'REJECTED_DOCUMENTS':
      return { text: 'Documentos Rejeitados', color: 'text-red-600 dark:text-red-400', progress: 75, icon: FileWarning };
    case 'HABILITATED': // Mudado para "HABILITADO"
      return { text: 'Habilitado para Dar Lances', color: 'text-green-600 dark:text-green-400', progress: 100, icon: CheckCircle2 };
    case 'BLOCKED':
      return { text: 'Conta Bloqueada', color: 'text-destructive', progress: 0, icon: ShieldAlert };
    default:
      const exhaustiveCheck: never = status; // This will error if a case is missed
      return { text: "Status Desconhecido" as never, color: 'text-muted-foreground', progress: 0, icon: HelpCircle };
  }
};

// ============================================================================
// 3. DERIVED/PROCESSED DATA FUNCTIONS (Continuam aqui, pois são puras)
// ============================================================================

// Função para obter categorias únicas baseadas nos dados de exemplo
export function getUniqueLotCategoriesFromSampleData(): LotCategory[] {
  const categoriesMap = new Map<string, LotCategory>();
  // Primeiramente, adiciona as categorias estáticas com datas
  sampleLotCategoriesStatic.forEach(cat => categoriesMap.set(cat.slug, { ...cat, id: `cat-${cat.slug}`, itemCount: 0, createdAt: createPastDate(30), updatedAt: createPastDate(1) }));

  // Então, itera sobre os lotes, leilões e ofertas para contar itens e adicionar categorias faltantes
  [...sampleLotsRaw, ...sampleAuctionsRaw, ...sampleDirectSaleOffersRaw].forEach(item => {
    const categoryNameOrId = 'categoryId' in item ? item.categoryId : ('category' in item ? item.category : undefined);
    let categorySlugToUse: string | undefined;
    let categoryNameToUse: string | undefined;

    if (categoryNameOrId) {
      const staticCatById = sampleLotCategoriesStatic.find(c => `cat-${c.slug}` === categoryNameOrId);
      const staticCatBySlug = sampleLotCategoriesStatic.find(c => c.slug === categoryNameOrId);
      const staticCatByName = sampleLotCategoriesStatic.find(c => c.name === categoryNameOrId);

      if (staticCatById) {
        categorySlugToUse = staticCatById.slug;
        categoryNameToUse = staticCatById.name;
      } else if (staticCatBySlug) {
         categorySlugToUse = staticCatBySlug.slug;
         categoryNameToUse = staticCatBySlug.name;
      } else if (staticCatByName) {
         categorySlugToUse = staticCatByName.slug;
         categoryNameToUse = staticCatByName.name;
      } else if (typeof categoryNameOrId === 'string') { // Se não é um ID/slug conhecido, trata como um nome novo
        categorySlugToUse = slugify(categoryNameOrId);
        categoryNameToUse = categoryNameOrId;
      }
    }


    if (categorySlugToUse && categoryNameToUse) {
      if (!categoriesMap.has(categorySlugToUse)) {
        categoriesMap.set(categorySlugToUse, {
          id: `cat-${categorySlugToUse}`,
          name: categoryNameToUse,
          slug: categorySlugToUse,
          description: `Categoria de ${categoryNameToUse}`,
          itemCount: 0,
          createdAt: createPastDate(30),
          updatedAt: createPastDate(1),
        });
      }
      const existingCat = categoriesMap.get(categorySlugToUse);
      if (existingCat) {
        existingCat.itemCount = (existingCat.itemCount || 0) + 1;
      }
    }
  });
  return Array.from(categoriesMap.values()).sort((a,b) => a.name.localeCompare(b.name));
};

export function getCategoryNameFromSlug(slug: string): string | undefined {
  const allSampleCategories = getUniqueLotCategoriesFromSampleData(); // Usa a função que já processa
  const foundCategory = allSampleCategories.find(cat => cat.slug === slug);
  if (foundCategory) {
    return foundCategory.name;
  }
  // Se não encontrar pelo slug, tenta pelo nome (caso o "slug" seja na verdade o nome)
  const foundByName = allSampleCategories.find(cat => cat.name === slug || slugify(cat.name) === slug);
  if (foundByName) return foundByName.name;

  console.warn(`[sample-data] Nenhum nome de categoria encontrado para o slug/nome: ${slug} nos dados de exemplo.`);
  return slug; // Retorna o próprio slug/nome como fallback se não encontrado
}

export const getUniqueLotLocations = (): string[] => {
  const locations = new Set<string>();
  sampleLotsRaw.forEach(lot => {
    const cityInfo = sampleCitiesStatic.find(c => c.id === lot.cityId);
    const stateInfo = sampleStatesStatic.find(s => s.id === lot.stateId);
    const locationString = cityInfo?.name && stateInfo?.uf ? `${cityInfo.name} - ${stateInfo.uf}` : stateInfo?.uf || cityInfo?.name;
    if (locationString) locations.add(locationString);
  });
  sampleDirectSaleOffersRaw.forEach(offer => {
    const locationString = offer.locationCity && offer.locationState ? `${offer.locationCity} - ${offer.locationState}` : offer.locationState || offer.locationCity;
    if (locationString) locations.add(locationString);
  });
  return Array.from(locations).sort();
};

export const getUniqueSellerNames = (): string[] => {
  const sellerNames = new Set<string>();
  sampleAuctionsRaw.forEach(auction => {
    if (auction.seller) sellerNames.add(auction.seller);
  });
  sampleLotsRaw.forEach(lot => {
    if (lot.sellerId) {
        const sellerProf = sampleSellersStatic.find(s => s.name === lot.sellerId); // Comparar pelo nome
        if(sellerProf) sellerNames.add(sellerProf.name);
        else if (typeof lot.sellerId === 'string') sellerNames.add(lot.sellerId);
    }
  });
   sampleDirectSaleOffersRaw.forEach(offer => {
    if (offer.sellerName) sellerNames.add(offer.sellerName);
  });
  return Array.from(sellerNames).sort();
};

export const getUniqueAuctioneersInternal = (): AuctioneerProfileInfo[] => {
    const auctioneerMap = new Map<string, AuctioneerProfileInfo>();
    sampleAuctioneersStatic.forEach(aucStatic => {
        const slug = slugify(aucStatic.name);
        if (!auctioneerMap.has(slug)) {
            const randomYearsAgo = Math.floor(Math.random() * 5) + 1;
            let memberSince = subYears(now, randomYearsAgo);
            memberSince = subMonths(memberSince, Math.floor(Math.random() * 12));
            const initial = aucStatic.name ? aucStatic.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : 'L';

            auctioneerMap.set(slug, {
                ...aucStatic,
                id: `auct-${slug}`,
                publicId: `AUCT-PUB-${slug.substring(0,5)}-${uuidv4().substring(0,6)}`,
                slug: slug,
                memberSince: memberSince,
                rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
                auctionsConductedCount: Math.floor(Math.random() * 50) + 5,
                totalValueSold: (Math.random() * 2000000) + 500000,
                logoUrl: aucStatic.logoUrl || `https://placehold.co/100x100.png?text=${initial}`,
                createdAt: memberSince, updatedAt: new Date(),
            });
        }
    });
     sampleAuctionsRaw.forEach(auction => {
        if (auction.auctioneer && !auctioneerMap.has(slugify(auction.auctioneer))) {
             const slug = slugify(auction.auctioneer);
             const randomYearsAgo = Math.floor(Math.random() * 5) + 1;
             let memberSince = subYears(now, randomYearsAgo);
             memberSince = subMonths(memberSince, Math.floor(Math.random() * 12));
             const initial = auction.auctioneer.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
            auctioneerMap.set(slug, {
                id: `auct-${slug}`, name: auction.auctioneer, slug,
                publicId: `AUCT-PUB-${slug.substring(0,5)}-${uuidv4().substring(0,6)}`,
                logoUrl: auction.auctioneerLogoUrl || `https://placehold.co/100x100.png?text=${initial}`,
                dataAiHintLogo: auction.dataAiHint || 'logo leiloeiro',
                registrationNumber: `MAT ${Math.floor(Math.random() * 900) + 100}`,
                memberSince, rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
                auctionsConductedCount: Math.floor(Math.random() * 200) + 50,
                totalValueSold: (Math.random() * 5000000) + 1000000,
                email: `${slug}@leiloes.com.br`, phone: `(XX) XXXX-XXXX`,
                city: auction.city || 'Cidade Exemplo', state: auction.state || 'EX',
                createdAt: memberSince, updatedAt: new Date(),
            });
        }
    });
    return Array.from(auctioneerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
};

export const getUniqueSellersInternal = (): SellerProfileInfo[] => {
  const sellerMap = new Map<string, SellerProfileInfo>();

  sampleSellersStatic.forEach(sellStatic => {
    const slug = slugify(sellStatic.name);
    if (!sellerMap.has(slug)) {
        const randomYearsAgo = Math.floor(Math.random() * 3) + 1;
        let memberSince = subYears(now, randomYearsAgo);
        memberSince = subMonths(memberSince, Math.floor(Math.random() * 12));
        memberSince = subDays(memberSince, Math.floor(Math.random() * 28));
        const initial = sellStatic.name ? sellStatic.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : 'S';

        sellerMap.set(slug, {
            ...sellStatic,
            id: `seller-${slug}`,
            publicId: `SELL-PUB-${slug.substring(0,5)}-${uuidv4().substring(0,6)}`,
            slug: slug,
            memberSince: memberSince,
            rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
            activeLotsCount: Math.floor(Math.random() * 46) + 5,
            logoUrl: sellStatic.logoUrl || `https://placehold.co/100x100.png?text=${initial}`,
            createdAt: memberSince, updatedAt: new Date(),
        });
    }
  });

  return Array.from(sellerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
};

interface CategoryAssets {
  logoUrl: string;
  logoAiHint: string;
  bannerUrl: string;
  bannerAiHint: string;
  bannerText?: string;
}

export function getCategoryAssets(categoryNameOrSlug: string): CategoryAssets {
  const categoryName = getCategoryNameFromSlug(categoryNameOrSlug) || categoryNameOrSlug;
  const slug = slugify(categoryName);

  const defaultAssets: CategoryAssets = {
    logoUrl: `https://placehold.co/100x100.png?text=${encodeURIComponent(categoryName.charAt(0).toUpperCase())}`,
    logoAiHint: `logo ${slug}`,
    bannerUrl: `https://placehold.co/1200x300.png?text=Banner+${encodeURIComponent(categoryName)}`,
    bannerAiHint: `banner ${slug}`,
    bannerText: `Descubra os melhores lotes em ${categoryName}`,
  };

  if (slug.includes('veiculo')) {
    return { ...defaultAssets, logoUrl: 'https://placehold.co/100x100.png?text=Carro', logoAiHint: 'icone carro', bannerUrl: 'https://placehold.co/1200x300.png?text=Veiculos+em+Destaque', bannerAiHint: 'carros estrada', bannerText: `Excelentes Ofertas em Veículos - ${categoryName}` };
  }
  if (slug.includes('imove')) {
    return { ...defaultAssets, logoUrl: 'https://placehold.co/100x100.png?text=Casa', logoAiHint: 'icone casa', bannerUrl: 'https://placehold.co/1200x300.png?text=Oportunidades+Imobiliarias', bannerAiHint: 'imoveis cidade', bannerText: `Seu Novo Lar ou Investimento está aqui - ${categoryName}` };
  }
  if (slug.includes('arte') || slug.includes('antiguidade')) {
    return { ...defaultAssets, logoUrl: 'https://placehold.co/100x100.png?text=Arte', logoAiHint: 'icone arte', bannerUrl: 'https://placehold.co/1200x300.png?text=Leilao+de+Arte', bannerAiHint: 'galeria arte', bannerText: `Obras Raras e Antiguidades - ${categoryName}` };
  }
  if (slug.includes('maquinas') || slug.includes('equipamentos') || slug.includes('agricola')) {
    return { ...defaultAssets, logoUrl: 'https://placehold.co/100x100.png?text=Trator', logoAiHint: 'icone trator', bannerUrl: 'https://placehold.co/1200x300.png?text=Maquinario+Agro', bannerAiHint: 'campo trator', bannerText: `Equipamentos Agrícolas e Maquinário Pesado - ${categoryName}` };
  }
   if (slug.includes('eletronico') || slug.includes('informatica')) {
    return { ...defaultAssets, logoUrl: 'https://placehold.co/100x100.png?text=Chip', logoAiHint: 'icone chip placa', bannerUrl: 'https://placehold.co/1200x300.png?text=Tecnologia+e+Eletronicos', bannerAiHint: 'computador smartphone', bannerText: `Os Melhores Gadgets e Eletrônicos - ${categoryName}` };
  }
  if (slug.includes('semovente')) {
    return { ...defaultAssets, logoUrl: 'https://placehold.co/100x100.png?text=Boi', logoAiHint: 'icone boi cavalo', bannerUrl: 'https://placehold.co/1200x300.png?text=Leilao+Semoventes', bannerAiHint: 'gado pasto', bannerText: `Animais de Qualidade e Procedência - ${categoryName}` };
  }
  return defaultAssets;
}

// ============================================================================
// 4. EXPORTED SAMPLE DATA ARRAYS (Processed)
// ============================================================================

export const sampleLotCategories: LotCategory[] = getUniqueLotCategoriesFromSampleData();
export const sampleStates: StateInfo[] = sampleStatesStatic.map(s => ({ ...s, cityCount: sampleCitiesStatic.filter(c => c.stateId === s.id).length, createdAt: createPastDate(Math.floor(Math.random() * 30) + 1), updatedAt: createPastDate(Math.floor(Math.random() * 30)) }));
export const sampleCities: CityInfo[] = sampleCitiesStatic.map(c => ({ ...c, lotCount: sampleLotsRaw.filter(l => l.cityId === c.id).length, createdAt: createPastDate(Math.floor(Math.random() * 30) + 1), updatedAt: createPastDate(Math.floor(Math.random() * 30)) }));

export const sampleLots: Lot[] = sampleLotsRaw.map(lot => {
    const categoryInfo = sampleLotCategories.find(c => c.id === lot.categoryId || c.slug === lot.categoryId);
    const auctionInfo = sampleAuctionsRaw.find(a => a.id === lot.auctionId);
    const stateInfo = sampleStates.find(s => s.id === lot.stateId);
    const cityInfo = sampleCities.find(c => c.id === lot.cityId);
    const sellerInfo = sampleSellersStatic.find(s => s.name === lot.sellerId || s.slug === lot.sellerId); // Match by name or slug for consistency

    return {
        ...lot,
        type: categoryInfo?.name || 'Desconhecida',
        auctionName: auctionInfo?.title || 'Leilão Desconhecido',
        sellerName: sellerInfo?.name || auctionInfo?.seller || 'Vendedor Desconhecido',
        cityName: cityInfo?.name || lot.cityName,
        stateUf: stateInfo?.uf || lot.stateUf,
        createdAt: createPastDate(Math.floor(Math.random() * 30) + 1, undefined, undefined, lot.endDate ? new Date(lot.endDate) : undefined),
        updatedAt: createPastDate(Math.floor(Math.random() * 30), undefined, undefined, lot.endDate ? new Date(lot.endDate) : undefined),
    } as Lot;
});

export const sampleAuctions: Auction[] = sampleAuctionsRaw.map(auction => {
    const lotsForAuction = sampleLots.filter(l => l.auctionId === auction.id);
    const categoryInfo = sampleLotCategories.find(c => c.id === auction.categoryId || c.name === auction.category || c.slug === auction.category);
    const auctioneerInfo = sampleAuctioneersStatic.find(auc => auc.name === auction.auctioneer);
    const sellerInfo = sampleSellersStatic.find(s => s.name === auction.seller);

    return {
        ...auction,
        category: categoryInfo?.name || auction.category,
        auctioneer: auctioneerInfo?.name || auction.auctioneer,
        seller: sellerInfo?.name || auction.seller,
        lots: lotsForAuction,
        totalLots: lotsForAuction.length,
        createdAt: createPastDate(Math.floor(Math.random() * 60) + 1),
        updatedAt: createPastDate(Math.floor(Math.random() * 60)),
    } as Auction;
});

export const sampleAuctioneers: AuctioneerProfileInfo[] = getUniqueAuctioneersInternal();
export const sampleSellers: SellerProfileInfo[] = getUniqueSellersInternal();

export const sampleBids: BidInfo[] = sampleLots.flatMap(lot => {
    const numberOfBids = Math.floor(Math.random() * 8); // Increased max bids
    const bids: BidInfo[] = [];
    let currentBidPrice = lot.initialPrice || lot.price;
    const baseBidIncrement = currentBidPrice > 50000 ? 500 : (currentBidPrice > 5000 ? 100 : 20);

    for (let i = 0; i < numberOfBids; i++) {
        const increment = baseBidIncrement + Math.floor(Math.random() * baseBidIncrement);
        currentBidPrice += increment;
        const bidTime = createPastDate(Math.floor(Math.random() * 5), Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), lot.endDate ? new Date(lot.endDate) : undefined);
        if (bidTime > now && lot.status === 'ABERTO_PARA_LANCES') continue; // Don't create future bids for open lots
        if (bidTime > (lot.endDate || now)) continue; // Don't create bids after lot ended

        bids.push({
            id: `BID-${lot.id}-${uuidv4().substring(0,8)}`,
            lotId: lot.id,
            auctionId: lot.auctionId,
            bidderId: `user${String.fromCharCode(65 + Math.floor(Math.random() * 10))}${Math.floor(Math.random() * 999)}`,
            bidderDisplay: `Usuário ${String.fromCharCode(65 + Math.floor(Math.random() * 10))}****`,
            amount: parseFloat(currentBidPrice.toFixed(2)),
            timestamp: bidTime,
        });
    }
     if (bids.length > 0 && lot.status === 'ABERTO_PARA_LANCES') {
        lot.price = bids.reduce((max, b) => b.amount > max ? b.amount : max, lot.price);
    }
    lot.bidsCount = (lot.bidsCount || 0) + bids.length;
    return bids;
}).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());


export const sampleLotReviews: Review[] = sampleLots.flatMap(lot => {
    const numReviews = Math.floor(Math.random() * 4);
    const reviews: Review[] = [];
    const reviewUsers = ['Carlos S.', 'Maria P.', 'João L.', 'Ana R.', 'Leiloeiro Experiente', 'Comprador Satisfeito'];
    const reviewTexts = [
        'Ótimo item! Exatamente como descrito. Chegou rápido.',
        'Conforme descrito. Vendedor atencioso.',
        'Entrega rápida e produto em perfeito estado. Recomendo!',
        'Tudo certo com a compra, satisfeito.',
        'Pequeno detalhe não mencionado, mas nada grave.',
        'Excelente aquisição, superou minhas expectativas!',
        'Bom valor pelo preço. Compraria novamente.',
        'Lote interessante, mas não arrematei.',
    ];
    for (let i = 0; i < numReviews; i++) {
        reviews.push({
            id: `REV-${lot.id}-${uuidv4().substring(0,8)}`,
            lotId: lot.id,
            auctionId: lot.auctionId,
            userId: `userRev${i}${Math.floor(Math.random()*1000)}`,
            userDisplayName: reviewUsers[Math.floor(Math.random() * reviewUsers.length)],
            rating: Math.floor(Math.random() * 2) + 4, // 4 ou 5 estrelas
            comment: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
            createdAt: createPastDate(Math.floor(Math.random() * 20) + 1, undefined, undefined, lot.endDate ? new Date(lot.endDate) : undefined),
            updatedAt: createPastDate(Math.floor(Math.random() * 10), undefined, undefined, lot.endDate ? new Date(lot.endDate) : undefined)
        });
    }
    return reviews;
});

export const sampleLotQuestions: LotQuestion[] = sampleLots.flatMap(lot => {
    const numQuestions = Math.floor(Math.random() * 3);
    const questions: LotQuestion[] = [];
    const questionUsers = ['Interessado X', 'Comprador Y', 'Visitante Z', 'Possível Licitante'];
    const questionSamples = [
        'Qual o estado de conservação real do motor?',
        'Aceita troca por um modelo mais novo com volta?',
        'Qual o valor do frete para o CEP 00000-000?',
        'Possui algum detalhe que não está evidente nas fotos?',
        'A documentação está em dia?',
        'É possível visitar o item antes de dar o lance?',
    ];
    const answerSamples = [
        'O motor está em bom estado, revisado recentemente. Sem vazamentos.',
        'Apenas venda, obrigado pelo interesse.',
        'Sim, entregamos. O frete para sua região fica em torno de R$ XXX,XX. Confirme após o arremate.',
        'Não, todos os detalhes relevantes estão na descrição e fotos. O item é vendido no estado em que se encontra.',
        'Sim, documentação 2024 totalmente em dia e sem débitos.',
        'Visitação mediante agendamento. Contate-nos para mais informações.',
    ];
    for (let i = 0; i < numQuestions; i++) {
        const hasAnswer = Math.random() > 0.25; // 75% de chance de ter resposta
        const questionDate = createPastDate(Math.floor(Math.random() * 10) + 2, undefined, undefined, lot.endDate ? new Date(lot.endDate) : undefined);
        const answerDate = hasAnswer ? createPastDate(Math.floor(Math.random() * 2) + 1, undefined, undefined, questionDate) : undefined;

        questions.push({
            id: `QST-${lot.id}-${uuidv4().substring(0,8)}`,
            lotId: lot.id,
            auctionId: lot.auctionId,
            userId: `userQst${i}${Math.floor(Math.random()*1000)}`,
            userDisplayName: questionUsers[Math.floor(Math.random() * questionUsers.length)],
            questionText: questionSamples[Math.floor(Math.random() * questionSamples.length)],
            createdAt: questionDate,
            isPublic: true,
            answerText: hasAnswer ? answerSamples[Math.floor(Math.random() * answerSamples.length)] : undefined,
            answeredAt: answerDate,
            answeredByUserId: hasAnswer ? (lot.sellerId || 'seller-admin-placeholder') : undefined,
            answeredByUserDisplayName: hasAnswer ? (lot.sellerName || 'Vendedor') : undefined,
        });
    }
    return questions;
});


export const sampleUserBids: UserBid[] = [
  { id: 'BID001', lotId: 'LOTEVEI001', auctionId: '300724car', lotTitle: sampleLots.find(l => l.id === 'LOTEVEI001')?.title || '', lotImageUrl: sampleLots.find(l => l.id === 'LOTEVEI001')?.imageUrl || '', userBidAmount: 67000, currentLotPrice: sampleLots.find(l => l.id === 'LOTEVEI001')?.price || 0, bidStatus: 'PERDENDO', bidDate: createPastDate(0, 2), lotEndDate: sampleLots.find(l => l.id === 'LOTEVEI001')?.endDate || new Date() },
  { id: 'BID002', lotId: 'LOTE001', auctionId: '100625bra', lotTitle: sampleLots.find(l => l.id === 'LOTE001')?.title || '', lotImageUrl: sampleLots.find(l => l.id === 'LOTE001')?.imageUrl || '', userBidAmount: 45000, currentLotPrice: sampleLots.find(l => l.id === 'LOTE001')?.price || 0, bidStatus: 'GANHANDO', bidDate: createPastDate(1, 0), lotEndDate: sampleLots.find(l => l.id === 'LOTE001')?.endDate || new Date() },
  { id: 'BID003', lotId: 'LOTE003', auctionId: '100625bra', lotTitle: sampleLots.find(l => l.id === 'LOTE003')?.title || '', lotImageUrl: sampleLots.find(l => l.id === 'LOTE003')?.imageUrl || '', userBidAmount: 105000, currentLotPrice: sampleLots.find(l => l.id === 'LOTE003')?.price || 0, bidStatus: 'ARREMATADO', bidDate: createPastDate(2, 1), lotEndDate: sampleLots.find(l => l.id === 'LOTE003')?.endDate || new Date() },
  { id: 'BID004', lotId: 'LOTEVCLASS001', auctionId: 'CLASSICVEH24', lotTitle: sampleLots.find(l => l.id === 'LOTEVCLASS001')?.title || '', lotImageUrl: sampleLots.find(l => l.id === 'LOTEVCLASS001')?.imageUrl || '', userBidAmount: 250000, currentLotPrice: sampleLots.find(l => l.id === 'LOTEVCLASS001')?.price || 0, bidStatus: 'GANHANDO', bidDate: createPastDate(0, 1), lotEndDate: sampleLots.find(l => l.id === 'LOTEVCLASS001')?.endDate || new Date() },
];

export const sampleUserWins: UserWin[] = [
    { id: 'WIN001', lot: sampleLots.find(l => l.id === 'LOTE003')!, winningBidAmount: 105000, winDate: (sampleLots.find(l => l.id === 'LOTE003')!.endDate as Date), paymentStatus: 'PAGO', invoiceUrl: '/invoices/inv-lote003.pdf' },
    { id: 'WIN002', lot: sampleLots.find(l => l.id === 'LOTE006')!, winningBidAmount: 365000, winDate: (sampleLots.find(l => l.id === 'LOTE006')!.endDate as Date), paymentStatus: 'PENDENTE' }
];

export const sampleDirectSaleOffers: DirectSaleOffer[] = sampleDirectSaleOffersRaw.map(offer => ({
    ...offer,
    createdAt: createPastDate(Math.floor(Math.random() * 60) + 1),
    updatedAt: createPastDate(Math.floor(Math.random() * 30)),
    expiresAt: offer.status === 'EXPIRED' ? createPastDate(Math.floor(Math.random() * 10) + 1) : createFutureDate(Math.floor(Math.random() * 30) + 5),
}));

export const sampleMediaItems: MediaItem[] = sampleMediaItemsRaw.map(item => ({
    ...item,
    uploadedAt: createPastDate(Math.floor(Math.random() * 30) + 1),
    linkedLotIds: sampleLots.filter(l => l.mediaItemIds?.includes(item.id)).map(l => l.id),
}));

export const sampleDocumentTypes: DocumentType[] = [
  { id: 'DT001', name: 'Documento de Identidade (Frente)', description: 'Foto nítida da frente do seu RG ou CNH.', isRequired: true, allowedFormats: ['JPG', 'PNG', 'PDF'], displayOrder: 1 },
  { id: 'DT002', name: 'Documento de Identidade (Verso)', description: 'Foto nítida do verso do seu RG ou CNH.', isRequired: true, allowedFormats: ['JPG', 'PNG', 'PDF'], displayOrder: 2 },
  { id: 'DT004', name: 'Comprovante de Residência', description: 'Conta de água, luz ou telefone recente (últimos 3 meses).', isRequired: true, allowedFormats: ['PDF', 'JPG', 'PNG'], displayOrder: 3 },
  { id: 'DT003', name: 'CPF', description: 'Foto nítida do seu CPF (caso não conste no RG/CNH).', isRequired: false, allowedFormats: ['JPG', 'PNG', 'PDF'], displayOrder: 4 },
  { id: 'DT005', name: 'Certidão de Casamento (se aplicável)', description: 'Caso seja casado(a), envie a certidão.', isRequired: false, allowedFormats: ['PDF', 'JPG', 'PNG'], displayOrder: 5 },
];

export const sampleUserDocuments: UserDocument[] = [
  { id: 'UD001', documentTypeId: 'DT001', userId: 'user123', status: 'APPROVED', uploadDate: createPastDate(5), analysisDate: createPastDate(4), fileUrl: '#', documentType: sampleDocumentTypes.find(dt => dt.id === 'DT001')! },
  { id: 'UD002', documentTypeId: 'DT002', userId: 'user123', status: 'REJECTED', uploadDate: createPastDate(5), analysisDate: createPastDate(4), rejectionReason: 'Imagem ilegível. Por favor, envie uma foto com melhor qualidade.', fileUrl: '#', documentType: sampleDocumentTypes.find(dt => dt.id === 'DT002')! },
  { id: 'UD003', documentTypeId: 'DT003', userId: 'user123', status: 'NOT_SENT', documentType: sampleDocumentTypes.find(dt => dt.id === 'DT003')! },
  { id: 'UD004', documentTypeId: 'DT004', userId: 'user123', status: 'PENDING_ANALYSIS', uploadDate: createPastDate(1), fileUrl: '#', documentType: sampleDocumentTypes.find(dt => dt.id === 'DT004')! },
];

export const sampleUserHabilitationStatus: UserHabilitationStatus = 'PENDING_DOCUMENTS';

// Atualiza sampleLots para incluir auctionName e sellerName se não existirem
sampleLots.forEach(lot => {
  if (!lot.auctionName) {
    const parentAuction = sampleAuctions.find(a => a.id === lot.auctionId);
    lot.auctionName = parentAuction?.title || 'Leilão Desconhecido';
  }
  if (!lot.sellerName) {
    const parentAuction = sampleAuctions.find(a => a.id === lot.auctionId);
    const sellerFromSample = sampleSellers.find(s => s.id === lot.sellerId || s.name === parentAuction?.seller);
    lot.sellerName = sellerFromSample?.name || parentAuction?.seller || 'Vendedor Desconhecido';
  }
  if(!lot.publicId) {
      lot.publicId = `LOT-PUB-${slugify(lot.title.substring(0,6))}-${lot.id.substring(0,4)}`;
  }
  const categoryInfo = sampleLotCategories.find(c => c.id === lot.categoryId || c.slug === lot.categoryId || c.name === lot.type);
  if(categoryInfo) lot.type = categoryInfo.name;

  const stateInfo = sampleStates.find(s => s.id === lot.stateId || s.uf === lot.stateUf);
  if(stateInfo) lot.stateUf = stateInfo.uf;

  const cityInfo = sampleCities.find(c => c.id === lot.cityId || c.name === lot.cityName && c.stateId === lot.stateId);
  if(cityInfo) lot.cityName = cityInfo.name;
});

sampleAuctions.forEach(auction => {
    if (!auction.publicId) {
        auction.publicId = `AUC-PUB-${slugify(auction.title.substring(0,6))}-${auction.id.substring(0,4)}`;
    }
    const categoryInfo = sampleLotCategories.find(c => c.id === auction.categoryId || c.name === auction.category || c.slug === auction.category);
    if(categoryInfo) auction.category = categoryInfo.name;

    const auctioneerInfo = sampleAuctioneers.find(auc => auc.id === auction.auctioneerId || auc.name === auction.auctioneer || auc.slug === auction.auctioneer);
    if(auctioneerInfo) auction.auctioneer = auctioneerInfo.name;

    const sellerInfo = sampleSellers.find(s => s.id === auction.sellerId || s.name === auction.seller || s.slug === auction.seller);
    if(sellerInfo) auction.seller = sellerInfo.name;

    if (!auction.lots || auction.lots.length === 0) {
        auction.lots = sampleLots.filter(l => l.auctionId === auction.id);
        auction.totalLots = auction.lots.length;
    } else {
         auction.lots.forEach(lot => {
            if(!lot.auctionName) lot.auctionName = auction.title;
            if(!lot.sellerName && auction.seller) lot.sellerName = auction.seller;
        });
    }
});

const defaultMentalTriggerSettings: MentalTriggerSettings = {
    showDiscountBadge: true,
    showUrgencyTimer: true,
    showPopularityBadge: true,
    popularityViewThreshold: 500,
    showHotBidBadge: true,
    hotBidThreshold: 10,
    showExclusiveBadge: true,
};

const defaultHomepageSections: HomepageSectionConfig[] = [
    { id: 'hero', type: 'hero_carousel', title: 'Destaques Principais', visible: true, order: 1 },
    { id: 'filter_links', type: 'filter_links', title: 'Explorar por Tipo', visible: true, order: 2 },
    { id: 'featured_lots', type: 'featured_lots', title: 'Lotes em Destaque', visible: true, order: 3, itemCount: 10 },
    // Removida promo_banner_1
    { id: 'active_auctions', type: 'active_auctions', title: 'Leilões Ativos', visible: true, order: 4, itemCount: 10 }, // Ordem ajustada
];


export const samplePlatformSettings: PlatformSettings = {
  id: 'global',
  siteTitle: 'BidExpert Leilões',
  siteTagline: 'Sua plataforma definitiva para leilões online.',
  galleryImageBasePath: '/uploads/lotes/',
  activeThemeName: 'Padrão BidExpert',
  themes: [
    {
      name: 'Padrão BidExpert',
      colors: {
        '--background': 'hsl(0 0% 100%)',
        '--foreground': 'hsl(0 0% 3.9%)',
        '--primary': 'hsl(25 95% 53%)',
        '--primary-foreground': 'hsl(0 0% 100%)',
        '--secondary': 'hsl(0 0% 96.1%)', 
        '--accent': 'hsl(25 95% 95%)',
      }
    }
  ],
  platformPublicIdMasks: {
    auctions: "LEIL-",
    lots: "LOTE-",
    auctioneers: "LEILOE-",
    sellers: "COMIT-"
  },
  mentalTriggerSettings: defaultMentalTriggerSettings,
  homepageSections: defaultHomepageSections,
  updatedAt: new Date()
};

export function getPlaceholderIfEmpty(value: string | number | null | undefined, placeholder: string = '-'): string {
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
        return placeholder;
    }
    return String(value);
}

```
  </change>
  <change>
    <file>/home/user/studio/src/components/lot-card.tsx</file>
    <content><![CDATA[
'use client';

import type { Lot } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Share2, MapPin, Eye, ListChecks, DollarSign, CalendarDays, Clock, Users, Gavel, Building, Car, Truck, Info, X, Facebook, MessageSquareText, Mail, Percent, Zap, TrendingUp, Crown } from 'lucide-react';
import { format, differenceInDays, differenceInHours, differenceInMinutes, isPast, differenceInSeconds } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { getAuctionStatusText, getLotStatusColor, sampleAuctions } from '@/lib/sample-data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { isLotFavoriteInStorage, addFavoriteLotIdToStorage, removeFavoriteLotIdFromStorage } from '@/lib/favorite-store';
import LotPreviewModal from './lot-preview-modal'; 
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'; 

interface TimeRemainingBadgeProps {
  endDate: Date | string;
  status: Lot['status'];
}

const TimeRemainingBadge: React.FC<TimeRemainingBadgeProps> = ({ endDate, status }) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isEndingSoon, setIsEndingSoon] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const end = endDate instanceof Date ? endDate : new Date(endDate);

      if (isPast(end) || status !== 'ABERTO_PARA_LANCES') {
        setTimeRemaining(getAuctionStatusText(status === 'ABERTO_PARA_LANCES' && isPast(end) ? 'ENCERRADO' : status));
        setIsEndingSoon(false);
        return;
      }

      const totalSeconds = differenceInSeconds(end, now);
      if (totalSeconds <= 0) {
        setTimeRemaining('Encerrado');
        setIsEndingSoon(false);
        return;
      }

      const days = Math.floor(totalSeconds / (3600 * 24));
      const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      setIsEndingSoon(days === 0 && hours < 2); // Considera "em breve" se menos de 2 horas

      if (days > 0) setTimeRemaining(`${days}d ${hours}h`);
      else if (hours > 0) setTimeRemaining(`${hours}h ${minutes}m`);
      else if (minutes > 0) setTimeRemaining(`${minutes}m ${seconds}s`);
      else if (seconds > 0) setTimeRemaining(`${seconds}s`);
      else setTimeRemaining('Encerrando!');
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endDate, status]);

  return (
    <Badge variant={isEndingSoon ? "destructive" : "outline"} className="text-xs font-medium">
      <Clock className="h-3 w-3 mr-1" />
      {timeRemaining}
    </Badge>
  );
};


interface LotCardProps {
  lot: Lot;
}

const LotCardClientContent: React.FC<LotCardProps> = ({ lot }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [lotDetailUrl, setLotDetailUrl] = useState<string>(`/auctions/${lot.auctionId}/lots/${lot.id}`);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false); 
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLotDetailUrl(`${window.location.origin}/auctions/${lot.auctionId}/lots/${lot.id}`);
      setIsFavorite(isLotFavoriteInStorage(lot.id));
    }
  }, [lot.id, lot.auctionId]);

  useEffect(() => {
    if (lot && lot.id) {
        setIsFavorite(isLotFavoriteInStorage(lot.id));
    }
  }, [lot?.id]);


  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState); 

    if (newFavoriteState) {
      addFavoriteLotIdToStorage(lot.id);
    } else {
      removeFavoriteLotIdFromStorage(lot.id);
    }
    
    toast({
      title: newFavoriteState ? "Adicionado aos Favoritos" : "Removido dos Favoritos",
      description: `O lote "${lot.title}" foi ${newFavoriteState ? 'adicionado à' : 'removido da'} sua lista.`,
    });
  };
  
  const handlePreviewOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPreviewModalOpen(true);
  };

  const getSocialLink = (platform: 'x' | 'facebook' | 'whatsapp' | 'email', url: string, title: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    switch(platform) {
      case 'x':
        return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      case 'whatsapp':
        return `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
      case 'email':
        return `mailto:?subject=${encodedTitle}&body=${encodedUrl}`;
    }
  }
  
  const getTypeIcon = (type: string) => {
    const upperType = type.toUpperCase();
    if (upperType.includes('CASA') || upperType.includes('IMÓVEL') || upperType.includes('APARTAMENTO')) {
        return <Building className="h-3 w-3 text-muted-foreground" />;
    }
    if (upperType.includes('VEÍCULO') || upperType.includes('AUTOMÓVEL') || upperType.includes('CARRO')) {
        return <Car className="h-3 w-3 text-muted-foreground" />;
    }
    if (upperType.includes('MAQUINÁRIO') || upperType.includes('TRATOR')) {
        return <Truck className="h-3 w-3 text-muted-foreground" />;
    }
    return <Info className="h-3 w-3 text-muted-foreground" />;
  };

  const displayLocation = lot.cityName && lot.stateUf ? `${lot.cityName} - ${lot.stateUf}` : lot.stateUf || lot.cityName || 'Não informado';

  const discountPercentage = useMemo(() => {
    if (lot.initialPrice && lot.secondInitialPrice && lot.secondInitialPrice < lot.initialPrice && (lot.status === 'ABERTO_PARA_LANCES' || lot.status === 'EM_BREVE')) { // Considerar status para desconto
      return Math.round(((lot.initialPrice - lot.secondInitialPrice) / lot.initialPrice) * 100);
    }
    return lot.discountPercentage || 0;
  }, [lot.initialPrice, lot.secondInitialPrice, lot.status, lot.discountPercentage]);


  const mentalTriggers = useMemo(() => {
    const triggers = lot.additionalTriggers ? [...lot.additionalTriggers] : [];
    // Simulação de configurações da plataforma para popularidade e lances quentes
    const platformSettings = { mentalTriggerSettings: { popularityViewThreshold: 500, hotBidThreshold: 10, showPopularityBadge: true, showHotBidBadge: true, showExclusiveBadge: true, showDiscountBadge: true, showUrgencyTimer: true }};

    if (platformSettings.mentalTriggerSettings?.showPopularityBadge && (lot.views || 0) > (platformSettings.mentalTriggerSettings.popularityViewThreshold || 500)) {
      triggers.push('MAIS VISITADO');
    }
    if (platformSettings.mentalTriggerSettings?.showHotBidBadge && (lot.bidsCount || 0) > (platformSettings.mentalTriggerSettings.hotBidThreshold || 10) && lot.status === 'ABERTO_PARA_LANCES') {
      triggers.push('LANCE QUENTE');
    }
    if (platformSettings.mentalTriggerSettings?.showExclusiveBadge && lot.isExclusive) {
        triggers.push('EXCLUSIVO');
    }
    return triggers;
  }, [lot.views, lot.bidsCount, lot.status, lot.additionalTriggers, lot.isExclusive]);


  return (
    <>
    <Card className="flex flex-col overflow-hidden h-full shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg group">
      <div className="relative">
        <Link href={`/auctions/${lot.auctionId}/lots/${lot.id}`} className="block">
          <div className="aspect-[16/10] relative bg-muted">
            <Image
              src={lot.imageUrl}
              alt={lot.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              data-ai-hint={lot.dataAiHint || 'imagem lote'}
            />
            {/* Main Status Badge */}
            <Badge className={`absolute top-2 left-2 text-xs px-2 py-1 z-10 ${getLotStatusColor(lot.status)}`}>
              {getAuctionStatusText(lot.status)}
            </Badge>
            
            {/* Mental Trigger Badges - stack below main status or to the right */}
            <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10">
              {discountPercentage > 0 && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0.5 animate-pulse">
                  <Percent className="h-3 w-3 mr-1" /> {discountPercentage}% OFF
                </Badge>
              )}
              {mentalTriggers.map(trigger => (
                <Badge key={trigger} variant="secondary" className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 border-amber-300">
                  {trigger === 'MAIS VISITADO' && <TrendingUp className="h-3 w-3 mr-1" />}
                  {trigger === 'LANCE QUENTE' && <Zap className="h-3 w-3 mr-1 text-red-500 fill-red-500" />}
                  {trigger === 'EXCLUSIVO' && <Crown className="h-3 w-3 mr-1 text-purple-600" />}
                  {trigger}
                </Badge>
              ))}
            </div>

            <div className="absolute top-10 right-2 flex flex-col space-y-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-7 w-7 bg-background/80 hover:bg-background" onClick={handleFavoriteToggle} aria-label={isFavorite ? "Desfavoritar" : "Favoritar"}>
                    <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{isFavorite ? "Desfavoritar" : "Favoritar"}</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-7 w-7 bg-background/80 hover:bg-background" onClick={handlePreviewOpen} aria-label="Pré-visualizar Lote">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Pré-visualizar Lote</p></TooltipContent>
              </Tooltip>
              <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-7 w-7 bg-background/80 hover:bg-background" aria-label="Compartilhar">
                        <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent><p>Compartilhar</p></TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <a href={getSocialLink('x', lotDetailUrl, lot.title)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs">
                      <X className="h-3.5 w-3.5" /> X (Twitter)
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={getSocialLink('facebook', lotDetailUrl, lot.title)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs">
                      <Facebook className="h-3.5 w-3.5" /> Facebook
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={getSocialLink('whatsapp', lotDetailUrl, lot.title)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs">
                      <MessageSquareText className="h-3.5 w-3.5" /> WhatsApp
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={getSocialLink('email', lotDetailUrl, lot.title)} className="flex items-center gap-2 text-xs">
                      <Mail className="h-3.5 w-3.5" /> Email
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Link>
      </div>

      <CardContent className="p-3 flex-grow space-y-1.5">
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{displayLocation}</span>
          </div>
          <div className="flex items-center gap-1">
            {getTypeIcon(lot.type)}
            <span>{lot.type}</span>
          </div>
        </div>

        <Link href={`/auctions/${lot.auctionId}/lots/${lot.id}`}>
          <h3 className="text-sm font-semibold hover:text-primary transition-colors leading-tight min-h-[2.2em] line-clamp-2">
            {lot.title}
          </h3>
        </Link>
        
        <div className="flex justify-between items-center text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
                <ListChecks className="h-3 w-3" />
                <span>{lot.auctionName}</span>
            </div>
            <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{lot.views}</span>
            </div>
        </div>
      </CardContent>

      <CardFooter className="p-3 border-t flex-col items-start space-y-1.5">
        <div className="w-full">
          <p className="text-xs text-muted-foreground">Lance Mínimo</p>
          <p className={`text-xl font-bold ${isPast(new Date(lot.endDate)) ? 'text-muted-foreground line-through' : 'text-primary'}`}>
            R$ {lot.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className={`flex items-center text-xs text-muted-foreground ${isPast(new Date(lot.endDate)) ? 'line-through' : ''}`}>
          <CalendarDays className="h-3 w-3 mr-1" />
          <span>{format(new Date(lot.endDate), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
        </div>
        
        <div className="w-full flex justify-between items-center text-xs">
            <TimeRemainingBadge endDate={lot.endDate} status={lot.status} />
            <div className={`flex items-center gap-1 ${isPast(new Date(lot.endDate)) ? 'text-muted-foreground line-through' : ''}`}>
                <Gavel className="h-3 w-3" />
                <span>{lot.bidsCount || 0} Lances</span>
            </div>
            <span className={`font-semibold ${isPast(new Date(lot.endDate)) ? 'text-muted-foreground line-through' : 'text-foreground'}`}>Lote {lot.number || lot.id.replace('LOTE', '')}</span>
        </div>
         <Button asChild className="w-full mt-2" size="sm">
            <Link href={`/auctions/${lot.auctionId}/lots/${lot.id}`}>Ver Detalhes do Lote</Link>
        </Button>
      </CardFooter>
    </Card>
    <LotPreviewModal
        lot={lot}
        auction={sampleAuctions.find(a => a.id === lot.auctionId)} // Pass the parent auction if available
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
      />
    </>
  );
}


export default function LotCard({ lot }: LotCardProps) {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
      setIsClient(true);
    }, []);
  
    if (!isClient) {
      return (
        <Card className="flex flex-col overflow-hidden h-full shadow-md rounded-lg group">
             <div className="relative aspect-[16/10] bg-muted animate-pulse"></div>
             <CardContent className="p-3 flex-grow space-y-1.5">
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                <div className="h-8 bg-muted rounded w-full animate-pulse mt-1"></div>
                <div className="h-4 bg-muted rounded w-1/2 animate-pulse mt-1"></div>
             </CardContent>
             <CardFooter className="p-3 border-t flex-col items-start space-y-1.5">
                <div className="h-6 bg-muted rounded w-1/3 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-1/2 animate-pulse mt-1"></div>
                <div className="h-4 bg-muted rounded w-full animate-pulse mt-1"></div>
                 <div className="h-8 bg-muted rounded w-full animate-pulse mt-2"></div>
             </CardFooter>
        </Card>
      );
    }
  
    return <LotCardClientContent lot={lot} />;
  }

    

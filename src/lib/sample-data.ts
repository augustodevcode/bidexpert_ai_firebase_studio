
import type { Auction, Lot, AuctionStatus, LotStatus, DocumentType, UserDocument, UserHabilitationStatus, UserDocumentStatus, UserBid, UserBidStatus, UserWin, PaymentStatus, SellerProfileInfo, RecentlyViewedLotInfo, AuctioneerProfileInfo, DirectSaleOffer, DirectSaleOfferType, DirectSaleOfferStatus, BidInfo, Review, LotQuestion, LotCategory, StateInfo, CityInfo, MediaItem, PlatformSettings } from '@/types';
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

const createPastDate = (days: number, hours: number = 0, minutes: number = 0) => {
    const date = new Date(now);
    date.setDate(now.getDate() - days);
    date.setHours(now.getHours() - hours);
    date.setMinutes(now.getMinutes() - minutes);
    return date; 
};

export const slugify = (text: string): string => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD") 
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

export const sampleLotCategories: LotCategory[] = [
  { id: 'cat1', name: 'Imóveis', slug: 'imoveis', description: 'Casas, apartamentos, terrenos.', itemCount: 5, createdAt: createPastDate(30), updatedAt: createPastDate(2) },
  { id: 'cat2', name: 'Veículos', slug: 'veiculos', description: 'Carros, motos, caminhões.', itemCount: 8, createdAt: createPastDate(30), updatedAt: createPastDate(2) },
  { id: 'cat3', name: 'Maquinário Agrícola', slug: 'maquinario-agricola', description: 'Tratores, colheitadeiras, implementos.', itemCount: 3, createdAt: createPastDate(30), updatedAt: createPastDate(2) },
  { id: 'cat4', name: 'Arte e Antiguidades', slug: 'arte-e-antiguidades', description: 'Pinturas, esculturas, móveis antigos.', itemCount: 2, createdAt: createPastDate(30), updatedAt: createPastDate(2) },
  { id: 'cat5', name: 'Eletrônicos', slug: 'eletronicos', description: 'Celulares, computadores, TVs.', itemCount: 4, createdAt: createPastDate(30), updatedAt: createPastDate(2) },
];

export const sampleStates: StateInfo[] = [
    { id: 'state-al', name: 'Alagoas', uf: 'AL', slug: 'alagoas', cityCount: 1, createdAt: new Date(), updatedAt: new Date() },
    { id: 'state-ba', name: 'Bahia', uf: 'BA', slug: 'bahia', cityCount: 1, createdAt: new Date(), updatedAt: new Date() },
    { id: 'state-sp', name: 'São Paulo', uf: 'SP', slug: 'sao-paulo', cityCount: 2, createdAt: new Date(), updatedAt: new Date() },
];

export const sampleCities: CityInfo[] = [
    { id: 'city-teo-al', name: 'TEOTÔNIO VILELA', slug: 'teotonio-vilela', stateId: 'state-al', stateUf: 'AL', ibgeCode: '2709152', createdAt: new Date(), updatedAt: new Date() },
    { id: 'city-salvador-ba', name: 'SALVADOR', slug: 'salvador', stateId: 'state-ba', stateUf: 'BA', ibgeCode: '2927408', createdAt: new Date(), updatedAt: new Date() },
    { id: 'city-sao-paulo-sp', name: 'São Paulo', slug: 'sao-paulo', stateId: 'state-sp', stateUf: 'SP', ibgeCode: '3550308', createdAt: new Date(), updatedAt: new Date() },
    { id: 'city-campinas-sp', name: 'Campinas', slug: 'campinas', stateId: 'state-sp', stateUf: 'SP', ibgeCode: '3509502', createdAt: new Date(), updatedAt: new Date() },
];


export const sampleLots: Lot[] = [
  {
    id: 'LOTE001', auctionId: '100625bra', publicId: 'LOT-CASACENT-ABC123X1', title: 'CASA COM 129,30 M² - CENTRO', imageUrl: 'https://placehold.co/800x600.png?text=Casa+Centro', dataAiHint: 'casa residencial', galleryImageUrls: ['https://placehold.co/150x100.png?text=Casa+Frente'], mediaItemIds: ['media-casa-frente'], status: 'ABERTO_PARA_LANCES', cityId: 'city-teo-al', stateId: 'state-al', cityName: 'TEOTÔNIO VILELA', stateUf: 'AL', type: 'Imóveis', categoryId: 'cat1', views: 1018, auctionName: 'Leilão Único Bradesco', price: 45000, endDate: createFutureDate(10, 2), bidsCount: 7, description: 'Casa residencial bem localizada no centro da cidade.', sellerName: 'Banco Bradesco S.A.', sellerId: 'banco-bradesco-s-a', lotSpecificAuctionDate: createFutureDate(10, 2)
  },
  {
    id: 'LOTEVEI001', auctionId: '300724car', publicId: 'LOT-2013AUDI-DEF456Y2', title: '2013 AUDI A4 PREMIUM PLUS', year: 2013, make: 'AUDI', model: 'A4', imageUrl: 'https://placehold.co/800x600.png?text=Audi+A4+2013', dataAiHint: 'carro sedan preto', galleryImageUrls: ['https://placehold.co/150x100.png?text=Audi+A4+Frente'], mediaItemIds: ['media-audi-frente'], status: 'ABERTO_PARA_LANCES', cityId: 'city-sao-paulo-sp', stateId: 'state-sp', cityName: 'São Paulo', stateUf: 'SP', type: 'Veículos', categoryId: 'cat2', views: 1560, auctionName: 'Leilão de Veículos Premium', price: 68500, endDate: createFutureDate(5, 10), bidsCount: 12, description: 'Audi A4 Premium Plus 2013, completo.', sellerName: 'Proprietário Particular', sellerId: 'prop-particular-1', lotSpecificAuctionDate: createFutureDate(5,10)
  },
  {
    id: 'LOTE003', auctionId: '100625bra', publicId: 'LOT-APTOCABU-GHI789Z3', title: 'APARTAMENTO COM 54,25 M² - CABULA', imageUrl: 'https://placehold.co/800x600.png?text=Apto+Cabula', dataAiHint: 'apartamento predio residencial', status: 'ENCERRADO', cityId: 'city-salvador-ba', stateId: 'state-ba', cityName: 'SALVADOR', stateUf: 'BA', type: 'Imóveis', categoryId: 'cat1', views: 754, auctionName: 'Leilão Único Bradesco', price: 105000, endDate: createPastDate(2), bidsCount: 15, description: 'Apartamento funcional no Cabula.', sellerName: 'Banco Bradesco S.A.', sellerId: 'banco-bradesco-s-a'
  },
  {
    id: 'LOTEART001', auctionId: 'ART001ANTIQ', publicId: 'LOT-PINTURAO-JKL012A4', title: 'Pintura a Óleo "Paisagem Toscana" - Séc. XIX', imageUrl: 'https://placehold.co/800x600.png?text=Paisagem+Toscana', dataAiHint: 'pintura oleo paisagem', status: 'ABERTO_PARA_LANCES', cityName: 'RIO DE JANEIRO', stateUf: 'RJ', type: 'Arte e Antiguidades', categoryId: 'cat4', views: 320, auctionName: 'Leilão de Arte e Antiguidades', price: 7500, endDate: createFutureDate(8, 0), bidsCount: 3, description: 'Belíssima pintura a óleo.', sellerName: 'Colecionador Particular RJ', sellerId: 'col-rj-1'
  },
  {
    id: 'LOTEVCLASS001', auctionId: 'CLASSICVEH24', publicId: 'LOT-1967FORD-MNO345B5', title: '1967 FORD MUSTANG FASTBACK', year: 1967, make: 'FORD', model: 'MUSTANG', imageUrl: 'https://placehold.co/800x600.png?text=Mustang+1967', dataAiHint: 'carro classico vermelho', status: 'ABERTO_PARA_LANCES', cityName: 'CURITIBA', stateUf: 'PR', type: 'Veículos', categoryId: 'cat2', views: 1850, auctionName: 'Leilão de Veículos Clássicos', price: 250000, endDate: createFutureDate(12, 0), bidsCount: 8, description: 'Icônico Ford Mustang Fastback 1967.', sellerName: 'Colecionador de Clássicos PR', sellerId: 'col-class-pr-1'
  },
  {
    id: 'LOTE005', auctionId: '20301vei', publicId: 'LOT-TRATORAG-PQR678C6', title: 'TRATOR AGRÍCOLA NEW HOLLAND T7', year: 2018, make: 'NEW HOLLAND', model: 'T7.245', imageUrl: 'https://images.unsplash.com/photo-1633153627433-b15010a9b2f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHx0cmFjdG9yJTIwbmglMjB0N3xlbnwwfHx8fDE3NDk5MjQ1Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080', dataAiHint: 'trator agricola campo', galleryImageUrls: ['https://placehold.co/150x100.png?text=Trator+Frente'], mediaItemIds: ['media-trator-frente'], status: 'ABERTO_PARA_LANCES', cityName: 'RIO VERDE', stateUf: 'GO', type: 'Maquinário Agrícola', categoryId: 'cat3', views: 305, auctionName: 'Leilão Online Agro', price: 180000, endDate: createFutureDate(7, 1), bidsCount: 3, isFeatured: true, description: 'Trator New Holland T7.245, ano 2018.', sellerName: 'Fazenda Boa Esperança', sellerId: 'faz-boa-esperanca'
  },
  {
    id: 'LOTE002', auctionId: '100625bra', publicId: 'LOT-CASAPORT-STU901D7', title: 'CASA COM 234,50 M² - PORTÃO', imageUrl: 'https://placehold.co/800x600.png?text=Casa+Portao', dataAiHint: 'casa moderna suburbio', status: 'ABERTO_PARA_LANCES', cityName: 'LAURO DE FREITAS', stateUf: 'BA', type: 'Imóveis', categoryId: 'cat1', views: 681, auctionName: 'Leilão Único Bradesco', price: 664000, endDate: createFutureDate(10, 5), bidsCount: 0, description: 'Espaçosa casa em Lauro de Freitas.', sellerName: 'Banco Bradesco S.A.', sellerId: 'banco-bradesco-s-a'
  },
  {
    id: 'LOTE004', auctionId: '100625bra', publicId: 'LOT-CASAVILA-VWX234E8', title: 'CASA COM 133,04 M² - VILA PERI', imageUrl: 'https://placehold.co/800x600.png?text=Casa+Vila+Peri', dataAiHint: 'casa terrea simples', status: 'EM_BREVE', cityName: 'FORTALEZA', stateUf: 'CE', type: 'Imóveis', categoryId: 'cat1', views: 527, auctionName: '1ª Praça Bradesco', price: 238000, endDate: createFutureDate(3, 0), bidsCount: 0, description: 'Casa em Fortaleza, boa localização.', sellerName: 'Banco Bradesco S.A.', sellerId: 'banco-bradesco-s-a'
  },
  {
    id: 'LOTE006', auctionId: '20301vei', publicId: 'LOT-COLHEITA-YZA567F9', title: 'COLHEITADEIRA JOHN DEERE S680', imageUrl: 'https://placehold.co/800x600.png?text=Colheitadeira+JD', dataAiHint: 'colheitadeira graos campo', status: 'ENCERRADO', cityName: 'CAMPO GRANDE', stateUf: 'MS', type: 'Maquinário Agrícola', categoryId: 'cat3', views: 450, auctionName: 'Leilão Físico e Online Agro', price: 365000, endDate: createPastDate(5), bidsCount: 12, description: 'Colheitadeira John Deere S680, usada.', sellerName: 'Produtor Rural MS', sellerId: 'prod-rural-ms'
  },
  {
    id: 'LOTEART002', auctionId: 'ART001ANTIQ', publicId: 'LOT-ESCULTUR-BCD890G0', title: 'Escultura em Bronze "O Pensador" - Réplica Assinada', imageUrl: 'https://placehold.co/800x600.png?text=Escultura+Pensador', dataAiHint: 'escultura bronze pensador', status: 'EM_BREVE', cityName: 'SÃO PAULO', stateUf: 'SP', type: 'Arte e Antiguidades', categoryId: 'cat4', views: 150, auctionName: 'Leilão de Arte e Antiguidades', price: 3200, endDate: createFutureDate(15, 0), bidsCount: 0, description: 'Réplica em bronze da famosa escultura.', sellerName: 'Galeria de Arte SP', sellerId: 'gal-arte-sp'
  },
  {
    id: 'LOTEVCLASS002', auctionId: 'CLASSICVEH24', publicId: 'LOT-1955PORS-EFG123H1', title: '1955 PORSCHE 356 SPEEDSTER - RÉPLICA', year: 1955, make: 'PORSCHE', model: '356 SPEEDSTER (RÉPLICA)', imageUrl: 'https://placehold.co/800x600.png?text=Porsche+356+Replica', dataAiHint: 'carro conversivel prata antigo', status: 'ABERTO_PARA_LANCES', cityName: 'BELO HORIZONTE', stateUf: 'MG', type: 'Veículos', categoryId: 'cat2', views: 990, auctionName: 'Leilão de Veículos Clássicos', price: 180000, endDate: createFutureDate(10, 0), bidsCount: 5, description: 'Excelente réplica do Porsche 356 Speedster.', sellerName: 'Restauradora de Clássicos MG', sellerId: 'rest-class-mg'
  },
  {
    id: 'LOTEUTIL001', auctionId: '300724car', publicId: 'LOT-2019FIAT-HIJ456I2', title: '2019 FIAT FIORINO 1.4 FLEX', year: 2019, make: 'FIAT', model: 'FIORINO', imageUrl: 'https://placehold.co/800x600.png?text=Fiat+Fiorino+2019', dataAiHint: 'furgoneta branca cidade', status: 'ABERTO_PARA_LANCES', cityName: 'Porto Alegre', stateUf: 'RS', type: 'Veículos', categoryId: 'cat2', views: 720, auctionName: 'Leilão de Veículos Premium', price: 55000, endDate: createFutureDate(3, 5), bidsCount: 6, description: 'Fiat Fiorino 2019, ideal para trabalho.', sellerName: 'Empresa de Logística RS', sellerId: 'log-rs-1'
  },
  {
    id: 'LOTEFIN001', auctionId: 'XYZBANK001', publicId: 'LOT-APTOCABE-KLM789J3', title: 'Apartamento 3 Quartos - Cobertura - Barra da Tijuca', imageUrl: 'https://placehold.co/800x600.png?text=Cobertura+Barra', dataAiHint: 'cobertura vista mar', status: 'ABERTO_PARA_LANCES', cityName: 'Rio de Janeiro', stateUf: 'RJ', type: 'Imóveis', categoryId: 'cat1', views: 500, auctionName: 'Leilão Especial Banco XYZ', price: 1200000, endDate: createFutureDate(15, 0), bidsCount: 2, description: 'Cobertura duplex com vista para o mar.', sellerName: 'Banco XYZ', sellerId: 'banco-xyz'
  },
  {
    id: 'LOTE007', auctionId: 'XYZBANK001', publicId: 'LOT-CASATEST-TST123A0', title: 'Casa Teste Leilão XYZ', imageUrl: 'https://placehold.co/800x600.png?text=Casa+Teste', dataAiHint: 'casa simples teste', status: 'EM_BREVE', cityName: 'Niterói', stateUf: 'RJ', type: 'Imóveis', categoryId: 'cat1', views: 10, auctionName: 'Leilão Especial Banco XYZ', price: 150000, endDate: createFutureDate(16,0), bidsCount: 0, description: 'Casa para teste no leilão do Banco XYZ.', sellerName: 'Banco XYZ', sellerId: 'banco-xyz'
  }
];

export const sampleAuctions: Auction[] = [
  {
    id: '100625bra', publicId: 'LEI-LEILOUNI-E9F3G7H2', title: 'Leilão Único Bradesco', fullTitle: 'Grande Leilão de Imóveis Bradesco - Oportunidades Imperdíveis', auctionDate: createFutureDate(0, 1), totalLots: 0, status: 'ABERTO', auctioneer: 'VICENTE PAULO - JUCEMA N° 12/96', category: 'Extrajudicial', auctioneerLogoUrl: 'https://placehold.co/150x50.png?text=Bradesco&font=roboto', visits: 16913, lots: [], imageUrl: 'https://placehold.co/150x75.png?text=Leilao+Bradesco&font=roboto', dataAiHint: 'logo banco leilao', seller: 'Banco Bradesco S.A.', sellerId: 'banco-bradesco-s-a', sellingBranch: 'Bradesco Matriz', city: 'São Paulo', state: 'SP', auctionStages: [{ name: "1ª Praça", endDate: createFutureDate(10, 5), statusText: "Encerramento 1ª Praça" }, { name: "2ª Praça", endDate: createFutureDate(20, 5), statusText: "Encerramento 2ª Praça" }], initialOffer: 45000, createdAt: createPastDate(30), updatedAt: createPastDate(1)
  },
  {
    id: '20301vei', publicId: 'LEI-LEILOMAQ-A1B2C3D4', title: 'Leilão Maquinário Pesado', fullTitle: 'Leilão de Tratores e Colheitadeiras Usadas', auctionDate: createFutureDate(0, 2), totalLots: 0, status: 'ABERTO_PARA_LANCES', auctioneer: 'AGROLEILÕES LTDA - MATRICULA XYZ/00', category: 'Maquinário Agrícola', auctioneerLogoUrl: 'https://placehold.co/150x75.png?text=AgroLeiloes&font=roboto', visits: 8750, lots: [], imageUrl: 'https://placehold.co/150x75.png?text=Leilao+Agro&font=roboto', dataAiHint: 'logo leilao agro', seller: 'Diversos Comitentes Agro', sellerId: 'div-comitentes-agro', sellingBranch: 'AgroLeilões Central', city: 'Rio Verde', state: 'GO', auctionStages: [{ name: "Leilão Online", endDate: createFutureDate(7, 1), statusText: "Encerramento Lances" }], initialOffer: 180000, createdAt: createPastDate(25), updatedAt: createPastDate(2)
  },
  {
    id: '300724car', publicId: 'LEI-LEILOVEI-X5Y6Z7W8', title: 'Leilão Veículos Premium', fullTitle: 'Leilão de Veículos Seminovos e de Luxo', auctionDate: createFutureDate(0, 3), totalLots: 0, status: 'ABERTO', auctioneer: 'SUPERBID Leilões - JUCESP Nº 123', category: 'Veículos', auctioneerLogoUrl: 'https://placehold.co/150x75.png?text=SuperBid&font=roboto', visits: 12345, lots: [], imageUrl: 'https://placehold.co/150x75.png?text=Leilao+Veiculos&font=roboto', dataAiHint: 'logo leilao carros', seller: 'Diversos Proprietários e Financeiras', sellerId: 'div-prop-finan', sellingBranch: 'Pátio SuperBid SP', city: 'São Paulo', state: 'SP', auctionStages: [{ name: "Fase de Lances Online", endDate: createFutureDate(5, 10), statusText: "Encerramento Online" }], initialOffer: 55000, createdAt: createPastDate(40), updatedAt: createPastDate(3)
  },
  {
    id: '15926', publicId: 'LEI-LEILAOJU-R9T0U1V2', fullTitle: 'Leilão Tribunal de Justiça SP', title: 'Leilão Judicial Imóveis Ribeirão Preto', auctionDate: createPastDate(2), totalLots: 0, status: 'ENCERRADO', auctioneer: 'Bomvalor Judicial', category: 'Imóveis', auctioneerLogoUrl: 'https://placehold.co/150x75.png?text=Logo+TJSP&font=roboto', lots: [], seller: 'Tribunal de Justiça SP', sellerId: 'tj-sp', visits: 5000, imageUrl: 'https://placehold.co/150x75.png?text=Leilao+TJSP&font=roboto', dataAiHint: 'logo justica leilao', city: 'Ribeirão Preto', state: 'SP', auctionStages: [{ name: "Praça Única", endDate: createPastDate(2), statusText: "Encerrado" }], initialOffer: 0, createdAt: createPastDate(60), updatedAt: createPastDate(2)
  },
  {
    id: 'ART001ANTIQ', publicId: 'LEI-LEILAOAR-P3Q4R5S6', title: 'Leilão Arte & Antiguidades', fullTitle: 'Leilão Especial de Obras de Arte e Peças de Antiguidade', auctionDate: createFutureDate(1, 0), totalLots: 0, status: 'EM_BREVE', auctioneer: 'Galeria Antika - Leiloeiro Oficial A.Silva', category: 'Arte e Antiguidades', auctioneerLogoUrl: 'https://placehold.co/150x75.png?text=Galeria+Antika&font=merriweather', visits: 1500, lots: [], imageUrl: 'https://placehold.co/150x75.png?text=Leilao+Arte&font=merriweather', dataAiHint: 'logo galeria arte', seller: 'Colecionadores Particulares', sellerId: 'col-particulares', sellingBranch: 'Galeria Antika - Sede SP', city: 'São Paulo', state: 'SP', auctionStages: [{ name: "Exposição Online", endDate: createFutureDate(7, 0), statusText: "Fim da Exposição" }, { name: "Leilão ao Vivo", endDate: createFutureDate(8, 0), statusText: "Encerramento Leilão" }], initialOffer: 3200, createdAt: createPastDate(15), updatedAt: createPastDate(1)
  },
  {
    id: 'CLASSICVEH24', publicId: 'LEI-CLASSICO-K1L2M3N4', title: 'Clássicos de Garagem', fullTitle: 'Leilão Anual de Veículos Clássicos e Colecionáveis', auctionDate: createFutureDate(2, 0), totalLots: 0, status: 'ABERTO_PARA_LANCES', auctioneer: 'Clássicos Leilões BR - Leiloeiro J.Pimenta', category: 'Veículos Clássicos', auctioneerLogoUrl: 'https://placehold.co/150x75.png?text=Classicos+BR&font=playfair+display', visits: 7600, lots: [], imageUrl: 'https://placehold.co/150x75.png?text=Leilao+Classicos&font=playfair+display', dataAiHint: 'logo leilao classicos', seller: 'Proprietários Diversos Clássicos', sellerId: 'prop-classicos', sellingBranch: 'Pátio Clássicos BR - Curitiba', city: 'Curitiba', state: 'PR', auctionStages: [{ name: "Lances Online", endDate: createFutureDate(12, 0), statusText: "Encerramento Online" }], initialOffer: 180000, createdAt: createPastDate(50), updatedAt: createPastDate(5)
  },
  {
    id: 'XYZBANK001', publicId: 'LEI-BANCOXYZ-XYZ001', title: 'Leilão Banco XYZ - Imóveis RJ', fullTitle: 'Grande Oportunidade de Imóveis Residenciais - Banco XYZ', auctionDate: createFutureDate(3, 14), endDate: createFutureDate(18, 14), totalLots: 0, status: 'EM_BREVE', auctioneer: 'Leiloeiro XYZ Oficial', category: 'Imóvel de Luxo', auctioneerLogoUrl: 'https://placehold.co/150x50.png?text=Banco+XYZ&font=lato', visits: 120, lots: [], imageUrl: 'https://placehold.co/150x75.png?text=Leilao+XYZ&font=lato', dataAiHint: 'logo banco moderno', seller: 'Banco XYZ', sellerId: 'banco-xyz', sellingBranch: 'XYZ Imóveis RJ', city: 'Rio de Janeiro', state: 'RJ', auctionStages: [{ name: "1ª Praça", endDate: createFutureDate(10, 14), statusText: "Encerramento 1ª Praça" }, { name: "2ª Praça", endDate: createFutureDate(18, 14), statusText: "Encerramento 2ª Praça" }], initialOffer: 150000, createdAt: createPastDate(5), updatedAt: createPastDate(0)
  },
];

// Populate auction.lots and auction.totalLots
sampleAuctions.forEach(auction => {
  auction.lots = sampleLots.filter(lot => lot.auctionId === auction.id);
  auction.totalLots = auction.lots.length;
});


export const sampleAuctioneers: AuctioneerProfileInfo[] = getUniqueAuctioneers();
export const sampleSellers: SellerProfileInfo[] = getUniqueSellers();

export const sampleBids: BidInfo[] = sampleLots.flatMap(lot => {
    const numberOfBids = Math.floor(Math.random() * 6); // 0 a 5 lances por lote
    const bids: BidInfo[] = [];
    let currentPrice = lot.initialPrice || lot.price;
    for (let i = 0; i < numberOfBids; i++) {
        const increment = currentPrice > 50000 ? (Math.random() * 1000 + 500) : (currentPrice > 5000 ? (Math.random() * 500 + 100) : (Math.random() * 100 + 50));
        currentPrice += increment;
        currentPrice = Math.round(currentPrice / 10) * 10;
        bids.push({
            id: `BID-${lot.id}-${i + 1}`,
            lotId: lot.id,
            auctionId: lot.auctionId,
            bidderId: `user${String.fromCharCode(65 + Math.floor(Math.random() * 5))}${Math.floor(Math.random() * 99)}`,
            bidderDisplay: `Usuário ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}****`,
            amount: currentPrice,
            timestamp: createPastDate(Math.floor(Math.random() * (differenceInDays(new Date(), lot.endDate instanceof Date ? lot.endDate : new Date(lot.endDate) ) || 1) ), Math.floor(Math.random() * 24), Math.floor(Math.random() * 60)),
        });
    }
     if (bids.length > 0) {
        lot.price = bids[bids.length -1].amount;
        lot.bidsCount = bids.length;
    }
    return bids;
}).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

export const sampleLotReviews: Review[] = sampleLots.flatMap(lot => {
    const numReviews = Math.floor(Math.random() * 3);
    const reviews: Review[] = [];
    const reviewUsers = ['Carlos S.', 'Maria P.', 'João L.', 'Ana R.'];
    const reviewTexts = ['Ótimo item!', 'Conforme descrito.', 'Entrega rápida.', 'Recomendo.'];
    for (let i = 0; i < numReviews; i++) {
        reviews.push({
            id: `REV-${lot.id}-${i + 1}`,
            lotId: lot.id,
            auctionId: lot.auctionId,
            userId: `userRev${i}${Math.floor(Math.random()*100)}`,
            userDisplayName: reviewUsers[Math.floor(Math.random() * reviewUsers.length)],
            rating: Math.floor(Math.random() * 2) + 4, // 4 ou 5 estrelas
            comment: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
            createdAt: createPastDate(Math.floor(Math.random() * 10) + 1),
        });
    }
    return reviews;
});

export const sampleLotQuestions: LotQuestion[] = sampleLots.flatMap(lot => {
    const numQuestions = Math.floor(Math.random() * 2);
    const questions: LotQuestion[] = [];
    const questionUsers = ['Interessado X', 'Comprador Y'];
    const questionSamples = ['Qual o estado de conservação?', 'Aceita troca?'];
    const answerSamples = ['Em bom estado, conforme fotos.', 'Apenas venda, obrigado.'];
    for (let i = 0; i < numQuestions; i++) {
        const hasAnswer = Math.random() > 0.5;
        questions.push({
            id: `QST-${lot.id}-${i + 1}`,
            lotId: lot.id,
            auctionId: lot.auctionId,
            userId: `userQst${i}${Math.floor(Math.random()*100)}`,
            userDisplayName: questionUsers[Math.floor(Math.random() * questionUsers.length)],
            questionText: questionSamples[Math.floor(Math.random() * questionSamples.length)],
            createdAt: createPastDate(Math.floor(Math.random() * 7) + 1),
            isPublic: true,
            answerText: hasAnswer ? answerSamples[Math.floor(Math.random() * answerSamples.length)] : undefined,
            answeredAt: hasAnswer ? createPastDate(Math.floor(Math.random() * 2)) : undefined,
            answeredByUserId: hasAnswer ? 'seller-admin' : undefined,
            answeredByUserDisplayName: hasAnswer ? lot.sellerName || 'Vendedor' : undefined,
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
    { id: 'WIN001', lot: sampleLots.find(l => l.id === 'LOTE003')!, winningBidAmount: 105000, winDate: sampleLots.find(l => l.id === 'LOTE003')!.endDate, paymentStatus: 'PAGO', invoiceUrl: '/invoices/inv-lote003.pdf' },
    { id: 'WIN002', lot: sampleLots.find(l => l.id === 'LOTE006')!, winningBidAmount: 365000, winDate: sampleLots.find(l => l.id === 'LOTE006')!.endDate, paymentStatus: 'PENDENTE' }
];


export const sampleDirectSaleOffers: DirectSaleOffer[] = [
  { id: 'DSO001', title: 'Coleção Completa de Selos Raros do Brasil Império', description: 'Uma oportunidade única para colecionadores...', imageUrl: 'https://placehold.co/800x600.png?text=Selos+Raros', dataAiHint: 'selos antigos colecao', offerType: 'ACCEPTS_PROPOSALS', minimumOfferPrice: 25000, category: 'Colecionáveis', locationCity: 'Rio de Janeiro', locationState: 'RJ', sellerName: 'Antiguidades Imperial', status: 'ACTIVE', createdAt: createPastDate(10), updatedAt: createPastDate(1), expiresAt: createFutureDate(20) },
  { id: 'DSO002', title: 'MacBook Pro 16" M1 Max - Seminovo', description: 'MacBook Pro de 16 polegadas com chip M1 Max...', imageUrl: 'https://placehold.co/800x600.png?text=MacBook+Pro+16', dataAiHint: 'macbook pro aberto', offerType: 'BUY_NOW', price: 18500, category: 'Eletrônicos', locationCity: 'São Paulo', locationState: 'SP', sellerName: 'Tech Revenda SP', status: 'ACTIVE', createdAt: createPastDate(5), updatedAt: createPastDate(2) },
  { id: 'DSO003', title: 'Serviço de Consultoria em Marketing Digital', description: 'Pacote de consultoria completo para startups...', imageUrl: 'https://placehold.co/800x600.png?text=Consultoria+Marketing', dataAiHint: 'marketing digital reuniao', offerType: 'BUY_NOW', price: 4500, category: 'Serviços', locationCity: 'Remoto', locationState: 'BR', sellerName: 'Digital Boost Consultoria', status: 'ACTIVE', createdAt: createPastDate(20), updatedAt: createPastDate(5) },
  { id: 'DSO004', title: 'Ford Mustang 1968 Conversível', description: 'Raro Ford Mustang conversível de 1968...', imageUrl: 'https://placehold.co/800x600.png?text=Mustang+68+Conv', dataAiHint: 'mustang conversivel vermelho', offerType: 'ACCEPTS_PROPOSALS', minimumOfferPrice: 320000, category: 'Veículos', locationCity: 'Curitiba', locationState: 'PR', sellerName: 'Garagem Clássicos PR', status: 'PENDING_APPROVAL', createdAt: createPastDate(2), updatedAt: createPastDate(0), expiresAt: createFutureDate(45) },
  { id: 'DSO005', title: 'Lote de Equipamentos de Academia Profissional', description: 'Lote completo de equipamentos de academia profissional...', imageUrl: 'https://placehold.co/800x600.png?text=Equip+Academia', dataAiHint: 'academia equipamentos profissional', offerType: 'BUY_NOW', price: 75000, category: 'Equipamentos Esportivos', locationCity: 'Belo Horizonte', locationState: 'MG', sellerName: 'Fitness Total Equipamentos', status: 'SOLD', createdAt: createPastDate(60), updatedAt: createPastDate(35) },
  { id: 'DSO006', title: 'Obra de Arte Contemporânea - "Abstração Urbana"', description: 'Pintura acrílica sobre tela de grandes dimensões...', imageUrl: 'https://placehold.co/800x600.png?text=Arte+Abstrata', dataAiHint: 'pintura abstrata colorida', offerType: 'ACCEPTS_PROPOSALS', minimumOfferPrice: 12000, category: 'Arte e Antiguidades', locationCity: 'Porto Alegre', locationState: 'RS', sellerName: 'Galeria Pampa Arte', status: 'EXPIRED', createdAt: createPastDate(90), updatedAt: createPastDate(30), expiresAt: createPastDate(30) },
];

export const sampleMediaItems: MediaItem[] = [
    { id: 'media001', fileName: 'casa_centro_frente.jpg', uploadedAt: createPastDate(10), title: 'Frente da Casa no Centro', mimeType: 'image/jpeg', sizeBytes: 102400, urlOriginal: 'https://placehold.co/800x600.png?text=Casa+Centro', urlThumbnail: 'https://placehold.co/150x100.png?text=Casa+Frente', urlMedium: 'https://placehold.co/400x300.png?text=Casa+Frente', urlLarge: 'https://placehold.co/800x600.png?text=Casa+Frente', dataAiHint: 'fachada casa cidade', linkedLotIds: ['LOTE001'] },
    { id: 'media002', fileName: 'audi_a4_2013_perfil.png', uploadedAt: createPastDate(5), title: 'Audi A4 2013 Perfil', mimeType: 'image/png', sizeBytes: 204800, urlOriginal: 'https://placehold.co/800x600.png?text=Audi+A4+2013', urlThumbnail: 'https://placehold.co/150x100.png?text=Audi+A4+Frente', urlMedium: 'https://placehold.co/400x300.png?text=Audi+A4+Frente', urlLarge: 'https://placehold.co/800x600.png?text=Audi+A4+Frente', dataAiHint: 'carro audi perfil', linkedLotIds: ['LOTEVEI001'] },
    { id: 'media003', fileName: 'edital_leilao_bradesco.pdf', uploadedAt: createPastDate(12), title: 'Edital Leilão Bradesco 100625bra', mimeType: 'application/pdf', sizeBytes: 512000, urlOriginal: '#', urlThumbnail: 'https://placehold.co/150x100.png?text=PDF', urlMedium: '#', urlLarge: '#', dataAiHint: 'documento edital' },
    { id: 'media-casa-frente', fileName: 'casa_frente_detalhe.jpg', uploadedAt: createPastDate(9), title: 'Detalhe Fachada Casa Centro', mimeType: 'image/jpeg', sizeBytes: 120000, urlOriginal: 'https://placehold.co/800x600.png?text=Casa+Detalhe', urlThumbnail: 'https://placehold.co/150x100.png?text=Casa+Detalhe', urlMedium: 'https://placehold.co/400x300.png?text=Casa+Detalhe', urlLarge: 'https://placehold.co/800x600.png?text=Casa+Detalhe', dataAiHint: 'detalhe fachada', linkedLotIds: ['LOTE001'] },
    { id: 'media-audi-frente', fileName: 'audi_a4_frente_total.jpg', uploadedAt: createPastDate(4), title: 'Audi A4 2013 Vista Frontal', mimeType: 'image/jpeg', sizeBytes: 180000, urlOriginal: 'https://placehold.co/800x600.png?text=Audi+Frente+Total', urlThumbnail: 'https://placehold.co/150x100.png?text=Audi+Frente+T', urlMedium: 'https://placehold.co/400x300.png?text=Audi+Frente+T', urlLarge: 'https://placehold.co/800x600.png?text=Audi+Frente+Total', dataAiHint: 'audi carro frente', linkedLotIds: ['LOTEVEI001'] },
    { id: 'media-trator-frente', fileName: 'trator_nh_vista_frontal.jpg', uploadedAt: createPastDate(6), title: 'Trator New Holland T7 Frontal', mimeType: 'image/jpeg', sizeBytes: 220000, urlOriginal: 'https://images.unsplash.com/photo-1633153627433-b15010a9b2f5?w=150', urlThumbnail: 'https://images.unsplash.com/photo-1633153627433-b15010a9b2f5?w=150', urlMedium: 'https://images.unsplash.com/photo-1633153627433-b15010a9b2f5?w=400', urlLarge: 'https://images.unsplash.com/photo-1633153627433-b15010a9b2f5?w=800', dataAiHint: 'trator campo frente', linkedLotIds: ['LOTE005'] },
];


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
    case 'HABILITATED': return 'Habilitado';
    case 'REJECTED_DOCUMENTS': return 'Documentos Rejeitados';
    case 'BLOCKED': return 'Bloqueado';
    case 'ACTIVE': return 'Ativa'; 
    case 'SOLD': return 'Vendido'; 
    case 'EXPIRED': return 'Expirada'; 
    case 'PENDING_APPROVAL': return 'Pendente Aprovação'; 
    default: {
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
      case 'ACTIVE': 
        return 'bg-green-600 text-white';
      case 'EM_BREVE':
      case 'PENDING_APPROVAL': 
        return 'bg-blue-500 text-white';
      case 'ENCERRADO':
      case 'VENDIDO':
      case 'NAO_VENDIDO':
      case 'SOLD': 
      case 'EXPIRED': 
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
    case 'HABILITATED':
      return { text: 'Habilitado para Dar Lances', color: 'text-green-600 dark:text-green-400', progress: 100, icon: CheckCircle2 };
    case 'BLOCKED':
      return { text: 'Conta Bloqueada', color: 'text-destructive', progress: 0, icon: ShieldAlert };
    default:
      const exhaustiveCheck: never = status;
      return { text: "Status Desconhecido" as never, color: 'text-muted-foreground', progress: 0, icon: HelpCircle };
  }
};

export const getUniqueLotCategoriesFromSampleData = (): LotCategory[] => {
  const categoriesMap = new Map<string, LotCategory>();
  sampleLotCategories.forEach(cat => categoriesMap.set(cat.slug, cat));
  
  [...sampleLots, ...sampleAuctions, ...sampleDirectSaleOffers].forEach(item => {
    const categoryName = 'type' in item ? item.type : item.category;
    if (categoryName) {
      const slug = slugify(categoryName);
      if (!categoriesMap.has(slug)) {
        categoriesMap.set(slug, {
          id: `sample-cat-${slug}`,
          name: categoryName,
          slug: slug,
          description: `Categoria de ${categoryName}`,
          itemCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      const existingCat = categoriesMap.get(slug);
      if (existingCat) {
        existingCat.itemCount = (existingCat.itemCount || 0) + 1;
      }
    }
  });
  return Array.from(categoriesMap.values()).sort((a,b) => a.name.localeCompare(b.name));
};

export function getCategoryNameFromSlug(slug: string): string | undefined {
  const allSampleCategories = getUniqueLotCategoriesFromSampleData(); 
  const foundCategory = allSampleCategories.find(cat => cat.slug === slug);
  if (foundCategory) {
    return foundCategory.name;
  }
  console.warn(`[sample-data] Nenhum nome de categoria encontrado para o slug: ${slug} nos dados de exemplo.`);
  return undefined;
}


export const getUniqueLotLocations = (): string[] => {
  const locations = new Set<string>();
  sampleLots.forEach(lot => {
    const locationString = lot.cityName && lot.stateUf ? `${lot.cityName} - ${lot.stateUf}` : lot.stateUf || lot.cityName;
    if (locationString) locations.add(locationString);
  });
  sampleDirectSaleOffers.forEach(offer => {
    const locationString = offer.locationCity && offer.locationState ? `${offer.locationCity} - ${offer.locationState}` : offer.locationState || offer.locationCity;
    if (locationString) locations.add(locationString);
  });
  return Array.from(locations).sort();
};

export const getUniqueSellerNames = (): string[] => {
  const sellerNames = new Set<string>();
  sampleAuctions.forEach(auction => {
    if (auction.seller) sellerNames.add(auction.seller);
  });
  sampleLots.forEach(lot => {
    if (lot.sellerName) sellerNames.add(lot.sellerName);
  });
   sampleDirectSaleOffers.forEach(offer => {
    if (offer.sellerName) sellerNames.add(offer.sellerName);
  });
  return Array.from(sellerNames).sort();
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
    return {
      logoUrl: 'https://placehold.co/100x100.png?text=Carro',
      logoAiHint: 'icone carro',
      bannerUrl: 'https://placehold.co/1200x300.png?text=Veiculos+em+Destaque',
      bannerAiHint: 'carros estrada',
      bannerText: `Excelentes Ofertas em Veículos - ${categoryName}`,
    };
  }
  if (slug.includes('imove')) { // 'imoveis', 'imovel'
    return {
      logoUrl: 'https://placehold.co/100x100.png?text=Casa',
      logoAiHint: 'icone casa',
      bannerUrl: 'https://placehold.co/1200x300.png?text=Oportunidades+Imobiliarias',
      bannerAiHint: 'imoveis cidade',
      bannerText: `Seu Novo Lar ou Investimento está aqui - ${categoryName}`,
    };
  }
  if (slug.includes('arte') || slug.includes('antiguidade')) {
    return {
      logoUrl: 'https://placehold.co/100x100.png?text=Arte',
      logoAiHint: 'icone arte',
      bannerUrl: 'https://placehold.co/1200x300.png?text=Leilao+de+Arte',
      bannerAiHint: 'galeria arte',
      bannerText: `Obras Raras e Antiguidades - ${categoryName}`,
    };
  }
  if (slug.includes('maquinario') || slug.includes('agricola')) {
    return {
      logoUrl: 'https://placehold.co/100x100.png?text=Trator',
      logoAiHint: 'icone trator',
      bannerUrl: 'https://placehold.co/1200x300.png?text=Maquinario+Agro',
      bannerAiHint: 'campo trator',
      bannerText: `Equipamentos Agrícolas e Maquinário Pesado - ${categoryName}`,
    };
  }
   if (slug.includes('eletronico')) {
    return {
      logoUrl: 'https://placehold.co/100x100.png?text=Chip',
      logoAiHint: 'icone chip placa',
      bannerUrl: 'https://placehold.co/1200x300.png?text=Tecnologia+e+Eletronicos',
      bannerAiHint: 'computador smartphone',
      bannerText: `Os Melhores Gadgets e Eletrônicos - ${categoryName}`,
    };
  }


  return defaultAssets;
}


export const getUniqueSellers = (): SellerProfileInfo[] => {
  const sellerMap = new Map<string, SellerProfileInfo>();

  const addSeller = (name: string | undefined, isAuctioneer = false, city?: string, state?: string, logoUrl?: string, dataAiHint?: string, description?: string) => {
    if (!name) return;
    const slug = slugify(name);
    if (sellerMap.has(slug)) return;

    const randomYearsAgo = Math.floor(Math.random() * 3) + 1;
    let memberSince = subYears(now, randomYearsAgo);
    memberSince = subMonths(memberSince, Math.floor(Math.random() * 12));
    memberSince = subDays(memberSince, Math.floor(Math.random() * 28));

    const rating = Math.round((Math.random() * 1.5 + 3.5) * 10) / 10; 
    const activeLotsCount = Math.floor(Math.random() * 46) + 5; 
    const initial = name ? name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : 'S';

    sellerMap.set(slug, {
      id: slug, 
      publicId: `SELL-PUB-${slug.substring(0,5)}-${uuidv4().substring(0,6)}`, 
      name, slug, memberSince, rating, activeLotsCount,
      logoUrl: logoUrl || `https://placehold.co/100x100.png?text=${initial}`,
      dataAiHintLogo: dataAiHint || (isAuctioneer ? 'logo leiloeiro placeholder' : 'logo comitente placeholder'),
      city: city, state: state, description: description,
      createdAt: memberSince, updatedAt: new Date(), 
    });
  };

  sampleAuctions.forEach(auction => addSeller(auction.seller, false, auction.city, auction.state, undefined, auction.dataAiHint, auction.description));
  sampleLots.forEach(lot => addSeller(lot.sellerName, false, lot.cityName, lot.stateUf, undefined, lot.dataAiHint, lot.description));
  sampleDirectSaleOffers.forEach(offer => addSeller(offer.sellerName, false, offer.locationCity, offer.locationState, offer.sellerLogoUrl, offer.dataAiHintSellerLogo, offer.description));

  return Array.from(sellerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
};

export const getUniqueAuctioneers = (): AuctioneerProfileInfo[] => {
    const auctioneerMap = new Map<string, AuctioneerProfileInfo>();

    sampleAuctions.forEach(auction => {
        if (auction.auctioneer) {
            const slug = slugify(auction.auctioneer);
            if (!auctioneerMap.has(slug)) {
                const randomYearsAgo = Math.floor(Math.random() * 5) + 1; 
                let memberSince = subYears(new Date(), randomYearsAgo);
                memberSince = subMonths(memberSince, Math.floor(Math.random() * 12));
                const initial = auction.auctioneer.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();

                auctioneerMap.set(slug, {
                    id: slug, 
                    publicId: `AUCT-PUB-${slug.substring(0,5)}-${uuidv4().substring(0,6)}`, 
                    name: auction.auctioneer, slug: slug,
                    logoUrl: auction.auctioneerLogoUrl || `https://placehold.co/100x100.png?text=${initial}`,
                    dataAiHintLogo: 'logo leiloeiro',
                    registrationNumber: `JUCESP ${Math.floor(Math.random() * 900) + 100}`, 
                    memberSince: memberSince,
                    rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)), 
                    auctionsConductedCount: Math.floor(Math.random() * 200) + 50,
                    totalValueSold: (Math.random() * 5000000) + 1000000,
                    email: `${slug}@leiloes.com.br`,
                    phone: `(11) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
                    city: auction.city || sampleLots[Math.floor(Math.random()*sampleLots.length)]?.cityName || 'São Paulo',
                    state: auction.state || sampleLots[Math.floor(Math.random()*sampleLots.length)]?.stateUf || 'SP',
                    createdAt: memberSince, updatedAt: new Date(), 
                });
            }
        }
    });
    return Array.from(auctioneerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
};

// Atualiza sampleLots para incluir auctionName e sellerName se não existirem
sampleLots.forEach(lot => {
  if (!lot.auctionName) {
    const parentAuction = sampleAuctions.find(a => a.id === lot.auctionId);
    lot.auctionName = parentAuction?.title || 'Leilão Desconhecido';
  }
  if (!lot.sellerName) {
    const parentAuction = sampleAuctions.find(a => a.id === lot.auctionId);
    lot.sellerName = parentAuction?.seller || 'Vendedor Desconhecido';
  }
  if(!lot.publicId) {
      lot.publicId = `LOT-PUB-${slugify(lot.title.substring(0,6))}-${lot.id.substring(0,4)}`;
  }
});

// Atualiza sampleAuctions para ter publicId e IDs numéricos consistentes
sampleAuctions.forEach(auction => {
    if (!auction.publicId) {
        auction.publicId = `AUC-PUB-${slugify(auction.title.substring(0,6))}-${auction.id.substring(0,4)}`;
    }
    // Garante que os lotes dentro da auction também tenham auctionName
    if (auction.lots) {
        auction.lots.forEach(lot => {
            if(!lot.auctionName) lot.auctionName = auction.title;
            if(!lot.sellerName && auction.seller) lot.sellerName = auction.seller;
        });
    } else { // Se auction.lots não existir, inicializa e popula a partir de sampleLots
        auction.lots = sampleLots.filter(l => l.auctionId === auction.id);
        auction.totalLots = auction.lots.length;
    }
});


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
        '--primary': 'hsl(25 95% 53%)', // Laranja Vibrante
        '--primary-foreground': 'hsl(0 0% 100%)',
        '--secondary': 'hsl(0 0% 96.1%)', // #F5F5F5
        '--accent': 'hsl(25 95% 95%)', // Laranja mais claro
      }
    }
  ],
  platformPublicIdMasks: {
    auctions: "LEIL-",
    lots: "LOTE-",
    auctioneers: "LEILOE-",
    sellers: "COMIT-"
  },
  updatedAt: new Date()
};
    

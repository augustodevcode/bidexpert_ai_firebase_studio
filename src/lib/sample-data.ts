

import type { Auction, Lot, AuctionStatus, LotStatus, DocumentType, UserDocument, UserHabilitationStatus, UserDocumentStatus, UserBid, UserBidStatus, UserWin, PaymentStatus, SellerProfileInfo, RecentlyViewedLotInfo, AuctioneerProfileInfo, DirectSaleOffer, DirectSaleOfferType, DirectSaleOfferStatus } from '@/types';
import { format, differenceInDays, differenceInHours, differenceInMinutes, subYears, subMonths, subDays, addDays as dateFnsAddDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Clock, FileWarning, CheckCircle2, ShieldAlert, HelpCircle } from 'lucide-react';


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
  };

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


export const sampleLots: Lot[] = [
  {
    id: 'LOTE001',
    auctionId: '100625bra',
    title: 'CASA COM 129,30 M² - CENTRO',
    imageUrl: 'https://placehold.co/800x600.png?text=Casa+Centro',
    dataAiHint: 'casa residencial',
    galleryImageUrls: [
        'https://placehold.co/150x100.png?text=Casa+Frente',
        'https://placehold.co/150x100.png?text=Casa+Sala',
        'https://placehold.co/150x100.png?text=Casa+Cozinha',
        'https://placehold.co/150x100.png?text=Casa+Quarto',
    ],
    status: 'ABERTO_PARA_LANCES',
    cityName: 'TEOTÔNIO VILELA',
    stateUf: 'AL',
    type: 'Imóvel Residencial',
    views: 1018,
    auctionName: 'Leilão Único Bradesco',
    price: 45000,
    endDate: createFutureDate(10, 2),
    bidsCount: 7,
    isFavorite: true,
    isFeatured: true,
    description: 'Casa residencial bem localizada no centro da cidade, com 3 quartos, 2 banheiros e área de serviço. Próxima a comércios e escolas.',
    year: 2010,
    make: 'N/A',
    model: 'Residência',
    stockNumber: 'BR001TV',
    sellingBranch: 'Bradesco Imóveis AL',
    vin: 'N/A',
    vinStatus: 'N/A',
    lossType: 'Retomada de Financiamento',
    primaryDamage: 'N/A',
    titleInfo: 'Escritura Pública',
    titleBrand: 'Quitada',
    startCode: 'Disponível para Visitação',
    hasKey: true,
    odometer: 'N/A',
    airbagsStatus: 'N/A',
    bodyStyle: 'Casa Térrea',
    engineDetails: 'N/A',
    transmissionType: 'N/A',
    driveLineType: 'N/A',
    fuelType: 'N/A',
    cylinders: 'N/A',
    restraintSystem: 'N/A',
    exteriorInteriorColor: 'Branco / Bege',
    options: 'Murada, Gradeada',
    manufacturedIn: 'Brasil',
    vehicleClass: 'Imóvel Residencial',
    lotSpecificAuctionDate: createFutureDate(10,2),
    vehicleLocationInBranch: 'Local do Imóvel',
    laneRunNumber: 'N/A',
    aisleStall: 'N/A',
    actualCashValue: 'R$ 55.000,00',
    sellerName: 'Banco Bradesco S.A.'
  },
   {
    id: 'LOTEVEI001',
    auctionId: '300724car',
    title: '2013 AUDI A4 PREMIUM PLUS',
    year: 2013,
    make: 'AUDI',
    model: 'A4',
    series: 'PREMIUM PLUS',
    imageUrl: 'https://placehold.co/800x600.png?text=Audi+A4+2013',
    dataAiHint: 'carro sedan preto',
    galleryImageUrls: [
        'https://placehold.co/150x100.png?text=Audi+A4+Frente',
        'https://placehold.co/150x100.png?text=Audi+A4+Traseira',
        'https://placehold.co/150x100.png?text=Audi+A4+Interior',
        'https://placehold.co/150x100.png?text=Audi+A4+Painel',
        'https://placehold.co/150x100.png?text=Audi+A4+Roda',
        'https://placehold.co/150x100.png?text=Audi+A4+Motor',
    ],
    status: 'ABERTO_PARA_LANCES',
    cityName: 'São Paulo',
    stateUf: 'SP',
    type: 'Veículo de Passeio',
    views: 1560,
    auctionName: 'Leilão de Veículos Premium',
    price: 68500,
    endDate: createFutureDate(5, 10),
    bidsCount: 12,
    isFavorite: true,
    isFeatured: true,
    description: 'Audi A4 Premium Plus 2013, completo, com teto solar, bancos em couro e sistema de som premium. Veículo em ótimo estado, revisões em dia.',
    stockNumber: '42362593',
    sellingBranch: 'Leiloeira SP Leste',
    vin: 'WAUFFAFL3DA012345',
    vinStatus: 'WAUFFAFL3DA****** (OK)',
    lossType: 'Particular',
    primaryDamage: 'Pequenos arranhões no para-choque dianteiro',
    titleInfo: 'CRLV (São Paulo)',
    titleBrand: 'Sem Reserva',
    startCode: 'Funciona e Anda',
    hasKey: true,
    odometer: '140.846 km (Original)',
    airbagsStatus: 'Intactos',
    bodyStyle: 'SEDAN 4 PORTAS',
    engineDetails: '2.0L I4 FI DOHC 16V TFSI',
    transmissionType: 'Automática Multitronic',
    driveLineType: 'Dianteira',
    fuelType: 'Gasolina',
    cylinders: '4 Cilindros',
    restraintSystem: 'Airbags frontais, laterais e de cortina, ABS, ESP',
    exteriorInteriorColor: 'Preto / Couro Bege',
    options: 'Teto Solar, Central Multimídia, Rodas de Liga Leve 18"',
    manufacturedIn: 'Alemanha',
    vehicleClass: 'Sedan de Luxo Compacto',
    lotSpecificAuctionDate: createFutureDate(5,10),
    vehicleLocationInBranch: 'Pátio Principal',
    laneRunNumber: 'A - #112',
    aisleStall: 'BB - 222',
    actualCashValue: 'R$ 75.000,00',
    estimatedRepairCost: 'R$ 800,00 (Pintura para-choque)',
    sellerName: 'Proprietário Particular',
  },
  {
    id: 'LOTE003',
    auctionId: '100625bra',
    title: 'APARTAMENTO COM 54,25 M² - CABULA',
    imageUrl: 'https://placehold.co/800x600.png?text=Apto+Cabula',
    dataAiHint: 'apartamento predio residencial',
    status: 'ENCERRADO',
    cityName: 'SALVADOR',
    stateUf: 'BA',
    type: 'Imóvel Residencial',
    views: 754,
    auctionName: 'Leilão Único Bradesco',
    price: 105000,
    endDate: createPastDate(2),
    bidsCount: 15,
    isFavorite: false,
    isFeatured: false,
    description: 'Apartamento funcional no Cabula, 2 quartos, próximo a transporte público e comércio.',
    sellerName: 'Banco Bradesco S.A.'
  },
  {
    id: 'LOTEART001',
    auctionId: 'ART001ANTIQ',
    title: 'Pintura a Óleo "Paisagem Toscana" - Séc. XIX',
    imageUrl: 'https://placehold.co/800x600.png?text=Paisagem+Toscana',
    dataAiHint: 'pintura oleo paisagem',
    status: 'ABERTO_PARA_LANCES',
    cityName: 'RIO DE JANEIRO',
    stateUf: 'RJ',
    type: 'Arte e Antiguidades',
    views: 320,
    auctionName: 'Leilão de Arte e Antiguidades',
    price: 7500,
    endDate: createFutureDate(8, 0),
    bidsCount: 3,
    isFavorite: true,
    isFeatured: true,
    description: 'Belíssima pintura a óleo sobre tela representando paisagem da Toscana, Itália. Artista desconhecido, atribuído ao século XIX. Moldura original.',
    sellerName: 'Colecionador Particular RJ'
  },
  {
    id: 'LOTEVCLASS001',
    auctionId: 'CLASSICVEH24',
    title: '1967 FORD MUSTANG FASTBACK',
    year: 1967,
    make: 'FORD',
    model: 'MUSTANG',
    series: 'FASTBACK',
    imageUrl: 'https://placehold.co/800x600.png?text=Mustang+1967',
    dataAiHint: 'carro classico vermelho',
    status: 'ABERTO_PARA_LANCES',
    cityName: 'CURITIBA',
    stateUf: 'PR',
    type: 'Veículo Clássico',
    views: 1850,
    auctionName: 'Leilão de Veículos Clássicos',
    price: 250000,
    endDate: createFutureDate(12, 0),
    bidsCount: 8,
    isFavorite: false,
    isFeatured: false,
    description: 'Icônico Ford Mustang Fastback 1967, motor V8 289, câmbio manual. Restaurado nos padrões originais. Placa preta de coleção.',
    sellerName: 'Colecionador de Clássicos PR'
  },
  {
    id: 'LOTE005',
    auctionId: '20301vei',
    title: 'TRATOR AGRÍCOLA NEW HOLLAND T7',
    year: 2018,
    make: 'NEW HOLLAND',
    model: 'T7.245',
    series: 'Classic',
    imageUrl: 'https://placehold.co/800x600.png?text=Trator+NH+T7',
    dataAiHint: 'trator agricola campo',
    galleryImageUrls: [
        'https://placehold.co/150x100.png?text=Trator+Frente',
        'https://placehold.co/150x100.png?text=Trator+Lado',
        'https://placehold.co/150x100.png?text=Trator+Cabine',
        'https://placehold.co/150x100.png?text=Trator+Motor',
        'https://placehold.co/150x100.png?text=Trator+Pneu',
    ],
    status: 'ABERTO_PARA_LANCES',
    cityName: 'RIO VERDE',
    stateUf: 'GO',
    type: 'Maquinário Agrícola',
    views: 305,
    auctionName: 'Leilão Online Agro',
    price: 180000,
    endDate: createFutureDate(7, 1),
    bidsCount: 3,
    isFavorite: false,
    isFeatured: true,
    description: 'Trator New Holland T7.245, ano 2018, em excelente estado de conservação. Poucas horas de uso, pneus em bom estado, revisado.',
    stockNumber: 'AGRO-T7-001',
    sellingBranch: 'AgroLeilões Rio Verde',
    vin: 'NH5987T7XWZ001',
    vinStatus: 'OK',
    lossType: 'N/A',
    primaryDamage: 'N/A',
    titleInfo: 'Nota Fiscal de Produtor',
    titleBrand: 'Único Dono',
    startCode: 'Operacional',
    hasKey: true,
    odometer: '1250 horas',
    airbagsStatus: 'N/A (Não Aplicável)',
    bodyStyle: 'Trator Agrícola com Cabine',
    engineDetails: 'FPT 6.7L, 6 Cilindros, Turbo Intercooler, 245cv',
    transmissionType: 'Semi-Powershift 18x6',
    driveLineType: '4x4',
    fuelType: 'Diesel S10',
    cylinders: '6',
    restraintSystem: 'Cinto de Segurança',
    exteriorInteriorColor: 'Azul / Cinza',
    options: 'Ar Condicionado, GPS Agrícola, Levante Hidráulico Traseiro',
    manufacturedIn: 'Brasil',
    vehicleClass: 'Maquinário Agrícola Pesado',
    lotSpecificAuctionDate: createFutureDate(7,1),
    vehicleLocationInBranch: 'Pátio Rio Verde',
    laneRunNumber: 'MAQ-05',
    aisleStall: 'TR-12',
    actualCashValue: 'R$ 220.000,00',
    sellerName: 'Fazenda Boa Esperança',
  },
  {
    id: 'LOTE002',
    auctionId: '100625bra',
    title: 'CASA COM 234,50 M² - PORTÃO',
    imageUrl: 'https://placehold.co/800x600.png?text=Casa+Portao',
    dataAiHint: 'casa moderna suburbio',
    galleryImageUrls: ['https://placehold.co/150x100.png?text=Casa+Varanda', 'https://placehold.co/150x100.png?text=Casa+Jardim'],
    status: 'ABERTO_PARA_LANCES',
    cityName: 'LAURO DE FREITAS',
    stateUf: 'BA',
    type: 'Imóvel Residencial',
    views: 681,
    auctionName: 'Leilão Único Bradesco',
    price: 664000,
    endDate: createFutureDate(10, 5),
    bidsCount: 0,
    isFavorite: true,
    isFeatured: false,
    description: 'Espaçosa casa em Lauro de Freitas, com 4 suítes, piscina e área gourmet. Ideal para famílias.',
    sellerName: 'Banco Bradesco S.A.'
  },
  {
    id: 'LOTE004',
    auctionId: '100625bra',
    title: 'CASA COM 133,04 M² - VILA PERI',
    imageUrl: 'https://placehold.co/800x600.png?text=Casa+Vila+Peri',
    dataAiHint: 'casa terrea simples',
    status: 'EM_BREVE',
    cityName: 'FORTALEZA',
    stateUf: 'CE',
    type: 'Imóvel Residencial',
    views: 527,
    auctionName: '1ª Praça Bradesco',
    price: 238000,
    endDate: createFutureDate(3, 0),
    bidsCount: 0,
    isFavorite: true,
    isFeatured: false,
    description: 'Casa em Fortaleza, boa localização na Vila Peri. Necessita de pequenas reformas.',
    sellerName: 'Banco Bradesco S.A.'
  },
  {
    id: 'LOTE006',
    auctionId: '20301vei',
    title: 'COLHEITADEIRA JOHN DEERE S680',
    imageUrl: 'https://placehold.co/800x600.png?text=Colheitadeira+JD',
    dataAiHint: 'colheitadeira graos campo',
    status: 'ENCERRADO',
    cityName: 'CAMPO GRANDE',
    stateUf: 'MS',
    type: 'Maquinário Agrícola',
    views: 450,
    auctionName: 'Leilão Físico e Online Agro',
    price: 365000,
    endDate: createPastDate(5),
    bidsCount: 12,
    isFavorite: false,
    isFeatured: false,
    description: 'Colheitadeira John Deere S680, usada, em bom estado de funcionamento. Plataforma de corte inclusa.',
    sellerName: 'Produtor Rural MS'
  },
    {
    id: 'LOTEART002',
    auctionId: 'ART001ANTIQ',
    title: 'Escultura em Bronze "O Pensador" - Réplica Assinada',
    imageUrl: 'https://placehold.co/800x600.png?text=Escultura+Pensador',
    dataAiHint: 'escultura bronze pensador',
    status: 'EM_BREVE',
    cityName: 'SÃO PAULO',
    stateUf: 'SP',
    type: 'Arte e Antiguidades',
    views: 150,
    auctionName: 'Leilão de Arte e Antiguidades',
    price: 3200,
    endDate: createFutureDate(15, 0),
    bidsCount: 0,
    isFavorite: false,
    isFeatured: false,
    description: 'Réplica em bronze da famosa escultura "O Pensador" de Rodin, assinada pelo artista fundidor. Altura: 45cm.',
    sellerName: 'Galeria de Arte SP'
  },
  {
    id: 'LOTEVCLASS002',
    auctionId: 'CLASSICVEH24',
    title: '1955 PORSCHE 356 SPEEDSTER - RÉPLICA',
    year: 1955,
    make: 'PORSCHE',
    model: '356 SPEEDSTER (RÉPLICA)',
    series: '',
    imageUrl: 'https://placehold.co/800x600.png?text=Porsche+356+Replica',
    dataAiHint: 'carro conversivel prata antigo',
    status: 'ABERTO_PARA_LANCES',
    cityName: 'BELO HORIZONTE',
    stateUf: 'MG',
    type: 'Veículo Clássico',
    views: 990,
    auctionName: 'Leilão de Veículos Clássicos',
    price: 180000,
    endDate: createFutureDate(10, 0),
    bidsCount: 5,
    isFavorite: true,
    isFeatured: false,
    description: 'Excelente réplica do Porsche 356 Speedster, montada com motor VW AP 1.8. Carroceria em fibra, interior em couro. Documentação regularizada.',
    sellerName: 'Restauradora de Clássicos MG'
  },
   {
    id: 'LOTEUTIL001',
    auctionId: '300724car',
    title: '2019 FIAT FIORINO 1.4 FLEX',
    year: 2019,
    make: 'FIAT',
    model: 'FIORINO',
    series: '1.4 FLEX ENDURANCE',
    imageUrl: 'https://placehold.co/800x600.png?text=Fiat+Fiorino+2019',
    dataAiHint: 'furgoneta branca cidade',
    status: 'ABERTO_PARA_LANCES',
    cityName: 'Porto Alegre',
    stateUf: 'RS',
    type: 'Veículo Utilitário',
    views: 720,
    auctionName: 'Leilão de Veículos Premium',
    price: 55000,
    endDate: createFutureDate(3, 5),
    bidsCount: 6,
    isFavorite: false,
    isFeatured: false,
    description: 'Fiat Fiorino 2019, modelo Endurance 1.4 Flex, com baú. Ideal para trabalho, baixa quilometragem. Único dono.',
    sellerName: 'Empresa de Logística RS'
  },
];

export const sampleAuctions: Auction[] = [
  {
    id: '100625bra',
    title: 'Leilão 100625bra',
    fullTitle: 'Grande Leilão de Imóveis Bradesco',
    auctionDate: createFutureDate(0, 1),
    totalLots: sampleLots.filter(l => l.auctionId === '100625bra').length,
    status: 'ABERTO',
    auctioneer: 'VICENTE PAULO - JUCEMA N° 12/96',
    category: 'Extrajudicial',
    auctioneerLogoUrl: 'https://placehold.co/150x50.png?text=Bradesco&font=roboto',
    visits: 16913,
    lots: sampleLots.filter(l => l.auctionId === '100625bra'),
    imageUrl: 'https://placehold.co/150x75.png?text=Leilao+Bradesco&font=roboto',
    dataAiHint: 'logo banco leilao',
    seller: 'Banco Bradesco S.A.',
    sellingBranch: 'Bradesco Matriz',
    // vehicleLocation: 'Diversos Locais (ver lote)',
    city: 'São Paulo',
    state: 'SP',
    auctionStages: [
        { name: "1ª Praça", endDate: createFutureDate(10, 5), statusText: "Encerramento 1ª Praça" },
        { name: "2ª Praça", endDate: createFutureDate(20, 5), statusText: "Encerramento 2ª Praça" },
    ],
    initialOffer: Math.min(...sampleLots.filter(l => l.auctionId === '100625bra' && l.price > 0).map(l => l.price)),
    createdAt: createPastDate(30),
    updatedAt: createPastDate(1),
  },
  {
    id: '20301vei',
    title: 'Leilão Maquinário Pesado',
    fullTitle: 'Leilão de Tratores e Colheitadeiras Usadas',
    auctionDate: createFutureDate(0, 2),
    totalLots: sampleLots.filter(l => l.auctionId === '20301vei').length,
    status: 'ABERTO_PARA_LANCES',
    auctioneer: 'AGROLEILÕES LTDA - MATRICULA XYZ/00',
    category: 'Maquinário Agrícola',
    auctioneerLogoUrl: 'https://placehold.co/150x75.png?text=AgroLeiloes&font=roboto',
    visits: 8750,
    lots: sampleLots.filter(l => l.auctionId === '20301vei'),
    imageUrl: 'https://placehold.co/150x75.png?text=Leilao+Agro&font=roboto',
    dataAiHint: 'logo leilao agro',
    seller: 'Diversos Comitentes Agro',
    sellingBranch: 'AgroLeilões Central',
    // vehicleLocation: 'Pátio Central AgroLeilões',
    city: 'Rio Verde',
    state: 'GO',
     auctionStages: [
        { name: "Leilão Online", endDate: createFutureDate(7, 1), statusText: "Encerramento Lances" },
    ],
    initialOffer: Math.min(...sampleLots.filter(l => l.auctionId === '20301vei' && l.price > 0).map(l => l.price)),
    createdAt: createPastDate(25),
    updatedAt: createPastDate(2),
  },
   {
    id: '300724car',
    title: 'Leilão Veículos Premium',
    fullTitle: 'Leilão de Veículos Seminovos e de Luxo',
    auctionDate: createFutureDate(0, 3),
    totalLots: sampleLots.filter(l => l.auctionId === '300724car').length,
    status: 'ABERTO',
    auctioneer: 'SUPERBID Leilões - JUCESP Nº 123',
    category: 'Veículos',
    auctioneerLogoUrl: 'https://placehold.co/150x75.png?text=SuperBid&font=roboto',
    visits: 12345,
    lots: sampleLots.filter(l => l.auctionId === '300724car'),
    imageUrl: 'https://placehold.co/150x75.png?text=Leilao+Veiculos&font=roboto',
    dataAiHint: 'logo leilao carros',
    seller: 'Diversos Proprietários e Financeiras',
    sellingBranch: 'Pátio SuperBid SP',
    // vehicleLocation: 'Pátio SuperBid SP',
    city: 'São Paulo',
    state: 'SP',
    auctionStages: [
        { name: "Fase de Lances Online", endDate: createFutureDate(5, 10), statusText: "Encerramento Online" },
    ],
    initialOffer: Math.min(...sampleLots.filter(l => l.auctionId === '300724car' && l.price > 0).map(l => l.price)),
    createdAt: createPastDate(40),
    updatedAt: createPastDate(3),
  },
  {
    id: '15926',
    fullTitle: 'Leilão Tribunal de Justiça SP',
    title: 'Leilão Judicial Imóveis Ribeirão Preto',
    auctionDate: createPastDate(2),
    totalLots: 0,
    status: 'ENCERRADO',
    auctioneer: 'Bomvalor Judicial',
    category: 'Imóveis',
    auctioneerLogoUrl: 'https://placehold.co/150x75.png?text=Logo+TJSP&font=roboto',
    lots: [],
    seller: 'Tribunal de Justiça SP',
    visits: 5000,
    imageUrl: 'https://placehold.co/150x75.png?text=Leilao+TJSP&font=roboto',
    dataAiHint: 'logo justica leilao',
    city: 'Ribeirão Preto',
    state: 'SP',
     auctionStages: [
        { name: "Praça Única", endDate: createPastDate(2), statusText: "Encerrado" },
    ],
    initialOffer: 0,
    createdAt: createPastDate(60),
    updatedAt: createPastDate(2),
  },
  {
    id: 'ART001ANTIQ',
    title: 'Leilão Arte & Antiguidades',
    fullTitle: 'Leilão Especial de Obras de Arte e Peças de Antiguidade',
    auctionDate: createFutureDate(1, 0),
    totalLots: sampleLots.filter(l => l.auctionId === 'ART001ANTIQ').length,
    status: 'EM_BREVE',
    auctioneer: 'Galeria Antika - Leiloeiro Oficial A.Silva',
    category: 'Arte e Antiguidades',
    auctioneerLogoUrl: 'https://placehold.co/150x75.png?text=Galeria+Antika&font=merriweather',
    visits: 1500,
    lots: sampleLots.filter(l => l.auctionId === 'ART001ANTIQ'),
    imageUrl: 'https://placehold.co/150x75.png?text=Leilao+Arte&font=merriweather',
    dataAiHint: 'logo galeria arte',
    seller: 'Colecionadores Particulares',
    sellingBranch: 'Galeria Antika - Sede SP',
    // vehicleLocation: 'N/A',
    city: 'São Paulo',
    state: 'SP',
    auctionStages: [
        { name: "Exposição Online", endDate: createFutureDate(7, 0), statusText: "Fim da Exposição" },
        { name: "Leilão ao Vivo", endDate: createFutureDate(8, 0), statusText: "Encerramento Leilão" },
    ],
    initialOffer: Math.min(...sampleLots.filter(l => l.auctionId === 'ART001ANTIQ' && l.price > 0).map(l => l.price)),
    createdAt: createPastDate(15),
    updatedAt: createPastDate(1),
  },
  {
    id: 'CLASSICVEH24',
    title: 'Clássicos de Garagem',
    fullTitle: 'Leilão Anual de Veículos Clássicos e Colecionáveis',
    auctionDate: createFutureDate(2, 0),
    totalLots: sampleLots.filter(l => l.auctionId === 'CLASSICVEH24').length,
    status: 'ABERTO_PARA_LANCES',
    auctioneer: 'Clássicos Leilões BR - Leiloeiro J.Pimenta',
    category: 'Veículos Clássicos',
    auctioneerLogoUrl: 'https://placehold.co/150x75.png?text=Classicos+BR&font=playfair+display',
    visits: 7600,
    lots: sampleLots.filter(l => l.auctionId === 'CLASSICVEH24'),
    imageUrl: 'https://placehold.co/150x75.png?text=Leilao+Classicos&font=playfair+display',
    dataAiHint: 'logo leilao classicos',
    seller: 'Proprietários Diversos Clássicos',
    sellingBranch: 'Pátio Clássicos BR - Curitiba',
    // vehicleLocation: 'Pátio do Leiloeiro',
    city: 'Curitiba',
    state: 'PR',
    auctionStages: [
        { name: "Lances Online", endDate: createFutureDate(12, 0), statusText: "Encerramento Online" },
    ],
    initialOffer: Math.min(...sampleLots.filter(l => l.auctionId === 'CLASSICVEH24' && l.price > 0).map(l => l.price)),
    createdAt: createPastDate(50),
    updatedAt: createPastDate(5),
  },
];

export const sampleUserBids: UserBid[] = [
  {
    id: 'BID001',
    lotId: 'LOTEVEI001',
    auctionId: '300724car',
    lotTitle: sampleLots.find(l => l.id === 'LOTEVEI001')?.title || '',
    lotImageUrl: sampleLots.find(l => l.id === 'LOTEVEI001')?.imageUrl || '',
    lotImageAiHint: sampleLots.find(l => l.id === 'LOTEVEI001')?.dataAiHint,
    userBidAmount: 67000,
    currentLotPrice: sampleLots.find(l => l.id === 'LOTEVEI001')?.price || 0,
    bidStatus: 'PERDENDO',
    bidDate: createPastDate(0, 2),
    lotEndDate: sampleLots.find(l => l.id === 'LOTEVEI001')?.endDate || new Date(),
  },
  {
    id: 'BID002',
    lotId: 'LOTE001',
    auctionId: '100625bra',
    lotTitle: sampleLots.find(l => l.id === 'LOTE001')?.title || '',
    lotImageUrl: sampleLots.find(l => l.id === 'LOTE001')?.imageUrl || '',
    lotImageAiHint: sampleLots.find(l => l.id === 'LOTE001')?.dataAiHint,
    userBidAmount: 45000,
    currentLotPrice: sampleLots.find(l => l.id === 'LOTE001')?.price || 0,
    bidStatus: 'GANHANDO',
    bidDate: createPastDate(1, 0),
    lotEndDate: sampleLots.find(l => l.id === 'LOTE001')?.endDate || new Date(),
  },
  {
    id: 'BID003',
    lotId: 'LOTE003',
    auctionId: '100625bra',
    lotTitle: sampleLots.find(l => l.id === 'LOTE003')?.title || '',
    lotImageUrl: sampleLots.find(l => l.id === 'LOTE003')?.imageUrl || '',
    lotImageAiHint: sampleLots.find(l => l.id === 'LOTE003')?.dataAiHint,
    userBidAmount: 105000,
    currentLotPrice: sampleLots.find(l => l.id === 'LOTE003')?.price || 0,
    bidStatus: 'ARREMATADO',
    bidDate: createPastDate(2, 1),
    lotEndDate: sampleLots.find(l => l.id === 'LOTE003')?.endDate || new Date(),
  },
    {
    id: 'BID004',
    lotId: 'LOTEVCLASS001',
    auctionId: 'CLASSICVEH24',
    lotTitle: sampleLots.find(l => l.id === 'LOTEVCLASS001')?.title || '',
    lotImageUrl: sampleLots.find(l => l.id === 'LOTEVCLASS001')?.imageUrl || '',
    lotImageAiHint: sampleLots.find(l => l.id === 'LOTEVCLASS001')?.dataAiHint,
    userBidAmount: 250000,
    currentLotPrice: sampleLots.find(l => l.id === 'LOTEVCLASS001')?.price || 0,
    bidStatus: 'GANHANDO',
    bidDate: createPastDate(0, 1),
    lotEndDate: sampleLots.find(l => l.id === 'LOTEVCLASS001')?.endDate || new Date(),
  },
];

export const sampleUserWins: UserWin[] = [
    {
        id: 'WIN001',
        lot: sampleLots.find(l => l.id === 'LOTE003')!,
        winningBidAmount: 105000,
        winDate: sampleLots.find(l => l.id === 'LOTE003')!.endDate,
        paymentStatus: 'PAGO',
        invoiceUrl: '/invoices/inv-lote003.pdf'
    },
    {
        id: 'WIN002',
        lot: sampleLots.find(l => l.id === 'LOTE006')!,
        winningBidAmount: 365000,
        winDate: sampleLots.find(l => l.id === 'LOTE006')!.endDate,
        paymentStatus: 'PENDENTE',
    }
];


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
    case 'ACTIVE': return 'Ativa'; // DirectSaleOfferStatus
    case 'SOLD': return 'Vendido'; // DirectSaleOfferStatus
    case 'EXPIRED': return 'Expirada'; // DirectSaleOfferStatus
    case 'PENDING_APPROVAL': return 'Pendente Aprovação'; // DirectSaleOfferStatus
    default: {
      const exhaustiveCheck: never = status;
      return exhaustiveCheck; 
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
      case 'ACTIVE': // DirectSaleOfferStatus
        return 'bg-green-600 text-white';
      case 'EM_BREVE':
      case 'PENDING_APPROVAL': // DirectSaleOfferStatus
        return 'bg-blue-500 text-white';
      case 'ENCERRADO':
      case 'VENDIDO':
      case 'NAO_VENDIDO':
      case 'SOLD': // DirectSaleOfferStatus
      case 'EXPIRED': // DirectSaleOfferStatus
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

export const getUniqueLotCategories = (): string[] => {
  const categories = new Set<string>();
  sampleLots.forEach(lot => {
    if (lot.type) {
      categories.add(lot.type);
    }
  });
  return Array.from(categories).sort();
};

export const getUniqueLotLocations = (): string[] => {
  const locations = new Set<string>();
  sampleLots.forEach(lot => {
    const locationString = lot.cityName && lot.stateUf ? `${lot.cityName} - ${lot.stateUf}` : lot.stateUf || lot.cityName;
    if (locationString) {
      locations.add(locationString);
    }
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
  return Array.from(sellerNames).sort();
};


export const slugify = (text: string): string => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD") // Normalize to decompose combined graphemes
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

export function getCategoryNameFromSlug(slug: string): string | undefined {
  const allCategoriesFromLots = getUniqueLotCategories(); 
  const foundCategoryName = allCategoriesFromLots.find(catName => slugify(catName) === slug);
  return foundCategoryName;
}

interface CategoryAssets {
  logoUrl: string;
  logoAiHint: string;
  bannerUrl: string;
  bannerAiHint: string;
  bannerText?: string;
}

export function getCategoryAssets(categoryNameOrSlug: string): CategoryAssets {
  const categoryName = getCategoryNameFromSlug(categoryNameOrSlug) || categoryNameOrSlug;

  const defaultAssets: CategoryAssets = {
    logoUrl: 'https://placehold.co/100x100.png?text=Categoria',
    logoAiHint: 'logo categoria',
    bannerUrl: 'https://placehold.co/1200x300.png?text=Banner+da+Categoria',
    bannerAiHint: 'banner categoria',
    bannerText: `Descubra os melhores lotes em ${categoryName}`,
  };

  if (slugify(categoryName).includes('veiculo')) {
    return {
      logoUrl: 'https://placehold.co/100x100.png?text=Carro',
      logoAiHint: 'icone carro',
      bannerUrl: 'https://placehold.co/1200x300.png?text=Veiculos+em+Destaque',
      bannerAiHint: 'carros estrada',
      bannerText: `Excelentes Ofertas em Veículos - ${categoryName}`,
    };
  }
  if (slugify(categoryName).includes('imovel')) {
    return {
      logoUrl: 'https://placehold.co/100x100.png?text=Casa',
      logoAiHint: 'icone casa',
      bannerUrl: 'https://placehold.co/1200x300.png?text=Oportunidades+Imobiliarias',
      bannerAiHint: 'imoveis cidade',
      bannerText: `Seu Novo Lar ou Investimento está aqui - ${categoryName}`,
    };
  }
  if (slugify(categoryName).includes('arte')) {
    return {
      logoUrl: 'https://placehold.co/100x100.png?text=Arte',
      logoAiHint: 'icone arte',
      bannerUrl: 'https://placehold.co/1200x300.png?text=Leilao+de+Arte',
      bannerAiHint: 'galeria arte',
      bannerText: `Obras Raras e Antiguidades - ${categoryName}`,
    };
  }

  return defaultAssets;
}


export const getUniqueSellers = (): SellerProfileInfo[] => {
  const sellerMap = new Map<string, SellerProfileInfo>();

  const addSeller = (name: string | undefined, isAuctioneer = false) => {
    if (!name) return;
    const slug = slugify(name);
    if (sellerMap.has(slug)) return;


    const randomYearsAgo = Math.floor(Math.random() * 3) + 1;
    const randomMonthsAgo = Math.floor(Math.random() * 12);
    const randomDaysAgo = Math.floor(Math.random() * 28);
    let memberSince = subYears(now, randomYearsAgo);
    memberSince = subMonths(memberSince, randomMonthsAgo);
    memberSince = subDays(memberSince, randomDaysAgo);

    const rating = Math.round((Math.random() * 1.5 + 3.5) * 10) / 10; // Rating between 3.5 and 5.0
    const activeLotsCount = Math.floor(Math.random() * 46) + 5; // 5 to 50 lots
    const initial = name ? name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : 'S';


    sellerMap.set(slug, {
      id: slug, 
      name,
      slug,
      memberSince,
      rating,
      activeLotsCount,
      logoUrl: `https://placehold.co/100x100.png?text=${initial}`,
      dataAiHintLogo: isAuctioneer ? 'logo leiloeiro placeholder' : 'logo comitente placeholder',
      createdAt: memberSince, 
      updatedAt: memberSince, 
    });
  };

  sampleAuctions.forEach(auction => {
    addSeller(auction.seller, false); 
  });
  sampleLots.forEach(lot => {
    addSeller(lot.sellerName, false); 
  });

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
                    name: auction.auctioneer,
                    slug: slug,
                    logoUrl: auction.auctioneerLogoUrl || `https://placehold.co/100x100.png?text=${initial}`,
                    dataAiHintLogo: 'logo leiloeiro',
                    registrationNumber: `JUCESP ${Math.floor(Math.random() * 900) + 100}`, 
                    memberSince: memberSince,
                    rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)), 
                    auctionsConductedCount: Math.floor(Math.random() * 200) + 50,
                    totalValueSold: (Math.random() * 5000000) + 1000000,
                    email: `${slug}@leiloes.com.br`,
                    phone: `(11) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
                    city: sampleLots[Math.floor(Math.random()*sampleLots.length)]?.cityName || 'São Paulo',
                    state: sampleLots[Math.floor(Math.random()*sampleLots.length)]?.stateUf || 'SP',
                    createdAt: memberSince, 
                    updatedAt: new Date(), 
                });
            }
        }
    });
    return Array.from(auctioneerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
};

// --- Venda Direta Sample Data ---
export const sampleDirectSaleOffers: DirectSaleOffer[] = [
  {
    id: 'DSO001',
    title: 'Coleção Completa de Selos Raros do Brasil Império',
    description: 'Uma oportunidade única para colecionadores: coleção completa e impecável de selos do período do Brasil Império, catalogada e com certificado de autenticidade para as peças mais valiosas. Inclui "Olho de Boi" e outras raridades.',
    imageUrl: 'https://placehold.co/800x600.png?text=Selos+Raros',
    dataAiHint: 'selos antigos colecao',
    galleryImageUrls: [
      'https://placehold.co/150x100.png?text=Selo+Olho+Boi',
      'https://placehold.co/150x100.png?text=Album+Selos',
      'https://placehold.co/150x100.png?text=Detalhe+Selo',
    ],
    offerType: 'ACCEPTS_PROPOSALS',
    minimumOfferPrice: 25000,
    category: 'Colecionáveis',
    locationCity: 'Rio de Janeiro',
    locationState: 'RJ',
    sellerName: 'Antiguidades Imperial',
    sellerId: slugify('Antiguidades Imperial'),
    sellerLogoUrl: 'https://placehold.co/100x100.png?text=AI',
    status: 'ACTIVE',
    itemsIncluded: ['Coleção completa de selos do Brasil Império (aproximadamente 350 selos)', 'Álbum classificador específico', 'Certificados de autenticidade para 5 selos chave'],
    tags: ['Selos', 'Brasil Império', 'Colecionismo', 'Raridade'],
    views: 150,
    proposalsCount: 2,
    createdAt: createPastDate(10),
    updatedAt: createPastDate(1),
    expiresAt: createFutureDate(20),
  },
  {
    id: 'DSO002',
    title: 'MacBook Pro 16" M1 Max - Seminovo, Garantia AppleCare+',
    description: 'MacBook Pro de 16 polegadas com chip M1 Max, 32GB RAM, 1TB SSD. Em estado de novo, pouquíssimo uso. Cobertura AppleCare+ válida até Novembro de 2025. Acompanha caixa original e todos os acessórios.',
    imageUrl: 'https://placehold.co/800x600.png?text=MacBook+Pro+16',
    dataAiHint: 'macbook pro aberto',
    galleryImageUrls: [
      'https://placehold.co/150x100.png?text=MacBook+Tela',
      'https://placehold.co/150x100.png?text=MacBook+Teclado',
      'https://placehold.co/150x100.png?text=MacBook+Portas',
    ],
    offerType: 'BUY_NOW',
    price: 18500,
    category: 'Eletrônicos',
    locationCity: 'São Paulo',
    locationState: 'SP',
    sellerName: 'Tech Revenda SP',
    sellerId: slugify('Tech Revenda SP'),
    status: 'ACTIVE',
    itemsIncluded: ['MacBook Pro 16" M1 Max', 'Carregador MagSafe Original', 'Cabo USB-C', 'Caixa Original', 'Comprovante AppleCare+'],
    tags: ['MacBook Pro', 'Apple', 'M1 Max', 'Notebook', 'Seminovo'],
    views: 280,
    createdAt: createPastDate(5),
    updatedAt: createPastDate(2),
  },
  {
    id: 'DSO003',
    title: 'Serviço de Consultoria em Marketing Digital (Pacote Startup)',
    description: 'Pacote de consultoria completo para startups, incluindo análise de mercado, definição de persona, planejamento estratégico de marketing digital (SEO, Mídias Sociais, Email Marketing) e 2 meses de acompanhamento. Ideal para lançar ou alavancar seu negócio online.',
    imageUrl: 'https://placehold.co/800x600.png?text=Consultoria+Marketing',
    dataAiHint: 'marketing digital reuniao',
    offerType: 'BUY_NOW',
    price: 4500,
    category: 'Serviços',
    locationCity: 'Remoto',
    locationState: 'BR',
    sellerName: 'Digital Boost Consultoria',
    sellerId: slugify('Digital Boost Consultoria'),
    status: 'ACTIVE',
    itemsIncluded: ['Diagnóstico de Marketing Atual', 'Planejamento Estratégico Detalhado (PDF)', 'Relatório de Persona (PDF)', '2 Sessões de Mentoria Online (2h cada)', 'Suporte via Email por 60 dias'],
    tags: ['Marketing Digital', 'Consultoria', 'Startup', 'SEO', 'Mídias Sociais'],
    views: 95,
    createdAt: createPastDate(20),
    updatedAt: createPastDate(5),
  },
  {
    id: 'DSO004',
    title: 'Automóvel Clássico: Ford Mustang 1968 Conversível',
    description: 'Raro Ford Mustang conversível de 1968, motor V8 289, câmbio automático. Restaurado com peças originais, pintura impecável na cor "Candy Apple Red". Um verdadeiro ícone, perfeito para colecionadores e entusiastas. Placa preta.',
    imageUrl: 'https://placehold.co/800x600.png?text=Mustang+68+Conv',
    dataAiHint: 'mustang conversivel vermelho',
    galleryImageUrls: [
      'https://placehold.co/150x100.png?text=Mustang+Interior',
      'https://placehold.co/150x100.png?text=Mustang+Motor',
      'https://placehold.co/150x100.png?text=Mustang+Capota',
    ],
    offerType: 'ACCEPTS_PROPOSALS',
    minimumOfferPrice: 320000,
    category: 'Veículo Clássico',
    locationCity: 'Curitiba',
    locationState: 'PR',
    sellerName: 'Garagem Clássicos PR',
    sellerId: slugify('Garagem Clássicos PR'),
    status: 'PENDING_APPROVAL',
    itemsIncluded: ['Ford Mustang 1968 Conversível', 'Capa protetora personalizada', 'Manuais originais (cópia)', 'Histórico de restauração'],
    tags: ['Ford Mustang', 'Clássico', 'Conversível', 'V8', 'Carro Antigo'],
    views: 450,
    proposalsCount: 1,
    createdAt: createPastDate(2),
    updatedAt: createPastDate(0),
    expiresAt: createFutureDate(45),
  },
   {
    id: 'DSO005',
    title: 'Lote de Equipamentos de Academia Profissional',
    description: 'Lote completo de equipamentos de academia profissional, marca Life Fitness e Technogym. Inclui esteiras, elípticos, bicicletas ergométricas, estação de musculação completa e conjunto de halteres. Ideal para montar ou renovar sua academia.',
    imageUrl: 'https://placehold.co/800x600.png?text=Equip+Academia',
    dataAiHint: 'academia equipamentos profissional',
    galleryImageUrls: [
      'https://placehold.co/150x100.png?text=Esteiras',
      'https://placehold.co/150x100.png?text=Estacao+Musculacao',
      'https://placehold.co/150x100.png?text=Halteres',
    ],
    offerType: 'BUY_NOW',
    price: 75000,
    category: 'Equipamentos Esportivos',
    locationCity: 'Belo Horizonte',
    locationState: 'MG',
    sellerName: 'Fitness Total Equipamentos',
    sellerId: slugify('Fitness Total Equipamentos'),
    status: 'SOLD',
    itemsIncluded: ['5 Esteiras Profissionais', '3 Elípticos', '2 Bicicletas Ergométricas', '1 Estação de Musculação Completa', 'Conjunto de Halteres (1kg a 30kg)'],
    tags: ['Academia', 'Fitness', 'Equipamentos', 'Musculação', 'Cardio'],
    views: 620,
    createdAt: createPastDate(60),
    updatedAt: createPastDate(35), // Data da venda
  },
   {
    id: 'DSO006',
    title: 'Obra de Arte Contemporânea - "Abstração Urbana" por Silva Jr.',
    description: 'Pintura acrílica sobre tela de grandes dimensões (150x200cm) do renomado artista contemporâneo Silva Jr. Obra vibrante e expressiva, ideal para colecionadores e apreciadores de arte moderna. Acompanha certificado do artista.',
    imageUrl: 'https://placehold.co/800x600.png?text=Arte+Abstrata',
    dataAiHint: 'pintura abstrata colorida',
    offerType: 'ACCEPTS_PROPOSALS',
    minimumOfferPrice: 12000,
    category: 'Arte e Antiguidades',
    locationCity: 'Porto Alegre',
    locationState: 'RS',
    sellerName: 'Galeria Pampa Arte',
    sellerId: slugify('Galeria Pampa Arte'),
    status: 'EXPIRED', // Expirou
    itemsIncluded: ['Pintura "Abstração Urbana"', 'Certificado de Autenticidade do Artista'],
    tags: ['Arte Contemporânea', 'Pintura', 'Abstrato', 'Silva Jr', 'Coleção'],
    views: 210,
    proposalsCount: 0,
    createdAt: createPastDate(90),
    updatedAt: createPastDate(30),
    expiresAt: createPastDate(30), // Expirou 30 dias atrás
  },
];
// --- End Venda Direta Sample Data ---


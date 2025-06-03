
import type { Auction, Lot, AuctionStatus, LotStatus, DocumentType, UserDocument, UserHabilitationStatus, UserDocumentStatus, UserBid, UserBidStatus, UserWin, PaymentStatus, SellerProfileInfo, RecentlyViewedLotInfo, AuctioneerProfileInfo } from '@/types';
import { format, differenceInDays, differenceInHours, differenceInMinutes, subYears, subMonths, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';


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


export const getAuctionStatusText = (status: AuctionStatus | LotStatus | UserDocumentStatus | UserHabilitationStatus ): string => {
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
    default: {
      // This should ideally not be reached if all statuses are handled.
      // To satisfy TypeScript's exhaustive check, you might:
      // 1. Log an error: console.error("Unhandled status:", status); return "Status Desconhecido";
      // 2. Or, if you are certain all cases are covered by the union type, you can use 'never':
      const exhaustiveCheck: never = status;
      return exhaustiveCheck; // This line will cause a compile-time error if a status is missed.
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


export const getLotStatusColor = (status: LotStatus): string => {
    switch (status) {
      case 'ABERTO_PARA_LANCES':
        return 'bg-green-600 text-white';
      case 'EM_BREVE':
        return 'bg-blue-500 text-white';
      case 'ENCERRADO':
      case 'VENDIDO':
      case 'NAO_VENDIDO':
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
      return { text: exhaustiveCheck, color: 'text-muted-foreground', progress: 0, icon: HelpCircle };
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
    // If auctioneer can also be a "seller" in some contexts
    // if (auction.auctioneer) sellerNames.add(auction.auctioneer);
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
  // This function would ideally fetch categories from Firestore or a global state.
  // For now, using sample data structure (assuming LotCategory structure exists in your types)
  const allCategoriesFromLots = getUniqueLotCategories(); // This gives names
  const foundCategoryName = allCategoriesFromLots.find(catName => slugify(catName) === slug);
  return foundCategoryName;
}

// Placeholder for category-specific assets
interface CategoryAssets {
  logoUrl: string;
  logoAiHint: string;
  bannerUrl: string;
  bannerAiHint: string;
  bannerText?: string;
}

export function getCategoryAssets(categoryNameOrSlug: string): CategoryAssets {
  const categoryName = getCategoryNameFromSlug(categoryNameOrSlug) || categoryNameOrSlug;

  // Basic placeholder logic, can be expanded
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
      id: slug, // Using slug as ID for sample data
      name,
      slug,
      memberSince,
      rating,
      activeLotsCount,
      logoUrl: `https://placehold.co/100x100.png?text=${initial}`,
      dataAiHintLogo: isAuctioneer ? 'logo leiloeiro placeholder' : 'logo comitente placeholder',
      createdAt: memberSince, // For simplicity
      updatedAt: memberSince, // For simplicity
    });
  };

  sampleAuctions.forEach(auction => {
    addSeller(auction.seller, false); // Sellers (Comitentes)
  });
  sampleLots.forEach(lot => {
    addSeller(lot.sellerName, false); // Sellers (Comitentes) from lots
  });

  return Array.from(sellerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
};

export const getUniqueAuctioneers = (): AuctioneerProfileInfo[] => {
    const auctioneerMap = new Map<string, AuctioneerProfileInfo>();

    sampleAuctions.forEach(auction => {
        if (auction.auctioneer) {
            const slug = slugify(auction.auctioneer);
            if (!auctioneerMap.has(slug)) {
                const randomYearsAgo = Math.floor(Math.random() * 5) + 1; // 1 to 5 years
                let memberSince = subYears(new Date(), randomYearsAgo);
                memberSince = subMonths(memberSince, Math.floor(Math.random() * 12));

                const initial = auction.auctioneer.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();

                auctioneerMap.set(slug, {
                    id: slug, // Use slug as ID for sample data
                    name: auction.auctioneer,
                    slug: slug,
                    logoUrl: auction.auctioneerLogoUrl || `https://placehold.co/100x100.png?text=${initial}`,
                    dataAiHintLogo: 'logo leiloeiro',
                    registrationNumber: `JUCESP ${Math.floor(Math.random() * 900) + 100}`, // Sample reg number
                    memberSince: memberSince,
                    rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)), // Rating 3.5 to 5.0
                    auctionsConductedCount: Math.floor(Math.random() * 200) + 50,
                    totalValueSold: (Math.random() * 5000000) + 1000000,
                    email: `${slug}@leiloes.com.br`,
                    phone: `(11) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
                    city: sampleLots[Math.floor(Math.random()*sampleLots.length)]?.cityName || 'São Paulo',
                    state: sampleLots[Math.floor(Math.random()*sampleLots.length)]?.stateUf || 'SP',
                    createdAt: memberSince, // Placeholder
                    updatedAt: new Date(), // Placeholder
                });
            }
        }
    });
    return Array.from(auctioneerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
};

```
  </change>
  <change>
    <file>/src/components/layout/header.tsx</file>
    <content><![CDATA[
'use client';

import Link from 'next/link';
import { Coins, Search, Menu, Heart, ChevronDown, Eye, UserCircle, LayoutList, Tag, Home as HomeIcon, Briefcase, Users2, MessageSquareText, Package, Tv, Percent, Handshake, FileText, History, Loader2, Bell, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MainNav from './main-nav';
import UserNav from './user-nav';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { sampleLots, slugify } from '@/lib/sample-data'; // getUniqueLotCategories from sample-data removed
import { getLotCategories } from '@/app/admin/categories/actions'; // Import for dynamic categories
import type { RecentlyViewedLotInfo, Lot, LotCategory } from '@/types';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { getRecentlyViewedIds } from '@/lib/recently-viewed-store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export default function Header() {
  const [recentlyViewedItems, setRecentlyViewedItems] = useState<RecentlyViewedLotInfo[]>([]);
  const [searchCategories, setSearchCategories] = useState<LotCategory[]>([]); // Changed to LotCategory[]
  const [isClient, setIsClient] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSearchCategorySlug, setSelectedSearchCategorySlug] = useState<string | undefined>(undefined);
  const [searchResults, setSearchResults] = useState<Lot[]>([]);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useAuth();

  const placeholderNotificationsCount = 3; 

  useEffect(() => {
    setIsClient(true);

    const viewedIds = getRecentlyViewedIds();
    const items: RecentlyViewedLotInfo[] = viewedIds.map(id => {
      const lot = sampleLots.find(l => l.id === id); // Still uses sampleLots for viewed items
      return lot ? {
        id: lot.id,
        title: lot.title,
        imageUrl: lot.imageUrl,
        auctionId: lot.auctionId,
        dataAiHint: lot.dataAiHint
      } : null;
    }).filter(item => item !== null) as RecentlyViewedLotInfo[];
    setRecentlyViewedItems(items);

    async function fetchCategoriesForSearch() {
      try {
        const fetchedCategories = await getLotCategories();
        setSearchCategories(fetchedCategories);
      } catch (error) {
        console.error("Error fetching categories for search dropdown:", error);
        setSearchCategories([]); // Set to empty or some default on error
      }
    }
    fetchCategoriesForSearch();
    
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (searchTerm.length < 3) {
      setSearchResults([]);
      setIsSearchDropdownOpen(false);
      setIsSearchLoading(false);
      return;
    }

    setIsSearchLoading(true);
    const debounceTimer = setTimeout(() => {
      // TODO: Replace sampleLots.filter with a proper backend search/filter API call
      const filtered = sampleLots.filter(lot => {
        const term = searchTerm.toLowerCase();
        const categoryMatch = selectedSearchCategorySlug && selectedSearchCategorySlug !== 'todas'
          ? slugify(lot.type) === selectedSearchCategorySlug // lot.type is the category name
          : true;

        const textMatch = (
          lot.title.toLowerCase().includes(term) ||
          (lot.description && lot.description.toLowerCase().includes(term)) ||
          lot.auctionName.toLowerCase().includes(term) ||
          lot.id.toLowerCase().includes(term)
        );
        return categoryMatch && textMatch;
      });
      setSearchResults(filtered.slice(0, 7));
      setIsSearchDropdownOpen(true);
      setIsSearchLoading(false);
    }, 500); 

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedSearchCategorySlug]);
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      let query = `term=${encodeURIComponent(searchTerm.trim())}`; // Always start with term
      if (selectedSearchCategorySlug && selectedSearchCategorySlug !== 'todas') {
        query += `&category=${selectedSearchCategorySlug}`;
      }
      // Redirect to /search with query params. The SearchPage will handle these.
      router.push(`/search?${query}`);
      setIsSearchDropdownOpen(false);
    }
  };


  return (
    <header className="sticky top-0 z-50 w-full shadow-md">
      {/* Top Bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 flex h-20 items-center">
          <div className="flex items-center">
            <div className="md:hidden mr-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-primary/80 focus-visible:ring-primary-foreground">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Abrir Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0 bg-background text-foreground">
                  <Link href="/" className="flex items-center space-x-2 text-lg font-semibold mb-4 p-6 border-b">
                    <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                      <AvatarImage src="https://placehold.co/40x40.png?text=BE" alt="BidExpert Logo Small" data-ai-hint="logo initial" />
                      <AvatarFallback>BE</AvatarFallback>
                    </Avatar>
                    <span className="text-primary">BidExpert</span>
                  </Link>
                  <nav className="flex flex-col gap-1 px-4">
                    <MainNav className="flex-col items-start space-x-0 space-y-0" />
                    <div className="mt-auto pt-4 border-t">
                      <UserNav />
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>

            <Link href="/" className="mr-4 flex items-center space-x-2">
              <Avatar className="h-10 w-10 bg-primary-foreground text-primary">
                <AvatarImage src="https://placehold.co/40x40.png?text=BE" alt="BidExpert Logo" data-ai-hint="logo initial" />
                <AvatarFallback className="font-bold text-xl">BE</AvatarFallback>
              </Avatar>
              <span className="font-bold text-3xl hidden sm:inline-block">
                BidExpert
              </span>
            </Link>
          </div>

          {isClient && (
             <form onSubmit={handleSearchSubmit} className="flex-1 flex justify-center items-center px-2 sm:px-4">
                <div ref={searchContainerRef} className="relative flex w-full max-w-xl bg-background rounded-md shadow-sm">
                  <Select 
                    value={selectedSearchCategorySlug || 'todas'}
                    onValueChange={(value) => setSelectedSearchCategorySlug(value === 'todas' ? undefined : value)}
                  >
                    <SelectTrigger 
                      className="w-[120px] sm:w-[150px] h-10 text-xs sm:text-sm text-muted-foreground border-r border-input rounded-l-md rounded-r-none focus:ring-0 focus:ring-offset-0 bg-secondary/20 truncate"
                      aria-label="Selecionar Categoria de Busca"
                    >
                      <SelectValue placeholder="Categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas" className="text-xs sm:text-sm">Todas</SelectItem>
                      {searchCategories.map(cat => (
                        <SelectItem 
                          key={cat.slug} 
                          value={cat.slug} 
                          className="text-xs sm:text-sm"
                        >
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="search"
                    placeholder="Buscar em produtos..."
                    className="h-10 pl-3 pr-10 flex-1 rounded-l-none rounded-r-md border-l-0 focus:ring-0 focus:ring-offset-0 text-foreground placeholder:text-muted-foreground"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => searchTerm.length >= 3 && setIsSearchDropdownOpen(true)}
                  />
                  <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Search className="h-4 w-4" />
                    <span className="sr-only">Buscar</span>
                  </Button>
                  {isSearchDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border shadow-lg rounded-md z-50 max-h-96 overflow-y-auto">
                      {isSearchLoading && (
                        <div className="p-4 text-center text-muted-foreground flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Buscando...
                        </div>
                      )}
                      {!isSearchLoading && searchResults.length === 0 && searchTerm.length >=3 && (
                        <div className="p-4 text-center text-muted-foreground">Nenhum lote encontrado.</div>
                      )}
                      {!isSearchLoading && searchResults.length > 0 && (
                        <ul className="divide-y divide-border">
                          {searchResults.map(lot => (
                            <li key={lot.id}>
                              <Link 
                                href={`/auctions/${lot.auctionId}/lots/${lot.id}`} 
                                className="flex items-center p-3 hover:bg-accent transition-colors"
                                onClick={() => setIsSearchDropdownOpen(false)}
                              >
                                <div className="relative h-12 w-16 flex-shrink-0 bg-muted rounded overflow-hidden mr-3">
                                  <Image src={lot.imageUrl} alt={lot.title} fill className="object-cover" data-ai-hint={lot.dataAiHint || "resultado busca"} />
                                </div>
                                <div className="flex-grow overflow-hidden">
                                  <p className="text-sm font-medium text-foreground truncate">{lot.title}</p>
                                  <p className="text-xs text-primary font-semibold">
                                    R$ {lot.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                  </p>
                                </div>
                              </Link>
                            </li>
                          ))}
                           <li className="p-2 border-t border-border">
                            <Button variant="link" className="w-full text-sm text-primary" onClick={handleSearchSubmit}>
                              Ver todos os resultados para "{searchTerm}"
                            </Button>
                          </li>
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </form>
          )}


          <div className="ml-auto flex items-center space-x-1 sm:space-x-2">
            {user && ( 
              <Button variant="ghost" size="icon" className="relative hover:bg-primary/80 focus-visible:ring-primary-foreground sm:inline-flex" asChild>
                <Link href="/dashboard/notifications">
                  <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
                  {placeholderNotificationsCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-primary-foreground text-primary border-primary">
                      {placeholderNotificationsCount}
                    </Badge>
                  )}
                  <span className="sr-only">Notificações</span>
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="icon" className="relative hover:bg-primary/80 focus-visible:ring-primary-foreground sm:inline-flex" asChild>
              <Link href="/dashboard/favorites">
                <Heart className="h-5 w-5 sm:h-6 sm:w-6" />
                <Badge variant="destructive" className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-primary-foreground text-primary border-primary">0</Badge>
                <span className="sr-only">Favoritos</span>
              </Link>
            </Button>
             <UserNav /> 
          </div>
        </div>
      </div>

      <div className="border-b bg-background text-foreground hidden md:block">
        <div className="container mx-auto px-4 flex h-12 items-center justify-between">
          <div className="flex items-center text-sm font-medium">
            <Link href="/" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1" aria-label="Início">
              <HomeIcon className="h-4 w-4" />
            </Link>
          </div>

          <nav className="flex items-center space-x-3 lg:space-x-4 text-xs sm:text-sm">
              <Link href="/" className="text-muted-foreground hover:text-primary transition-colors font-medium">Home</Link>
              <Link href="/sell-with-us" className="text-muted-foreground hover:text-primary transition-colors font-medium">Venda Conosco</Link>
              <Link href="/sellers" className="text-muted-foreground hover:text-primary transition-colors font-medium">Comitentes</Link>
              <Link href="/auctioneers" className="text-muted-foreground hover:text-primary transition-colors font-medium">Nossos Leiloeiros</Link>
          </nav>

          <div className="flex items-center">
            {isClient && recentlyViewedItems.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-sm font-medium hover:bg-accent hover:text-accent-foreground text-muted-foreground">
                    Histórico de Navegação <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-card text-card-foreground">
                  <DropdownMenuLabel className="flex justify-between items-center">
                    Itens Vistos Recentemente
                    <History className="h-4 w-4 text-muted-foreground" />
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {recentlyViewedItems.slice(0, 5).map(item => ( 
                    <DropdownMenuItem key={item.id} asChild className="cursor-pointer">
                      <Link href={`/auctions/${item.auctionId}/lots/${item.id}`} className="flex items-center gap-2 py-1.5">
                        <div className="relative h-12 w-12 flex-shrink-0 bg-muted rounded-sm overflow-hidden">
                          <Image src={item.imageUrl} alt={item.title} fill className="object-cover" data-ai-hint={item.dataAiHint || "item visto recentemente"} />
                        </div>
                        <span className="text-xs truncate flex-grow">{item.title}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/dashboard/history" className="flex items-center justify-center text-primary hover:underline text-xs py-1">
                      Ver Histórico Completo
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
             {isClient && recentlyViewedItems.length === 0 && (
                <Link href="/dashboard/history" className="text-sm text-muted-foreground hover:text-primary font-medium">
                    Histórico de Navegação
                </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
```
  </change>
  <change>
    <file>/src/app/auctioneers/page.tsx</file>
    <content><![CDATA[
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building, ArrowRight, CalendarDays, Star, PackageOpen, Loader2, Landmark } from 'lucide-react';
import Link from 'next/link';
import { getUniqueAuctioneers, slugify } from '@/lib/sample-data'; // Assuming getUniqueAuctioneers is similar to getUniqueSellers
import type { AuctioneerProfileInfo } from '@/types';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AuctioneersListPage() {
  const [auctioneers, setAuctioneers] = useState<AuctioneerProfileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, you'd fetch this from your backend/Firebase
    // For now, using the sample data generator
    setAuctioneers(getUniqueAuctioneers());
    setIsLoading(false);
  }, []);

  const getAuctioneerInitial = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : 'L';
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <section className="text-center py-12 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg">
          <Landmark className="mx-auto h-12 w-12 text-primary mb-4" />
          <h1 className="text-4xl font-bold mb-4 font-headline">Nossos Leiloeiros</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Profissionais e empresas que conduzem os leilões em nossa plataforma.
          </p>
        </section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="shadow-lg animate-pulse">
              <CardHeader className="items-center text-center">
                <div className="h-20 w-20 mb-3 rounded-full bg-muted"></div>
                <div className="h-6 w-3/4 bg-muted rounded"></div>
                <div className="h-4 w-1/2 bg-muted rounded mt-1"></div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="h-4 w-full bg-muted rounded"></div>
                <div className="h-4 w-3/4 bg-muted rounded"></div>
                <div className="h-4 w-1/2 bg-muted rounded"></div>
                <div className="h-9 w-full bg-muted rounded mt-3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <section className="text-center py-12 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg">
        <Landmark className="mx-auto h-12 w-12 text-primary mb-4" />
        <h1 className="text-4xl font-bold mb-4 font-headline">Nossos Leiloeiros</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Profissionais e empresas que conduzem os leilões em nossa plataforma.
        </p>
      </section>

      {auctioneers.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Nenhum leiloeiro encontrado.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {auctioneers.map((auctioneer) => (
          <Card key={auctioneer.slug} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
            <CardHeader className="items-center text-center">
              <Avatar className="h-20 w-20 mb-3 border-2 border-primary/30">
                <AvatarImage src={auctioneer.logoUrl} alt={auctioneer.name} data-ai-hint={auctioneer.dataAiHintLogo} />
                <AvatarFallback>{getAuctioneerInitial(auctioneer.name)}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl font-semibold">{auctioneer.name}</CardTitle>
              <CardDescription className="text-xs text-primary">{auctioneer.registrationNumber || 'Leiloeiro Credenciado'}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground text-center">
              <div className="flex items-center justify-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>Membro desde: {auctioneer.memberSince ? format(new Date(auctioneer.memberSince), 'MM/yyyy', { locale: ptBR }) : 'N/A'}</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <PackageOpen className="h-3.5 w-3.5" />
                <span>Leilões Conduzidos: {auctioneer.auctionsConductedCount || 0}</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                 <Star className="h-3.5 w-3.5 text-amber-500" />
                <span>Avaliação: {auctioneer.rating ? auctioneer.rating.toFixed(1) : 'N/A'} / 5.0</span>
              </div>
              {auctioneer.city && auctioneer.state && (
                <p className="text-xs text-muted-foreground">{auctioneer.city} - {auctioneer.state}</p>
              )}
            </CardContent>
            <CardFooter className="mt-auto pt-0 pb-4 px-4">
              <Button asChild variant="outline" className="w-full mt-3">
                <Link href={`/auctioneers/${auctioneer.slug}`}>
                  Ver Leilões Ativos <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

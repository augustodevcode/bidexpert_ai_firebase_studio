
import type { Auction, Lot, AuctionStatus, LotStatus, DocumentType, UserDocument, UserHabilitationStatus, UserDocumentStatus } from '@/types';

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
  { id: 'DT001', name: 'Documento de Identidade (Frente)', description: 'Foto nítida da frente do seu RG ou CNH.', isRequired: true, allowedFormats: ['JPG', 'PNG', 'PDF'] },
  { id: 'DT002', name: 'Documento de Identidade (Verso)', description: 'Foto nítida do verso do seu RG ou CNH.', isRequired: true, allowedFormats: ['JPG', 'PNG', 'PDF'] },
  { id: 'DT003', name: 'CPF', description: 'Foto nítida do seu CPF (caso não conste no RG/CNH).', isRequired: false, allowedFormats: ['JPG', 'PNG', 'PDF'] },
  { id: 'DT004', name: 'Comprovante de Residência', description: 'Conta de água, luz ou telefone recente (últimos 3 meses).', isRequired: true, allowedFormats: ['PDF', 'JPG', 'PNG'] },
  { id: 'DT005', name: 'Certidão de Casamento (se aplicável)', description: 'Caso seja casado(a), envie a certidão.', isRequired: false, allowedFormats: ['PDF', 'JPG', 'PNG'] },
];

export const sampleUserDocuments: UserDocument[] = [
  { id: 'UD001', documentTypeId: 'DT001', userId: 'user123', status: 'APPROVED', uploadDate: createPastDate(5), analysisDate: createPastDate(4), fileUrl: '#', documentType: sampleDocumentTypes.find(dt => dt.id === 'DT001') },
  { id: 'UD002', documentTypeId: 'DT002', userId: 'user123', status: 'REJECTED', uploadDate: createPastDate(5), analysisDate: createPastDate(4), rejectionReason: 'Imagem ilegível. Por favor, envie uma foto com melhor qualidade.', fileUrl: '#', documentType: sampleDocumentTypes.find(dt => dt.id === 'DT002') },
  { id: 'UD003', documentTypeId: 'DT003', userId: 'user123', status: 'NOT_SENT', documentType: sampleDocumentTypes.find(dt => dt.id === 'DT003') },
  { id: 'UD004', documentTypeId: 'DT004', userId: 'user123', status: 'PENDING_ANALYSIS', uploadDate: createPastDate(1), fileUrl: '#', documentType: sampleDocumentTypes.find(dt => dt.id === 'DT004') },
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
    location: 'TEOTÔNIO VILELA - AL',
    type: 'CASA',
    views: 1018,
    auctionName: 'Leilão Único Bradesco',
    price: 45000,
    endDate: createFutureDate(10, 2),
    bidsCount: 7,
    isFavorite: false,
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
    id: 'LOTE005', // Mantendo o ID para consistência com o exemplo anterior
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
    location: 'RIO VERDE - GO',
    type: 'MAQUINÁRIO',
    views: 305,
    auctionName: 'Leilão Online Agro',
    price: 180000,
    endDate: createFutureDate(7, 1),
    bidsCount: 3,
    isFavorite: false,
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
    location: 'São Paulo - SP',
    type: 'Automóvel',
    views: 1560,
    auctionName: 'Leilão de Veículos Premium',
    price: 65000, // Lance mínimo
    endDate: createFutureDate(5, 10), // Encerra em 5 dias e 10 horas
    bidsCount: 12,
    isFavorite: true,
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
  // Adicionar outros lotes de exemplo aqui, variando os tipos e dados
   {
    id: 'LOTE002',
    auctionId: '100625bra',
    title: 'CASA COM 234,50 M² - PORTÃO',
    imageUrl: 'https://placehold.co/800x600.png?text=Casa+Portao',
    dataAiHint: 'casa moderna suburbio',
    galleryImageUrls: ['https://placehold.co/150x100.png?text=Casa+Varanda', 'https://placehold.co/150x100.png?text=Casa+Jardim'],
    status: 'ABERTO_PARA_LANCES',
    location: 'LAURO DE FREITAS - BA',
    type: 'CASA',
    views: 681,
    auctionName: 'Leilão Único Bradesco',
    price: 664000,
    endDate: createFutureDate(10, 5),
    bidsCount: 0,
    isFavorite: true,
    description: 'Espaçosa casa em Lauro de Freitas, com 4 suítes, piscina e área gourmet. Ideal para famílias.',
  },
  {
    id: 'LOTE003',
    auctionId: '100625bra',
    title: 'APARTAMENTO COM 54,25 M² - CABULA',
    imageUrl: 'https://placehold.co/800x600.png?text=Apto+Cabula',
    dataAiHint: 'apartamento predio residencial',
    status: 'ENCERRADO', // Alterado para ENCERRADO pois a data é passada
    location: 'SALVADOR - BA',
    type: 'APARTAMENTO',
    views: 754,
    auctionName: 'Leilão Único Bradesco',
    price: 97000,
    endDate: createPastDate(2),
    bidsCount: 15,
    isFavorite: false,
    description: 'Apartamento funcional no Cabula, 2 quartos, próximo a transporte público e comércio.',
  },
  {
    id: 'LOTE004',
    auctionId: '100625bra',
    title: 'CASA COM 133,04 M² - VILA PERI',
    imageUrl: 'https://placehold.co/800x600.png?text=Casa+Vila+Peri',
    dataAiHint: 'casa terrea simples',
    status: 'EM_BREVE',
    location: 'FORTALEZA - CE',
    type: 'CASA',
    views: 527,
    auctionName: '1ª Praça Bradesco',
    price: 238000,
    endDate: createFutureDate(3, 0),
    bidsCount: 0,
    isFavorite: true,
    description: 'Casa em Fortaleza, boa localização na Vila Peri. Necessita de pequenas reformas.',
  },
  {
    id: 'LOTE006',
    auctionId: '20301vei',
    title: 'COLHEITADEIRA JOHN DEERE S680',
    imageUrl: 'https://placehold.co/800x600.png?text=Colheitadeira+JD',
    dataAiHint: 'colheitadeira graos campo',
    status: 'ENCERRADO',
    location: 'CAMPO GRANDE - MS',
    type: 'MAQUINÁRIO',
    views: 450,
    auctionName: 'Leilão Físico e Online Agro',
    price: 350000,
    endDate: createPastDate(5),
    bidsCount: 12,
    isFavorite: false,
    description: 'Colheitadeira John Deere S680, usada, em bom estado de funcionamento. Plataforma de corte inclusa.',
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
    seller: 'Bradesco S.A.',
    sellingBranch: 'Bradesco Matriz',
    vehicleLocation: 'Diversos Locais (ver lote)',
    auctionStages: [
        { name: "1ª Praça", endDate: createFutureDate(10, 5), statusText: "Encerramento 1ª Praça" },
        { name: "2ª Praça", endDate: createFutureDate(20, 5), statusText: "Encerramento 2ª Praça" },
    ],
    initialOffer: Math.min(...sampleLots.filter(l => l.auctionId === '100625bra').map(l => l.price)),
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
    seller: 'Diversos Comitentes',
    sellingBranch: 'AgroLeilões Central',
    vehicleLocation: 'Pátio Central AgroLeilões',
     auctionStages: [
        { name: "Leilão Online", endDate: createFutureDate(7, 1), statusText: "Encerramento Lances" },
    ],
    initialOffer: Math.min(...sampleLots.filter(l => l.auctionId === '20301vei').map(l => l.price)),
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
    vehicleLocation: 'Pátio SuperBid SP',
    auctionStages: [
        { name: "Fase de Lances Online", endDate: createFutureDate(5, 10), statusText: "Encerramento Online" },
    ],
    initialOffer: Math.min(...sampleLots.filter(l => l.auctionId === '300724car').map(l => l.price)),
  },
  {
    id: '15926',
    fullTitle: 'Leilão Tribunal de Justiça SP',
    title: 'Leilão Judicial Imóveis Ribeirão Preto',
    auctionDate: createPastDate(2), // Já encerrado
    totalLots: 0, 
    status: 'ENCERRADO',
    auctioneer: 'Bomvalor Judicial',
    category: 'Imóveis',
    auctioneerLogoUrl: 'https://placehold.co/150x75.png?text=Logo+TJSP&font=roboto',
    lots: [], // Se quiser popular, adicione lotes aqui e atualize totalLots
    seller: 'Tribunal de Justiça SP',
    visits: 5000,
    imageUrl: 'https://placehold.co/150x75.png?text=Leilao+TJSP&font=roboto',
    dataAiHint: 'logo justica leilao',
     auctionStages: [
        { name: "Praça Única", endDate: createPastDate(2), statusText: "Encerrado" },
    ],
    initialOffer: 0,
  },
];


export const getAuctionStatusText = (status: AuctionStatus | LotStatus | UserDocumentStatus | UserHabilitationStatus ): string => {
  switch (status) {
    case 'ABERTO_PARA_LANCES': return 'Aberto para Lances';
    case 'EM_BREVE': return 'Em Breve';
    case 'ENCERRADO': return 'Encerrado';
    case 'FINALIZADO': return 'Finalizado';
    case 'ABERTO': return 'Aberto';
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
      // For type safety, if a new status is added and not handled, this will give a hint.
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

export const getUserHabilitationStatusInfo = (status: UserHabilitationStatus): { text: string; color: string; progress: number } => {
  switch (status) {
    case 'PENDING_DOCUMENTS':
      return { text: 'Documentação Pendente', color: 'bg-orange-500', progress: 25 };
    case 'PENDING_ANALYSIS':
      return { text: 'Documentos em Análise', color: 'bg-yellow-500', progress: 50 };
    case 'REJECTED_DOCUMENTS':
      return { text: 'Documentos Rejeitados', color: 'bg-red-500', progress: 75 }; // Still progress, but needs action
    case 'HABILITATED':
      return { text: 'Habilitado para Dar Lances', color: 'bg-green-500', progress: 100 };
    case 'BLOCKED':
      return { text: 'Conta Bloqueada', color: 'bg-destructive', progress: 0 };
    default:
      const exhaustiveCheck: never = status;
      return { text: exhaustiveCheck, color: 'bg-gray-500', progress: 0 };
  }
};

    

import type { Auction, Lot, AuctionStatus, LotStatus } from '@/types';

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

export const sampleLots: Lot[] = [
  {
    id: 'LOTE001',
    auctionId: '100625bra',
    title: 'CASA COM 129,30 M² - CENTRO',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'casa residencial',
    status: 'ABERTO_PARA_LANCES',
    location: 'TEOTÔNIO VILELA - AL',
    type: 'CASA',
    views: 1018,
    auctionName: 'Leilão Único',
    price: 45000,
    endDate: createFutureDate(10, 2), // Encerra em 10 dias e 2 horas
    bidsCount: 7,
    isFavorite: false,
  },
  {
    id: 'LOTE002',
    auctionId: '100625bra',
    title: 'CASA COM 234,50 M² - PORTÃO',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'casa moderna',
    status: 'ABERTO_PARA_LANCES',
    location: 'LAURO DE FREITAS - BA',
    type: 'CASA',
    views: 681,
    auctionName: 'Leilão Único',
    price: 664000,
    endDate: createFutureDate(10, 5), // Encerra em 10 dias e 5 horas
    bidsCount: 0,
    isFavorite: true,
  },
  {
    id: 'LOTE003',
    auctionId: '100625bra',
    title: 'APARTAMENTO COM 54,25 M² - CABULA',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'apartamento predio',
    status: 'ABERTO_PARA_LANCES',
    location: 'SALVADOR - BA',
    type: 'APARTAMENTO',
    views: 754,
    auctionName: 'Leilão Único',
    price: 97000,
    endDate: createPastDate(2), // Encerrado há 2 dias
    bidsCount: 15,
    isFavorite: false,
  },
  {
    id: 'LOTE004',
    auctionId: '100625bra',
    title: 'CASA COM 133,04 M² - VILA PERI',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'casa terrea',
    status: 'EM_BREVE',
    location: 'FORTALEZA - CE',
    type: 'CASA',
    views: 527,
    auctionName: '1ª Praça',
    price: 238000,
    endDate: createFutureDate(3, 0), // Em breve, começa em 3 dias
    bidsCount: 0,
    isFavorite: true,
  },
  {
    id: 'LOTE005',
    auctionId: '20301vei',
    title: 'TRATOR AGRÍCOLA NEW HOLLAND T7',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'trator agricola',
    status: 'ABERTO_PARA_LANCES',
    location: 'RIO VERDE - GO',
    type: 'MAQUINÁRIO',
    views: 305,
    auctionName: 'Leilão Online',
    price: 180000,
    endDate: createFutureDate(7, 1),
    bidsCount: 3,
    isFavorite: false,
  },
  {
    id: 'LOTE006',
    auctionId: '20301vei',
    title: 'COLHEITADEIRA JOHN DEERE S680',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'colheitadeira campo',
    status: 'ENCERRADO',
    location: 'CAMPO GRANDE - MS',
    type: 'MAQUINÁRIO',
    views: 450,
    auctionName: 'Leilão Físico e Online',
    price: 350000,
    endDate: createPastDate(5),
    bidsCount: 12,
    isFavorite: false,
  },
];

export const sampleAuctions: Auction[] = [
  {
    id: '100625bra',
    title: 'Leilão 100625bra',
    fullTitle: 'Grande Leilão de Imóveis Bradesco',
    auctionDate: createFutureDate(0, 1), // Supõe que a data do leilão é hoje, mas os lotes têm suas próprias datas
    totalLots: sampleLots.filter(l => l.auctionId === '100625bra').length,
    status: 'ABERTO',
    auctioneer: 'VICENTE PAULO - JUCEMA N° 12/96',
    category: 'Extrajudicial',
    auctioneerLogoUrl: 'https://placehold.co/150x50.png?text=Bradesco&font=roboto',
    visits: 16913,
    lots: sampleLots.filter(l => l.auctionId === '100625bra'),
    imageUrl: 'https://placehold.co/150x75.png?text=Bradesco&font=roboto', // Main auction image can be the logo
    dataAiHint: 'logo banco',
    seller: 'Bradesco S.A.',
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
    imageUrl: 'https://placehold.co/150x75.png?text=AgroLeiloes&font=roboto',
    dataAiHint: 'logo leilao',
    seller: 'Diversos Comitentes',
  },
  // Manter outros leilões de exemplo da AuctionCard, se necessário, ou adaptá-los.
  // Por ora, vou remover os antigos para focar nos novos com lotes.
  {
    id: '15926',
    fullTitle: 'Leilão Tribunal de Justiça SP',
    title: 'Leilão Judicial Imóveis Ribeirão Preto',
    auctionDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    totalLots: 0, // Adicionar lotes se quiser testar esta auction
    status: 'ENCERRADO',
    auctioneer: 'Bomvalor Judicial',
    category: 'Imóveis',
    auctioneerLogoUrl: 'https://placehold.co/150x75.png?text=Logo+TJSP&font=roboto',
    lots: [],
    seller: 'Tribunal de Justiça SP',
    visits: 5000,
  },
];


export const getAuctionStatusText = (status: AuctionStatus | LotStatus): string => {
  switch (status) {
    case 'ABERTO_PARA_LANCES':
      return 'Aberto para Lances';
    case 'EM_BREVE':
      return 'Em Breve';
    case 'ENCERRADO':
      return 'Encerrado';
    case 'FINALIZADO': // Para Auction
      return 'Finalizado';
    case 'ABERTO': // Para Auction
      return 'Aberto';
    case 'VENDIDO': // Para Lot
      return 'Vendido';
    case 'NAO_VENDIDO': // Para Lot
      return 'Não Vendido';
    default: {
      // const _exhaustiveCheck: never = status; // Comentado para evitar erro de compilação se status for string
      return 'Desconhecido';
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

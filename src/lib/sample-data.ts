
import type { Auction } from '@/types';

const now = new Date();

export const sampleAuctions: Auction[] = [
  {
    id: '15926',
    fullTitle: 'Leilão Tribunal de Justiça SP',
    title: 'Direitos Apartamento A.T. 49,15m², em Ribeirão Preto/SP',
    description: 'Apartamento com 2 dormitórios, sala, cozinha, banheiro e área de serviço. Condomínio com portaria 24h e área de lazer.',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'apartamento predio',
    auctioneerLogoUrl: 'https://placehold.co/150x75.png?text=Logo+TJSP&font=roboto',
    auctioneerName: 'Bomvalor Judicial',
    category: 'Imóveis',
    initialOffer: 45000,
    auctionStages: [
      { name: '1ª Praça', statusText: 'Encerramento', endDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) }, // Encerrado há 2 dias
      { name: '2ª Praça', statusText: 'Encerramento', endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000) }, // Encerra em 5 dias
    ],
    status: 'ABERTO_PARA_LANCES',
    seller: 'Tribunal de Justiça SP',
    location: 'Ribeirão Preto/SP',
    condition: 'Usado - Bom',
    isFavorite: false,
    bidsCount: 12,
    currentBid: 45000, // Assuming current bid starts at initial offer
  },
  {
    id: '20301',
    fullTitle: 'Leilão Fazenda Progresso',
    title: 'Trator Agrícola Massey Ferguson 2022',
    description: 'Trator em excelente estado de conservação, poucas horas de uso. Ideal para médias e grandes propriedades rurais.',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'trator agricola',
    auctioneerLogoUrl: 'https://placehold.co/150x75.png?text=Fazenda+Logo&font=roboto',
    auctioneerName: 'AgroLeilões',
    category: 'Maquinário Agrícola',
    initialOffer: 120000,
    auctionStages: [
      { name: '1ª Praça', statusText: 'Encerramento', endDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) },
    ],
    status: 'ABERTO_PARA_LANCES',
    seller: 'Fazenda Progresso Ltda.',
    location: 'Rio Verde/GO',
    condition: 'Usado - Como Novo',
    isFavorite: true,
    bidsCount: 5,
    currentBid: 122500,
  },
  {
    id: '78845',
    fullTitle: 'Leilão de Veículos Usados',
    title: 'Toyota Hilux CD 4x4 Diesel 2020',
    description: 'Caminhonete robusta e confiável, completa com ar condicionado, direção hidráulica, e tração 4x4. Único dono.',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'carro caminhonete',
    auctioneerLogoUrl: 'https://placehold.co/150x75.png?text=AutoLeilão&font=roboto',
    auctioneerName: 'Central de Leilões',
    category: 'Veículos',
    initialOffer: 95000,
    auctionStages: [
      { name: 'Única Praça', statusText: 'Encerramento', endDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) }, // Encerrado há 5 dias
    ],
    status: 'ENCERRADO',
    seller: 'Banco XYZ Financeira',
    location: 'Curitiba/PR',
    condition: 'Usado - Bom',
    isFavorite: false,
    bidsCount: 33,
    currentBid: 110000,
  },
  {
    id: '90112',
    fullTitle: 'Leilão Industrial S.A.',
    title: 'Torno Mecânico Industrial Nardini ND-250',
    description: 'Torno mecânico robusto para usinagem pesada. Acompanha placas e ferramentas. Necessita de revisão.',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'maquina industrial',
    auctioneerLogoUrl: 'https://placehold.co/150x75.png?text=IndLeilões&font=roboto',
    auctioneerName: 'Máquinas Leilões',
    category: 'Industrial',
    initialOffer: 25000,
    auctionStages: [
        { name: '1ª Praça', statusText: 'Encerramento', endDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000) },
        { name: '2ª Praça', statusText: 'Encerramento', endDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000) },
    ],
    status: 'EM_BREVE', // Example of upcoming auction
    seller: 'Metalúrgica Jota',
    location: 'Caxias do Sul/RS',
    condition: 'Usado - Regular',
    isFavorite: false,
    bidsCount: 0,
    currentBid: 25000,
  },
];

export const getAuctionStatusText = (status: Auction['status']): string => {
  switch (status) {
    case 'ABERTO_PARA_LANCES':
      return 'Aberto para Lances';
    case 'EM_BREVE':
      return 'Em Breve';
    case 'ENCERRADO':
      return 'Encerrado';
    case 'FINALIZADO':
      return 'Finalizado';
    default:
      return 'Desconhecido';
  }
};

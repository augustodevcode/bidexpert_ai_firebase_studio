
import type { Auction, Lot, AuctionStatus, LotStatus, DocumentType, UserDocument, UserHabilitationStatus, UserDocumentStatus, UserBid, UserBidStatus, UserWin, PaymentStatus, SellerProfileInfo, RecentlyViewedLotInfo, AuctioneerProfileInfo, DirectSaleOffer, DirectSaleOfferType, DirectSaleOfferStatus, BidInfo, Review, LotQuestion, LotCategory, StateInfo, CityInfo, MediaItem, PlatformSettings, MentalTriggerSettings, HomepageSectionConfig, BadgeVisibilitySettings, SectionBadgeConfig, MapSettings, AuctionStage } from '@/types';
import { format, differenceInDays, differenceInHours, differenceInMinutes, subYears, subMonths, subDays, addDays as dateFnsAddDays, isPast, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Clock, FileWarning, CheckCircle2, ShieldAlert, HelpCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';


const now = new Date();

const createFutureDate = (days: number, hours: number = 0, minutes: number = 0) => {
  let date = dateFnsAddDays(now, days);
  date = addHours(date, hours);
  date.setMinutes(now.getMinutes() + minutes); // Keep minutes relative to current for small adjustments
  return date;
};

const createPastDate = (days: number, hours: number = 0, minutes: number = 0, fromDate?: Date) => {
    const baseDate = fromDate || now;
    let date = subDays(baseDate, days);
    date = subMonths(date, 0); // Ensure month/year is handled if days are many
    date = subYears(date, 0);
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

export const sampleLotCategoriesStatic: Omit<LotCategory, 'id' | 'createdAt' | 'updatedAt' | 'itemCount'>[] = [
  { name: 'Imóveis', slug: 'imoveis', description: 'Casas, apartamentos, terrenos, salas comerciais, galpões, fazendas, sítios e chácaras.', subcategories: ['Apartamentos', 'Casas', 'Terrenos', 'Salas Comerciais', 'Galpões e Prédios', 'Imóveis Rurais', 'Vagas de Garagem', 'Glebas'] },
  { name: 'Veículos', slug: 'veiculos', description: 'Carros, motos, caminhões, ônibus, utilitários e outros veículos terrestres.', subcategories: ['Carros', 'Motos', 'Caminhões e Ônibus', 'Veículos Pesados', 'Embarcações', 'Aeronaves'] },
  { name: 'Máquinas e Equipamentos', slug: 'maquinas-e-equipamentos', description: 'Máquinas pesadas, agrícolas, industriais, equipamentos de construção e diversos.', subcategories: ['Máquinas Agrícolas', 'Máquinas Industriais', 'Equipamentos de Construção', 'Equipamentos de Mineração', 'Empilhadeiras e Transpaleteiras', 'Movimentação e Transporte'] },
  { name: 'Eletrônicos e Tecnologia', slug: 'eletronicos-e-tecnologia', description: 'Celulares, computadores, notebooks, televisores, áudio, componentes e peças.', subcategories: ['Celulares e Tablets', 'Computadores e Notebooks', 'Televisores e Áudio', 'Componentes e Peças'] },
  { name: 'Casa e Decoração', slug: 'casa-e-decoracao', description: 'Móveis, eletrodomésticos, utensílios de cozinha, itens de decoração e iluminação.', subcategories: ['Móveis Residenciais', 'Eletrodomésticos', 'Utensílios de Cozinha', 'Decoração e Iluminação', 'Cama, Mesa e Banho'] },
  { name: 'Arte e Antiguidades', slug: 'arte-e-antiguidades', description: 'Obras de arte como pinturas e esculturas, móveis antigos e itens colecionáveis.', subcategories: ['Obras de Arte (Pinturas, Esculturas)', 'Antiguidades', 'Itens Colecionáveis', 'Numismática'] },
  { name: 'Joias e Acessórios de Luxo', slug: 'joias-e-acessorios-de-luxo', description: 'Joias, relógios de pulso e bolso, bolsas de grife, canetas e artigos de luxo.', subcategories: ['Joias', 'Relógios de Luxo', 'Bolsas de Grife', 'Canetas Finas'] },
  { name: 'Semoventes', slug: 'semoventes', description: 'Animais como bovinos, equinos, ovinos, caprinos e outros animais de produção ou estimação.', subcategories: ['Bovinos', 'Equinos', 'Ovinos e Caprinos', 'Aves', 'Outros Animais de Produção ou Estimação'] },
  { name: 'Materiais e Sucatas', slug: 'materiais-e-sucatas', description: 'Materiais de construção civil, sucatas metálicas, resíduos industriais e recicláveis.', subcategories: ['Materiais de Construção Civil', 'Sucatas Metálicas (Ferrosas e Não Ferrosas)', 'Resíduos Industriais', 'Papel e Plástico Reciclável'] },
  { name: 'Industrial (Geral)', slug: 'industrial-geral', description: 'Estoques industriais, matéria-prima, equipamentos de escritório (de empresas), e outros bens industriais.', subcategories: ['Estoques Industriais', 'Matéria-prima', 'Equipamentos de Escritório (Empresarial)', 'Mobiliário Corporativo'] },
  { name: 'Serviços e Contratos', slug: 'servicos-e-contratos', description: 'Contratação de serviços, concessões e outras oportunidades contratuais.', subcategories: ['Serviços de TI', 'Serviços de Limpeza', 'Consultoria', 'Contratos de Fornecimento']},
  { name: 'Outros Itens', slug: 'outros-itens', description: 'Consórcios, energia solar, direitos creditórios, itens diversos e oportunidades únicas.', subcategories: ['Consórcios', 'Energia Solar (Equipamentos)', 'Direitos Creditórios', 'Títulos e Valores Mobiliários', 'Vinhos e Bebidas Raras', 'Instrumentos Musicais', 'Bens Diversos'] },
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
    { name: 'Prefeitura Municipal de Campinas', city: 'Campinas', state: 'SP', logoUrl: 'https://placehold.co/100x100.png?text=PMC', dataAiHint: 'prefeitura brasao' },
    { name: 'Secretaria de Administração de Salvador', city: 'Salvador', state: 'BA', logoUrl: 'https://placehold.co/100x100.png?text=SAS', dataAiHint: 'governo edificio' },
    { name: 'Vara Cível de São Paulo - TJSP', city: 'São Paulo', state: 'SP', logoUrl: 'https://placehold.co/100x100.png?text=TJSP', dataAiHint: 'tribunal justica predio' },
    { name: 'Vara de Falências do Rio de Janeiro - TJRJ', city: 'Rio de Janeiro', state: 'RJ', logoUrl: 'https://placehold.co/100x100.png?text=TJRJ', dataAiHint: 'tribunal justica martelo' },
    { name: 'Vara do Trabalho de Curitiba - TRT9', city: 'Curitiba', state: 'PR', logoUrl: 'https://placehold.co/100x100.png?text=TRT9', dataAiHint: 'justica trabalho predio' },
];

export const sampleAuctioneersStatic: Omit<AuctioneerProfileInfo, 'id'|'publicId'|'slug'|'createdAt'|'updatedAt'|'memberSince'|'rating'|'auctionsConductedCount'|'totalValueSold'>[] = [
  { name: 'VICENTE PAULO - JUCEMA N° 12/96', logoUrl: 'https://placehold.co/150x50.png?text=VP&font=roboto', dataAiHint: 'leiloeiro martelo', city: 'São Luís', state: 'MA'},
  { name: 'AGROLEILÕES LTDA - MATRICULA XYZ/00', logoUrl: 'https://images.unsplash.com/photo-1660071155921-7204712d7d1a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxhdWN0aW9uZWVyJTIwbG9nb3xlbnwwfHx8fDE3NTAzNTYwNjV8MA&ixlib=rb-4.1.0&q=80&w=1080', dataAiHint: 'auctioneer logo', city: 'Rio Verde', state: 'GO'},
  { name: 'SUPERBID Leilões - JUCESP Nº 123', logoUrl: 'https://placehold.co/150x75.png?text=SuperBid&font=roboto', dataAiHint: 'logo empresa moderno', city: 'São Paulo', state: 'SP'},
  { name: 'Bomvalor Judicial', city: 'Ribeirão Preto', state: 'SP'},
  { name: 'Galeria Antika - Leiloeiro Oficial A.Silva', logoUrl: 'https://images.unsplash.com/photo-1563798211121-19d806779c46?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8YXVjdGlvbmVlciUyMGxvZ298ZW58MHx8fHwxNzUwMzU2MDY1fDA&ixlib=rb-4.1.0&q=80&w=1080', dataAiHint: 'auctioneer logo', city: 'São Paulo', state: 'SP'},
  { name: 'Clássicos Leilões BR - Leiloeiro J.Pimenta', logoUrl: 'https://images.unsplash.com/photo-1563798211121-19d806779c46?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8YXVjdGlvbmVlciUyMGxvZ298ZW58MHx8fHwxNzUwMzU2MDY1fDA&ixlib=rb-4.1.0&q=80&w=1080', dataAiHint: 'auctioneer logo', city: 'Curitiba', state: 'PR'},
  { name: 'Leiloeiro XYZ Oficial', city: 'Rio de Janeiro', state: 'RJ'},
  { name: 'Leiloeiro Oficial Bradesco', logoUrl: 'https://images.unsplash.com/photo-1653499676737-becf2c9562c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxhdWN0aW9uZWVyJTIwbG9nb3xlbnwwfHx8fDE3NTAzNTYwNjV8MA&ixlib=rb-4.1.0&q=80&w=1080', dataAiHint: 'auctioneer logo', city: 'São Paulo', state: 'SP'},
  { name: 'Leiloeiro Público Municipal Campinas', city: 'Campinas', state: 'SP', logoUrl: 'https://images.unsplash.com/photo-1703584449021-4cfdfe9650dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxhdWN0aW9uZWVyJTIwbG9nb3xlbnwwfHx8fDE3NTAzNTYwNjV8MA&ixlib=rb-4.1.0&q=80&w=1080', dataAiHint: 'auctioneer logo'},
  { name: 'Central de Compras Bahia', city: 'Salvador', state: 'BA', logoUrl: 'https://images.unsplash.com/photo-1563798211121-19d806779c46?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8YXVjdGlvbmVlciUyMGxvZ298ZW58MHx8fHwxNzUwMzU2MDY1fDA&ixlib=rb-4.1.0&q=80&w=1080', dataAiHint: 'auctioneer logo'},
];

export const sampleAuctionsRaw: Omit<Auction, 'createdAt' | 'updatedAt' | 'lots' | 'totalLots' | 'category' | 'auctioneer' | 'seller' | 'auctioneerLogoUrl'>[] = [
  { id: '100625bra', publicId: 'AUC-IMOVEIS-XYZ123P1', title: 'Leilão de Imóveis Residenciais e Comerciais', fullTitle: 'Grande Leilão de Imóveis do Banco Bradesco - Oportunidades em SP, BA e AL', description: 'Leilão online de casas, apartamentos e terrenos. Excelentes oportunidades de investimento e moradia. Lances a partir de R$ 45.000. Não perca!', status: 'ABERTO_PARA_LANCES', auctionType: 'EXTRAJUDICIAL', categoryId: 'cat-imoveis', auctioneerId: 'auct-leiloeiro-oficial-bradesco', sellerId: 'seller-banco-bradesco-s-a', auctionDate: createFutureDate(0, 0, 15), endDate: createFutureDate(10, 5), city: 'Nacional', state: 'BR', imageUrl: 'https://images.unsplash.com/photo-1711488398760-b89f4023905a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxsZWlsYW8lMjBpbW92ZWlzJTIwY2lkYWRlfGVufDB8fHx8MTc1MDM1NjA2NXww&ixlib=rb-4.1.0&q=80&w=1080', dataAiHint: 'leilao imoveis cidade', documentsUrl: '#', visits: 2580, initialOffer: 45000, isFavorite: false, auctionStages: [{ name: '1ª Praça', endDate: createFutureDate(5,0), statusText: 'Encerramento', initialPrice: 45000 }, { name: '2ª Praça', endDate: createFutureDate(10, 5), statusText: 'Encerramento', initialPrice: 30000 }] },
  { id: '300724car', publicId: 'AUC-VEICULOS-ABC456Q2', title: 'Leilão de Veículos Usados e Seminovos', description: 'Diversos modelos e marcas. Carros de passeio, utilitários e motos com preços especiais.', status: 'EM_BREVE', auctionType: 'EXTRAJUDICIAL', categoryId: 'cat-veiculos', auctioneerId: 'auct-superbid-leiloes', sellerId: 'seller-proprietario-particular-1', auctionDate: createFutureDate(7, 0), endDate: createFutureDate(14, 0), city: 'São Paulo', state: 'SP', imageUrl: 'https://images.unsplash.com/photo-1647089490645-c46e824475d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxsZWlsYW8lMjBjYXJyb3MlMjBwYXRpb3xlbnwwfHx8fDE3NTAzNTYwNjV8MA&ixlib=rb-4.1.0&q=80&w=1080', dataAiHint: 'leilao carros patio', initialOffer: 15000, visits: 1230, auctionStages: [{ name: 'Abertura', endDate: createFutureDate(7,0), statusText: 'Início dos Lances', initialPrice: 15000 }] },
  { id: 'ART001ANTIQ', publicId: 'AUC-ARTECLAS-GHI789R3', title: 'Leilão de Arte e Antiguidades Clássicas', description: 'Peças raras, pinturas, esculturas e mobiliário antigo. Oportunidade para colecionadores.', status: 'ABERTO_PARA_LANCES', auctionType: 'PARTICULAR', categoryId: 'cat-arte-e-antiguidades', auctioneerId: 'auct-galeria-antika-leiloeiro-oficial-asilva', sellerId: 'seller-colecionadores-rj', auctionDate: createPastDate(2), endDate: createFutureDate(8, 0), city: 'Rio de Janeiro', state: 'RJ', imageUrl: 'https://images.unsplash.com/photo-1748722144965-6f7a17a87570?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxsZWlsYW8lMjBhcnRlJTIwcXVhZHJvc3xlbnwwfHx8fDE3NTAzNTYwNjV8MA&ixlib=rb-4.1.0&q=80&w=1080', dataAiHint: 'leilao arte quadros', initialOffer: 1000, visits: 850 },
  { id: 'CLASSICVEH24', publicId: 'AUC-MUSTANGS-JKL012S4', title: 'Leilão Especial de Mustangs Clássicos', description: 'Modelos raros de Ford Mustang das décadas de 60 e 70. Para apaixonados por clássicos.', status: 'ABERTO_PARA_LANCES', auctionType: 'PARTICULAR', categoryId: 'cat-veiculos', auctioneerId: 'auct-classicos-leiloes-br-leiloeiro-jpimenta', sellerId: 'seller-colecionadores-classicos-pr', auctionDate: createPastDate(1), endDate: createFutureDate(12, 0), city: 'Curitiba', state: 'PR', imageUrl: 'https://images.unsplash.com/photo-1598998267982-d2a80038fd0b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxtdXN0YW5nJTIwY2xhc3NpY28lMjBwZXJmaWx8ZW58MHx8fHwxNzUwMzU2MDY1fDA&ixlib=rb-4.1.0&q=80&w=1080', dataAiHint: 'mustang classico perfil', initialOffer: 150000, visits: 2100, auctionStages: [{ name: 'Pregão Único', endDate: createFutureDate(12,0), statusText: 'Encerramento Lances', initialPrice: 150000 }] },
  { id: '20301vei', publicId: 'AUC-MAQUINAS-MNO345T5', title: 'Leilão de Maquinário Pesado e Agrícola', description: 'Tratores, colheitadeiras e equipamentos industriais. Renove sua frota ou maquinário.', status: 'ABERTO_PARA_LANCES', auctionType: 'EXTRAJUDICIAL', categoryId: 'cat-maquinas-e-equipamentos', auctioneerId: 'auct-agroleiloes-ltda-matricula-xyz00', sellerId: 'seller-fazenda-boa-esperanca', auctionDate: createPastDate(3), endDate: createFutureDate(5, 0), city: 'Rio Verde', state: 'GO', imageUrl: 'https://images.unsplash.com/photo-1604225318415-20fddd721f35?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxtYXF1aW5hcyUyMHBlc2FkYXMlMjBjb25zdHJ1Y2FvfGVufDB8fHx8MTc1MDM1NjA2Nnww&ixlib=rb-4.1.0&q=80&w=1080', dataAiHint: 'maquinas pesadas construcao', initialOffer: 50000, visits: 975, isFavorite: true },
  {
    id: 'TP001-NOTEBOOKS', publicId: 'AUC-TPNOTE-PMC001X9', title: 'Tomada de Preços - Aquisição de Notebooks',
    fullTitle: 'Tomada de Preços Nº 001/2024 - Aquisição de Notebooks para Secretaria de Educação de Campinas',
    description: 'Processo de tomada de preços para aquisição de 80 notebooks para equipar escolas municipais. Especificações detalhadas no edital. Propostas devem ser enviadas em envelope lacrado até a data limite.',
    status: 'ACTIVE', auctionType: 'TOMADA_DE_PRECOS', categoryId: 'cat-eletronicos-e-tecnologia',
    auctioneerId: 'auct-leiloeiro-publico-municipal-campinas', sellerId: 'seller-prefeitura-municipal-de-campinas',
    auctionDate: createFutureDate(1, 9), endDate: createFutureDate(15, 17),
    city: 'Campinas', state: 'SP', imageUrl: 'https://images.unsplash.com/photo-1744051518421-1eaf2fbde680?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxub3RlYm9va3MlMjBwaWxoYSUyMGVzY3JpdG9yaW98ZW58MHx8fHwxNzUwMzU2MDY1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    dataAiHint: 'notebooks pilha escritorio', documentsUrl: '#edital-notebooks', visits: 150,
    initialOffer: 320000,
    auctionStages: [{ name: 'Recebimento de Propostas', endDate: createFutureDate(15,17), statusText: 'Prazo Final', initialPrice: 320000 }]
  },
  {
    id: 'TP002-VEICULOS', publicId: 'AUC-TPVEIC-SAS002Y0', title: 'Tomada de Preços - Alienação de Veículos da Frota',
    fullTitle: 'Tomada de Preços Nº 002/2024 - Alienação de Veículos Usados da Frota da Secretaria de Salvador',
    description: 'Alienação de veículos usados da frota municipal, incluindo carros de passeio e utilitários. Visitação permitida conforme edital. Propostas para lotes individuais ou para a frota completa.',
    status: 'ENCERRADO', auctionType: 'TOMADA_DE_PRECOS', categoryId: 'cat-veiculos',
    auctioneerId: 'auct-central-de-compras-bahia', sellerId: 'seller-secretaria-de-administracao-de-salvador',
    auctionDate: createPastDate(30, 9), endDate: createPastDate(15, 17),
    city: 'Salvador', state: 'BA', imageUrl: 'https://images.unsplash.com/photo-1658241213593-b7904e271aa8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxjYXJyb3MlMjB1c2Fkb3MlMjBwYXRpb3xlbnwwfHx8fDE3NTAzNTYwNjV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    dataAiHint: 'carros usados patio', documentsUrl: '#edital-veiculos', visits: 320,
    initialOffer: 80000,
    auctionStages: [{ name: 'Recebimento de Propostas', endDate: createPastDate(15,17), statusText: 'Encerrado', initialPrice: 80000 }]
  },
  {
    id: 'JUD001IMV', publicId: 'AUC-JUDIMV-SP001A1', title: 'Leilão Judicial - Apartamento em Moema',
    fullTitle: 'Leilão Judicial do TJSP - Apartamento 2 Dormitórios em Moema, São Paulo',
    description: 'Apartamento de 2 dormitórios, localizado em Moema, São Paulo. Leilão determinado pelo Processo nº 12345-67.2023.8.26.0001 da 1ª Vara Cível de São Paulo. Consulte o edital para mais informações.',
    status: 'ABERTO_PARA_LANCES', auctionType: 'JUDICIAL', categoryId: 'cat-imoveis',
    auctioneerId: 'auct-superbid-leiloes', sellerId: 'seller-vara-civel-de-sao-paulo-tjsp',
    auctionDate: createFutureDate(2, 0), endDate: createFutureDate(12, 0), city: 'São Paulo', state: 'SP',
    imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxhcGFydG1lbnQlMjBleHRlcmlvcnxlbnwwfHx8fDE3NTA5NTg5MDZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    dataAiHint: 'apartamento predio moderno', documentsUrl: '#edital-jud001', visits: 1850,
    initialOffer: 250000,
    auctionStages: [
      { name: '1ª Praça', endDate: createFutureDate(7,0), statusText: 'Encerramento 1ª Praça', initialPrice: 300000 },
      { name: '2ª Praça', endDate: createFutureDate(12,0), statusText: 'Encerramento 2ª Praça', initialPrice: 250000 }
    ]
  },
  {
    id: 'JUD002VEI', publicId: 'AUC-JUDVEI-RJ002B2', title: 'Leilão Judicial - Veículo Fiat Toro',
    fullTitle: 'Leilão Judicial TJRJ - Veículo Fiat Toro Freedom 2018 - Processo Falimentar',
    description: 'Veículo Fiat Toro Freedom 1.8 AT, ano/modelo 2018/2018, cor branca. Leilão oriundo do Processo nº 98765-43.2022.8.19.0001 da Vara de Falências do Rio de Janeiro. Veículo vendido no estado em que se encontra.',
    status: 'EM_BREVE', auctionType: 'JUDICIAL', categoryId: 'cat-veiculos',
    auctioneerId: 'auct-leiloeiro-xyz-oficial', sellerId: 'seller-vara-de-falencias-do-rio-de-janeiro-tjrj',
    auctionDate: createFutureDate(10, 0), endDate: createFutureDate(20, 0), city: 'Rio de Janeiro', state: 'RJ',
    imageUrl: 'https://images.unsplash.com/photo-1617093583090-67685879968e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxmaWF0JTIwdG9yb3xlbnwwfHx8fDE3NTA5NTg5MDZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    dataAiHint: 'fiat toro branca', documentsUrl: '#edital-jud002', visits: 950,
    initialOffer: 40000,
    auctionStages: [{ name: 'Leilão Único', endDate: createFutureDate(20,0), statusText: 'Data do Leilão', initialPrice: 40000 }]
  },
  {
    id: 'JUD003MAQ', publicId: 'AUC-JUDMAQ-PR003C3', title: 'Leilão Judicial - Trator Massey Ferguson',
    fullTitle: 'Leilão Judicial TRT9 - Trator Massey Ferguson 275 - Processo Trabalhista',
    description: 'Trator Massey Ferguson modelo 275, ano 1998, em funcionamento. Leilão do Processo Trabalhista nº 00123-2021-005-09-00-0 da Vara do Trabalho de Curitiba.',
    status: 'ABERTO_PARA_LANCES', auctionType: 'JUDICIAL', categoryId: 'cat-maquinas-e-equipamentos',
    auctioneerId: 'auct-classicos-leiloes-br-leiloeiro-jpimenta', sellerId: 'seller-vara-do-trabalho-de-curitiba-trt9',
    auctionDate: createPastDate(1,0), endDate: createFutureDate(5, 0), city: 'Curitiba', state: 'PR',
    imageUrl: 'https://placehold.co/600x400.png?text=Trator+Judicial', dataAiHint: 'trator antigo vermelho',
    initialOffer: 22000, visits: 680,
    auctionStages: [{ name: 'Leilão Único', endDate: createFutureDate(5,0), statusText: 'Encerramento', initialPrice: 22000 }]
  },
];

export const sampleLotsRaw: Omit<Lot, 'createdAt' | 'updatedAt' | 'auctionName' | 'sellerName' | 'cityName' | 'stateUf' | 'type' | 'bids' | 'reviews' | 'questions'>[] = [
  { id: 'LOTE001', auctionId: '100625bra', publicId: 'LOT-CASACENT-ABC123X1', title: 'CASA COM 129,30 M² - CENTRO', imageUrl: '/lotes-exemplo/imoveis/casa_centro_principal.jpg', dataAiHint: 'casa residencial', galleryImageUrls: ['/lotes-exemplo/imoveis/casa_centro_detalhe1.jpg', '/lotes-exemplo/imoveis/casa_centro_detalhe2.jpg'], mediaItemIds: ['media-casa-frente', 'media001'], status: 'ABERTO_PARA_LANCES', cityId: 'city-teotonio-vilela-al', stateId: 'state-al', categoryId: 'cat-imoveis', views: 1018, price: 45000, endDate: createFutureDate(0, 1, 30), bidsCount: 12, description: 'Casa residencial bem localizada no centro da cidade.', sellerId: 'seller-banco-bradesco-s-a', lotSpecificAuctionDate: createFutureDate(0, 1, 30), initialPrice: 50000, secondInitialPrice: 42000, additionalTriggers: ['DESCONTO PROGRESSIVO'], isFeatured: true, latitude: -9.56096, longitude: -36.3516, mapAddress: 'Rua Central, Teotônio Vilela, Alagoas', mapEmbedUrl: 'https://www.openstreetmap.org/export/embed.html?bbox=-36.3566,-9.5659,-36.3466,-9.5559&layer=mapnik&marker=-9.56096,-36.3516', mapStaticImageUrl: `https://maps.googleapis.com/maps/api/staticmap?center=-9.56096,-36.3516&zoom=16&size=600x400&markers=color:blue%7C-9.56096,-36.3516&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}` },
  { id: 'LOTEVEI001', auctionId: '300724car', publicId: 'LOT-2013AUDI-DEF456Y2', title: '2013 AUDI A4 PREMIUM PLUS', year: 2013, make: 'AUDI', model: 'A4', imageUrl: '/lotes-exemplo/veiculos/audi_a4_principal.jpg', dataAiHint: 'carro sedan preto', galleryImageUrls: ['/lotes-exemplo/veiculos/audi_a4_interior.jpg', '/lotes-exemplo/veiculos/audi_a4_lateral.jpg'], mediaItemIds: ['media-audi-frente', 'media002'], status: 'ABERTO_PARA_LANCES', cityId: 'city-sao-paulo-sp', stateId: 'state-sp', categoryId: 'cat-veiculos', views: 1560, price: 68500, endDate: createFutureDate(0, 0, 45), bidsCount: 25, description: 'Audi A4 Premium Plus 2013, completo, com baixa quilometragem.', sellerId: 'seller-proprietario-particular-1', lotSpecificAuctionDate: createFutureDate(0, 0, 45), isExclusive: true, additionalTriggers: ['ALTA DEMANDA', 'LANCE QUENTE'], isFeatured: true, latitude: -23.550520, longitude: -46.633308, mapAddress: 'Av. Paulista, 1578, Bela Vista, São Paulo - SP', mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.1489015339396!2d-46.65879078502246!3d-23.56318168468204!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce59c8da0aa315%3A0x168c9d0b70928d9a!2sAv.%20Paulista%2C%201578%20-%20Bela%20Vista%2C%20S%C3%A3o%20Paulo%20-%20SP%2C%2001310-200!5e0!3m2!1spt-BR!2sbr!4v1678886512345!5m2!1spt-BR!2sbr', mapStaticImageUrl: `https://maps.googleapis.com/maps/api/staticmap?center=-23.550520,-46.633308&zoom=15&size=600x400&markers=color:red%7C-23.550520,-46.633308&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}` },
  { id: 'LOTE003', auctionId: '100625bra', publicId: 'LOT-APTOCABU-GHI789Z3', title: 'APARTAMENTO COM 54,25 M² - CABULA', imageUrl: '/lotes-exemplo/imoveis/apto_cabula_sala.jpg', dataAiHint: 'apartamento predio residencial', status: 'ENCERRADO', cityId: 'city-salvador-ba', stateId: 'state-ba', categoryId: 'cat-imoveis', views: 754, price: 105000, endDate: createPastDate(2), bidsCount: 12, description: 'Apartamento funcional no Cabula, Salvador. 2 quartos, sala, cozinha e banheiro. Condomínio com portaria.', sellerId: 'seller-banco-bradesco-sa', latitude: -12.960980, longitude: -38.467789, mapAddress: 'Rua do Cabula, Salvador - BA', mapEmbedUrl: null, mapStaticImageUrl: `https://maps.googleapis.com/maps/api/staticmap?center=-12.960980,-38.467789&zoom=15&size=600x400&markers=color:blue%7C-12.960980,-38.467789&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}` },
  { id: 'LOTEART001', auctionId: 'ART001ANTIQ', publicId: 'LOT-PINTURAO-JKL012A4', title: 'Pintura a Óleo "Paisagem Toscana" - Séc. XIX', imageUrl: '/lotes-exemplo/arte/paisagem_toscana.jpg', dataAiHint: 'pintura oleo paisagem', status: 'ABERTO_PARA_LANCES', cityId: 'city-rio-de-janeiro-rj', stateId: 'state-rj', categoryId: 'cat-arte-e-antiguidades', views: 320, price: 7500, endDate: createFutureDate(8, 0), bidsCount: 3, description: 'Belíssima pintura a óleo sobre tela, representando paisagem da Toscana. Assinatura ilegível. Moldura original.', sellerId: 'seller-colecionadores-rj', latitude: -22.9068, longitude: -43.1729, mapAddress: 'Copacabana, Rio de Janeiro - RJ', mapEmbedUrl: null, mapStaticImageUrl: `https://maps.googleapis.com/maps/api/staticmap?center=-22.9068,-43.1729&zoom=14&size=600x400&markers=color:green%7C-22.9068,-43.1729&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}` },
  { id: 'LOTEVCLASS001', auctionId: 'CLASSICVEH24', publicId: 'LOT-1967FORD-MNO345B5', title: '1967 FORD MUSTANG FASTBACK', year: 1967, make: 'FORD', model: 'MUSTANG', imageUrl: '/lotes-exemplo/veiculos/mustang_67_frente.jpg', dataAiHint: 'carro classico vermelho', status: 'ABERTO_PARA_LANCES', cityId: 'city-curitiba-pr', stateId: 'state-pr', categoryId: 'cat-veiculos', views: 1850, price: 250000, endDate: createFutureDate(12, 0), bidsCount: 18, description: 'Icônico Ford Mustang Fastback 1967, motor V8, câmbio manual. Restaurado.', sellerId: 'seller-colecionadores-classicos-pr', initialPrice: 280000, secondInitialPrice: 250000, isFeatured: true, latitude: -25.4284, longitude: -49.2733, mapAddress: 'Batel, Curitiba - PR', mapEmbedUrl: null, mapStaticImageUrl: `https://maps.googleapis.com/maps/api/staticmap?center=-25.4284,-49.2733&zoom=15&size=600x400&markers=color:red%7C-25.4284,-49.2733&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}` },
  { id: 'LOTE005', auctionId: '20301vei', publicId: 'LOT-TRATORAG-PQR678C6', title: 'TRATOR AGRÍCOLA NEW HOLLAND T7', year: 2018, make: 'NEW HOLLAND', model: 'T7.245', imageUrl: '/lotes-exemplo/maquinas/trator_nh_t7.jpg', dataAiHint: 'trator agricola campo', galleryImageUrls: ['/lotes-exemplo/maquinas/trator_nh_t7_detalhe.jpg'], mediaItemIds: ['media-trator-frente'], status: 'ABERTO_PARA_LANCES', cityId: 'city-rio-verde-go', stateId: 'state-go', categoryId: 'cat-maquinas-e-equipamentos', views: 650, price: 180000, endDate: createFutureDate(0, 1, 15), bidsCount: 7, isFeatured: true, description: 'Trator New Holland T7.245, ano 2018, com apenas 1200 horas de uso. Excelente estado.', sellerId: 'seller-fazenda-boa-esperanca', latitude: -17.7999, longitude: -50.9253, mapAddress: 'Zona Rural, Rio Verde - GO', mapEmbedUrl: 'https://www.openstreetmap.org/export/embed.html?bbox=-50.9353,-17.8099,-50.9153,-17.7899&layer=mapnik&marker=-17.7999,-50.9253', mapStaticImageUrl: `https://maps.googleapis.com/maps/api/staticmap?center=-17.7999,-50.9253&zoom=13&size=600x400&markers=color:blue%7C-17.7999,-50.9253&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}` },
  { id: 'LOTE002', auctionId: '100625bra', publicId: 'LOT-CASAPORT-STU901D7', title: 'CASA COM 234,50 M² - PORTÃO', imageUrl: '/lotes-exemplo/imoveis/casa_portao_vista_aerea.jpg', dataAiHint: 'casa moderna suburbio', status: 'ABERTO_PARA_LANCES', cityId: 'city-lauro-de-freitas-ba', stateId: 'state-ba', categoryId: 'cat-imoveis', views: 681, price: 664000, endDate: createFutureDate(10, 5), bidsCount: 1, description: 'Espaçosa casa em Lauro de Freitas, Bahia. Perto da praia.', sellerId: 'seller-banco-bradesco-sa', isFeatured: true, latitude: -12.8868, longitude: -38.3275, mapAddress: 'Rua Principal, Portão, Lauro de Freitas - BA', mapEmbedUrl: 'https://www.openstreetmap.org/export/embed.html?bbox=-38.3375,-12.8968,-38.3175,-12.8768&layer=mapnik&marker=-12.8868,-38.3275', mapStaticImageUrl: `https://maps.googleapis.com/maps/api/staticmap?center=-12.8868,-38.3275&zoom=16&size=600x400&markers=color:green%7C-12.8868,-38.3275&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}` },
  { id: 'LOTE004', auctionId: '100625bra', publicId: 'LOT-CASAVILA-VWX234E8', title: 'CASA COM 133,04 M² - VILA PERI', imageUrl: '/lotes-exemplo/imoveis/casa_vila_peri_externa.jpg', dataAiHint: 'casa terrea simples', status: 'EM_BREVE', cityId: 'city-fortaleza-ce', stateId: 'state-ce', categoryId: 'cat-imoveis', views: 527, price: 238000, endDate: createFutureDate(3, 0), bidsCount: 0, description: 'Casa em Fortaleza, boa localização, necessita pequenas reformas.', sellerId: 'seller-banco-bradesco-sa', latitude: -3.7929, longitude: -38.5396, mapAddress: 'Avenida Principal, Vila Peri, Fortaleza - CE', mapEmbedUrl: 'https://www.openstreetmap.org/export/embed.html?bbox=-38.5496,-3.8029,-38.5296,-3.7829&layer=mapnik&marker=-3.7929,-38.5396', mapStaticImageUrl: `https://maps.googleapis.com/maps/api/staticmap?center=-3.7929,-38.5396&zoom=15&size=600x400&markers=color:yellow%7C-3.7929,-38.5396&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}` },
  { id: 'LOTE006', auctionId: '20301vei', publicId: 'LOT-COLHEITA-YZA567F9', title: 'COLHEITADEIRA JOHN DEERE S680', imageUrl: '/lotes-exemplo/maquinas/colheitadeira_jd_campo.jpg', dataAiHint: 'colheitadeira graos campo', status: 'ENCERRADO', cityId: 'city-campo-grande-ms', stateId: 'state-ms', categoryId: 'cat-maquinas-e-equipamentos', views: 450, price: 365000, endDate: createPastDate(5), bidsCount: 22, description: 'Colheitadeira John Deere S680, usada, em bom estado de funcionamento.', sellerId: 'seller-produtores-rurais-ms', latitude: -20.4428, longitude: -54.6295, mapAddress: 'Saída para Três Lagoas, Campo Grande - MS', mapEmbedUrl: null, mapStaticImageUrl: `https://maps.googleapis.com/maps/api/staticmap?center=-20.4428,-54.6295&zoom=14&size=600x400&markers=color:purple%7C-20.4428,-54.6295&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}` },
  { id: 'LOTEART002', auctionId: 'ART001ANTIQ', publicId: 'LOT-ESCULTUR-BCD890G0', title: 'Escultura em Bronze "O Pensador" - Réplica Assinada', imageUrl: '/lotes-exemplo/arte/escultura_pensador_detalhe.jpg', dataAiHint: 'escultura bronze pensador', status: 'EM_BREVE', cityId: 'city-sao-paulo-sp', stateId: 'state-sp', categoryId: 'cat-arte-e-antiguidades', views: 150, price: 3200, endDate: createFutureDate(15, 0), bidsCount: 0, description: 'Réplica em bronze da famosa escultura, assinada pelo artista.', sellerId: 'seller-galeria-de-arte-sp', latitude: -23.5613, longitude: -46.6562, mapAddress: 'Próximo ao MASP, Avenida Paulista, São Paulo - SP', mapEmbedUrl: 'https://www.openstreetmap.org/export/embed.html?bbox=-46.6662,-23.5713,-46.6462,-23.5513&layer=mapnik&marker=-23.5613,-46.6562', mapStaticImageUrl: `https://maps.googleapis.com/maps/api/staticmap?center=-23.5613,-46.6562&zoom=15&size=600x400&markers=color:orange%7C-23.5613,-46.6562&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}` },
  { 
    id: 'LOTETP001-NB-A', auctionId: 'TP001-NOTEBOOKS', publicId: 'LOT-TPNOTEA-XZY987H7', title: 'Notebook Tipo A - Core i5, 8GB RAM, 256GB SSD (50 unidades)', 
    imageUrl: 'https://placehold.co/600x400.png?text=Notebook+Tipo+A', dataAiHint: 'notebook moderno tela',
    status: 'ABERTO_PARA_LANCES', cityId: 'city-campinas-sp', stateId: 'state-sp', categoryId: 'cat-eletronicos-e-tecnologia', 
    views: 75, price: 150000, endDate: createFutureDate(15, 17), description: 'Lote de 50 notebooks corporativos padrão, Processador Intel Core i5 de 11ª geração, 8GB RAM DDR4, 256GB SSD NVMe, Tela 14" Full HD. Conforme edital TP 001/2024.',
    sellerId: 'seller-prefeitura-municipal-de-campinas', initialPrice: 160000,
    latitude: -22.9056, longitude: -47.0608, mapAddress: 'Paço Municipal, Campinas - SP'
  },
  { 
    id: 'LOTETP001-NB-B', auctionId: 'TP001-NOTEBOOKS', publicId: 'LOT-TPNOTEB-WXY654I8', title: 'Notebook Tipo B - Core i7, 16GB RAM, 512GB SSD (30 unidades)', 
    imageUrl: 'https://placehold.co/600x400.png?text=Notebook+Tipo+B', dataAiHint: 'notebook avançado aberto',
    status: 'ABERTO_PARA_LANCES', cityId: 'city-campinas-sp', stateId: 'state-sp', categoryId: 'cat-eletronicos-e-tecnologia',
    views: 60, price: 170000, endDate: createFutureDate(15, 17), description: 'Lote de 30 notebooks corporativos avançados, Processador Intel Core i7 de 12ª geração, 16GB RAM DDR4, 512GB SSD NVMe, Tela 15.6" Full HD IPS. Conforme edital TP 001/2024.',
    sellerId: 'seller-prefeitura-municipal-de-campinas', initialPrice: 180000,
    latitude: -22.9056, longitude: -47.0608, mapAddress: 'Paço Municipal, Campinas - SP'
  },
  {
    id: 'LOTETP002-CAR1', auctionId: 'TP002-VEICULOS', publicId: 'LOT-TPVEIC1-UVX321J9', title: 'Veículo Sedan - Fiat Cronos 2019', 
    imageUrl: 'https://placehold.co/600x400.png?text=Fiat+Cronos', dataAiHint: 'carro sedan branco',
    status: 'ENCERRADO', cityId: 'city-salvador-ba', stateId: 'state-ba', categoryId: 'cat-veiculos',
    views: 120, price: 35000, endDate: createPastDate(15, 17), description: 'Fiat Cronos Drive 1.3, 2019, branco, completo. Estado de conservação regular. Placa final 5. Venda no estado em que se encontra. Edital TP 002/2024.',
    sellerId: 'seller-secretaria-de-administracao-de-salvador', initialPrice: 30000,
    latitude: -12.9714, longitude: -38.5014, mapAddress: 'Pátio da Prefeitura, Salvador - BA'
  },
  {
    id: 'LOTETP002-UTIL1', auctionId: 'TP002-VEICULOS', publicId: 'LOT-TPVEIC2-RST098K0', title: 'Veículo Utilitário - Fiat Fiorino 2017', 
    imageUrl: 'https://placehold.co/600x400.png?text=Fiat+Fiorino', dataAiHint: 'fiorino branca carga',
    status: 'ENCERRADO', cityId: 'city-salvador-ba', stateId: 'state-ba', categoryId: 'cat-veiculos',
    views: 95, price: 28000, endDate: createPastDate(15, 17), description: 'Fiat Fiorino Hard Working 1.4, 2017, branca, furgão. Necessita reparos. Placa final 8. Venda no estado. Edital TP 002/2024.',
    sellerId: 'seller-secretaria-de-administracao-de-salvador', initialPrice: 25000,
    latitude: -12.9714, longitude: -38.5014, mapAddress: 'Pátio da Prefeitura, Salvador - BA'
  },
  {
    id: 'LOTJUDIMV001', auctionId: 'JUD001IMV', publicId: 'LOT-APTMOEMA-SP01A1', title: 'Apartamento 2 Dorms Moema - Leilão Judicial',
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxhcGFydG1lbnQlMjBpbnRlcmlvcnxlbnwwfHx8fDE3NTA5NTg5MDZ8MA&ixlib=rb-4.1.0&q=80&w=1080', dataAiHint: 'apartamento interior moderno',
    status: 'ABERTO_PARA_LANCES', cityId: 'city-sao-paulo-sp', stateId: 'state-sp', categoryId: 'cat-imoveis',
    price: 250000, initialPrice: 300000, secondInitialPrice: 250000, endDate: createFutureDate(12, 0),
    judicialProcessNumber: '12345-67.2023.8.26.0001', courtDistrict: 'São Paulo', courtName: '1ª Vara Cível',
    sellerId: 'seller-vara-civel-de-sao-paulo-tjsp', description: 'Lindo apartamento em Moema, parte de leilão judicial. 2 dormitórios, sala ampla, cozinha e área de serviço. Próximo ao Parque Ibirapuera.',
    views: 1250, bidsCount: 8
  },
  {
    id: 'LOTJUDVEI001', auctionId: 'JUD002VEI', publicId: 'LOT-TORORJ-RJ02B2', title: 'Fiat Toro Freedom 2018 - Leilão Judicial',
    imageUrl: 'https://images.unsplash.com/photo-1617093583090-67685879968e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxmaWF0JTIwdG9yb3xlbnwwfHx8fDE3NTA5NTg5MDZ8MA&ixlib=rb-4.1.0&q=80&w=1080', dataAiHint: 'fiat toro branca frente',
    status: 'EM_BREVE', cityId: 'city-rio-de-janeiro-rj', stateId: 'state-rj', categoryId: 'cat-veiculos',
    price: 40000, initialPrice: 40000, endDate: createFutureDate(20, 0),
    judicialProcessNumber: '98765-43.2022.8.19.0001', courtDistrict: 'Rio de Janeiro', courtName: 'Vara de Falências',
    sellerId: 'seller-vara-de-falencias-do-rio-de-janeiro-tjrj', description: 'Fiat Toro Freedom 1.8 AT, 2018, cor branca. Venda judicial. Veículo em bom estado geral. Consulte o edital para condições.',
    views: 780, bidsCount: 0
  },
  {
    id: 'LOTJUDMAQ001', auctionId: 'JUD003MAQ', publicId: 'LOT-TRATORMF-PR03C3', title: 'Trator Massey Ferguson 275 - Judicial',
    imageUrl: 'https://placehold.co/600x400.png?text=Trator+MF+275', dataAiHint: 'trator vermelho antigo',
    status: 'ABERTO_PARA_LANCES', cityId: 'city-curitiba-pr', stateId: 'state-pr', categoryId: 'cat-maquinas-e-equipamentos',
    price: 22000, initialPrice: 22000, endDate: createFutureDate(5, 0),
    judicialProcessNumber: '00123-2021-005-09-00-0', courtDistrict: 'Curitiba', courtName: 'Vara do Trabalho',
    sellerId: 'seller-vara-do-trabalho-de-curitiba-trt9', description: 'Trator Massey Ferguson 275, ano 1998. Funcionando. Leilão judicial trabalhista.',
    views: 510, bidsCount: 5
  },
];

export const sampleDirectSaleOffersRaw: Omit<DirectSaleOffer, 'createdAt' | 'updatedAt' | 'expiresAt'>[] = [
  { id: 'DSO001', title: 'Coleção Completa de Selos Raros do Brasil Império', description: 'Uma oportunidade única para colecionadores de selos do período imperial brasileiro. Inclui peças raras e bem conservadas, catalogadas e com histórico. Ideal para investidores e amantes da filatelia.', imageUrl: 'https://placehold.co/800x600.png?text=Selos+Raros', dataAiHint: 'selos antigos colecao', offerType: 'ACCEPTS_PROPOSALS', minimumOfferPrice: 25000, category: 'Arte e Antiguidades', locationCity: 'Rio de Janeiro', locationState: 'RJ', sellerName: 'Antiguidades Imperial', status: 'ACTIVE', latitude: -22.9068, longitude: -43.1729, mapAddress: "Centro, Rio de Janeiro" },
  { id: 'DSO002', title: 'MacBook Pro 16" M1 Max - Seminovo', description: 'MacBook Pro de 16 polegadas com chip M1 Max, 32GB RAM, 1TB SSD. Em excelente estado, pouco uso, com caixa e acessórios originais. Perfeito para profissionais de criação e desenvolvimento.', imageUrl: 'https://placehold.co/800x600.png?text=MacBook+Pro+16', dataAiHint: 'macbook pro aberto', offerType: 'BUY_NOW', price: 18500, category: 'Eletrônicos e Tecnologia', locationCity: 'São Paulo', locationState: 'SP', sellerName: 'Tech Revenda SP', status: 'ACTIVE', latitude: -23.5505, longitude: -46.6333, mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1dTEST' },
  { id: 'DSO003', title: 'Serviço de Consultoria em Marketing Digital', description: 'Pacote de consultoria completo para startups, incluindo análise de mercado, SEO, gestão de redes sociais e campanhas de tráfego pago. Ideal para alavancar seu negócio online.', imageUrl: 'https://placehold.co/800x600.png?text=Consultoria+Marketing', dataAiHint: 'marketing digital reuniao', offerType: 'BUY_NOW', price: 4500, category: 'Outros Itens', locationCity: 'Remoto', locationState: 'BR', sellerName: 'Digital Boost Consultoria', status: 'ACTIVE', mapStaticImageUrl: 'https://placehold.co/600x400.png?text=Servico+Online' },
  { id: 'DSO004', title: 'Ford Mustang 1968 Conversível', description: 'Raro Ford Mustang conversível de 1968, motor V8 289, câmbio automático. Placa preta. Veículo de coleção em excelente estado de conservação e originalidade. Para verdadeiros apreciadores.', imageUrl: 'https://placehold.co/800x600.png?text=Mustang+68+Conv', dataAiHint: 'mustang conversivel vermelho', offerType: 'ACCEPTS_PROPOSALS', minimumOfferPrice: 320000, category: 'Veículos', locationCity: 'Curitiba', locationState: 'PR', sellerName: 'Garagem Clássicos PR', status: 'PENDING_APPROVAL', latitude: -25.4284, longitude: -49.2733, mapAddress: "Bairro Batel, Curitiba" },
  { id: 'DSO005', title: 'Lote de Equipamentos de Academia Profissional', description: 'Lote completo de equipamentos de academia profissional, incluindo esteiras, bicicletas ergométricas, estações de musculação e pesos livres. Ideal para montar ou renovar sua academia.', imageUrl: 'https://placehold.co/800x600.png?text=Equip+Academia', dataAiHint: 'academia equipamentos profissional', offerType: 'BUY_NOW', price: 75000, category: 'Máquinas e Equipamentos', locationCity: 'Belo Horizonte', locationState: 'MG', sellerName: 'Fitness Total Equipamentos', status: 'SOLD', latitude: -19.9167, longitude: -43.9345, mapAddress: "Pampulha, Belo Horizonte" },
  { id: 'DSO006', title: 'Obra de Arte Contemporânea - "Abstração Urbana"', description: 'Pintura acrílica sobre tela de grandes dimensões (150x200cm) do renomado artista plástico local. Cores vibrantes e técnica mista. Acompanha certificado de autenticidade.', imageUrl: 'https://placehold.co/800x600.png?text=Arte+Abstrata', dataAiHint: 'pintura abstrata colorida', offerType: 'ACCEPTS_PROPOSALS', minimumOfferPrice: 12000, category: 'Arte e Antiguidades', locationCity: 'Porto Alegre', locationState: 'RS', sellerName: 'Galeria Pampa Arte', status: 'EXPIRED', latitude: -30.0346, longitude: -51.2177, mapAddress: "Moinhos de Vento, Porto Alegre" },
];

export const sampleMediaItemsRaw: Omit<MediaItem, 'uploadedAt' | 'linkedLotIds'>[] = [
    { id: 'media001', fileName: 'casa_centro_frente.jpg', title: 'Frente da Casa no Centro', mimeType: 'image/jpeg', sizeBytes: 102400, urlOriginal: '/lotes-exemplo/imoveis/casa_centro_principal.jpg', urlThumbnail: '/lotes-exemplo/imoveis/thumb_casa_centro_principal.jpg', urlMedium: '/lotes-exemplo/imoveis/medium_casa_centro_principal.jpg', urlLarge: '/lotes-exemplo/imoveis/casa_centro_principal.jpg', dataAiHint: 'fachada casa cidade' },
    { id: 'media002', fileName: 'audi_a4_2013_perfil.png', title: 'Audi A4 2013 Perfil', mimeType: 'image/png', sizeBytes: 204800, urlOriginal: '/lotes-exemplo/veiculos/audi_a4_principal.jpg', urlThumbnail: '/lotes-exemplo/veiculos/thumb_audi_a4_principal.jpg', urlMedium: '/lotes-exemplo/veiculos/medium_audi_a4_principal.jpg', urlLarge: '/lotes-exemplo/veiculos/audi_a4_principal.jpg', dataAiHint: 'carro audi perfil' },
    { id: 'media003', fileName: 'edital_leilao_bradesco.pdf', title: 'Edital Leilão Bradesco 100625bra', mimeType: 'application/pdf', sizeBytes: 512000, urlOriginal: '#', urlThumbnail: 'https://placehold.co/150x100.png?text=PDF', urlMedium: '#', urlLarge: '#', dataAiHint: 'documento edital' },
    { id: 'media-casa-frente', fileName: 'casa_frente_detalhe.jpg', title: 'Detalhe Fachada Casa Centro', mimeType: 'image/jpeg', sizeBytes: 120000, urlOriginal: '/lotes-exemplo/imoveis/casa_centro_detalhe1.jpg', urlThumbnail: '/lotes-exemplo/imoveis/thumb_casa_centro_detalhe1.jpg', urlMedium: '/lotes-exemplo/imoveis/medium_casa_centro_detalhe1.jpg', urlLarge: '/lotes-exemplo/imoveis/casa_centro_detalhe1.jpg', dataAiHint: 'detalhe fachada' },
    { id: 'media-audi-frente', fileName: 'audi_a4_frente_total.jpg', title: 'Audi A4 2013 Vista Frontal', mimeType: 'image/jpeg', sizeBytes: 180000, urlOriginal: '/lotes-exemplo/veiculos/audi_a4_interior.jpg', urlThumbnail: '/lotes-exemplo/veiculos/thumb_audi_a4_interior.jpg', urlMedium: '/lotes-exemplo/veiculos/medium_audi_a4_interior.jpg', urlLarge: '/lotes-exemplo/veiculos/audi_a4_interior.jpg', dataAiHint: 'audi carro frente' },
    { id: 'media-trator-frente', fileName: 'trator_nh_vista_frontal.jpg', title: 'Trator New Holland T7 Frontal', mimeType: 'image/jpeg', sizeBytes: 220000, urlOriginal: 'https://images.unsplash.com/photo-1633153627433-b15010a9b2f5?w=800', urlThumbnail: 'https://images.unsplash.com/photo-1633153627433-b15010a9b2f5?w=150', urlMedium: 'https://images.unsplash.com/photo-1633153627433-b15010a9b2f5?w=400', urlLarge: 'https://images.unsplash.com/photo-1633153627433-b15010a9b2f5?w=800', dataAiHint: 'trator campo frente' },
];

// ============================================================================
// 2. UTILITY FUNCTIONS 
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
    case 'HABILITADO': return 'Habilitado para Dar Lances'; 
    case 'REJECTED_DOCUMENTS': return 'Documentos Rejeitados';
    case 'BLOCKED': return 'Bloqueado';
    case 'ACTIVE': return 'Ativa'; 
    case 'SOLD': return 'Vendido'; 
    case 'EXPIRED': return 'Expirada'; 
    case 'PENDING_APPROVAL': return 'Pendente Aprovação'; 
    default: {
      // const exhaustiveCheck: never = status; // Comentado para evitar erro de compilação com tipos de string literais
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
    case 'HABILITADO':
      return { text: 'Habilitado para Dar Lances', color: 'text-green-600 dark:text-green-400', progress: 100, icon: CheckCircle2 }; 
    case 'BLOCKED':
      return { text: 'Conta Bloqueada', color: 'text-destructive', progress: 0, icon: ShieldAlert };
    default:
      // const exhaustiveCheck: never = status; // Temporariamente comentado se UserHabilitationStatus pode ser string
      return { text: "Status Desconhecido" as never, color: 'text-muted-foreground', progress: 0, icon: HelpCircle };
  }
};

// ============================================================================
// 3. DERIVED/PROCESSED DATA FUNCTIONS 
// ============================================================================

export function getUniqueLotCategoriesFromSampleData(): LotCategory[] {
  const categoriesMap = new Map<string, LotCategory>();
  sampleLotCategoriesStatic.forEach(cat => categoriesMap.set(cat.slug, { ...cat, id: `cat-${cat.slug}`, itemCount: 0, createdAt: createPastDate(30), updatedAt: createPastDate(1) }));

  const allItems = [...sampleLotsRaw, ...sampleAuctionsRaw, ...sampleDirectSaleOffersRaw];

  allItems.forEach(item => {
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
      } else if (typeof categoryNameOrId === 'string') { 
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
  const allSampleCategories = getUniqueLotCategoriesFromSampleData(); 
  const foundCategory = allSampleCategories.find(cat => cat.slug === slug);
  if (foundCategory) {
    return foundCategory.name;
  }
  
  const foundByName = allSampleCategories.find(cat => cat.name === slug || slugify(cat.name) === slug);
  if (foundByName) return foundByName.name;

  return undefined; 
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
    if (auction.sellerId) {
       const sellerProf = sampleSellersStatic.find(s => `seller-${slugify(s.name)}` === auction.sellerId);
       if(sellerProf) sellerNames.add(sellerProf.name);
    } else if (auction.seller) {
       sellerNames.add(auction.seller);
    }
  });
  sampleLotsRaw.forEach(lot => {
    if (lot.sellerId) { 
        const sellerProf = sampleSellersStatic.find(s => `seller-${slugify(s.name)}` === lot.sellerId);
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
        if (auction.auctioneerId) {
            const aucStatic = sampleAuctioneersStatic.find(a => `auct-${slugify(a.name)}` === auction.auctioneerId);
            if (aucStatic && !auctioneerMap.has(slugify(aucStatic.name))) {
                 const slug = slugify(aucStatic.name);
                 const randomYearsAgo = Math.floor(Math.random() * 5) + 1;
                 let memberSince = subYears(now, randomYearsAgo);
                 memberSince = subMonths(memberSince, Math.floor(Math.random() * 12));
                 const initial = aucStatic.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
                 auctioneerMap.set(slug, {
                    ...aucStatic,
                    id: `auct-${slug}`,
                    publicId: `AUCT-PUB-${slug.substring(0,5)}-${uuidv4().substring(0,6)}`,
                    slug,
                    memberSince, rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
                    auctionsConductedCount: Math.floor(Math.random() * 200) + 50,
                    totalValueSold: (Math.random() * 5000000) + 1000000,
                    logoUrl: aucStatic.logoUrl || `https://placehold.co/100x100.png?text=${initial}`,
                    createdAt: memberSince, updatedAt: new Date(),
                 });
            }
        } else if (auction.auctioneer && !auctioneerMap.has(slugify(auction.auctioneer))) {
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
  const initialSlug = slugify(categoryNameOrSlug);
  const category = sampleLotCategories.find(cat => cat.slug === initialSlug || slugify(cat.name) === initialSlug);

  let resolvedName = categoryNameOrSlug;
  let resolvedSlug = initialSlug;

  if (category) {
    resolvedName = category.name;
    resolvedSlug = category.slug;
  }

  const defaultAssets: CategoryAssets = {
    logoUrl: `https://placehold.co/100x100.png?text=${encodeURIComponent(resolvedName.charAt(0).toUpperCase())}`,
    logoAiHint: `logo ${resolvedSlug}`,
    bannerUrl: `https://placehold.co/1200x300.png?text=Banner+${encodeURIComponent(resolvedName)}`,
    bannerAiHint: `banner ${resolvedSlug}`,
    bannerText: `Descubra os melhores lotes em ${resolvedName}`,
  };

  const getOverride = (slug: string) => {
      const assetOverrides: Record<string, Partial<CategoryAssets>> = {
        'veiculos': { logoUrl: 'https://placehold.co/100x100.png?text=Carro', logoAiHint: 'icone carro', bannerUrl: 'https://placehold.co/1200x300.png?text=Veiculos+Destaque', bannerAiHint: 'carros estrada', bannerText: `Excelentes Ofertas em Veículos - ${resolvedName}` },
        'imoveis': { logoUrl: 'https://placehold.co/100x100.png?text=Casa', logoAiHint: 'icone casa', bannerUrl: 'https://placehold.co/1200x300.png?text=Oportunidades+Imobiliarias', bannerAiHint: 'imoveis cidade', bannerText: `Seu Novo Lar ou Investimento está aqui - ${resolvedName}` },
        'arte-e-antiguidades': { logoUrl: 'https://placehold.co/100x100.png?text=Arte', logoAiHint: 'icone arte', bannerUrl: 'https://placehold.co/1200x300.png?text=Leilao+Arte', bannerAiHint: 'galeria arte', bannerText: `Obras Raras e Antiguidades - ${resolvedName}` },
        'maquinas-e-equipamentos': { logoUrl: 'https://placehold.co/100x100.png?text=Trator', logoAiHint: 'icone trator', bannerUrl: 'https://placehold.co/1200x300.png?text=Maquinario+Agro', bannerAiHint: 'campo trator', bannerText: `Equipamentos Agrícolas e Maquinário Pesado - ${resolvedName}` },
        'eletronicos-e-tecnologia': { logoUrl: 'https://placehold.co/100x100.png?text=Chip', logoAiHint: 'icone chip placa', bannerUrl: 'https://placehold.co/1200x300.png?text=Tecnologia+Eletronicos', bannerAiHint: 'computador smartphone', bannerText: `Os Melhores Gadgets e Eletrônicos - ${resolvedName}` },
        'semoventes': { logoUrl: 'https://placehold.co/100x100.png?text=Boi', logoAiHint: 'icone boi cavalo', bannerUrl: 'https://placehold.co/1200x300.png?text=Leilao+Semoventes', bannerAiHint: 'gado pasto', bannerText: `Animais de Qualidade e Procedência - ${resolvedName}` },
        'leiloes-judiciais': { logoUrl: 'https://placehold.co/100x100.png?text=TJ', logoAiHint: 'justica balanca', bannerUrl: 'https://placehold.co/1200x300.png?text=Leiloes+Judiciais', bannerAiHint: 'martelo tribunal', bannerText: 'Oportunidades Únicas em Leilões Judiciais' },
        'leiloes-extrajudiciais': { logoUrl: 'https://placehold.co/100x100.png?text=LX', logoAiHint: 'acordo negocios', bannerUrl: 'https://placehold.co/1200x300.png?text=Leiloes+Extrajudiciais', bannerAiHint: 'documentos acordo', bannerText: 'Negociações Diretas e Ágeis em Leilões Extrajudiciais' },
        'venda-direta': { logoUrl: 'https://placehold.co/100x100.png?text=VD', logoAiHint: 'etiqueta preco', bannerUrl: 'https://placehold.co/1200x300.png?text=Venda+Direta', bannerAiHint: 'loja vitrine', bannerText: 'Compre Itens com Preço Fixo, Sem Disputa de Lances' },
        'segunda-praca': { logoUrl: 'https://placehold.co/100x100.png?text=2P', logoAiHint: 'numero dois leilao', bannerUrl: 'https://placehold.co/1200x300.png?text=Segunda+Praca', bannerAiHint: 'oportunidade desconto', bannerText: 'Novas Chances com Valores Atrativos em Segunda Praça' },
        'leiloes-encerrados': { logoUrl: 'https://placehold.co/100x100.png?text=Fim', logoAiHint: 'calendario finalizado', bannerUrl: 'https://placehold.co/1200x300.png?text=Leiloes+Encerrados', bannerAiHint: 'arquivo historico', bannerText: 'Consulte o Histórico de Resultados de Leilões Encerrados' },
        'leiloes-cancelados': { logoUrl: 'https://placehold.co/100x100.png?text=X', logoAiHint: 'simbolo cancelado', bannerUrl: 'https://placehold.co/1200x300.png?text=Leiloes+Cancelados', bannerAiHint: 'documento cancelado', bannerText: 'Veja os Leilões que Foram Cancelados' },
        'tomada-de-precos': { logoUrl: 'https://placehold.co/100x100.png?text=TP', logoAiHint: 'documento propostas', bannerUrl: 'https://placehold.co/1200x300.png?text=Tomada+de+Precos', bannerAiHint: 'propostas envelope', bannerText: 'Participe de Tomadas de Preços e Faça a Melhor Oferta' },
      };
      if (assetOverrides[slug]) return assetOverrides[slug];

      if (slug.includes('judicial') || slug.includes('justica')) return assetOverrides['leiloes-judiciais'];
      if (slug.includes('extrajudicial')) return assetOverrides['leiloes-extrajudiciais'];
      if (slug.includes('direta')) return assetOverrides['venda-direta'];
      if (slug.includes('segunda') && slug.includes('praca')) return assetOverrides['segunda-praca'];
      if (slug.includes('veiculo')) return assetOverrides['veiculos'];
      if (slug.includes('imovel') || slug.includes('casa') || slug.includes('terreno')) return assetOverrides['imoveis'];
      if (slug.includes('tomada') && slug.includes('preco')) return assetOverrides['tomada-de-precos'];

      return {}; 
  };

  return { ...defaultAssets, ...getOverride(resolvedSlug) };
}


// ============================================================================
// 4. EXPORTED SAMPLE DATA ARRAYS (Processed)
// ============================================================================

export const sampleLotCategories: LotCategory[] = getUniqueLotCategoriesFromSampleData();
export const sampleStates: StateInfo[] = sampleStatesStatic.map(s => ({ ...s, cityCount: sampleCitiesStatic.filter(c => c.stateId === s.id).length, createdAt: createPastDate(Math.floor(Math.random() * 30) + 1), updatedAt: createPastDate(Math.floor(Math.random() * 30)) }));
export const sampleCities: CityInfo[] = sampleCitiesStatic.map(c => ({ ...c, lotCount: sampleLotsRaw.filter(l => l.cityId === c.id).length, createdAt: createPastDate(Math.floor(Math.random() * 30) + 1), updatedAt: createPastDate(Math.floor(Math.random() * 30)) }));

export const sampleLots: Lot[] = sampleLotsRaw.map(lot => {
    const categoryInfo = sampleLotCategories.find(c => c.id === lot.categoryId || c.slug === lot.categoryId || c.name === lot.categoryId);
    const auctionInfo = sampleAuctionsRaw.find(a => a.id === lot.auctionId);
    const stateInfo = sampleStates.find(s => s.id === lot.stateId);
    const cityInfo = sampleCities.find(c => c.id === lot.cityId);
    
    let resolvedSellerId = lot.sellerId;
    if (!resolvedSellerId && auctionInfo?.sellerId) {
        resolvedSellerId = auctionInfo.sellerId;
    } else if (!resolvedSellerId && auctionInfo?.seller) {
        const foundSeller = sampleSellersStatic.find(s => s.name === auctionInfo.seller);
        if (foundSeller) resolvedSellerId = `seller-${slugify(foundSeller.name)}`;
    }
    const sellerInfo = sampleSellersStatic.find(s => `seller-${slugify(s.name)}` === resolvedSellerId);

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
    const auctioneerInfo = sampleAuctioneersStatic.find(auc => auc.name === auction.auctioneerId || `auct-${slugify(auc.name)}` === auction.auctioneerId);
    const sellerInfo = sampleSellersStatic.find(s => s.name === auction.sellerId || `seller-${slugify(s.name)}` === auction.sellerId);

    return {
        ...auction,
        category: categoryInfo?.name || auction.category || 'Outras',
        auctioneer: auctioneerInfo?.name || auction.auctioneerId || 'Leiloeiro Desconhecido',
        auctioneerLogoUrl: auctioneerInfo?.logoUrl || auction.auctioneerLogoUrl,
        seller: sellerInfo?.name || auction.sellerId || 'Comitente Desconhecido',
        lots: lotsForAuction,
        totalLots: lotsForAuction.length,
        createdAt: createPastDate(Math.floor(Math.random() * 60) + 1),
        updatedAt: createPastDate(Math.floor(Math.random() * 60)),
    } as Auction;
});

export const sampleAuctioneers: AuctioneerProfileInfo[] = getUniqueAuctioneersInternal();
export const sampleSellers: SellerProfileInfo[] = getUniqueSellersInternal();

export const sampleBids: BidInfo[] = sampleLots.flatMap(lot => {
    const numberOfBids = Math.floor(Math.random() * 8); 
    const bids: BidInfo[] = [];
    let currentBidPrice = lot.initialPrice || lot.price;
    const baseBidIncrement = currentBidPrice > 50000 ? 500 : (currentBidPrice > 5000 ? 100 : 20);

    for (let i = 0; i < numberOfBids; i++) {
        const increment = baseBidIncrement + Math.floor(Math.random() * baseBidIncrement);
        currentBidPrice += increment;
        const bidTime = createPastDate(Math.floor(Math.random() * 5), Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), lot.endDate ? new Date(lot.endDate) : undefined);
        if (bidTime > now && lot.status === 'ABERTO_PARA_LANCES') continue; 
        if (lot.endDate && bidTime > new Date(lot.endDate)) continue; 

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
        const hasAnswer = Math.random() > 0.25; 
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
    if(auctioneerInfo) {
        auction.auctioneer = auctioneerInfo.name;
        auction.auctioneerLogoUrl = auctioneerInfo.logoUrl || auction.auctioneerLogoUrl;
    }

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
    urgencyTimerThresholdDays: 1, 
    urgencyTimerThresholdHours: 12, 
    showPopularityBadge: true,
    popularityViewThreshold: 500,
    showHotBidBadge: true,
    hotBidThreshold: 10,
    showExclusiveBadge: true,
};

const defaultBadgeVisibility: BadgeVisibilitySettings = {
  showStatusBadge: true,
  showDiscountBadge: true,
  showUrgencyTimer: true,
  showPopularityBadge: true,
  showHotBidBadge: true,
  showExclusiveBadge: true,
};

const defaultHomepageSections: HomepageSectionConfig[] = [
    { id: 'hero', type: 'hero_carousel', title: 'Destaques Principais', visible: true, order: 1 },
    { id: 'filter_links', type: 'filter_links', title: 'Explorar por Tipo', visible: true, order: 2 },
    { id: 'featured_lots', type: 'featured_lots', title: 'Lotes em Destaque', visible: true, order: 3, itemCount: 10 },
    { id: 'active_auctions', type: 'active_auctions', title: 'Leilões Ativos', visible: true, order: 4, itemCount: 10 },
];

export const defaultSectionBadgeVisibility: SectionBadgeConfig = {
  featuredLots: { 
    showStatusBadge: false, 
    showDiscountBadge: true,
    showUrgencyTimer: true,
    showPopularityBadge: true,
    showHotBidBadge: true,
    showExclusiveBadge: true,
  },
  searchGrid: { ...defaultBadgeVisibility, showUrgencyTimer: true }, 
  searchList: { ...defaultBadgeVisibility, showUrgencyTimer: true }, 
  lotDetail: { ...defaultBadgeVisibility, showUrgencyTimer: true, showStatusBadge: true },
};

const defaultMapSettings: MapSettings = {
    defaultProvider: 'openstreetmap', 
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    staticImageMapZoom: 15,
    staticImageMapMarkerColor: 'blue', 
};


export const samplePlatformSettings: PlatformSettings = {
  id: 'global',
  siteTitle: 'BidExpert Leilões',
  siteTagline: 'Sua plataforma definitiva para leilões online.',
  galleryImageBasePath: '/lotes-exemplo/', 
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
  sectionBadgeVisibility: defaultSectionBadgeVisibility, 
  mapSettings: defaultMapSettings, 
  updatedAt: new Date()
};

export function getPlaceholderIfEmpty(value: string | number | null | undefined, placeholder: string = '-'): string {
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
        return placeholder;
    }
    return String(value);
}

// Garantir que os IDs únicos de auctioneerId e sellerId sejam usados nos leilões
sampleAuctionsRaw.forEach(auc => {
    const auctioneer = sampleAuctioneersStatic.find(a => a.name === auc.auctioneerId);
    if (auctioneer) {
        auc.auctioneerId = `auct-${slugify(auctioneer.name)}`;
    }
    const seller = sampleSellersStatic.find(s => s.name === auc.sellerId);
    if (seller) {
        auc.sellerId = `seller-${slugify(seller.name)}`;
    }
});

// Garantir que os IDs únicos de auctionId e sellerId sejam usados nos lotes
sampleLotsRaw.forEach(lot => {
    const auction = sampleAuctionsRaw.find(a => a.id === lot.auctionId);
    if (auction) {
        lot.auctionId = auction.id; // Mantém o ID original do leilão, não o publicId aqui
    }
    const seller = sampleSellersStatic.find(s => s.name === lot.sellerId);
    if (seller) {
        lot.sellerId = `seller-${slugify(seller.name)}`;
    }
});

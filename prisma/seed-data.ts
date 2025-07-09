// prisma/seed-data.ts
// This file contains the sample data for seeding the database.

import type { State, City, LotCategory, Subcategory, Court, JudicialDistrict, JudicialBranch, Seller, Auctioneer, JudicialProcess, Bem, Auction, Lot, Bid, UserWin, DocumentType, Notification, MediaItem, ProcessParty } from '@prisma/client';

export const sampleLotCategories: (Omit<LotCategory, 'createdAt' | 'updatedAt' | 'itemCount' | 'hasSubcategories'> & { subcategories?: Omit<Subcategory, 'parentCategoryId' | 'slug' | 'createdAt' | 'updatedAt' | 'itemCount'>[] })[] = [
  { id: "cat-imoveis", name: "Imóveis", slug: "imoveis", description: "Casas, apartamentos, terrenos, salas comerciais, galpões, fazendas, sítios e chácaras.", logoUrl: null, coverImageUrl: "/uploads/media/6caf929a-d9e0-4109-a64a-f47f2cbdbf12-3d-rendering-loft-luxury-living-room-with-bookshelf.jpg", megaMenuImageUrl: null, dataAiHintLogo: "predio casa", dataAiHintCover: "imoveis cidade panorama", dataAiHintMegaMenu: null, subcategories: [
      { id: 'subcat-imoveis-apartamentos', name: "Apartamentos", description: "Apartamentos de todos os tamanhos." },
      { id: 'subcat-imoveis-casas', name: "Casas", description: "Casas residenciais." },
  ] },
  { id: "cat-veiculos", name: "Veículos", slug: "veiculos", description: "Carros, motos, caminhões, ônibus, utilitários e outros veículos terrestres.", subcategories: [
      { id: 'subcat-veiculos-carros', name: "Carros" },
      { id: 'subcat-veiculos-motos', name: "Motos" }
  ] },
  { id: "cat-maquinas-e-equipamentos", name: "Máquinas e Equipamentos", slug: "maquinas-e-equipamentos", description: "Máquinas pesadas, agrícolas, industriais, equipamentos de construção e diversos.", subcategories: [
       { id: 'subcat-maquinas-agricolas', name: "Máquinas Agrícolas"},
       { id: 'subcat-equipamentos-construcao', name: "Equipamentos de Construção"}
  ] },
  { id: "cat-eletronicos-e-tecnologia", name: "Eletrônicos e Tecnologia", slug: "eletronicos-e-tecnologia", description: "Celulares, computadores, TVs e mais.", subcategories: [
      { id: 'subcat-eletronicos-celulares', name: "Celulares e Smartphones"}
  ]},
  { id: "cat-bens-diversos", name: "Bens Diversos", slug: "bens-diversos", description: "Móveis, utensílios, e outros itens gerais."},
  { id: "cat-arte-e-antiguidades", name: "Arte e Antiguidades", slug: "arte-e-antiguidades", description: "Obras de arte, antiguidades e itens de coleção."},
  { id: "cat-embarcacoes", name: "Embarcações", slug: "embarcacoes", description: "Lanchas, barcos, veleiros, jet skis.", subcategories: [
      { id: "subcat-embarcacoes-lanchas", name: "Lanchas e Iates"},
      { id: "subcat-embarcacoes-jetskis", name: "Jet Skis"}
  ]},
];

export const sampleStates: Omit<State, 'createdAt' | 'updatedAt' | 'cityCount'>[] = [
  { id: "state-al", name: "Alagoas", uf: "AL", slug: "alagoas" },
  { id: "state-ba", name: "Bahia", uf: "BA", slug: "bahia" },
  { id: "state-sp", name: "São Paulo", uf: "SP", slug: "sao-paulo" },
  { id: "state-rj", name: "Rio de Janeiro", uf: "RJ", slug: "rio-de-janeiro" },
  { id: "state-mg", name: "Minas Gerais", uf: "MG", slug: "minas-gerais" },
  { id: "state-pr", name: "Paraná", uf: "PR", slug: "parana" },
  { id: "state-rs", name: "Rio Grande do Sul", uf: "RS", slug: "rio-grande-do-sul" },
  { id: "state-go", name: "Goiás", uf: "GO", slug: "goias" },
  { id: "state-ms", name: "Mato Grosso do Sul", uf: "MS", slug: "mato-grosso-do-sul" },
  { id: "state-ce", name: "Ceará", uf: "CE", slug: "ceara" },
  { id: "state-se", name: "Sergipe", uf: "SE", slug: "sergipe" },
];

export const sampleCities: Omit<City, 'createdAt' | 'updatedAt' | 'lotCount'>[] = [
  { id: "city-maceio-al", name: "Maceió", slug: "maceio", stateId: "state-al", stateUf: "AL", ibgeCode: "2704302"},
  { id: "city-salvador-ba", name: "Salvador", slug: "salvador", stateId: "state-ba", stateUf: "BA", ibgeCode: "2927408"},
  { id: "city-sao-paulo-sp", name: "São Paulo", slug: "sao-paulo", stateId: "state-sp", stateUf: "SP", ibgeCode: "3550308"},
  { id: "city-campinas-sp", name: "Campinas", slug: "campinas", stateId: "state-sp", stateUf: "SP", ibgeCode: "3509502"},
  { id: "city-rio-de-janeiro-rj", name: "Rio de Janeiro", slug: "rio-de-janeiro", stateId: "state-rj", stateUf: "RJ", ibgeCode: "3304557"},
  { id: "city-belo-horizonte-mg", name: "Belo Horizonte", slug: "belo-horizonte", stateId: "state-mg", stateUf: "MG", ibgeCode: "3106200"},
  { id: "city-curitiba-pr", name: "Curitiba", slug: "curitiba", stateId: "state-pr", stateUf: "PR", ibgeCode: "4106902"},
  { id: "city-porto-alegre-rs", name: "Porto Alegre", slug: "porto-alegre", stateId: "state-rs", stateUf: "RS", ibgeCode: "4314902"},
  { id: "city-rio-verde-go", name: "Rio Verde", slug: "rio-verde", stateId: "state-go", stateUf: "GO", ibgeCode: "5218805"},
  { id: "city-campo-grande-ms", name: "Campo Grande", slug: "campo-grande", stateId: "state-ms", stateUf: "MS", ibgeCode: "5002704"},
  { id: "city-fortaleza-ce", name: "Fortaleza", slug: "fortaleza", stateId: "state-ce", stateUf: "CE", ibgeCode: "2304400"},
  { id: "city-lauro-de-freitas-ba", name: "Lauro de Freitas", slug: "lauro-de-freitas", stateId: "state-ba", stateUf: "BA", ibgeCode: "2919207"},
  { id: "city-niteroi-rj", name: "Niterói", slug: "niteroi", stateId: "state-rj", stateUf: "RJ", ibgeCode: "3303302"},
  { id: "city-teotonio-vilela-al", name: "Teotônio Vilela", slug: "teotonio-vilela", stateId: "state-al", stateUf: "AL", ibgeCode: "2709152"},
  { id: "city-lagarto-se", name: "Lagarto", slug: "lagarto", stateId: "state-se", stateUf: "SE", ibgeCode: "2803500"},
];

export const sampleDocumentTypes = [
  // PF
  { id: 'doc-cpf', name: 'CPF', description: 'Cópia do Cadastro de Pessoa Física.', isRequired: true, appliesTo: 'PHYSICAL', allowedFormats: 'pdf,jpg,png', displayOrder: 10 },
  { id: 'doc-rg-cnh', name: 'RG ou CNH', description: 'Documento de identidade com foto (frente e verso).', isRequired: true, appliesTo: 'PHYSICAL', allowedFormats: 'pdf,jpg,png', displayOrder: 20 },
  { id: 'doc-comprovante-residencia', name: 'Comprovante de Residência', description: 'Conta de consumo recente (água, luz, telefone).', isRequired: true, appliesTo: 'PHYSICAL,LEGAL', allowedFormats: 'pdf,jpg,png', displayOrder: 30 },
  { id: 'doc-comprovante-estado-civil', name: 'Comprovante de Estado Civil', description: 'Certidão de casamento ou nascimento.', isRequired: false, appliesTo: 'PHYSICAL', allowedFormats: 'pdf,jpg,png', displayOrder: 40 },
  
  // PJ
  { id: 'doc-cartao-cnpj', name: 'Cartão CNPJ', description: 'Comprovante de Inscrição e de Situação Cadastral.', isRequired: true, appliesTo: 'LEGAL', allowedFormats: 'pdf', displayOrder: 10 },
  { id: 'doc-contrato-social', name: 'Contrato Social Consolidado', description: 'Última alteração contratual ou estatuto social.', isRequired: true, appliesTo: 'LEGAL', allowedFormats: 'pdf', displayOrder: 20 },
  { id: 'doc-documentos-representantes', name: 'Documentos dos Representantes', description: 'RG/CPF ou CNH dos sócios administradores.', isRequired: true, appliesTo: 'LEGAL', allowedFormats: 'pdf,jpg,png', displayOrder: 50 },
];

export const sampleAuctions = [
  {
      "id": "100625bra",
      "publicId": "AUC-IMOVEIS-XYZ123P1",
      "title": "Leilão de Imóveis Residenciais e Comerciais",
      "description": "Leilão online de casas, apartamentos e terrenos. Excelentes oportunidades de investimento e moradia. Lances a partir de R$ 45.000. Não perca!",
      "status": "ABERTO_PARA_LANCES",
      "auctionType": "EXTRAJUDICIAL",
      "categoryId": "cat-imoveis",
      "auctioneerId": "auct-leiloeiro-oficial-bradesco",
      "sellerId": "seller-banco-bradesco-s-a",
      "auctionDate": new Date("2025-06-24T04:07:47.479Z"),
      "endDate": new Date("2025-07-04T08:52:47.479Z"),
      "city": "Nacional",
      "state": "BR",
      "imageMediaId": "media-auc-imoveis-banner",
      "dataAiHint": "leilao imoveis cidade",
      "documentsUrl": "#",
      "visits": 2580,
      "initialOffer": 45000,
      "isFavorite": false,
      "auctionStages": JSON.stringify([
        { "name": "1ª Praça", "endDate": "2025-06-29T03:52:47.479Z", "statusText": "Encerramento", "initialPrice": 45000 },
        { "name": "2ª Praça", "endDate": "2025-07-04T08:52:47.479Z", "statusText": "Encerramento", "initialPrice": 30000 }
      ]),
      "automaticBiddingEnabled": true,
      "allowInstallmentBids": true,
      "estimatedRevenue": 2000000,
      "achievedRevenue": 0,
      "totalHabilitatedUsers": 150,
      "isFeaturedOnMarketplace": true,
      "marketplaceAnnouncementTitle": "Mega Leilão Bradesco Imóveis",
      "additionalTriggers": "OPORTUNIDADE ÚNICA, DESCONTO",
  },
  // Add more sample auctions here, ensuring additionalTriggers is a string
];


// Omitting other sample data arrays for brevity in this response,
// but they would be included in the full file.
export const sampleCourts: Omit<Court, 'createdAt' | 'updatedAt'>[] = [];
export const sampleJudicialDistricts: Omit<JudicialDistrict, 'createdAt' | 'updatedAt'>[] = [];
export const sampleJudicialBranches: Omit<JudicialBranch, 'createdAt' | 'updatedAt'>[] = [];
export const sampleSellers: (Omit<Seller, 'createdAt' | 'updatedAt' | 'activeLotsCount' | 'totalSalesValue' | 'auctionsFacilitatedCount' | 'memberSince' | 'rating'>)[] = [];
export const sampleAuctioneers: (Omit<Auctioneer, 'createdAt' | 'updatedAt' | 'memberSince' | 'auctionsConductedCount' | 'totalValueSold' | 'rating'>)[] = [];
export const sampleJudicialProcesses: (Omit<JudicialProcess, 'createdAt' | 'updatedAt'> & {parties: Omit<ProcessParty, 'processId'>[]})[] = [];
export const sampleBens: (Omit<Bem, 'createdAt' | 'updatedAt'>)[] = [];
export const sampleLots: (Omit<Lot, 'createdAt' | 'updatedAt' | 'bidsCount' | 'views'>)[] = [];
export const sampleBids: Bid[] = [];
export const sampleUserWins: (Omit<UserWin, 'lot'>)[] = [];
export const sampleUserDocuments: (Omit<UserDocument, 'createdAt' | 'updatedAt' | 'documentType'>)[] = [];
export const sampleNotifications: Notification[] = [];
export const sampleMediaItems: MediaItem[] = [];


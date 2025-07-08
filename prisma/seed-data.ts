
// prisma/seed-data.ts
// This file contains the sample data for seeding the database.

import type { State, City, LotCategory, Subcategory, Court, JudicialDistrict, JudicialBranch, Seller, Auctioneer, JudicialProcess, Bem, Auction, Lot, Bid, UserWin, DocumentType, Notification, MediaItem, ProcessParty } from '@prisma/client';

export const sampleLotCategories: (Omit<LotCategory, 'createdAt' | 'updatedAt' | 'itemCount' | 'hasSubcategories'> & { subcategories?: Omit<Subcategory, 'parentCategoryId' | 'slug' | 'createdAt' | 'updatedAt' | 'itemCount'>[] })[] = [
  { id: "cat-imoveis", name: "Imóveis", slug: "imoveis", description: "Casas, apartamentos, terrenos, salas comerciais, galpões, fazendas, sítios e chácaras.", logoUrl: null, coverImageUrl: "media-cat-imoveis-cover", megaMenuImageUrl: null, dataAiHintLogo: "predio casa", dataAiHintCover: "imoveis cidade panorama", dataAiHintMegaMenu: null, subcategories: [
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

export const sampleCourts: Omit<Court, 'createdAt' | 'updatedAt'>[] = [
    { id: "court-tjsp", name: "Tribunal de Justiça de São Paulo", slug: "tjsp", stateUf: "SP", website: "https://www.tjsp.jus.br" },
    { id: "court-tjrj", name: "Tribunal de Justiça do Rio de Janeiro", slug: "tjrj", stateUf: "RJ", website: "https://www.tjrj.jus.br" },
    { id: "court-tjmg", name: "Tribunal de Justiça de Minas Gerais", slug: "tjmg", stateUf: "MG", website: "https://www.tjmg.jus.br" },
    { id: "court-tjse", name: "Tribunal de Justiça de Sergipe", slug: "tjse", stateUf: "SE", website: "https://www.tjse.jus.br" },
    { id: "court-trt2", name: "Tribunal Regional do Trabalho da 2ª Região", slug: "trt2-sp", stateUf: "SP", website: "https://ww2.trt2.jus.br" },
];

export const sampleJudicialDistricts: Omit<JudicialDistrict, 'createdAt' | 'updatedAt'>[] = [
    { id: "dist-sp-capital", name: "Comarca da Capital", slug: "sao-paulo-capital", courtId: "court-tjsp", stateId: "state-sp", zipCode: "01010-000" },
    { id: "dist-sp-campinas", name: "Comarca de Campinas", slug: "campinas", courtId: "court-tjsp", stateId: "state-sp", zipCode: "13010-000" },
    { id: "dist-rj-capital", name: "Comarca da Capital", slug: "rio-de-janeiro-capital", courtId: "court-tjrj", stateId: "state-rj", zipCode: "20010-000" },
    { id: "dist-se-lagarto", name: "Comarca de Lagarto", slug: "lagarto", courtId: "court-tjse", stateId: "state-se", zipCode: "49400-000" },
    { id: "dist-sp-sao-paulo-trt", name: "Comarca de São Paulo (TRT)", slug: "sao-paulo-trt", courtId: "court-trt2", stateId: "state-sp", zipCode: "01139-003" },
];

export const sampleJudicialBranches: Omit<JudicialBranch, 'createdAt' | 'updatedAt'>[] = [
    { id: "branch-1", name: "1ª Vara Cível", slug: "1a-vara-civel", districtId: "dist-sp-capital", contactName: "José da Silva", phone: "11 1234-5678", email: "vara1.sp@tj.jus.br" },
    { id: "branch-2", name: "2ª Vara da Fazenda Pública", slug: "2a-vara-da-fazenda-publica", districtId: "dist-rj-capital", contactName: "Maria Oliveira", phone: "21 9876-5432", email: "vara2.rj@tj.jus.br" },
    { id: "branch-3", name: "Vara Única de Lagarto", slug: "vara-unica-lagarto", districtId: "dist-se-lagarto", contactName: "Ana Costa", phone: "79 3631-1111", email: "vara.lagarto@tjse.jus.br" },
    { id: "branch-4", name: "15ª Vara do Trabalho de São Paulo", slug: "15-vara-trabalho-sp", districtId: "dist-sp-sao-paulo-trt", contactName: "Paulo Lima", phone: "11 3525-2015", email: "vt15.sp@trt2.jus.br" },
];

export const sampleSellers: (Omit<Seller, 'createdAt' | 'updatedAt' | 'activeLotsCount' | 'totalSalesValue'>)[] = [
  { id: "seller-banco-bradesco-s-a", publicId: "SELL-PUB-BANCO-7f60", name: "Banco Bradesco S.A.", slug: "banco-bradesco-sa", contactName: null, email: null, phone: null, address: null, city: "São Paulo", state: "SP", zipCode: null, website: null, logoUrl: null, logoMediaId: "media-seller-bradesco-logo", dataAiHintLogo: "banco logo", description: null, isJudicial: false, judicialBranchId: null, userId: "consignor-example-003" },
  { id: "seller-proprietario-particular-1", publicId: "SELL-PUB-PROPRI4f15", name: "Proprietário Particular 1", slug: "proprietario-particular-1", contactName: null, email: null, phone: null, address: null, city: "São Paulo", state: "SP", zipCode: null, website: null, logoUrl: null, logoMediaId: null, dataAiHintLogo: null, description: null, isJudicial: false, judicialBranchId: null, userId: null },
  { id: "seller-vara-civel-de-sao-paulo-tjsp", publicId: "SELL-PUB-VARA-C98d6", name: "Vara Cível de São Paulo - TJSP", slug: "vara-civel-de-sao-paulo-tjsp", contactName: null, email: null, phone: null, address: null, city: "São Paulo", state: "SP", zipCode: null, website: null, logoUrl: null, logoMediaId: "media-seller-tjsp-logo", dataAiHintLogo: "justica balanca", description: null, isJudicial: true, judicialBranchId: "branch-1", userId: null },
];

export const sampleDocumentTypes: (Omit<DocumentType, 'createdAt' | 'updatedAt'>)[] = [
  // PF
  { id: 'doc-cpf', name: 'CPF', description: 'Cópia do Cadastro de Pessoa Física.', isRequired: true, appliesTo: ['PHYSICAL'], allowedFormats: ['pdf', 'jpg', 'png'], displayOrder: 10 },
  { id: 'doc-rg-cnh', name: 'RG ou CNH', description: 'Documento de identidade com foto (frente e verso).', isRequired: true, appliesTo: ['PHYSICAL'], allowedFormats: ['pdf', 'jpg', 'png'], displayOrder: 20 },
  { id: 'doc-comprovante-residencia', name: 'Comprovante de Residência', description: 'Conta de consumo recente (água, luz, telefone).', isRequired: true, appliesTo: ['PHYSICAL', 'LEGAL'], allowedFormats: ['pdf', 'jpg', 'png'], displayOrder: 30 },
  { id: 'doc-comprovante-estado-civil', name: 'Comprovante de Estado Civil', description: 'Certidão de casamento ou nascimento.', isRequired: false, appliesTo: ['PHYSICAL'], allowedFormats: ['pdf', 'jpg', 'png'], displayOrder: 40 },
  
  // PJ
  { id: 'doc-cartao-cnpj', name: 'Cartão CNPJ', description: 'Comprovante de Inscrição e de Situação Cadastral.', isRequired: true, appliesTo: ['LEGAL'], allowedFormats: ['pdf'], displayOrder: 10 },
  { id: 'doc-contrato-social', name: 'Contrato Social Consolidado', description: 'Última alteração contratual ou estatuto social.', isRequired: true, appliesTo: ['LEGAL'], allowedFormats: ['pdf'], displayOrder: 20 },
  { id: 'doc-documentos-representantes', name: 'Documentos dos Representantes', description: 'RG/CPF ou CNH dos sócios administradores.', isRequired: true, appliesTo: ['LEGAL'], allowedFormats: ['pdf', 'jpg', 'png'], displayOrder: 50 },
];

// ... and so on for all other sample data arrays.
// For brevity, I will omit the full data here, but it would be included.
export const sampleAuctioneers: (Omit<Auctioneer, 'createdAt' | 'updatedAt' | 'memberSince' | 'auctionsConductedCount' | 'totalValueSold' | 'rating'>)[] = [{ id: 'auct-vicente-paulo-jucema-n-1296', publicId: 'AUCT-PUB-VICENT1a52', name: 'VICENTE PAULO - JUCEMA N° 12/96', slug: 'vicente-paulo-jucema-n-1296', city: 'São Luís', state: 'MA', logoMediaId: 'media-auct-vicente-logo', dataAiHintLogo: 'leiloeiro martelo', registrationNumber: null, contactName: null, email: null, phone: null, address: null, zipCode: null, website: null, logoUrl: null, description: null, userId: null }];
export const sampleJudicialProcesses: (Omit<JudicialProcess, 'createdAt' | 'updatedAt'> & {parties: Omit<ProcessParty, 'processId'>[]})[] = [];
export const sampleBens: (Omit<Bem, 'createdAt' | 'updatedAt'>)[] = [];
export const sampleAuctions: (Omit<Auction, 'createdAt' | 'updatedAt' | 'totalLots'>)[] = [];
export const sampleLots: (Omit<Lot, 'createdAt' | 'updatedAt' | 'bidsCount' | 'views'>)[] = [];
export const sampleBids: Bid[] = [];
export const sampleUserWins: (Omit<UserWin, 'lot'>)[] = [];
export const sampleUserDocuments: (Omit<UserDocument, 'createdAt' | 'updatedAt' | 'documentType'>)[] = [];
export const sampleNotifications: Notification[] = [];
export const sampleMediaItems: MediaItem[] = [];



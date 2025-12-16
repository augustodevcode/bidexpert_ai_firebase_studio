// src/app/admin/assets/asset-field-config.ts
/**
 * @fileoverview Configuração dos campos específicos por tipo de ativo.
 * Define quais campos do schema Prisma devem ser exibidos para cada categoria.
 */

export type AssetFieldType = 'text' | 'number' | 'boolean' | 'date' | 'textarea' | 'select';

export interface AssetField {
  name: string;
  label: string;
  type: AssetFieldType;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  description?: string;
}

export interface AssetFieldGroup {
  title: string;
  fields: AssetField[];
}

// Campos comuns a TODOS os ativos (já implementados no formulário base)
export const COMMON_FIELDS: string[] = [
  'title',
  'description',
  'status',
  'categoryId',
  'subcategoryId',
  'judicialProcessId',
  'sellerId',
  'evaluationValue',
  'imageUrl',
  'imageMediaId',
  'galleryImageUrls',
  'mediaItemIds',
  'dataAiHint',
  'locationCity',
  'locationState',
  'address',
  'latitude',
  'longitude',
];

// Campos específicos para VEÍCULOS
export const VEHICLE_FIELDS: AssetFieldGroup[] = [
  {
    title: 'Identificação do Veículo',
    fields: [
      { name: 'plate', label: 'Placa', type: 'text', placeholder: 'ABC-1234' },
      { name: 'vin', label: 'Chassi (VIN)', type: 'text', placeholder: '9BWZZZ377VT004251' },
      { name: 'renavam', label: 'RENAVAM', type: 'text', placeholder: '00000000000' },
    ],
  },
  {
    title: 'Características do Veículo',
    fields: [
      { name: 'make', label: 'Marca', type: 'text', placeholder: 'Ex: Toyota' },
      { name: 'model', label: 'Modelo', type: 'text', placeholder: 'Ex: Corolla' },
      { name: 'version', label: 'Versão', type: 'text', placeholder: 'Ex: XEi 2.0' },
      { name: 'year', label: 'Ano de Fabricação', type: 'number', placeholder: '2020' },
      { name: 'modelYear', label: 'Ano do Modelo', type: 'number', placeholder: '2021' },
      { name: 'color', label: 'Cor', type: 'text', placeholder: 'Ex: Prata' },
      { name: 'mileage', label: 'Quilometragem (km)', type: 'number', placeholder: '50000' },
      { 
        name: 'fuelType', 
        label: 'Tipo de Combustível', 
        type: 'select',
        options: [
          { value: 'GASOLINA', label: 'Gasolina' },
          { value: 'ETANOL', label: 'Etanol' },
          { value: 'FLEX', label: 'Flex' },
          { value: 'DIESEL', label: 'Diesel' },
          { value: 'GNV', label: 'GNV' },
          { value: 'ELETRICO', label: 'Elétrico' },
          { value: 'HIBRIDO', label: 'Híbrido' },
        ],
      },
      { 
        name: 'transmissionType', 
        label: 'Tipo de Transmissão', 
        type: 'select',
        options: [
          { value: 'MANUAL', label: 'Manual' },
          { value: 'AUTOMATICA', label: 'Automática' },
          { value: 'AUTOMATIZADA', label: 'Automatizada' },
          { value: 'CVT', label: 'CVT' },
        ],
      },
      { name: 'bodyType', label: 'Tipo de Carroceria', type: 'text', placeholder: 'Ex: Sedan, SUV, Hatch' },
      { name: 'enginePower', label: 'Potência do Motor', type: 'text', placeholder: 'Ex: 150cv' },
      { name: 'numberOfDoors', label: 'Número de Portas', type: 'number', placeholder: '4' },
    ],
  },
  {
    title: 'Estado e Documentação',
    fields: [
      { 
        name: 'runningCondition', 
        label: 'Condição Mecânica', 
        type: 'select',
        options: [
          { value: 'FUNCIONANDO', label: 'Funcionando Perfeitamente' },
          { value: 'FUNCIONANDO_REPAROS', label: 'Funcionando com Reparos Necessários' },
          { value: 'NAO_FUNCIONANDO', label: 'Não Funcionando' },
          { value: 'DESCONHECIDA', label: 'Desconhecida' },
        ],
      },
      { 
        name: 'bodyCondition', 
        label: 'Condição da Lataria', 
        type: 'select',
        options: [
          { value: 'OTIMO', label: 'Ótimo Estado' },
          { value: 'BOM', label: 'Bom Estado' },
          { value: 'REGULAR', label: 'Estado Regular' },
          { value: 'RUIM', label: 'Estado Ruim' },
          { value: 'PESSIMO', label: 'Péssimo Estado' },
        ],
      },
      { 
        name: 'tiresCondition', 
        label: 'Condição dos Pneus', 
        type: 'select',
        options: [
          { value: 'NOVOS', label: 'Pneus Novos' },
          { value: 'SEMINOVOS', label: 'Pneus Semi-novos' },
          { value: 'DESGASTADOS', label: 'Pneus Desgastados' },
          { value: 'PRECISAM_TROCA', label: 'Precisam Trocar' },
        ],
      },
      { name: 'hasKey', label: 'Possui Chave?', type: 'boolean' },
      { name: 'vehicleOptions', label: 'Opcionais', type: 'textarea', placeholder: 'Ex: Ar condicionado, direção hidráulica, vidros elétricos...' },
      { name: 'detranStatus', label: 'Situação no DETRAN', type: 'textarea', placeholder: 'Informações sobre licenciamento, multas, etc.' },
      { name: 'debts', label: 'Débitos', type: 'textarea', placeholder: 'IPVA, multas, financiamento, etc.' },
    ],
  },
];

// Campos específicos para IMÓVEIS
export const PROPERTY_FIELDS: AssetFieldGroup[] = [
  {
    title: 'Identificação do Imóvel',
    fields: [
      { name: 'propertyRegistrationNumber', label: 'Matrícula', type: 'text', placeholder: 'Ex: 12345' },
      { name: 'iptuNumber', label: 'Inscrição IPTU', type: 'text', placeholder: 'Ex: 000.000.000-0' },
    ],
  },
  {
    title: 'Características do Imóvel',
    fields: [
      { name: 'totalArea', label: 'Área Total (m²)', type: 'number', placeholder: '250.00' },
      { name: 'builtArea', label: 'Área Construída (m²)', type: 'number', placeholder: '180.00' },
      { name: 'bedrooms', label: 'Quartos', type: 'number', placeholder: '3' },
      { name: 'suites', label: 'Suítes', type: 'number', placeholder: '1' },
      { name: 'bathrooms', label: 'Banheiros', type: 'number', placeholder: '2' },
      { name: 'parkingSpaces', label: 'Vagas de Garagem', type: 'number', placeholder: '2' },
      { name: 'constructionType', label: 'Tipo de Construção', type: 'text', placeholder: 'Ex: Alvenaria, Madeira' },
      { name: 'finishes', label: 'Acabamentos', type: 'textarea', placeholder: 'Descreva pisos, revestimentos, etc.' },
    ],
  },
  {
    title: 'Infraestrutura e Comodidades',
    fields: [
      { name: 'infrastructure', label: 'Infraestrutura', type: 'textarea', placeholder: 'Água, luz, esgoto, internet...' },
      { name: 'condoDetails', label: 'Detalhes do Condomínio', type: 'textarea', placeholder: 'Valor, estrutura, regras...' },
      { name: 'amenities', label: 'Comodidades (JSON)', type: 'textarea', placeholder: '["piscina","academia","salao-festas"]', description: 'Lista de amenidades em formato JSON' },
      { name: 'improvements', label: 'Benfeitorias', type: 'textarea', placeholder: 'Reformas, melhorias realizadas...' },
      { name: 'topography', label: 'Topografia', type: 'text', placeholder: 'Ex: Plano, Aclive, Declive' },
    ],
  },
  {
    title: 'Situação Jurídica e Ocupacional',
    fields: [
      { name: 'isOccupied', label: 'Imóvel Ocupado?', type: 'boolean' },
      { 
        name: 'occupationStatus', 
        label: 'Situação de Ocupação', 
        type: 'select',
        placeholder: 'Selecione...',
        options: [
          { value: 'OCCUPIED', label: 'Ocupado' },
          { value: 'UNOCCUPIED', label: 'Desocupado' },
          { value: 'UNCERTAIN', label: 'Incerto' },
          { value: 'SHARED_POSSESSION', label: 'Posse Compartilhada' },
        ],
      },
      { name: 'occupationNotes', label: 'Notas sobre Ocupação', type: 'textarea', placeholder: 'Resumo da vistoria ou relatos' },
      { name: 'occupationLastVerified', label: 'Data da Última Verificação', type: 'date' },
      { name: 'hasHabiteSe', label: 'Possui Habite-se?', type: 'boolean' },
      { name: 'liensAndEncumbrances', label: 'Ônus e Gravames', type: 'textarea', placeholder: 'Hipotecas, penhoras, servidões...' },
      { name: 'propertyDebts', label: 'Débitos do Imóvel', type: 'textarea', placeholder: 'IPTU, condomínio, taxas...' },
      { name: 'unregisteredRecords', label: 'Averbações Pendentes', type: 'textarea', placeholder: 'Construções não averbadas, etc.' },
      { name: 'zoningRestrictions', label: 'Restrições de Zoneamento', type: 'text', placeholder: 'Ex: Residencial, Comercial, Misto' },
    ],
  },
];

// Campos específicos para MÁQUINAS/ELETRÔNICOS/EQUIPAMENTOS
export const MACHINERY_FIELDS: AssetFieldGroup[] = [
  {
    title: 'Identificação do Equipamento',
    fields: [
      { name: 'brand', label: 'Marca', type: 'text', placeholder: 'Ex: Caterpillar' },
      { name: 'serialNumber', label: 'Número de Série', type: 'text', placeholder: 'Ex: SN123456789' },
    ],
  },
  {
    title: 'Características Técnicas',
    fields: [
      { name: 'specifications', label: 'Especificações Técnicas', type: 'textarea', placeholder: 'Detalhes técnicos completos...' },
      { name: 'capacityOrPower', label: 'Capacidade/Potência', type: 'text', placeholder: 'Ex: 100HP, 500kg' },
      { name: 'engineType', label: 'Tipo de Motor', type: 'text', placeholder: 'Ex: Diesel 4 tempos' },
      { name: 'hoursUsed', label: 'Horas de Uso', type: 'number', placeholder: '1500' },
      { name: 'voltage', label: 'Voltagem', type: 'text', placeholder: 'Ex: 110V, 220V, Bifásico' },
      { name: 'applianceType', label: 'Tipo de Aparelho', type: 'text', placeholder: 'Ex: Industrial, Doméstico' },
      { name: 'applianceCapacity', label: 'Capacidade (para eletrodomésticos)', type: 'text', placeholder: 'Ex: 500L' },
      { name: 'additionalFunctions', label: 'Funções Adicionais', type: 'text', placeholder: 'Recursos especiais' },
    ],
  },
  {
    title: 'Estado e Documentação',
    fields: [
      { 
        name: 'itemCondition', 
        label: 'Estado de Conservação', 
        type: 'select',
        options: [
          { value: 'NOVO', label: 'Novo' },
          { value: 'SEMINOVO', label: 'Semi-novo' },
          { value: 'USADO_BOM', label: 'Usado em Bom Estado' },
          { value: 'USADO_REGULAR', label: 'Usado em Estado Regular' },
          { value: 'PARA_RESTAURO', label: 'Para Restauro' },
        ],
      },
      { name: 'batteryCondition', label: 'Condição da Bateria', type: 'text', placeholder: 'Ex: Nova, Boa, Precisa Trocar' },
      { name: 'hasInvoice', label: 'Possui Nota Fiscal?', type: 'boolean' },
      { name: 'hasWarranty', label: 'Possui Garantia?', type: 'boolean' },
      { name: 'includedAccessories', label: 'Acessórios Inclusos', type: 'textarea', placeholder: 'Liste os acessórios que acompanham...' },
      { name: 'repairHistory', label: 'Histórico de Manutenção', type: 'textarea', placeholder: 'Reparos e manutenções realizadas...' },
      { name: 'maintenanceHistory', label: 'Histórico de Revisões', type: 'textarea', placeholder: 'Revisões programadas realizadas...' },
      { name: 'installationLocation', label: 'Local de Instalação', type: 'text', placeholder: 'Onde está instalado?' },
      { name: 'compliesWithNR', label: 'Atende Normas Regulamentadoras (NR)', type: 'text', placeholder: 'Ex: NR-12' },
      { name: 'operatingLicenses', label: 'Licenças de Operação', type: 'text', placeholder: 'Licenças necessárias' },
    ],
  },
];

// Campos específicos para PECUÁRIA/ANIMAIS
export const LIVESTOCK_FIELDS: AssetFieldGroup[] = [
  {
    title: 'Identificação do Animal',
    fields: [
      { name: 'individualId', label: 'Identificação Individual', type: 'text', placeholder: 'Ex: Brinco, Chip' },
      { name: 'breed', label: 'Raça', type: 'text', placeholder: 'Ex: Nelore, Angus' },
      { name: 'age', label: 'Idade', type: 'text', placeholder: 'Ex: 3 anos' },
      { 
        name: 'sex', 
        label: 'Sexo', 
        type: 'select',
        options: [
          { value: 'MACHO', label: 'Macho' },
          { value: 'FEMEA', label: 'Fêmea' },
        ],
      },
      { name: 'weight', label: 'Peso', type: 'text', placeholder: 'Ex: 450kg' },
    ],
  },
  {
    title: 'Características e Finalidade',
    fields: [
      { name: 'purpose', label: 'Finalidade', type: 'text', placeholder: 'Ex: Corte, Reprodução, Leiteiro' },
      { name: 'lineage', label: 'Linhagem/Genealogia', type: 'text', placeholder: 'Informações de pedigree' },
      { name: 'isPregnant', label: 'Prenha?', type: 'boolean' },
      { name: 'specialSkills', label: 'Habilidades Especiais', type: 'text', placeholder: 'Ex: Treinado para sela' },
    ],
  },
  {
    title: 'Saúde e Documentação',
    fields: [
      { name: 'sanitaryCondition', label: 'Condição Sanitária', type: 'textarea', placeholder: 'Vacinações, exames, tratamentos...' },
      { name: 'gtaDocument', label: 'GTA (Guia de Trânsito Animal)', type: 'text', placeholder: 'Número da GTA' },
      { name: 'breedRegistryDocument', label: 'Registro de Raça', type: 'text', placeholder: 'Número de registro' },
    ],
  },
];

// Campos específicos para MÓVEIS
export const FURNITURE_FIELDS: AssetFieldGroup[] = [
  {
    title: 'Características do Móvel',
    fields: [
      { name: 'furnitureType', label: 'Tipo de Móvel', type: 'text', placeholder: 'Ex: Mesa, Cadeira, Armário' },
      { name: 'material', label: 'Material', type: 'text', placeholder: 'Ex: Madeira Maciça, MDF, Metal' },
      { name: 'style', label: 'Estilo', type: 'text', placeholder: 'Ex: Rústico, Moderno, Clássico' },
      { name: 'dimensions', label: 'Dimensões', type: 'text', placeholder: 'Ex: 2m x 1m x 0.80m (CxLxA)' },
      { name: 'pieceCount', label: 'Número de Peças', type: 'number', placeholder: '6' },
    ],
  },
];

// Campos específicos para JOIAS
export const JEWELRY_FIELDS: AssetFieldGroup[] = [
  {
    title: 'Características da Joia',
    fields: [
      { name: 'jewelryType', label: 'Tipo de Joia', type: 'text', placeholder: 'Ex: Anel, Colar, Pulseira' },
      { name: 'metal', label: 'Metal', type: 'text', placeholder: 'Ex: Ouro 18k, Prata 925' },
      { name: 'gemstones', label: 'Pedras Preciosas', type: 'text', placeholder: 'Ex: Diamante 1ct, Esmeralda' },
      { name: 'totalWeight', label: 'Peso Total', type: 'text', placeholder: 'Ex: 15g' },
      { name: 'jewelrySize', label: 'Tamanho', type: 'text', placeholder: 'Ex: Aro 18, 45cm' },
      { name: 'authenticityCertificate', label: 'Certificado de Autenticidade', type: 'text', placeholder: 'Número do certificado' },
    ],
  },
];

// Campos específicos para ARTE
export const ART_FIELDS: AssetFieldGroup[] = [
  {
    title: 'Características da Obra',
    fields: [
      { name: 'workType', label: 'Tipo de Obra', type: 'text', placeholder: 'Ex: Pintura, Escultura, Gravura' },
      { name: 'artist', label: 'Artista', type: 'text', placeholder: 'Nome do artista' },
      { name: 'period', label: 'Período/Época', type: 'text', placeholder: 'Ex: Barroco, Modernismo' },
      { name: 'technique', label: 'Técnica', type: 'text', placeholder: 'Ex: Óleo sobre tela, Bronze fundido' },
      { name: 'provenance', label: 'Proveniência', type: 'textarea', placeholder: 'Histórico de propriedade, exposições, etc.' },
    ],
  },
];

// Campos específicos para EMBARCAÇÕES
export const BOAT_FIELDS: AssetFieldGroup[] = [
  {
    title: 'Características da Embarcação',
    fields: [
      { name: 'boatType', label: 'Tipo de Embarcação', type: 'text', placeholder: 'Ex: Lancha, Veleiro, Jet Ski' },
      { name: 'boatLength', label: 'Comprimento', type: 'text', placeholder: 'Ex: 25 pés, 7.5m' },
      { name: 'hullMaterial', label: 'Material do Casco', type: 'text', placeholder: 'Ex: Fibra de vidro, Alumínio' },
      { name: 'onboardEquipment', label: 'Equipamentos de Bordo', type: 'textarea', placeholder: 'GPS, Sonar, Rádio, etc.' },
    ],
  },
];

// Campos específicos para COMMODITIES
export const COMMODITY_FIELDS: AssetFieldGroup[] = [
  {
    title: 'Características do Produto',
    fields: [
      { name: 'productName', label: 'Nome do Produto', type: 'text', placeholder: 'Ex: Soja em Grão' },
      { name: 'quantity', label: 'Quantidade', type: 'text', placeholder: 'Ex: 1000 sacas de 60kg' },
      { name: 'packagingType', label: 'Tipo de Embalagem', type: 'text', placeholder: 'Ex: Sacas, Big Bags, Granel' },
      { name: 'expirationDate', label: 'Data de Validade', type: 'date' },
      { name: 'storageConditions', label: 'Condições de Armazenamento', type: 'text', placeholder: 'Ex: Local seco e arejado' },
    ],
  },
];

// Campos específicos para METAIS PRECIOSOS
export const PRECIOUS_METAL_FIELDS: AssetFieldGroup[] = [
  {
    title: 'Características do Metal',
    fields: [
      { name: 'preciousMetalType', label: 'Tipo de Metal', type: 'text', placeholder: 'Ex: Ouro, Prata, Platina' },
      { name: 'purity', label: 'Pureza', type: 'text', placeholder: 'Ex: 999, 925' },
    ],
  },
];

// Campos específicos para PRODUTOS FLORESTAIS
export const FOREST_GOODS_FIELDS: AssetFieldGroup[] = [
  {
    title: 'Características do Produto Florestal',
    fields: [
      { name: 'forestGoodsType', label: 'Tipo de Produto', type: 'text', placeholder: 'Ex: Madeira em Tora, Lenha' },
      { name: 'species', label: 'Espécie', type: 'text', placeholder: 'Ex: Eucalipto, Pinus' },
      { name: 'volumeOrQuantity', label: 'Volume/Quantidade', type: 'text', placeholder: 'Ex: 100m³' },
      { name: 'dofNumber', label: 'Número DOF', type: 'text', placeholder: 'Documento de Origem Florestal' },
    ],
  },
];

/**
 * Mapeamento de categorias para grupos de campos.
 * IMPORTANTE: Os nomes das categorias devem corresponder aos slugs no banco.
 */
export const CATEGORY_FIELD_MAPPING: Record<string, AssetFieldGroup[]> = {
  'veiculos': VEHICLE_FIELDS,
  'automoveis': VEHICLE_FIELDS,
  'carros': VEHICLE_FIELDS,
  'motos': VEHICLE_FIELDS,
  'caminhoes': VEHICLE_FIELDS,
  'onibus': VEHICLE_FIELDS,
  
  'imoveis': PROPERTY_FIELDS,
  'apartamentos': PROPERTY_FIELDS,
  'casas': PROPERTY_FIELDS,
  'terrenos': PROPERTY_FIELDS,
  'salas-comerciais': PROPERTY_FIELDS,
  'galpoes': PROPERTY_FIELDS,
  
  'maquinas': MACHINERY_FIELDS,
  'equipamentos': MACHINERY_FIELDS,
  'eletronicos': MACHINERY_FIELDS,
  'eletrodomesticos': MACHINERY_FIELDS,
  
  'pecuaria': LIVESTOCK_FIELDS,
  'animais': LIVESTOCK_FIELDS,
  'gado': LIVESTOCK_FIELDS,
  'cavalos': LIVESTOCK_FIELDS,
  
  'moveis': FURNITURE_FIELDS,
  
  'joias': JEWELRY_FIELDS,
  'relogios': JEWELRY_FIELDS,
  
  'arte': ART_FIELDS,
  'antiguidades': ART_FIELDS,
  
  'embarcacoes': BOAT_FIELDS,
  'barcos': BOAT_FIELDS,
  'lanchas': BOAT_FIELDS,
  
  'commodities': COMMODITY_FIELDS,
  'graos': COMMODITY_FIELDS,
  
  'metais-preciosos': PRECIOUS_METAL_FIELDS,
  'ouro': PRECIOUS_METAL_FIELDS,
  'prata': PRECIOUS_METAL_FIELDS,
  
  'produtos-florestais': FOREST_GOODS_FIELDS,
  'madeira': FOREST_GOODS_FIELDS,
};

/**
 * Retorna os grupos de campos específicos para uma categoria.
 */
export function getFieldGroupsForCategory(categorySlug: string): AssetFieldGroup[] {
  return CATEGORY_FIELD_MAPPING[categorySlug.toLowerCase()] || [];
}

/**
 * Retorna todos os nomes de campos específicos para uma categoria (sem os comuns).
 */
export function getSpecificFieldNamesForCategory(categorySlug: string): string[] {
  const groups = getFieldGroupsForCategory(categorySlug);
  return groups.flatMap(group => group.fields.map(f => f.name));
}

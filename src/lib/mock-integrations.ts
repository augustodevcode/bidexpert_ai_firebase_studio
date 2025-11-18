// (E) POCs MOCK FIPE/CARTÓRIOS/TRIBUNAIS (#29/#30)

export interface FipeVehicleData {
  brand: string;
  model: string;
  year: number;
  price: number;
  referenceMonth: string;
}

export interface CartorioMatriculaData {
  matricula: string;
  cartorio: string;
  proprietario: string;
  endereco: string;
  area: number;
  areaUtil: number;
  dataRegistro: Date;
  onus: Array<{
    tipo: 'HIPOTECA' | 'PENHORA' | 'ÔNUS' | 'SERVIDÃO';
    descricao: string;
    dataRegistro: Date;
  }>;
  debitos: Array<{
    tipo: 'IPTU' | 'CONDOMINIO' | 'AGUA' | 'ENERGIA';
    valor: number;
    periodos: number;
  }>;
}

export interface TribunalProcessData {
  processoNum: string;
  tribunal: string;
  classes: string[];
  partes: Array<{
    tipo: 'AUTOR' | 'REU' | 'ASSISTENTE';
    nome: string;
  }>;
  dataProtocolo: Date;
  dataUltimaMov: Date;
  status: 'ATIVO' | 'SENTENCIADO' | 'ARQUIVADO';
  movimentacoes: Array<{
    data: Date;
    descricao: string;
  }>;
}

// MOCK: FIPE Vehicle Price Lookup
export async function mockFipeQuery(brand: string, model: string, year: number): Promise<FipeVehicleData> {
  // Simula delay de API
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock data baseado em pattern
  const basePrice = 50000 + (year - 2000) * 2000;
  const variation = Math.random() * 0.2 - 0.1; // ±10%

  return {
    brand,
    model,
    year,
    price: Math.floor(basePrice * (1 + variation)),
    referenceMonth: new Date().toISOString().split('T')[0],
  };
}

// MOCK: Cartório Matrícula Lookup
export async function mockCartorioMatricula(matricula: string): Promise<CartorioMatriculaData> {
  // Simula delay de cartório
  await new Promise(resolve => setTimeout(resolve, 800));

  const hasDebitos = Math.random() > 0.7;
  const hasOnus = Math.random() > 0.6;

  return {
    matricula,
    cartorio: '1º Cartório de Registro de Imóveis - São Paulo',
    proprietario: 'João da Silva Santos',
    endereco: 'Rua Exemplo, 123 - São Paulo, SP',
    area: 250,
    areaUtil: 180,
    dataRegistro: new Date('2010-05-15'),
    onus: hasOnus
      ? [
          {
            tipo: 'HIPOTECA',
            descricao: 'Hipoteca em favor do Banco XYZ',
            dataRegistro: new Date('2015-08-20'),
          },
        ]
      : [],
    debitos: hasDebitos
      ? [
          {
            tipo: 'IPTU',
            valor: 1200,
            periodos: 3,
          },
          {
            tipo: 'CONDOMINIO',
            valor: 450,
            periodos: 6,
          },
        ]
      : [],
  };
}

// MOCK: Tribunal Processo Lookup
export async function mockTribunalProcesso(processoNum: string): Promise<TribunalProcessData> {
  // Simula delay de tribunal
  await new Promise(resolve => setTimeout(resolve, 1000));

  const statuses: Array<'ATIVO' | 'SENTENCIADO' | 'ARQUIVADO'> = ['ATIVO', 'SENTENCIADO', 'ARQUIVADO'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];

  return {
    processoNum,
    tribunal: 'TJ - Tribunal de Justiça de São Paulo',
    classes: ['Execução Fiscal', 'Ação de Despejo'],
    partes: [
      {
        tipo: 'AUTOR',
        nome: 'Fazenda Pública',
      },
      {
        tipo: 'REU',
        nome: 'Maria da Silva',
      },
    ],
    dataProtocolo: new Date('2020-03-10'),
    dataUltimaMov: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    status,
    movimentacoes: [
      {
        data: new Date('2020-03-10'),
        descricao: 'Protocolo de ação',
      },
      {
        data: new Date('2020-04-20'),
        descricao: 'Citação do réu',
      },
      {
        data: new Date('2020-06-15'),
        descricao: 'Primeira audiência',
      },
    ],
  };
}

// Wrapper com error handling
export async function queryFipe(brand: string, model: string, year: number) {
  try {
    const data = await mockFipeQuery(brand, model, year);
    return {
      success: true,
      data,
      source: 'FIPE_MOCK',
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'FIPE_MOCK',
      timestamp: new Date(),
    };
  }
}

export async function queryCartorio(matricula: string) {
  try {
    const data = await mockCartorioMatricula(matricula);
    return {
      success: true,
      data,
      source: 'CARTORIO_MOCK',
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'CARTORIO_MOCK',
      timestamp: new Date(),
    };
  }
}

export async function queryTribunal(processoNum: string) {
  try {
    const data = await mockTribunalProcesso(processoNum);
    return {
      success: true,
      data,
      source: 'TRIBUNAL_MOCK',
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'TRIBUNAL_MOCK',
      timestamp: new Date(),
    };
  }
}

// Batch queries para performance
export async function batchQueryIntegrations(queries: {
  fipe?: { brand: string; model: string; year: number };
  cartorio?: string;
  tribunal?: string;
}) {
  const results: Record<string, any> = {};

  if (queries.fipe) {
    results.fipe = await queryFipe(queries.fipe.brand, queries.fipe.model, queries.fipe.year);
  }

  if (queries.cartorio) {
    results.cartorio = await queryCartorio(queries.cartorio);
  }

  if (queries.tribunal) {
    results.tribunal = await queryTribunal(queries.tribunal);
  }

  return results;
}

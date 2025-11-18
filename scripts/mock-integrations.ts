// scripts/mock-integrations.ts
// POCs mock: FIPE, Cartórios, Tribunais
import 'dotenv/config';

// Simple mocks returning static/sample data
export async function fetchFIPEMock(brand: string, model: string, year: number) {
  return {
    brand,
    model,
    year,
    averagePrice: 75321.45,
    source: 'FIPE-MOCK',
    updatedAt: new Date().toISOString(),
  };
}

export async function fetchCartorioMock(matricula: string) {
  return {
    matricula,
    onus: [
      { tipo: 'HIPOTECA', status: 'BAIXA PENDENTE', data: '2021-03-10' },
    ],
    proprietarios: [
      { nome: 'Fulano de Tal', doc: '123.456.789-00' },
    ],
    source: 'CARTORIO-MOCK',
  };
}

export async function fetchTribunalMock(processNumber: string) {
  return {
    processNumber,
    classe: 'Execução de Título Extrajudicial',
    partes: [
      { tipo: 'AUTOR', nome: 'Banco XYZ' },
      { tipo: 'RÉU', nome: 'Ciclano' },
    ],
    andamentosRecentes: [
      { data: '2024-08-12', descricao: 'Despacho deferindo penhora' },
    ],
    source: 'TRIBUNAL-MOCK',
  };
}

if (require.main === module) {
  (async () => {
    console.log(await fetchFIPEMock('Toyota', 'Corolla', 2020));
    console.log(await fetchCartorioMock('12345-67-89'));
    console.log(await fetchTribunalMock('0001234-56.2024.8.26.0001'));
  })();
}

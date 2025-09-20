// src/app/admin/import/cnj/actions.ts
/**
 * @fileoverview Server Actions para a funcionalidade de importação de processos
 * a partir da API Datajud do CNJ (Conselho Nacional de Justiça). Este arquivo
 * encapsula a lógica de comunicação com o serviço externo, incluindo a montagem
 * das queries, tratamento da autenticação via API Key, e a transformação dos
 * dados recebidos para o formato da plataforma antes de importá-los.
 */
'use server';

import type { CnjSearchResponse, CnjProcessSource, CnjHit } from '@/types';
import { createJudicialProcessAction } from '@/app/admin/judicial-processes/actions';
import { revalidatePath } from 'next/cache';

const API_BASE_URL = 'https://api-publica.datajud.cnj.jus.br';

/**
 * Função central para realizar requisições à API do Datajud.
 * @param queryBody O corpo da requisição para a busca Elasticsearch do CNJ.
 * @param tribunal A sigla do tribunal a ser consultado (ex: 'trf1', 'tjdft').
 * @returns A resposta completa da API do CNJ.
 */
async function fetchProcessFromCnj(queryBody: any, tribunal: string): Promise<CnjSearchResponse> {
  const apiKey = process.env.DATAJUD_API_KEY;
  if (!apiKey) {
    throw new Error('A chave de API do Datajud (DATAJUD_API_KEY) não está configurada no ambiente.');
  }

  const url = `${API_BASE_URL}/api_publica_${tribunal.toLowerCase()}/_search`;
  console.log(`[CNJ Action] Fetching from URL: ${url}`);
  console.log(`[CNJ Action] Query Body: ${JSON.stringify(queryBody)}`);


  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `APIKey ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queryBody),
    });
    
    const responseData = await response.json();

    if (!response.ok) {
        console.error("CNJ API Error Response:", responseData);
        throw new Error(`Erro da API do CNJ: ${responseData.error?.reason || response.statusText}`);
    }
    
    return responseData;
  } catch (error: any) {
    console.error("Error fetching from CNJ API:", error);
    throw new Error(error.message || 'Falha na comunicação com a API do Datajud.');
  }
}

/**
 * Busca um processo específico pelo seu número único no Datajud.
 * @param processNumber O número do processo a ser buscado.
 * @param tribunal A sigla do tribunal.
 * @returns A resposta da API do CNJ.
 */
export async function searchByProcessNumber(processNumber: string, tribunal: string): Promise<CnjSearchResponse> {
    const query = {
        "query": {
            "match": {
                "numeroProcesso": processNumber
            }
        }
    };
    return fetchProcessFromCnj(query, tribunal);
}

/**
 * Busca processos em lote por código de classe e órgão julgador.
 * @param classCode Código da classe processual.
 * @param courtCode Código do órgão julgador.
 * @param tribunal Sigla do tribunal.
 * @param size Quantidade de resultados por página.
 * @param searchAfter Array para paginação em buscas profundas.
 * @returns A resposta da API do CNJ.
 */
export async function searchByClassAndCourt(classCode: string, courtCode: string, tribunal: string, size = 100, searchAfter?: (string | number)[]): Promise<CnjSearchResponse> {
    const query: any = {
        "size": size,
        "query": {
            "bool": {
                "must": [
                    {"match": {"classe.codigo": parseInt(classCode, 10)}},
                    {"match": {"orgaoJulgador.codigo": parseInt(courtCode, 10)}}
                ]
            }
        },
        "sort": [
            { "@timestamp": { "order": "asc" } }
        ]
    };

    if (searchAfter) {
        query.search_after = searchAfter;
    }
    
    return fetchProcessFromCnj(query, tribunal);
}

/**
 * Importa uma lista de processos do CNJ para o banco de dados local.
 * Transforma os dados do formato do CNJ para o formato da aplicação.
 * @param processes Array de processos no formato `CnjProcessSource`.
 * @returns Um contador de sucessos e erros.
 */
export async function importCnjProcesses(processes: CnjProcessSource[]): Promise<{ successCount: number; errorCount: number }> {
  let successCount = 0;
  let errorCount = 0;

  for (const process of processes) {
    try {
      const parties = (process.assuntos || []).flat().map((assunto: any, index: number) => ({
        name: assunto.nome || 'Parte não identificada',
        partyType: index === 0 ? 'AUTOR' : 'REU', // Simple assumption
      }));

      // A simple fallback if no "assuntos" are present but we need at least one party
      if (parties.length === 0) {
        parties.push({ name: 'Autor Desconhecido', partyType: 'AUTOR' });
        parties.push({ name: 'Réu Desconhecido', partyType: 'REU' });
      }

      // Mapeamento simplificado que assume que os IDs do CNJ podem ser usados diretamente
      // ou que a lógica de `createJudicialProcessAction` pode encontrá-los.
      const processData = {
        processNumber: process.numeroProcesso,
        isElectronic: process.formato.nome.toLowerCase() === 'eletrônico',
        courtId: process.tribunal,
        districtId: String(process.orgaoJulgador.codigo),
        branchId: String(process.orgaoJulgador.codigo),
        parties: parties,
      };

      const result = await createJudicialProcessAction(processData as any);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        console.error(`Failed to import process ${process.numeroProcesso}: ${result.message}`);
      }
    } catch (e) {
      errorCount++;
      console.error(`Error during import of process ${process.numeroProcesso}:`, e);
    }
  }

  if (successCount > 0) {
    revalidatePath('/admin/judicial-processes');
  }

  return { successCount, errorCount };
}

export type { CnjSearchResponse, CnjHit };

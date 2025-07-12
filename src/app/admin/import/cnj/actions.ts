// src/app/admin/import/cnj/actions.ts
'use server';

import type { CnjSearchResponse, CnjProcessSource, CnjHit } from '@/types';
import { createJudicialProcessAction } from '@/app/admin/judicial-processes/actions';
import { revalidatePath } from 'next/cache';

const API_BASE_URL = 'https://api-publica.datajud.cnj.jus.br';

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

      const processData = {
        processNumber: process.numeroProcesso,
        isElectronic: process.formato.nome.toLowerCase() === 'eletrônico',
        // These will need to be found or created in our DB based on the names/codes.
        // This is a complex step that requires mapping CNJ codes to our internal IDs.
        // For this implementation, we will pass placeholders and assume they can be resolved later.
        courtId: process.tribunal,
        districtId: String(process.orgaoJulgador.codigo),
        branchId: String(process.orgaoJulgador.codigo), // Often the same in CNJ data structure
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


// src/lib/actions/cep.ts
'use server';

import { z } from 'zod';

const CepSchema = z.object({
  cep: z.string(),
  logradouro: z.string(),
  complemento: z.string(),
  bairro: z.string(),
  localidade: z.string(),
  uf: z.string(),
  ibge: z.string(),
  gia: z.string(),
  ddd: z.string(),
  siafi: z.string(),
  erro: z.boolean().optional(),
});

type CepData = z.infer<typeof CepSchema>;

/**
 * Fetches address information from the ViaCEP API based on a given CEP.
 * @param {string} cep - The postal code (CEP) to look up.
 * @returns {Promise<{success: boolean; data?: CepData; message?: string}>} An object containing the result of the lookup.
 */
export async function consultaCepAction(cep: string): Promise<{
  success: boolean;
  data?: CepData;
  message?: string;
}> {
  const cleanedCep = cep.replace(/\D/g, ''); // Remove non-digit characters

  if (cleanedCep.length !== 8) {
    return { success: false, message: "CEP inválido. Deve conter 8 dígitos." };
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
    if (!response.ok) {
      throw new Error(`Erro na API do ViaCEP: ${response.statusText}`);
    }

    const data: CepData = await response.json();

    if (data.erro) {
      return { success: false, message: "CEP não encontrado." };
    }
    
    // Validate the response against the Zod schema
    const validation = CepSchema.safeParse(data);
    if (!validation.success) {
      console.error("Validação do Zod para o CEP falhou:", validation.error.flatten());
      return { success: false, message: "Dados de CEP retornados em formato inesperado." };
    }

    return { success: true, data: validation.data };
  } catch (error) {
    console.error("Erro na consulta do CEP:", error);
    return { success: false, message: "Falha ao consultar o CEP. Verifique sua conexão." };
  }
}

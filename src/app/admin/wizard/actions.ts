
'use server';

import { getCourts } from '../courts/actions';
import { getJudicialDistricts } from '../judicial-districts/actions';
import { getJudicialBranches } from '../judicial-branches/actions';
import { getJudicialProcesses } from '../judicial-processes/actions';
import { getAuctioneers } from '../auctioneers/actions';
import { getSellers } from '../sellers/actions';
import { getBens } from '../bens/actions';
import { getLotCategories } from '../categories/actions';
import type { WizardData } from '@/components/admin/wizard/wizard-context';
import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';

/**
 * @fileoverview Server Actions para o assistente de criação de leilões (Wizard).
 * Agrega dados de diversas fontes e cria o leilão e seus lotes de forma transacional.
 */


/**
 * Busca todos os dados iniciais necessários para popular os seletores e opções do wizard.
 * Isso inclui dados sobre entidades judiciais, leiloeiros, comitentes, bens e categorias.
 * @returns {Promise<{success: boolean, data?: object, message?: string}>} Um objeto com os dados ou uma mensagem de erro.
 */
export async function getWizardInitialData() {
  try {
    const [
      courts,
      districts,
      branches,
      judicialProcesses,
      auctioneers,
      sellers,
      availableBens,
      categories
    ] = await Promise.all([
      getCourts(),
      getJudicialDistricts(),
      getJudicialBranches(),
      getJudicialProcesses(),
      getAuctioneers(),
      getSellers(),
      getBens(),
      getLotCategories(),
    ]);

    return {
      success: true,
      data: {
        courts,
        districts,
        branches,
        judicialProcesses,
        auctioneers,
        sellers,
        availableBens,
        categories,
      },
    };
  } catch (error: any) {
    console.error("Error fetching wizard initial data:", error);
    return { success: false, message: error.message };
  }
}

/**
 * Cria um novo leilão e seus lotes associados a partir dos dados coletados no wizard.
 * Utiliza uma transação Prisma para garantir a atomicidade da operação (ou tudo é criado, ou nada é).
 * @param {WizardData} wizardData - O objeto de estado contendo todos os dados do assistente.
 * @returns {Promise<{success: boolean, message: string, auctionId?: string}>} O resultado da operação.
 */
export async function createAuctionFromWizard(wizardData: WizardData): Promise<{success: boolean; message: string; auctionId?: string;}> {
  if (!wizardData.auctionDetails || !wizardData.auctionDetails.title || !wizardData.auctionDetails.auctioneerId || !wizardData.auctionDetails.categoryId) {
    return { success: false, message: "Detalhes do leilão incompletos." };
  }
  console.warn("createAuctionFromWizard is not fully implemented for this data adapter.");
  return { success: false, message: "Ainda não implementado."};
}

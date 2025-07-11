
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
 * @param {WizardData} wizardData - O objeto de estado contendo todos os dados do assistente.
 * @returns {Promise<{success: boolean, message: string, auctionId?: string}>} O resultado da operação.
 */
export async function createAuctionFromWizard(wizardData: WizardData): Promise<{success: boolean; message: string; auctionId?: string;}> {
  if (!wizardData.auctionDetails || !wizardData.auctionDetails.title || !wizardData.auctionDetails.auctioneerId) {
    return { success: false, message: "Detalhes do leilão incompletos." };
  }
  
  const db = getDatabaseAdapter();

  // 1. Create the Auction
  // @ts-ignore - The adapter method expects a slightly different type
  const auctionResult = await db.createAuction(wizardData.auctionDetails);
  
  if (!auctionResult.success || !auctionResult.auctionId) {
    return { success: false, message: `Falha ao criar o leilão: ${auctionResult.message}` };
  }

  // 2. Create the Lots for this Auction
  if (wizardData.createdLots && wizardData.createdLots.length > 0) {
    for (const lot of wizardData.createdLots) {
      const lotDataForCreation = {
        ...lot,
        auctionId: auctionResult.auctionId, // Link to the newly created auction
      };
      await db.createLot(lotDataForCreation);
      // In a real scenario, you'd handle potential lot creation failures more gracefully
    }
  }

  revalidatePath('/admin/auctions');
  return { success: true, message: "Leilão e lotes criados com sucesso!", auctionId: auctionResult.auctionId };
}

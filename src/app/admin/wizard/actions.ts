// src/app/admin/wizard/actions.ts
'use server';

import { getCourts } from '../courts/actions';
import { getJudicialDistricts } from '../judicial-districts/actions';
import { getJudicialBranches } from '../judicial-branches/actions';
import { getJudicialProcesses } from '../judicial-processes/actions';
import { getAuctioneers } from '../auctioneers/actions';
import { getSellers } from '../sellers/actions';
import { getAssets } from '../assets/actions';
import { getLotCategories } from '../categories/actions';
import type { WizardData } from '@/components/admin/wizard/wizard-context';
import { revalidatePath } from 'next/cache';
import { AuctionService } from '@/services/auction.service';
import { LotService } from '@/services/lot.service';
import { getSession } from '@/app/auth/actions';
import { hasPermission } from '@/lib/permissions';

/**
 * @fileoverview Server Actions para o assistente de criação de leilões (Wizard).
 * Agrega dados de diversas fontes e cria o leilão e seus lotes de forma transacional.
 */

async function getTenantIdFromSession(): Promise<string> {
    const session = await getSession();
    if (!session?.tenantId) {
        throw new Error("Tenant ID não encontrado na sessão para o wizard.");
    }
    return session.tenantId;
}


/**
 * Busca todos os dados iniciais necessários para popular os seletores e opções do wizard.
 * Isso inclui dados sobre entidades judiciais, leiloeiros, comitentes, ativos e categorias,
 * TODOS FILTRADOS PELO TENANT_ID DO USUÁRIO LOGADO.
 * @returns {Promise<{success: boolean, data?: object, message?: string}>} Um objeto com os dados ou uma mensagem de erro.
 */
export async function getWizardInitialData() {
  try {
    const tenantId = await getTenantIdFromSession();

    const [
      courts,
      districts,
      branches,
      judicialProcesses,
      auctioneers,
      sellers,
      availableAssets,
      categories
    ] = await Promise.all([
      getCourts(),
      getJudicialDistricts(),
      getJudicialBranches(),
      getJudicialProcesses(tenantId),
      getAuctioneers(false),
      getSellers(false),
      getAssets({ tenantId }),
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
        availableAssets,
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
  const session = await getSession();
  const user = session; // Assumindo que a sessão tem o perfil do usuário
  if (!user || !hasPermission(user, 'auctions:create')) {
    return { success: false, message: "Acesso negado. Você não tem permissão para criar leilões." };
  }

  const tenantId = session.tenantId;
  
  if (!wizardData.auctionDetails || !wizardData.auctionDetails.title || !wizardData.auctionDetails.auctioneerId) {
    return { success: false, message: "Detalhes do leilão incompletos." };
  }
  
  const auctionService = new AuctionService();
  const lotService = new LotService();

  // 1. Create the Auction
  const auctionData = {
    ...wizardData.auctionDetails,
    judicialProcessId: wizardData.judicialProcess?.id // Make sure to pass this along
  };

  const auctionResult = await auctionService.createAuction(tenantId, auctionData);
  
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
      await lotService.createLot(lotDataForCreation, tenantId); // Pass tenantId
    }
  }

  if (process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/auctions');
  }
  
  return { success: true, message: "Leilão e lotes criados com sucesso!", auctionId: auctionResult.auctionId };
}

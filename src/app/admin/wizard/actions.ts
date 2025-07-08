
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
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

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

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the Auction
      const newAuction = await tx.auction.create({
        data: {
          publicId: `AUC-PUB-${uuidv4().substring(0, 8)}`,
          title: wizardData.auctionDetails!.title!,
          description: wizardData.auctionDetails?.description,
          status: 'RASCUNHO', // Or another default status
          auctionType: wizardData.auctionType,
          auctionDate: wizardData.auctionDetails!.auctionDate!,
          endDate: wizardData.auctionDetails?.endDate,
          auctionStages: wizardData.auctionDetails?.auctionStages || [],
          categoryId: wizardData.auctionDetails!.categoryId!,
          auctioneerId: wizardData.auctionDetails!.auctioneerId!,
          sellerId: wizardData.auctionDetails?.sellerId,
          judicialProcessId: wizardData.judicialProcess?.id,
        },
      });

      // 2. Create the Lots
      if (wizardData.createdLots && wizardData.createdLots.length > 0) {
        const lotsToCreate = wizardData.createdLots.map(lot => ({
          ...lot,
          id: undefined, // Let Prisma generate ID
          publicId: `LOT-PUB-${uuidv4().substring(0, 8)}`,
          auctionId: newAuction.id,
          status: 'EM_BREVE',
          createdAt: undefined,
          updatedAt: undefined,
          bens: undefined, // Don't try to nest create bens
        }));
        await tx.lot.createMany({
          data: lotsToCreate,
        });

        // 3. Update the status of the 'Bens'
        const allBemIds = wizardData.createdLots.flatMap(lot => lot.bemIds || []);
        if (allBemIds.length > 0) {
          await tx.bem.updateMany({
            where: { id: { in: allBemIds } },
            data: { status: 'LOTEADO' },
          });
        }
      }
      
      // 4. Update auction lot count
      const lotCount = wizardData.createdLots?.length || 0;
      await tx.auction.update({
        where: { id: newAuction.id },
        data: { totalLots: lotCount }
      });

      return { success: true, message: 'Leilão e lotes criados com sucesso!', auctionId: newAuction.id };
    });
    
    revalidatePath('/admin/auctions');
    revalidatePath('/admin/lots');
    revalidatePath('/admin/bens');
    return result;

  } catch (error: any) {
      console.error("Error in createAuctionFromWizard action:", error);
      return { success: false, message: error.message };
  }
}

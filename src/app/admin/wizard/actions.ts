

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
import { getDatabaseAdapter } from '@/lib/database';
import { revalidatePath } from 'next/cache';

// This action aggregates multiple data-fetching actions needed for the wizard.
export async function getWizardInitialData(processId?: string) {
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
      getBens(), // Fetch all initially
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

export async function createAuctionFromWizard(wizardData: WizardData): Promise<{success: boolean; message: string; auctionId?: string;}> {
    if (!wizardData.auctionDetails || !wizardData.auctionDetails.title) {
        return { success: false, message: "Detalhes do leilão incompletos." };
    }
    
    const db = await getDatabaseAdapter();

    try {
        const result = await db.createAuctionAndLinkLots(wizardData);
        if (result.success) {
            revalidatePath('/admin/auctions');
            revalidatePath('/admin/lots');
            revalidatePath('/admin/bens');
            revalidatePath('/admin/lotting');
        }
        return result;
    } catch (error: any) {
        console.error("Error in createAuctionFromWizard action:", error);
        return { success: false, message: error.message };
    }
}

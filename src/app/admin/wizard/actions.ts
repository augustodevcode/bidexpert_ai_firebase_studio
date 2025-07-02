
'use server';

import { getCourts } from '../courts/actions';
import { getJudicialDistricts } from '../judicial-districts/actions';
import { getJudicialBranches } from '../judicial-branches/actions';
import { getAuctioneers } from '../auctioneers/actions';
import { getSellers } from '../sellers/actions';
import { getBens } from '../bens/actions';

// This action aggregates multiple data-fetching actions needed for the wizard.
export async function getWizardInitialData(processId?: string) {
  try {
    const [
      courts,
      districts,
      branches,
      auctioneers,
      sellers,
      availableBens
    ] = await Promise.all([
      getCourts(),
      getJudicialDistricts(),
      getJudicialBranches(),
      getAuctioneers(),
      getSellers(),
      getBens(processId) // Fetch bens for a specific process if provided
    ]);

    return {
      success: true,
      data: {
        courts,
        districts,
        branches,
        auctioneers,
        sellers,
        availableBens,
      },
    };
  } catch (error: any) {
    console.error("Error fetching wizard initial data:", error);
    return { success: false, message: error.message };
  }
}

'use server';

import { 
  suggestListingDetails, 
} from '@/ai/flows/suggest-listing-details';
import type { SuggestListingDetailsInput, SuggestListingDetailsOutput } from '@/ai/flows/suggest-listing-details';
import { 
  predictOpeningValue, 
} from '@/ai/flows/predict-opening-value';
import type { PredictOpeningValueInput, PredictOpeningValueOutput } from '@/ai/flows/predict-opening-value';
import { 
  suggestSimilarListings, 
} from '@/ai/flows/suggest-similar-listings';
import type { SuggestSimilarListingsInput, SuggestSimilarListingsOutput } from '@/ai/flows/suggest-similar-listings';
import { getAuctions } from '@/app/admin/auctions/actions';

export interface AISuggestionState {
  listingDetails?: SuggestListingDetailsOutput | null;
  openingValue?: PredictOpeningValueOutput | null;
  similarListings?: SuggestSimilarListingsOutput | null;
}

export async function fetchListingDetailsSuggestions(input: Omit<SuggestListingDetailsInput, 'recentAuctionData'>): Promise<SuggestListingDetailsOutput> {
  try {
    const recentAuctions = await getAuctions();
    const recentAuctionData = recentAuctions.slice(0, 5).map(a => ({
        title: a.title,
        description: a.description,
        finalPrice: a.achievedRevenue || a.initialOffer || 0
    }));

    const fullInput: SuggestListingDetailsInput = {
        ...input,
        recentAuctionData: JSON.stringify(recentAuctionData),
    };

    const result = await suggestListingDetails(fullInput);
    return result;
  } catch (error: any) {
    console.error("Error fetching listing details suggestions:", error);
    throw new Error(error.message || "Failed to fetch listing details suggestions.");
  }
}

export async function fetchOpeningValuePrediction(input: PredictOpeningValueInput): Promise<PredictOpeningValueOutput> {
  try {
    const result = await predictOpeningValue(input);
    return result;
  } catch (error: any) {
    console.error("Error fetching opening value prediction:", error);
    throw new Error(error.message || "Failed to fetch opening value prediction.");
  }
}

export async function fetchSimilarListingsSuggestions(input: SuggestSimilarListingsInput): Promise<SuggestSimilarListingsOutput> {
  try {
    const result = await suggestSimilarListings(input);
    return result;
  } catch (error: any) {
    console.error("Error fetching similar listings suggestions:", error);
    throw new Error(error.message || "Failed to fetch similar listings suggestions.");
  }
}

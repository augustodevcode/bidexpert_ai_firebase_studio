
'use server';

import { 
  suggestListingDetails, 
  type SuggestListingDetailsInput, 
  type SuggestListingDetailsOutput 
} from '@/ai/flows/suggest-listing-details';
import { 
  predictOpeningValue, 
  type PredictOpeningValueInput, 
  type PredictOpeningValueOutput 
} from '@/ai/flows/predict-opening-value';
import { 
  suggestSimilarListings, 
  type SuggestSimilarListingsInput, 
  type SuggestSimilarListingsOutput 
} from '@/ai/flows/suggest-similar-listings';
import { getAuctions } from '@/app/admin/auctions/actions';

export interface AISuggestionState {
  listingDetails?: SuggestListingDetailsOutput | null;
  openingValue?: PredictOpeningValueOutput | null;
  similarListings?: SuggestSimilarListingsOutput | null;
}

export async function fetchListingDetailsSuggestions(input: Omit<SuggestListingDetailsInput, 'recentAuctionData'>): Promise<SuggestListingDetailsOutput> {
  try {
    // Fetch a sample of recent auctions to provide context to the AI.
    const recentAuctions = await getAuctions();
    const recentAuctionData = recentAuctions.slice(0, 5).map(a => ({
        title: a.title,
        description: a.description,
        finalPrice: a.achievedRevenue || a.initialOffer || 0 // A simplified final price
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


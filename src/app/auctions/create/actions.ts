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

export interface AISuggestionState {
  listingDetails?: SuggestListingDetailsOutput | null;
  openingValue?: PredictOpeningValueOutput | null;
  similarListings?: SuggestSimilarListingsOutput | null;
}

export async function fetchListingDetailsSuggestions(input: SuggestListingDetailsInput): Promise<SuggestListingDetailsOutput> {
  try {
    const result = await suggestListingDetails(input);
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

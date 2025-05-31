// src/ai/flows/suggest-similar-listings.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow that suggests similar successful listings to a seller for inspiration.
 *
 * - suggestSimilarListings - A function that suggests similar listings.
 * - SuggestSimilarListingsInput - The input type for the suggestSimilarListings function.
 * - SuggestSimilarListingsOutput - The output type for the suggestSimilarListings function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSimilarListingsInputSchema = z.object({
  itemCategory: z.string().describe('The category of the item being listed.'),
  itemDescription: z.string().describe('A detailed description of the item.'),
  sellerId: z.string().describe('The ID of the seller.'),
  desiredAuctionLengthDays: z.number().describe('The desired length of the auction in days.'),
});
export type SuggestSimilarListingsInput = z.infer<typeof SuggestSimilarListingsInputSchema>;

const SuggestedListingSchema = z.object({
  title: z.string().describe('The title of the similar listing.'),
  description: z.string().describe('A description of the similar listing.'),
  winningBid: z.number().describe('The winning bid amount for the similar listing.'),
  auctionLengthDays: z.number().describe('The auction length in days for the similar listing.'),
});

const SuggestSimilarListingsOutputSchema = z.object({
  listings: z.array(SuggestedListingSchema).describe('An array of similar listings.'),
});

export type SuggestSimilarListingsOutput = z.infer<typeof SuggestSimilarListingsOutputSchema>;

export async function suggestSimilarListings(input: SuggestSimilarListingsInput): Promise<SuggestSimilarListingsOutput> {
  return suggestSimilarListingsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSimilarListingsPrompt',
  input: {schema: SuggestSimilarListingsInputSchema},
  output: {schema: SuggestSimilarListingsOutputSchema},
  prompt: `You are an auction listing expert. Given the details of a seller's potential listing, you will suggest similar successful listings as inspiration.

Item Category: {{{itemCategory}}}
Item Description: {{{itemDescription}}}
Desired Auction Length (days): {{{desiredAuctionLengthDays}}}

Suggest 3 similar listings, including their title, description, winning bid, and auction length (in days). Consider what made these listings successful.

Format your response as a JSON object with a "listings" field containing an array of similar listing objects. Each listing object should have the following fields: "title", "description", "winningBid", and "auctionLengthDays".`,
});

const suggestSimilarListingsFlow = ai.defineFlow(
  {
    name: 'suggestSimilarListingsFlow',
    inputSchema: SuggestSimilarListingsInputSchema,
    outputSchema: SuggestSimilarListingsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

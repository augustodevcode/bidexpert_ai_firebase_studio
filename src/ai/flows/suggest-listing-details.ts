'use server';

/**
 * @fileOverview AI flow to suggest optimal listing details for auctions based on current trends.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestListingDetailsInputSchema = z.object({
  auctionTitle: z.string().describe('The current title of the auction listing.'),
  auctionDescription: z.string().describe('The current description of the auction listing.'),
  auctionCategory: z.string().describe('The current category of the auction listing.'),
  auctionKeywords: z.string().describe('The current keywords associated with the auction listing.'),
  recentAuctionData: z.string().describe('JSON array of recent, similar successful auctions, including titles, descriptions, and final prices.'),
});
export type SuggestListingDetailsInput = z.infer<typeof SuggestListingDetailsInputSchema>;

const SuggestListingDetailsOutputSchema = z.object({
  suggestedTitle: z.string().describe('A suggested title for the auction listing.'),
  suggestedDescription: z.string().describe('A suggested description for the auction listing.'),
  suggestedCategory: z.string().describe('A potentially better category for the listing.'),
  suggestedKeywords: z.string().describe('Suggested keywords to attract more interest.'),
  predictedOpeningValue: z.number().describe('Predicted optimal opening value for a fast auction resolution.'),
  similarListings: z.array(z.string()).describe('Titles of similar listings that may serve as inspiration.'),
});

export type SuggestListingDetailsOutput = z.infer<typeof SuggestListingDetailsOutputSchema>;

export async function suggestListingDetails(input: SuggestListingDetailsInput): Promise<SuggestListingDetailsOutput> {
  return suggestListingDetailsFlow(input);
}

const suggestListingDetailsPrompt = ai.definePrompt({
  name: 'suggestListingDetailsPrompt',
  input: {schema: SuggestListingDetailsInputSchema},
  output: {schema: SuggestListingDetailsOutputSchema},
  prompt: `You are an expert auction listing advisor. Analyze the provided auction details and recent auction data to suggest improvements.

Current Auction Details:
Title: {{{auctionTitle}}}
Description: {{{auctionDescription}}}
Category: {{{auctionCategory}}}
Keywords: {{{auctionKeywords}}}

Recent Auction Data (JSON):
{{{recentAuctionData}}}

Based on this data, provide the following suggestions:

*   suggestedTitle: A revised title that is more compelling.
*   suggestedDescription: A revised description that is more detailed and enticing.
*   suggestedCategory: A potentially better category for the listing.
*   suggestedKeywords: Keywords that will attract more interest and higher bids. These should be comma separated.
*   predictedOpeningValue: An opening value that is expected to lead to a fast auction resolution.  Base this on the recent auction data provided.
*   similarListings: Titles of listings from the recent auction data that the seller might find useful as inspiration.

Ensure the suggested title and description are appropriate for the category. Ensure that the predicted opening value is realistic.

Format the suggested keywords as a comma-separated list.

IMPORTANT: The ENTIRE output must be valid JSON. Do not include any markdown formatting.
`,
});

const suggestListingDetailsFlow = ai.defineFlow(
  {
    name: 'suggestListingDetailsFlow',
    inputSchema: SuggestListingDetailsInputSchema,
    outputSchema: SuggestListingDetailsOutputSchema,
  },
  async input => {
    const {output} = await suggestListingDetailsPrompt(input);
    return output!;
  }
);

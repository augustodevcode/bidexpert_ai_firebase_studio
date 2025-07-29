'use server';

/**
 * @fileOverview This file defines a Genkit flow to predict the optimal opening bid value for an auction.
 *
 * The flow uses historical auction data to suggest an opening bid that balances attracting initial bids with achieving a fast auction resolution.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictOpeningValueInputSchema = z.object({
  itemDescription: z.string().describe('Detailed description of the item being auctioned.'),
  category: z.string().describe('Category of the item (e.g., electronics, clothing, antiques).'),
  condition: z.string().describe('Condition of the item (e.g., new, used, like new).'),
  pastAuctionData: z.string().describe('Summary of past auction data for similar items, including average bid prices, number of bids, and auction duration.'),
});

export type PredictOpeningValueInput = z.infer<typeof PredictOpeningValueInputSchema>;

const PredictOpeningValueOutputSchema = z.object({
  suggestedOpeningValue: z.number().describe('The suggested optimal opening bid value for the auction.'),
  reasoning: z.string().describe('Explanation of why this opening value is suggested, based on the input data.'),
});

export type PredictOpeningValueOutput = z.infer<typeof PredictOpeningValueOutputSchema>;

export async function predictOpeningValue(input: PredictOpeningValueInput): Promise<PredictOpeningValueOutput> {
  return predictOpeningValueFlow(input);
}

const predictOpeningValuePrompt = ai.definePrompt({
  name: 'predictOpeningValuePrompt',
  input: {schema: PredictOpeningValueInputSchema},
  output: {schema: PredictOpeningValueOutputSchema},
  prompt: `You are an expert auction strategist. Analyze the following information to determine the optimal opening bid value for an auction item.

Item Description: {{{itemDescription}}}
Category: {{{category}}}
Condition: {{{condition}}}
Past Auction Data: {{{pastAuctionData}}}

Consider the trade-off between attracting initial bids and achieving a fast auction resolution. Provide a suggested opening bid value and explain your reasoning.

Output:
{{
  "suggestedOpeningValue": "",
  "reasoning": ""
}}
`,
});

const predictOpeningValueFlow = ai.defineFlow(
  {
    name: 'predictOpeningValueFlow',
    inputSchema: PredictOpeningValueInputSchema,
    outputSchema: PredictOpeningValueOutputSchema,
  },
  async input => {
    const {output} = await predictOpeningValuePrompt(input);
    return output!;
  }
);

import { config } from 'dotenv';
config();

import '@/ai/flows/predict-opening-value.ts';
import '@/ai/flows/suggest-listing-details.ts';
import '@/ai/flows/suggest-similar-listings.ts';
import '@/ai/flows/generate-document-flow.ts';
import '@/ai/flows/extract-process-data-flow.ts';

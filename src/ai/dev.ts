import { config } from 'dotenv';
config();

import '@/ai/flows/predict-opening-value.ts';
import '@/ai/flows/suggest-listing-details.ts';
import '@/ai/flows/suggest-similar-listings.ts';
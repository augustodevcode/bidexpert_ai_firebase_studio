/**
 * @fileoverview Endpoint público para obter índices de conversão BRL -> USD/EUR
 * com fallback de último valor válido em memória para maior resiliência.
 */

import { NextResponse } from 'next/server';
import { fetchLiveCurrencyRatesFromBRL, type CurrencyRatesResponse } from '@/services/currency-rates.service';

export const dynamic = 'force-dynamic';

let lastKnownGoodRates: CurrencyRatesResponse | null = null;

const FALLBACK_RATES: CurrencyRatesResponse = {
  base: 'BRL',
  rates: {
    BRL: 1,
    USD: 0.2,
    EUR: 0.18,
  },
  source: 'fallback-static-rates',
  updatedAt: new Date(0).toISOString(),
};

export async function GET() {
  try {
    const liveRates = await fetchLiveCurrencyRatesFromBRL();
    lastKnownGoodRates = liveRates;

    return NextResponse.json(liveRates, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    if (lastKnownGoodRates) {
      return NextResponse.json({
        ...lastKnownGoodRates,
        stale: true,
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    return NextResponse.json({
      ...FALLBACK_RATES,
      stale: true,
      fallbackReason: error instanceof Error ? error.message : 'unknown_error',
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }
}

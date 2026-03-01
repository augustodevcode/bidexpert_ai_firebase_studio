/**
 * @fileoverview Serviço para buscar cotações monetárias em provedor externo
 * e normalizar o payload para uso interno no BidExpert.
 */

import type { CurrencyExchangeRates } from '@/lib/format';

export interface CurrencyRatesResponse {
  base: 'BRL';
  rates: CurrencyExchangeRates;
  source: string;
  updatedAt: string;
}

interface FrankfurterPayload {
  amount?: number;
  base?: string;
  date?: string;
  rates?: Record<string, number>;
}

const DEFAULT_CURRENCY_PROVIDER_URL = 'https://api.frankfurter.app/latest';
const DEFAULT_CURRENCY_FETCH_TIMEOUT_MS = 7000;

export async function fetchLiveCurrencyRatesFromBRL(): Promise<CurrencyRatesResponse> {
  const endpoint = process.env.CURRENCY_EXCHANGE_API_URL ?? DEFAULT_CURRENCY_PROVIDER_URL;
  const url = `${endpoint}?from=BRL&to=USD,EUR`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_CURRENCY_FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timeout ao consultar cotação externa em ${DEFAULT_CURRENCY_FETCH_TIMEOUT_MS}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`Erro ao consultar cotação externa: ${response.status}`);
  }

  const payload = await response.json() as FrankfurterPayload;

  const usd = payload?.rates?.USD;
  const eur = payload?.rates?.EUR;

  if (!Number.isFinite(usd) || !Number.isFinite(eur) || (usd as number) <= 0 || (eur as number) <= 0) {
    throw new Error('Provedor de cotação retornou índices inválidos.');
  }

  return {
    base: 'BRL',
    rates: {
      BRL: 1,
      USD: usd as number,
      EUR: eur as number,
    },
    source: endpoint,
    updatedAt: new Date().toISOString(),
  };
}

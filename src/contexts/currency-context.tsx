/**
 * @fileoverview Contexto global para preferência de moeda e locale monetário.
 * Permite alternância entre BRL, USD e EUR com persistência em localStorage.
 */
'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CURRENCY_LOCALE_MAP, formatCurrency as baseFormatCurrency, setRuntimeCurrencyExchangeRates, setRuntimeCurrencyPreference, type CurrencyExchangeRates, type CurrencyFormatOptions, type SupportedCurrency } from '@/lib/format';

interface CurrencyContextValue {
  currency: SupportedCurrency;
  locale: string;
  exchangeRates: CurrencyExchangeRates;
  isRateLoading: boolean;
  lastRateUpdate: string | null;
  setCurrency: (currency: SupportedCurrency) => void;
  refreshExchangeRates: () => Promise<void>;
  formatCurrency: (value: number | string | null | undefined, options?: Omit<CurrencyFormatOptions, 'currency' | 'locale'>) => string;
}

const CURRENCY_STORAGE_KEY = 'bidexpert:selected-currency';
const CURRENCY_RATES_STORAGE_KEY = 'bidexpert:currency-rates';
const CURRENCY_RATES_UPDATED_AT_STORAGE_KEY = 'bidexpert:currency-rates-updated-at';

const DEFAULT_EXCHANGE_RATES: CurrencyExchangeRates = {
  BRL: 1,
  USD: 1,
  EUR: 1,
};

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

function CurrencyRenderBoundary({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<SupportedCurrency>('BRL');
  const [exchangeRates, setExchangeRates] = useState<CurrencyExchangeRates>(DEFAULT_EXCHANGE_RATES);
  const [isRateLoading, setIsRateLoading] = useState(false);
  const [lastRateUpdate, setLastRateUpdate] = useState<string | null>(null);

  const loadRatesFromStorage = useCallback((): CurrencyExchangeRates => {
    if (typeof window === 'undefined') {
      return DEFAULT_EXCHANGE_RATES;
    }

    try {
      const stored = window.localStorage.getItem(CURRENCY_RATES_STORAGE_KEY);
      if (!stored) {
        return DEFAULT_EXCHANGE_RATES;
      }

      const parsed = JSON.parse(stored) as Partial<CurrencyExchangeRates>;
      return {
        BRL: 1,
        USD: Number.isFinite(parsed?.USD) && (parsed.USD as number) > 0 ? (parsed.USD as number) : 1,
        EUR: Number.isFinite(parsed?.EUR) && (parsed.EUR as number) > 0 ? (parsed.EUR as number) : 1,
      };
    } catch {
      return DEFAULT_EXCHANGE_RATES;
    }
  }, []);

  const refreshExchangeRates = useCallback(async () => {
    setIsRateLoading(true);
    try {
      const response = await fetch('/api/public/currency/rates?base=BRL&symbols=USD,EUR', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Falha ao consultar cotação: ${response.status}`);
      }

      const payload = await response.json() as {
        rates?: Partial<CurrencyExchangeRates>;
        updatedAt?: string;
      };

      const normalizedRates: CurrencyExchangeRates = {
        BRL: 1,
        USD: Number.isFinite(payload?.rates?.USD) && (payload.rates?.USD as number) > 0 ? (payload.rates?.USD as number) : exchangeRates.USD,
        EUR: Number.isFinite(payload?.rates?.EUR) && (payload.rates?.EUR as number) > 0 ? (payload.rates?.EUR as number) : exchangeRates.EUR,
      };

      setExchangeRates(normalizedRates);
      setRuntimeCurrencyExchangeRates(normalizedRates);

      const updatedAt = payload.updatedAt ?? new Date().toISOString();
      setLastRateUpdate(updatedAt);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(CURRENCY_RATES_STORAGE_KEY, JSON.stringify(normalizedRates));
        window.localStorage.setItem(CURRENCY_RATES_UPDATED_AT_STORAGE_KEY, updatedAt);
      }
    } catch {
      const fallbackRates = loadRatesFromStorage();
      setExchangeRates(fallbackRates);
      setRuntimeCurrencyExchangeRates(fallbackRates);
    } finally {
      setIsRateLoading(false);
    }
  }, [exchangeRates.EUR, exchangeRates.USD, loadRatesFromStorage]);

  useEffect(() => {
    const storedValue = typeof window !== 'undefined' ? window.localStorage.getItem(CURRENCY_STORAGE_KEY) : null;
    const storedRates = loadRatesFromStorage();

    setExchangeRates(storedRates);
    setRuntimeCurrencyExchangeRates(storedRates);

    const storedRatesUpdatedAt = typeof window !== 'undefined'
      ? window.localStorage.getItem(CURRENCY_RATES_UPDATED_AT_STORAGE_KEY)
      : null;
    if (storedRatesUpdatedAt) {
      setLastRateUpdate(storedRatesUpdatedAt);
    }

    if (storedValue === 'BRL' || storedValue === 'USD' || storedValue === 'EUR') {
      setCurrencyState(storedValue);
      setRuntimeCurrencyPreference(storedValue);
    } else {
      setRuntimeCurrencyPreference('BRL');
    }

    void refreshExchangeRates();

    const intervalId = window.setInterval(() => {
      void refreshExchangeRates();
    }, 30 * 60 * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadRatesFromStorage, refreshExchangeRates]);

  const setCurrency = useCallback((nextCurrency: SupportedCurrency) => {
    setCurrencyState(nextCurrency);
    setRuntimeCurrencyPreference(nextCurrency);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CURRENCY_STORAGE_KEY, nextCurrency);
    }
    void refreshExchangeRates();
  }, [refreshExchangeRates]);

  const locale = CURRENCY_LOCALE_MAP[currency];

  const formatCurrency = useCallback<CurrencyContextValue['formatCurrency']>((value, options = {}) => {
    return baseFormatCurrency(value, {
      currency,
      locale,
      ...options,
    });
  }, [currency, locale]);

  const value = useMemo<CurrencyContextValue>(() => ({
    currency,
    locale,
    exchangeRates,
    isRateLoading,
    lastRateUpdate,
    setCurrency,
    refreshExchangeRates,
    formatCurrency,
  }), [currency, locale, exchangeRates, isRateLoading, lastRateUpdate, setCurrency, refreshExchangeRates, formatCurrency]);

  return (
    <CurrencyContext.Provider value={value}>
      <CurrencyRenderBoundary key={currency}>{children}</CurrencyRenderBoundary>
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

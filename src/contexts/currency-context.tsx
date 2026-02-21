/**
 * @fileoverview Contexto global para preferência de moeda e locale monetário.
 * Permite alternância entre BRL, USD e EUR com persistência em localStorage.
 */
'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CURRENCY_LOCALE_MAP, formatCurrency as baseFormatCurrency, type CurrencyFormatOptions, type SupportedCurrency } from '@/lib/format';

interface CurrencyContextValue {
  currency: SupportedCurrency;
  locale: string;
  setCurrency: (currency: SupportedCurrency) => void;
  formatCurrency: (value: number | string | null | undefined, options?: Omit<CurrencyFormatOptions, 'currency' | 'locale'>) => string;
}

const CURRENCY_STORAGE_KEY = 'bidexpert:selected-currency';

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<SupportedCurrency>('BRL');

  useEffect(() => {
    const storedValue = typeof window !== 'undefined' ? window.localStorage.getItem(CURRENCY_STORAGE_KEY) : null;
    if (storedValue === 'BRL' || storedValue === 'USD' || storedValue === 'EUR') {
      setCurrencyState(storedValue);
    }
  }, []);

  const setCurrency = useCallback((nextCurrency: SupportedCurrency) => {
    setCurrencyState(nextCurrency);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CURRENCY_STORAGE_KEY, nextCurrency);
    }
  }, []);

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
    setCurrency,
    formatCurrency,
  }), [currency, locale, setCurrency, formatCurrency]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency deve ser usado dentro de CurrencyProvider');
  }
  return context;
}

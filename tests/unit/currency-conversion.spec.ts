/**
 * @fileoverview Testes unitários para garantir conversão monetária global
 * com base em índices runtime de BRL para USD/EUR.
 */

import { describe, expect, it } from 'vitest';
import { formatCurrency, setRuntimeCurrencyExchangeRates } from '../../src/lib/format';

describe('currency conversion runtime', () => {
  it('converte BRL para USD com taxa dinâmica', () => {
    setRuntimeCurrencyExchangeRates({ USD: 0.2, EUR: 0.18 });

    expect(formatCurrency(1000, { currency: 'USD' })).toBe('$200.00');
  });

  it('converte BRL para EUR com taxa dinâmica', () => {
    setRuntimeCurrencyExchangeRates({ USD: 0.2, EUR: 0.18 });

    expect(formatCurrency(1000, { currency: 'EUR' })).toBe('180,00 €');
  });

  it('mantém BRL inalterado quando moeda é BRL', () => {
    setRuntimeCurrencyExchangeRates({ USD: 0.2, EUR: 0.18 });

    expect(formatCurrency(1000, { currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })).toBe('R$ 1.000');
  });
});

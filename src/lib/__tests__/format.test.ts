/**
 * @fileoverview Testes unitários para normalização e formatação monetária.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { formatCurrency, toMonetaryNumber, getRuntimeCurrencyPreference, setRuntimeCurrencyPreference } from '@/lib/format';

describe('toMonetaryNumber', () => {
  it('converte number sem alteração', () => {
    expect(toMonetaryNumber(49469)).toBe(49469);
  });

  it('converte string numérica evitando concatenação indevida', () => {
    const bid = toMonetaryNumber('49469');
    const commission = bid * 0.05;
    const total = bid + commission;

    expect(total).toBe(51942.45);
  });

  it('converte string pt-BR com separadores', () => {
    expect(toMonetaryNumber('R$ 2.473,45')).toBe(2473.45);
  });

  it('converte decimal-like com toNumber', () => {
    const decimalLike = { toNumber: () => 1234.56 };
    expect(toMonetaryNumber(decimalLike)).toBe(1234.56);
  });
});

describe('getRuntimeCurrencyPreference', () => {
  let originalWindow: typeof window;

  beforeEach(() => {
    // Save original window object
    originalWindow = global.window;
    // Reset runtime preference
    setRuntimeCurrencyPreference(null);
  });

  afterEach(() => {
    // Restore original window
    global.window = originalWindow;
    vi.restoreAllMocks();
  });

  it('retorna preferência em runtime se definida', () => {
    setRuntimeCurrencyPreference('EUR');
    expect(getRuntimeCurrencyPreference()).toBe('EUR');
  });

  it('retorna BRL se window estiver undefined (ex: SSR)', () => {
    // Mock window to undefined
    vi.stubGlobal('window', undefined);

    expect(getRuntimeCurrencyPreference()).toBe('BRL');
  });

  it('retorna preferência salva no localStorage se disponível e válida', () => {
    const mockGetItem = vi.fn().mockReturnValue('USD');
    const mockLocalStorage = {
      getItem: mockGetItem,
    };

    vi.stubGlobal('window', { localStorage: mockLocalStorage });

    expect(getRuntimeCurrencyPreference()).toBe('USD');
    expect(mockGetItem).toHaveBeenCalledWith('bidexpert:selected-currency');
  });

  it('retorna BRL se localStorage estiver vazio', () => {
    const mockGetItem = vi.fn().mockReturnValue(null);
    const mockLocalStorage = {
      getItem: mockGetItem,
    };

    vi.stubGlobal('window', { localStorage: mockLocalStorage });

    expect(getRuntimeCurrencyPreference()).toBe('BRL');
  });

  it('retorna BRL se localStorage contiver valor inválido', () => {
    const mockGetItem = vi.fn().mockReturnValue('INVALID_CURRENCY');
    const mockLocalStorage = {
      getItem: mockGetItem,
    };

    vi.stubGlobal('window', { localStorage: mockLocalStorage });

    expect(getRuntimeCurrencyPreference()).toBe('BRL');
  });
});

describe('formatCurrency', () => {
  it('formata BRL por padrão', () => {
    expect(formatCurrency(2473.45)).toContain('R$');
    expect(formatCurrency(2473.45)).toContain('2.473,45');
  });

  it('formata USD com locale en-US', () => {
    expect(formatCurrency(2473.45, { currency: 'USD' })).toBe('$2,473.45');
  });

  it('formata EUR com locale de-DE', () => {
    expect(formatCurrency(2473.45, { currency: 'EUR' })).toBe('2.473,45 €');
  });
});

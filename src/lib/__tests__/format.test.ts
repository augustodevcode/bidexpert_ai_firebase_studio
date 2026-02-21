/**
 * @fileoverview Testes unitários para normalização e formatação monetária.
 */

import { describe, expect, it } from 'vitest';
import { formatCurrency, toMonetaryNumber } from '@/lib/format';

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

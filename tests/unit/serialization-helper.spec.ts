/**
 * @fileoverview Testes unitários para sanitizeResponse em src/lib/serialization-helper.ts
 * BDD: Garantir serialização correta de BigInt, Decimal e Date para Client Components.
 * TDD: Cobrir casos de BigInt primitivo, BigInt em objeto, Decimal e Date.
 */
import { describe, it, expect } from 'vitest';
import { sanitizeResponse } from '../../src/lib/serialization-helper';
import { Decimal } from '@prisma/client/runtime/library';

describe('sanitizeResponse', () => {
  it('converte BigInt primitivo para string', () => {
    const result = sanitizeResponse(BigInt('9007199254740993'));
    expect(result).toBe('9007199254740993');
  });

  it('converte BigInt dentro de objeto para string', () => {
    const result = sanitizeResponse({ id: BigInt(123), name: 'test' });
    expect(result).toEqual({ id: '123', name: 'test' });
  });

  it('converte BigInt em array para string', () => {
    const result = sanitizeResponse([BigInt(1), BigInt(2), BigInt(3)]);
    expect(result).toEqual(['1', '2', '3']);
  });

  it('converte Decimal para número', () => {
    const decimal = new Decimal('99.99');
    const result = sanitizeResponse(decimal);
    expect(typeof result).toBe('number');
    expect(result).toBeCloseTo(99.99);
  });

  it('converte Decimal dentro de objeto para número', () => {
    const result = sanitizeResponse({ price: new Decimal('1500.50'), label: 'lot' });
    expect(result).toEqual({ price: 1500.5, label: 'lot' });
  });

  it('converte Date para string ISO', () => {
    const date = new Date('2026-01-01T00:00:00.000Z');
    const result = sanitizeResponse(date);
    expect(result).toBe('2026-01-01T00:00:00.000Z');
  });

  it('converte Date dentro de objeto para string ISO', () => {
    const date = new Date('2026-01-01T00:00:00.000Z');
    const result = sanitizeResponse({ createdAt: date, name: 'test' });
    expect(result).toEqual({ createdAt: '2026-01-01T00:00:00.000Z', name: 'test' });
  });

  it('preserva null e undefined', () => {
    expect(sanitizeResponse(null)).toBeNull();
    expect(sanitizeResponse(undefined)).toBeUndefined();
  });

  it('preserva strings e números', () => {
    expect(sanitizeResponse('hello')).toBe('hello');
    expect(sanitizeResponse(42)).toBe(42);
    expect(sanitizeResponse(true)).toBe(true);
  });

  it('processa objetos aninhados com múltiplos tipos', () => {
    const input = {
      id: BigInt(999),
      amount: new Decimal('250.75'),
      createdAt: new Date('2026-03-10T00:00:00.000Z'),
      name: 'test-lot',
      count: 5,
    };
    const result = sanitizeResponse(input);
    expect(result).toEqual({
      id: '999',
      amount: 250.75,
      createdAt: '2026-03-10T00:00:00.000Z',
      name: 'test-lot',
      count: 5,
    });
  });

  it('processa arrays de objetos aninhados', () => {
    const input = [
      { id: BigInt(1), amount: new Decimal('100') },
      { id: BigInt(2), amount: new Decimal('200') },
    ];
    const result = sanitizeResponse(input);
    expect(result).toEqual([
      { id: '1', amount: 100 },
      { id: '2', amount: 200 },
    ]);
  });
});

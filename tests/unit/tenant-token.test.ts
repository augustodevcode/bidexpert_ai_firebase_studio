/**
 * @fileoverview Testes unitários para normalização de tokens de tenant.
 * @vitest-environment node
 */

import { describe, expect, it } from 'vitest';
import { normalizeTenantToken } from '../../src/lib/tenant-token';

describe('normalizeTenantToken', () => {
  it('retorna null para valores vazios', () => {
    expect(normalizeTenantToken(undefined)).toBeNull();
    expect(normalizeTenantToken(null)).toBeNull();
    expect(normalizeTenantToken('')).toBeNull();
    expect(normalizeTenantToken('   ')).toBeNull();
  });

  it('remove caracteres de controle, trim e normaliza para lowercase por padrão', () => {
    expect(normalizeTenantToken('  Demo\n')).toBe('demo');
    expect(normalizeTenantToken('\u0000Tenant-01\u0007')).toBe('tenant-01');
  });

  it('preserva casing quando lowercase=false', () => {
    expect(normalizeTenantToken('  TenantABC\n', { lowercase: false })).toBe('TenantABC');
  });
});
/**
 * @fileoverview Testes unitários para sanitização de identificadores de tenant.
 * @vitest-environment node
 */

import { describe, expect, it } from 'vitest';
import { normalizeTenantToken } from '@/lib/tenant-token';

describe('normalizeTenantToken', () => {
  it('remove quebras de linha e normaliza para lowercase por padrão', () => {
    expect(normalizeTenantToken('demo\r\n')).toBe('demo');
  });

  it('preserva casing quando solicitado', () => {
    expect(normalizeTenantToken('DemoTenant\n', { lowercase: false })).toBe('DemoTenant');
  });

  it('retorna null para entradas vazias apos sanitizacao', () => {
    expect(normalizeTenantToken('\r\n\t')).toBeNull();
  });
});
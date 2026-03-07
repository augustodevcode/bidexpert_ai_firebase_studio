/**
 * @fileoverview Testes unitários para fallback de schema drift em preview/dev.
 * @vitest-environment node
 */

import { afterEach, describe, expect, it } from 'vitest';
import { isMissingColumnError, shouldAllowSchemaFallback } from '@/lib/db-resilience';

describe('schema drift fallback', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalVercelEnv = process.env.VERCEL_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalVercelEnv === undefined) {
      delete process.env.VERCEL_ENV;
      return;
    }

    process.env.VERCEL_ENV = originalVercelEnv;
  });

  it('detecta P2022 para a coluna featureFlags', () => {
    const error = new Error('P2022: The column `PlatformSettings.featureFlags` does not exist in the current database.');
    expect(isMissingColumnError(error, 'PlatformSettings.featureFlags')).toBe(true);
  });

  it('permite fallback de schema em preview', () => {
    process.env.NODE_ENV = 'production';
    process.env.VERCEL_ENV = 'preview';

    const error = new Error('P2022: The column `PlatformSettings.featureFlags` does not exist in the current database.');
    expect(shouldAllowSchemaFallback(error)).toBe(true);
  });

  it('bloqueia fallback de schema em producao real', () => {
    process.env.NODE_ENV = 'production';
    process.env.VERCEL_ENV = 'production';

    const error = new Error('P2022: The column `PlatformSettings.featureFlags` does not exist in the current database.');
    expect(shouldAllowSchemaFallback(error)).toBe(false);
  });
});
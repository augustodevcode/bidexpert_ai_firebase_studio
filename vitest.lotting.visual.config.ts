/**
 * @fileoverview Configuração dedicada para teste visual da aba de loteamento.
 * Isola cache do Vite para evitar lock de arquivo no Windows.
 */
import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vitest.config';

export default mergeConfig(
  baseConfig,
  defineConfig({
    cacheDir: '.vitest-cache-auction-lotting',
    test: {
      include: ['tests/ui-e2e/auction-lotting-readiness.visual.spec.tsx'],
    },
  })
);

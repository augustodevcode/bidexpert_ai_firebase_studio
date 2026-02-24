/**
 * @fileoverview Configuração exclusiva para testes unitários (sem browser provider).
 */
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'react-dom/client': path.resolve(__dirname, 'tests/setup/react-dom-client-shim.ts')
    }
  },
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    include: [
      'tests/unit/**/*.{test,spec}.{ts,mts,cts}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.tsx',
      '**/tests/unit/components/**',
      '**/tests/unit/log-drain.test.ts',
      '**/tests/unit/map-search-cache.spec.ts',
      '**/tests/unit/seed-min-50.spec.ts',
      '**/tests/e2e/**',
      '**/tests/visual/**',
      '**/tests/ui-e2e/**',
      '**/tests/ui/**',
      '**/analisar/**'
    ],
    reporters: ['default'],
    testTimeout: 30000,
    setupFiles: ['./vitest.setup.ts'],
  }
})
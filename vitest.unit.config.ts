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
      'tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'scripts/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
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
/**
 * @fileoverview Configuração do Vitest com provider Playwright para testes visuais e E2E.
 */
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import * as customCommands from './tests/visual/commands'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'react-dom/client': path.resolve(__dirname, 'tests/setup/react-dom-client-shim.ts'),
      'server-only': path.resolve(__dirname, 'tests/setup/server-only-mock.ts'),
    }
  },
  plugins: [
    tsconfigPaths(),
    react()
  ],
  optimizeDeps: {
    noDiscovery: true,
    include: []
  },
  test: {
    environment: 'jsdom',
    environmentMatchGlobs: [
      ['tests/unit/data-reconciliation.test.ts', 'node'],
      ['tests/unit/auction.service.spec.ts', 'node'],
      ['tests/unit/bid.service.spec.ts', 'node'],
      ['tests/unit/bidder.service.spec.ts', 'node'],
      ['tests/unit/category.repository.spec.ts', 'node'],
      ['tests/unit/log-drain.test.ts', 'node'],
      ['tests/unit/lot-service-images-mapping.spec.ts', 'node'],
      ['tests/unit/map-search-logic.spec.ts', 'node'],
      ['tests/unit/map-utils.spec.ts', 'node'],
      ['tests/unit/tenant-id-from-request.spec.ts', 'node'],
      ['tests/unit/ui-helpers.test.ts', 'node'],
      ['tests/unit/audit/**', 'node'],
      ['tests/unit/seed-min-50.spec.ts', 'node'],
    ],
    globals: true,
    include: [
      'tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'scripts/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/visual/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/ui-e2e/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/tests/e2e/**',
      '**/tests/itsm/**',
      '**/tests/ui/**',
      '**/analisar/**',
      // Exclude browser-mode only tests from regular test runs
      'tests/unit/components/closing-soon-carousel.spec.tsx',
      // Exclude database integration tests that require a real database
      'tests/unit/seed-min-50.spec.ts',
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/'
      ]
    },
    reporters: ['default'],
    testTimeout: 30000,
    setupFiles: ['./vitest.setup.ts'],
    env: {
      SESSION_SECRET: 'test-session-secret-key-at-least-32-characters-long',
      NEXTAUTH_SECRET: 'test-nextauth-secret-key-at-least-32-chars!',
      AUTH_SECRET: 'test-auth-secret-key-at-least-32-characters-long!',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      NODE_ENV: 'test',
    },
    browser: {
      enabled: true,
      headless: false,
      provider: playwright(),
      instances: [
        {
          browser: 'chromium',
          viewport: { width: 1280, height: 720 }
        }
      ],
      commands: customCommands,
      expect: {
        toMatchScreenshot: {
          comparatorName: 'pixelmatch',
          comparatorOptions: {
            threshold: 0.2,
            allowedMismatchedPixelRatio: 0.01,
          },
        },
      },
    },
  }
})

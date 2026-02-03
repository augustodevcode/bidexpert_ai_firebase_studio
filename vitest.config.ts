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
      'react-dom/client': path.resolve(__dirname, 'tests/setup/react-dom-client-shim.ts')
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
    environment: 'node',
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
      '**/analisar/**'
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

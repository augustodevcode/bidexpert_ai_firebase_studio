/**
 * @file Playwright config para media library tests
 * 
 * Estratégia: Não usar global-setup. Em vez disso:
 * 1. Carregar cookies/session pré-salvos de .auth/user.json
 * 2. Reutilizar session em todos os testes
 * 3. Se .auth/user.json não existir, criar via login script
 */

import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://demo.localhost:9005';
const DEBUG = process.env.DEBUG_PLAYWRIGHT === '1';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/media-library.simple.spec.ts',
  
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 1,
  
  reporter: [
    ['html', { outputFolder: 'test-results/media-simple', open: 'never' }],
    ['json', { outputFile: 'test-results/media-simple/results.json' }],
    ['list'],
  ],

  use: {
    baseURL: BASE_URL,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    
    // ✅ Não usar global-setup
    // ✅ Ao invés disso, carregar cookies pré-salvos
    storageState: path.join(__dirname, 'tests/e2e/.auth/user.json'),
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: !DEBUG, // headless: false se DEBUG=1
        launchArgs: [
          '--disable-dev-shm-usage', // Evita problemas de shared memory em Docker
          '--no-sandbox',              // Evita problemas de permissão
        ],
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});

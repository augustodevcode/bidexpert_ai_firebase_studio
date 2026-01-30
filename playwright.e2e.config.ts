/**
 * @fileoverview Configuração do Playwright para testes E2E de validação de seed.
 * Usa localhost:9005/app/demo para resolver o tenant demo via path-based routing.
 */
import { defineConfig, devices } from '@playwright/test';

const BASE_URL = 'http://localhost:9005';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000, // 1 minuto por teste
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
    headless: false, // Navegador visível para acompanhamento
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Não inicia webServer pois assumimos servidor já rodando em :9005
});

/**
 * @fileoverview Configuração do Playwright para testes E2E de validação de seed.
 * Usa demo.localhost:9005 para resolver o tenant demo via subdomain.
 * O globalSetup pré-aquece as páginas e salva o estado de autenticação.
 */
import { defineConfig, devices } from '@playwright/test';

const BASE_URL = 'http://demo.localhost:9005';

// Credenciais do seed (prisma/seed.ts)
process.env.ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@bidexpert.com.br';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'senha@123';

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  // 3 minutos por teste — suficiente para compilação lazy do Next.js
  timeout: 3 * 60_000,
  expect: { timeout: 15_000 },
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
    actionTimeout: 15_000,
    // 3 min — compilação cold pode demorar >60s
    navigationTimeout: 3 * 60_000,
    headless: false, // Navegador visível para acompanhamento
    // Restaura sessão admin persistida pelo globalSetup
    storageState: './tests/e2e/.auth/admin.json',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev:9005',
    port: 9005,
    reuseExistingServer: true,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 3 * 60 * 1000, // 3 minutes to start
  },
});

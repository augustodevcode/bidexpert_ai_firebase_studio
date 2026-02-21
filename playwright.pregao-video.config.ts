/**
 * playwright.pregao-video.config.ts
 * Configuração Playwright dedicada para captura de vídeo do Pregão (leilão em tempo real).
 *
 * Modo: headful com gravação de vídeo sempre ativa.
 * Objetivo: produzir evidência visual (vídeo) da disputa de lances entre robôs.
 *
 * Uso:
 *   npx playwright test tests/e2e/pregao-disputas-video.spec.ts \
 *     --config=playwright.pregao-video.config.ts
 *
 * Artefatos gerados em: test-results/pregao-video/
 */

import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.PREGAO_BASE_URL || 'http://demo.localhost:9005';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/pregao-disputas-video.spec.ts',

  // Timeout generoso: 10 minutos para acomodar o pregão de 5 min + setup
  timeout: 10 * 60 * 1000,
  expect: { timeout: 30_000 },

  // Serial: todos os passos rodam em sequência para vídeo coerente
  fullyParallel: false,
  retries: 0,
  workers: 1,

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'test-results/pregao-video/report' }],
    ['json', { outputFile: 'test-results/pregao-video/results.json' }],
  ],

  use: {
    baseURL: BASE_URL,

    // ── Gravação de vídeo SEMPRE ativa ──────────────────────────────────────
    video: 'on',
    videoSize: { width: 1280, height: 720 },

    // Screenshots em cada passo
    screenshot: 'on',

    // Trace completo para debugging pós-test
    trace: 'on',

    // Timeouts
    actionTimeout: 30_000,
    navigationTimeout: 60_000,

    // Viewport grande para o monitor do pregão ficar bem visível no vídeo
    viewport: { width: 1280, height: 720 },

    // Ignorar erros HTTPS do servidor local
    ignoreHTTPSErrors: true,

    // Headless false para uso local; em CI pode ser sobrescrito via env
    headless: process.env.CI === 'true' || process.env.HEADLESS === 'true',
  },

  outputDir: 'test-results/pregao-video/artifacts',

  projects: [
    {
      name: 'pregao-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
});

// tests/playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './ui',
  use: {
    baseURL: 'http://localhost:9002',
  },
  webServer: {
    command: 'npm run dev',
    port: 9002,
  },
});

import { defineConfig, devices } from '@playwright/test';

// Configuração específica para validação na porta 9005 com tenant demo
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: 'http://demo.localhost:9005',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    launchOptions: {
        args: ["--host-resolver-rules=MAP demo.localhost 127.0.0.1"],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev:9005',
    url: 'http://127.0.0.1:9005/favicon.ico', // Check local IP, but test will use demo.localhost
    reuseExistingServer: true,
    timeout: 120000, // 2 minutes to start
    stdout: 'pipe',
    stderr: 'pipe',
  },
});

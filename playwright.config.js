import { defineConfig } from '@playwright/test';

export default defineConfig({
  outputDir: 'tests/test-results', // Define onde os resultados (como traces) são salvos
  reporter: [
    ['html', { outputFolder: 'tests/playwright-report' }], // Relatório HTML na pasta tests
    ['json', { outputFile: 'tests/test-results.json' }], // Relatório JSON na pasta tests
  ],
});

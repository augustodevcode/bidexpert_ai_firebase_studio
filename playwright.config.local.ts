import { defineConfig, devices } from '@playwright/test';

const shouldStartWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER !== '1';
const isCI = process.env.CI === '1' || process.env.CI === 'true';

const baseURL = process.env.BASE_URL || 'http://localhost:9002';

export default defineConfig({
	testDir: './tests',
	timeout: 120_000, // 2 minutos por teste
	expect: { timeout: 15_000 },
	fullyParallel: false,
	retries: isCI ? 1 : 0, // 1 retry em CI para reduzir flakiness
	workers: 1,
	globalSetup: './tests/e2e/global-setup.ts',
	reporter: [ 
		['list'], 
		['./playwright-custom-reporter.js', { outputFile: 'test-results/plaintext-report.txt' }], 
		['html', { open: 'never' }],
		['json', { outputFile: 'test-results/results.json' }]
	],
	use: {
		baseURL,
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
		actionTimeout: 15000,
		navigationTimeout: 30000,
	},
	projects: [
		{
			name: 'chromium',
			use: { 
				...devices['Desktop Chrome'],
				storageState: './tests/e2e/.auth/admin.json',
			},
		},
	],
	// P0 SKILL: Prebuild E2E Orchestrator
	// Usa "npm run start:9002" (produção) em vez de "npm run dev" (lazy compilation)
	// para eliminar timeouts causados por compilação on-demand
	webServer: shouldStartWebServer ? {
		command: 'npm run start:9002',
		url: baseURL,
		reuseExistingServer: !isCI, // CI: sempre sobe novo server; local: reaproveita se existir
		timeout: 60_000, // Reduzido: server em produção sobe rápido (build já feito)
		env: {
			BASE_URL: baseURL,
			PORT: '9002',
		}
	} : undefined,
});


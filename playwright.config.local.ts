import { defineConfig, devices } from '@playwright/test';

const shouldStartWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER !== '1';

const baseURL = process.env.BASE_URL || 'http://localhost:9005';

export default defineConfig({
	testDir: './tests/e2e',
	timeout: 120_000, // 2 minutos por teste devido à compilação do Next.js
	expect: { timeout: 15_000 },
	fullyParallel: false,
	retries: 0,
	workers: 1,
	globalSetup: './tests/e2e/global-setup.ts',
	reporter: [ ['list'], ['./playwright-custom-reporter.js', { outputFile: 'test-results/plaintext-report.txt' }], ['html', { open: 'never' }] ],
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
	webServer: shouldStartWebServer ? {
		command: 'npm run dev:9005',
		url: baseURL,
		reuseExistingServer: true,
		timeout: 240000, // Increased timeout for build
		env: {
			BASE_URL: baseURL,
		}
	} : undefined,
});


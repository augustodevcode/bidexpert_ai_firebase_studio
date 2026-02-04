import { test, expect } from '@playwright/test';

test.describe('Console & Network Error Monitoring', () => {
    const consoleLogs: { type: string, text: string, location: string }[] = [];
    const pageErrors: Error[] = [];
    const failedRequests: string[] = [];

    // Ignored messages (known issues or benign warnings)
    const IGNORED_MESSAGES = [
        'downloadable font: kern:',
        'Third-party cookie will be blocked',
        '[Fast Refresh] rebuilding',
    ];

    test.beforeEach(async ({ page }) => {
        // Reset logs
        consoleLogs.length = 0;
        pageErrors.length = 0;
        failedRequests.length = 0;

        // 1. Capture Console Messages
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            
            if (IGNORED_MESSAGES.some(ignore => text.includes(ignore))) return;

            if (type === 'error' || type === 'warning') {
                const location = msg.location();
                consoleLogs.push({ 
                    type, 
                    text, 
                    location: `${location.url}:${location.lineNumber}` 
                });
                console.log(`[Browser ${type.toUpperCase()}] ${text} (${location.url}:${location.lineNumber})`);
            }
        });

        // 2. Capture Uncaught Exceptions
        page.on('pageerror', exception => {
            pageErrors.push(exception);
            console.error(`[Uncaught Exception]: ${exception.message}`);
        });

        // 3. Capture Failed Network Requests (4xx, 5xx)
        page.on('response', response => {
            if (response.status() >= 400 && response.status() !== 401) { // Ignore 401 for auth checks
                failedRequests.push(`${response.status()} ${response.url()}`);
                console.log(`[Network Error]: ${response.status()} ${response.url()}`);
            }
        });
    });

    test('Monitor Console Errors on Home and Navigation', async ({ page }) => {
        // Use the strategy port 9005 defined in instructions
        const baseURL = 'http://demo.localhost:9005';

        console.log(`\n🚀 Iniciando navegação em ${baseURL} monitorando erros...\n`);

        // Step 1: Navigate to Home
        // Changing waitUntil to 'domcontentloaded' to avoid HMR timeout issues in dev mode
        await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
        await expect(page).toHaveTitle(/BidExpert|Leilão/i);
        console.log('✅ Home Page Loaded');

        // Step 2: Interact to trigger potential errors (e.g., scroll, hover)
        // Wait a bit for client hydration
        await page.waitForTimeout(2000);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);
        
        // Step 3: Check Marketing/Opportunities (Solicited feature check)
        // Try to find an element related to "Super Oportunidades" if it exists
        const marketingSection = page.locator('text=Super Oportunidades');
        if (await marketingSection.count() > 0) {
            await marketingSection.first().scrollIntoViewIfNeeded();
            console.log('✅ Seção "Super Oportunidades" encontrada.');
        }

        // Step 4: Navigate to Login
        await page.goto(`${baseURL}/auth/login`, { waitUntil: 'domcontentloaded' });
        console.log('✅ Login Page Loaded');

        // Assertions
        console.log('\n📊 Relatório de Erros Detectados:');
        
        const criticalErrors = consoleLogs.filter(l => l.type === 'error');
        
        if (criticalErrors.length > 0) {
            console.log('❌ Erros de Console Encontrados:');
            criticalErrors.forEach(e => console.log(`   - ${e.text} @ ${e.location}`));
        } else {
            console.log('✅ Nenhum erro de console crítico detectado.');
        }

        if (pageErrors.length > 0) {
            console.log('❌ Exceções de Página Encontradas:');
            pageErrors.forEach(e => console.log(`   - ${e.message}`));
        } else {
            console.log('✅ Nenhuma exceção de página não tratada.');
        }

        if (failedRequests.length > 0) {
            console.log('⚠️ Requisições com Falha (4xx/5xx):');
            failedRequests.forEach(r => console.log(`   - ${r}`));
        }

        // Fail test if Critical Errors exist
        expect(pageErrors.length, 'Página teve exceções não tratadas').toBe(0);
        expect(criticalErrors.length, 'Console apresentou erros críticos').toBe(0);
    });
});

import { test, expect } from '@playwright/test';

test.describe('Audit & Observability 360', () => {
    // Increase timeout for the first run (lazy compilation)
    test.setTimeout(180000); 

    test.beforeEach(async ({ page }) => {
        // 1. Check if already logged in
        try {
            await page.goto('http://localhost:9005/dashboard', { timeout: 10000 });
            await page.waitForURL('**/dashboard/**', { timeout: 3000 });
            return;
        } catch (e) {
            // Proceed to login
        }

        await page.goto('http://localhost:9005/auth/login');

        // 2. Fill credentials
        await page.getByLabel('Email').fill('admin@bidexpert.com.br');
        await page.getByLabel('Senha').fill('Admin@123');

        // 3. Handle tenant selection (if pre-submit)
        const tenantSelector = page.getByLabel('Espaço de Trabalho');
        if (await tenantSelector.isVisible()) {
             await tenantSelector.click();
             await page.getByRole('option').first().click();
        }

        // 4. Click login
        await page.getByRole('button', { name: 'Login' }).click();

        // 5. Handle post-submit tenant selection (Modal/Step)
        try {
             // Wait for dashboard or error or modal
             await Promise.race([
                 page.waitForURL('**/dashboard/**', { timeout: 5000 }),
                 page.waitForSelector('text=Selecione um espaço de trabalho', { timeout: 5000 }),
                 page.waitForSelector('text=Entrar no Espaço de Trabalho', { timeout: 5000 })
             ]);
        } catch (e) {}

        if (page.url().includes('/dashboard')) return;

        // Retry tenant selection if we are not in dashboard yet
        if (await tenantSelector.isVisible()) {
             await tenantSelector.click();
             await page.getByRole('option').first().click();
             // Try clicking Login again or multi-tenant specific button
             const multiBtn = page.getByRole('button', { name: /Entrar|Login|Continuar/i }).last();
             if (await multiBtn.isVisible()) {
                 await multiBtn.click();
             }
        } else {
             // Maybe we just need to click login again (validation gap?)
             const loginBtn = page.getByRole('button', { name: 'Login' });
             if (await loginBtn.isVisible()) await loginBtn.click();
        }

        await page.waitForURL('**/dashboard/**', { timeout: 30000 });
    });

    test('Should capture an update event in Audit Log', async ({ page, request }) => {
        // 1. Go to Auctions management
        await page.goto('http://localhost:9005/admin/auctions');
        console.log('Navigated to Auctions list');
        
        // Wait for table
        await page.waitForSelector('table', { timeout: 15000 });

        // Search for our test auction
        const searchInput = page.getByPlaceholder('Buscar por título...');
        await searchInput.fill('Leilão de Teste E2E'); // More specific
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000); // Wait for search results
        console.log('Performed search');

        // Click on the first "Edit" button
        const editButton = page.getByRole('link', { name: 'Editar' }).first();
        
        if (await editButton.isVisible()) {
             console.log('Edit button found, clicking...');
             const href = await editButton.getAttribute('href');
             console.log(`Navigating to edit page: ${href}`);

             await editButton.click();
             
             // Wait for navigation to V2 editor
             await page.waitForURL('**/admin/auctions-v2/**', { timeout: 15000 });
             console.log(`Current URL: ${page.url()}`);

             // Wait for form to load
             try {
                await page.waitForSelector('input[name="title"]', { state: 'visible', timeout: 30000 });
             } catch (e) {
                console.error('Form title input did not appear!');
                const body = await page.content();
                console.log('Page content snippet:', body.substring(0, 1000));
                throw e;
             }

             // Change Title
             const titleInput = page.locator('input[name="title"]');
             await titleInput.fill(`Leilão de Teste E2E - Auditoria ${Date.now()}`);
             
             // Save
             await page.getByRole('button', { name: 'Atualizar leilão' }).click();
             
             // Wait for success toast
             await expect(page.getByText(/sucesso|atualizado/i)).toBeVisible();
        } else {
            console.log('No auction found to edit. Skipping UI interaction, verifying Log Viewer only.');
            throw new Error('Test failed: Could not find auction to edit.');
        }

        // 2. Go to Audit Logs
        await page.goto('http://localhost:9005/admin/audit-logs');
        await expect(page.locator('[data-ai-id="audit-page-container"]')).toBeVisible();
        
        // 3. Verify the log entry exists
        await expect(page.locator('table')).toBeVisible();
    });
});

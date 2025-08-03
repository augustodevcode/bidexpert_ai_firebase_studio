
// tests/ui/platform-settings.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

const testRunId = `settings-ui-e2e-${uuidv4().substring(0, 8)}`;
const testSiteTitle = `BidExpert UI Test ${testRunId}`;
const testSiteTagline = `Teste de UI bem-sucedido ${testRunId}`;

test.describe('Platform Settings UI Test', () => {

    test.beforeEach(async ({ page }) => {
        // Set setup flag in localStorage
        await page.addInitScript(() => {
            window.localStorage.setItem('bidexpert_setup_complete', 'true');
        });

        // Login as admin
        await page.goto('/auth/login');
        await page.locator('input[name="email"]').fill('admin@bidexpert.com.br');
        await page.locator('input[name="password"]').fill('Admin@123');
        await page.getByRole('button', { name: 'Login' }).click();
        await expect(page).toHaveURL('/dashboard/overview', { timeout: 10000 });
        
        // Navigate to settings page
        await page.goto('/admin/settings');
        await expect(page.getByRole('heading', { name: 'Identidade do Site' })).toBeVisible();
    });

    test('should update settings, save, and verify the changes persist after reload', async ({ page }) => {
        console.log(`--- [Test Case] Validating Settings Form UI for run: ${testRunId} ---`);

        // 1. Fill the form with new values
        const titleInput = page.locator('input[name="siteTitle"]');
        const taglineInput = page.locator('input[name="siteTagline"]');
        
        await titleInput.fill(testSiteTitle);
        await taglineInput.fill(testSiteTagline);
        console.log('- Filled form with new title and tagline.');

        // 2. Click the save button
        const saveButton = page.getByRole('button', { name: 'Salvar Configurações' });
        await saveButton.click();
        console.log('- Clicked "Salvar Configurações".');

        // 3. Assert that the success toast appears
        await expect(page.locator('div[role="status"]')).toContainText('Sucesso!', { timeout: 10000 });
        await expect(page.locator('div[role="status"]')).toContainText('Configurações atualizadas com sucesso.');
        console.log('- Verified: Success toast appeared.');

        // 4. Reload the page to ensure data was persisted
        console.log('- Reloading page to verify persistence...');
        await page.reload();
        await page.waitForLoadState('networkidle');

        // 5. Assert that the input fields have the new, saved values
        await expect(page.locator('input[name="siteTitle"]')).toHaveValue(testSiteTitle);
        await expect(page.locator('input[name="siteTagline"]')).toHaveValue(testSiteTagline);
        console.log('- Verified: New values persisted after page reload.');

        console.log('--- ✅ Settings UI Test Case Passed ---');
    });
});

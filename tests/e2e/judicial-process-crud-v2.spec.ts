
import { test, expect } from '@playwright/test';

test.use({
    baseURL: 'http://localhost:9005',
});

test.describe('Judicial Process CRUD V2 Check', () => {

    test('should display Linked Auctions column and Linked Entities grids in Edit Form', async ({ page }) => {
        test.setTimeout(60000); // Increase timeout
        
        // 1. Navigate to Judicial Processes list
        console.log('Navigating to Judicial Processes list...');
        await page.goto('/admin/judicial-processes');
        await page.waitForLoadState('networkidle');

        // 2. Verify "Leilões Vinculados" column exists
        console.log('Verifying "Leilões Vinculados" column...');
        await expect(page.getByText('Leilões Vinculados', { exact: true })).toBeVisible({ timeout: 10000 });
        
        // 3. Click on the first process to edit
        console.log('Clicking on first process...');
        const firstRow = page.locator('tbody tr').first();
        await expect(firstRow).toBeVisible();
        
        const firstProcessNumber = await firstRow.locator('td').nth(1).textContent(); 
        console.log(`Editing process: ${firstProcessNumber}`);
        
        // Find edit button (Pencil icon)
        const editBtn = firstRow.locator('button:has(svg.lucide-pencil)');
        if (await editBtn.isVisible()) {
            await editBtn.click();
        } else {
             await firstRow.locator('button.font-medium').click();
        }

        // 4. Verify Form is open
        console.log('Waiting for form...');
        await expect(page.locator('form')).toBeVisible();
        
        // 5. Scroll to bottom
        console.log('Checking for new grids...');
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000); // Wait for scroll/render
        
        // Check for "Lotes Vinculados"
        await expect(page.locator('[data-ai-id="process-linked-lots"]')).toBeVisible();
        await expect(page.getByText('Lotes Vinculados')).toBeVisible();

        // Check for "Ativos Vinculados"
        await expect(page.locator('[data-ai-id="process-linked-assets"]')).toBeVisible();
        await expect(page.getByText('Ativos Vinculados')).toBeVisible();

        // Check for "Leilões Vinculados"
        await expect(page.locator('[data-ai-id="process-linked-auctions"]')).toBeVisible();
        await expect(page.getByText('Leilões Vinculados')).last().toBeVisible();

        console.log('✅ Grid validation complete.');
    });
});

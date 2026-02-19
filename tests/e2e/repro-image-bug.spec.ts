import { test, expect } from '@playwright/test';

test.describe('Image Visibility Repro', () => {
    // test.use({ storageState: 'playwright/.auth/user.json' }); // Auth file not found, running as public user

    test('should show images on details page', async ({ page }) => {
        // 1. Go to home page
        await page.goto('/');
        
        // 2. Find an auction card or lot card with an image
        // We look for any article that likely represents a card and has an image
        const cardWithImage = page.locator('article img, div[class*="card"] img').first();
        
        // Wait for page to load potentially
        await page.waitForLoadState('networkidle');

        if (await cardWithImage.isVisible()) {
             const listImgSrc = await cardWithImage.getAttribute('src');
             console.log('List image src:', listImgSrc);
             
             // Find the parent link to click
             const cardLink = cardWithImage.locator('xpath=ancestor::a | xpath=ancestor::div[@onclick] | xpath=ancestor::article//a').first();
             
             if (await cardLink.isVisible()) {
                 await cardLink.click();
                 await page.waitForLoadState('networkidle');
                 
                 console.log('Navigated to details page:', page.url());

                 // Check details image (adjust selector based on inspection)
                 // We look for the main hero image or gallery main image
                 const heroImage = page.locator('div[data-ai-id="auction-hero-image"] img, .hero-image img, [data-ai-id="lot-gallery-main"] img').first();
                 
                 if (await heroImage.isVisible()) {
                     const detailImgSrc = await heroImage.getAttribute('src');
                     console.log('Detail image src:', detailImgSrc);
                     expect(detailImgSrc).toBeTruthy();
                     expect(detailImgSrc).not.toContain('placeholder');
                     expect(detailImgSrc).not.toBe('');
                 } else {
                     console.log('Detail image NOT visible');
                     // Fail the test if image is not visible
                     expect(await heroImage.isVisible()).toBe(true);
                 }
             } else {
                 console.log('Could not find link to navigate to details');
             }
        } else {
            console.log('No cards with images found on home page');
        }
    });
});

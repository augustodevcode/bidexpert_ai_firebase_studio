import { test, expect } from '@playwright/test';

const TEST_AUCTION_ID = 'AUC-f4f6c355-cb92-4a5e-9aa0-d1f38e9928d6';

test.describe('Lot Detail V2', () => {
  test('should display V2 components: Carousel, Documents, Map', async ({ page, baseURL }) => {
    // 1. Go directly to the lot detail page
    const baseUrl = baseURL || 'http://localhost:9002';
    const lotUrl = '/auctions/auction-1764169048835-001/lots/lot-1764169048835-001';
    await page.goto(`${baseUrl}${lotUrl}`, { waitUntil: 'networkidle' });

    // 2. Verify we are on the lot detail page
    await expect(page).toHaveURL(new RegExp(lotUrl));
    
    // Debug: Print page title
    console.log('Page Title:', await page.title());
    
    // Check for any H1
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    console.log('H1 Text:', await h1.textContent());

    // Debug: Print all text content
    console.log('Page Text Content:', await page.locator('body').textContent());

    // 3. Verify Carousel is present (it always renders, even with placeholder image)
    // Check for the carousel container or an image inside it
    const carousel = page.locator('.embla, [role="region"][aria-roledescription="carousel"], .carousel'); 
    // Or check for any image in the main display area
    const mainImageArea = page.locator('.aspect-video img');
    
    // Wait for either the carousel or an image to be visible
    await expect(mainImageArea.first()).toBeVisible();

    // 4. Verify Documents Section is present
    const documentsSection = page.getByText('Documentos do Lote');
    await expect(documentsSection).toBeVisible();

    // 6. Verify Map Section is present
    const mapSection = page.getByText('Localização do Lote');
    await expect(mapSection).toBeVisible();
  });
});

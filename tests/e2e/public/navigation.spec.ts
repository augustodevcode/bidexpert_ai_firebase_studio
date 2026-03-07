import { test, expect } from '@playwright/test';

test.describe('Public User Navigation', () => {

  test('should allow a guest to navigate from the homepage to a lot detail page', async ({ page }) => {
    // 1. Go to the homepage
    await page.goto('/');

    // 2. Verify homepage elements are visible
    // Wait for the main content to be loaded, the hero carousel is a good indicator.
    const heroCarousel = page.getByRole('region', { name: /hero carousel/i }); // Assuming an aria-label for the carousel section
    await expect(heroCarousel).toBeVisible({ timeout: 15000 });

    // 3. Find the "Lotes em Destaque" section and click on a lot
    const featuredLotsSection = page.getByRole('region', { name: /lotes em destaque/i });
    await expect(featuredLotsSection).toBeVisible();

    // Find the first available lot card link within the section
    const firstLotLink = featuredLotsSection.locator('a[href*="/lots/"]').first();
    await expect(firstLotLink).toBeVisible();

    // Get the title and href from the card to verify on the next page
    const lotTitleOnCard = await firstLotLink.locator('h3').innerText();
    const lotHref = await firstLotLink.getAttribute('href');
    expect(lotTitleOnCard).not.toBeNull();
    expect(lotHref).not.toBeNull();

    // 4. Click the lot link to navigate
    await firstLotLink.click();

    // 5. Verify navigation to the lot detail page
    await page.waitForURL(`**${lotHref}`);
    await expect(page).toHaveURL(lotHref!);

    // 6. Verify content on the lot detail page
    const pageTitle = page.getByRole('heading', { level: 1 });
    await expect(pageTitle).toBeVisible();

    // The heading on the detail page should match the title from the card
    await expect(pageTitle).toContainText(lotTitleOnCard);

    // Check for other key details to ensure the page is loaded correctly
    await expect(page.getByRole('tab', { name: 'Descrição' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Especificações' })).toBeVisible();
    await expect(page.getByText(/lance inicial/i)).toBeVisible();
  });

  test('should use the MegaMenu to navigate to a category page', async ({ page }) => {
    // 1. Go to the homepage
    await page.goto('/');

    // 2. Find and interact with the MegaMenu
    const categoriesMenuTrigger = page.getByRole('button', { name: 'Categorias de Oportunidades' });
    await expect(categoriesMenuTrigger).toBeVisible();
    await categoriesMenuTrigger.click(); // or hover(), depending on implementation

    // 3. Find a category link in the opened menu. Let's assume 'Veículos' exists from sample data.
    const vehicleCategoryLink = page.getByRole('link', { name: 'Veículos', exact: true });
    await expect(vehicleCategoryLink).toBeVisible();
    const categoryHref = await vehicleCategoryLink.getAttribute('href');
    expect(categoryHref).not.toBeNull();

    // 4. Click the category link
    await vehicleCategoryLink.click();

    // 5. Verify navigation to the category/search page
    await page.waitForURL(`**${categoryHref}`);
    await expect(page).toHaveURL(categoryHref!);

    // 6. Verify the page indicates the correct category is being viewed
    const pageTitle = page.getByRole('heading', { level: 1 });
    await expect(pageTitle).toBeVisible();
    await expect(pageTitle).toContainText(/Veículos/i); // Or check for a breadcrumb, etc.

    // Check that a list of results is present
    await expect(page.getByText(/resultados encontrados/i)).toBeVisible();
  });
});

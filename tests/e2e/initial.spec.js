const { test, expect } = require('@playwright/test');

test('has title', async ({ page }) => {
  // Since we are not running a web server in the CI yet for the static files,
  // we will navigate to the local file directly.
  // This will need to be updated once we have a proper dev server.
  await page.goto('file://' + process.cwd() + '/public/index.html');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/BidExpert AI/);
});

test('get started link', async ({ page }) => {
  await page.goto('file://' + process.cwd() + '/public/index.html');

  // Check that the main heading is visible and has the correct text.
  const heading = page.locator('h1');
  await expect(heading).toBeVisible();
  await expect(heading).toHaveText('Bem-vindo ao BidExpert AI');
});

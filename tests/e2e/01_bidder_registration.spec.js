const { test, expect } = require('@playwright/test');

const testUser = {
  name: 'Test User',
  email: `testuser_${Date.now()}@example.com`,
  password: 'Password123!',
};

test.describe('Bidder Registration', () => {
  test('should allow a new user to register for an account', async ({ page }) => {
    // 1. Navigate to the homepage
    await page.goto('file://' + process.cwd() + '/public/index.html');

    // 2. Click the "Register" link
    await page.getByRole('link', { name: 'Register' }).click();
    await expect(page).toHaveURL(/.*\/register.html/);

    // 3. Wait for the page's JavaScript to be ready
    await page.waitForSelector('body[data-ready="true"]');

    // 4. Fill out the registration form
    await page.locator('#name').fill(testUser.name);
    await page.locator('#email').fill(testUser.email);
    await page.locator('#password').fill(testUser.password);

    // 4. Submit the form
    await page.getByRole('button', { name: 'Create Account' }).click();

    // 5. Verify that a success message is shown
    const messageArea = page.locator('#message-area');
    await expect(messageArea).toBeVisible();
    await expect(messageArea).toHaveText(/Registration successful/);
  });
});

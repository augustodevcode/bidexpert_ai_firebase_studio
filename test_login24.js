const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to login...');
  await page.goto('http://demo.localhost:9014/auth/login?redirect=/admin', { waitUntil: 'domcontentloaded' });
  
  await page.waitForTimeout(2000);
  
  await page.fill('input[name="email"]', 'admin@bidexpert.com.br');
  await page.fill('input[name="password"]', 'Admin@123');
  
  await page.locator('[data-ai-id="auth-login-submit-button"]').click();
  
  try {
    await page.waitForTimeout(5000); // give it time to submit and redirect
    const url = page.url();
    console.log('Current URL after submit:', url);
    
    // Wait for the stat card to appear
    await page.waitForSelector('text="Faturamento Total"', { timeout: 10000 });
    console.log('Faturamento Total is visible!');
    
  } catch (err) {
    console.error('Error during wait:', err);
  }

  await browser.close();
})();

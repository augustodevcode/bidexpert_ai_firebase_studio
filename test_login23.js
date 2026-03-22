const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('pageerror', error => {
    console.log('[PAGE ERROR]', error.message);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('[CONSOLE ERROR]', msg.text());
    }
  });

  console.log('Navigating to login...');
  await page.goto('http://demo.localhost:9014/auth/login?redirect=/admin', { waitUntil: 'domcontentloaded' });
  
  await page.waitForTimeout(2000);
  
  await page.fill('input[name="email"]', 'admin@bidexpert.com.br');
  await page.fill('input[name="password"]', 'Admin@123');
  
  await page.locator('[data-ai-id="auth-login-submit-button"]').click();
  
  try {
    await page.waitForTimeout(5000); // give it time to submit and crash
    
  } catch (err) {
    console.error('Error during wait:', err);
  }

  await browser.close();
})();

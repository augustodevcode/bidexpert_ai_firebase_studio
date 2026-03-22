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
    
    const bodyContent = await page.innerHTML('body');
    const hasLoader = bodyContent.includes('admin-loading-state') || bodyContent.includes('lucide-loader-2');
    const isError = bodyContent.includes('Application error: a client-side exception has occurred');
    console.log('Has Loader?', hasLoader);
    console.log('Is Error?', isError);
    
    // Dump a snippet of what rendered
    console.log('Body start:', bodyContent.substring(0, 300));
    console.log('Body end:', bodyContent.length > 500 ? bodyContent.substring(bodyContent.length - 300) : '');
    
  } catch (err) {
    console.error('Error during wait:', err);
  }

  await browser.close();
})();

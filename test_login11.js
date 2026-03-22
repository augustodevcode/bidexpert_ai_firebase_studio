const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  await page.goto('http://dev.localhost:9014/auth/login?redirect=/admin');
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="email"]', 'admin@bidexpert.com.br');
  await page.fill('input[name="password"]', 'Admin@123');
  
  console.log('Dispatching form submit event...');
  await page.evaluate(() => {
    const form = document.querySelector('form[data-ai-id="auth-login-form"]');
    if (form) {
      console.log('Form found, dispatching...');
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  });
  
  // Wait a moment for network and requests
  await page.waitForTimeout(1000);
  
  // Add another wait in case there's navigation
  await page.waitForURL('**/admin**', { timeout: 10000 }).catch(() => console.log('Did not navigate to /admin'));
  console.log('Current URL:', page.url());
  
  await browser.close();
})();

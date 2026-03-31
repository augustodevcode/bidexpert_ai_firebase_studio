const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('response', response => {
    if (response.url().includes('/admin') || response.url().includes('/auth') || response.url().includes('/dashboard')) {
        console.log('<<', response.status(), response.url());
    }
  });
  
  console.log('Navigating to login...');
  await page.goto('http://dev.localhost:9006/auth/login?redirect=/admin');
  
  console.log('Clicking login...');
  await page.fill('input[type="email"]', 'admin@bidexpert.com.br');
  await page.fill('input[type="password"]', 'Admin@123');
  await page.click('button[type="submit"]');
  
  console.log('Waiting for network idle...');
  setTimeout(() => { console.log('Timeout reached. Final URL:', page.url()); browser.close(); process.exit(0); }, 15000);
})();
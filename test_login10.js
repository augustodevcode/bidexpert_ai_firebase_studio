const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  await page.goto('http://dev.localhost:9014/auth/login?redirect=/admin');
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="email"]', 'admin@bidexpert.com.br');
  await page.fill('input[name="password"]', 'Admin@123');
  
  const btn = await page.locator('button[type="submit"]').first();
  console.log('Button disabled?', await btn.isDisabled());
  console.log('Button visible?', await btn.isVisible());
  
  await btn.click({ force: true });
  console.log('Clicked');
  
  await page.waitForTimeout(3000);
  await browser.close();
})();

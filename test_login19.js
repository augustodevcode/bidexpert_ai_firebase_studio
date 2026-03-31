const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));

  await page.goto('http://dev.localhost:9014/auth/login?redirect=/admin');
  await page.waitForLoadState('networkidle');

  await page.fill('input[name="email"]', 'admin@bidexpert.com.br');
  await page.fill('input[name="password"]', 'Admin@123');

  await page.locator('button[data-ai-id="auth-login-submit-button"]').click();

  await page.waitForTimeout(3000);

  const cookies = await context.cookies();
  console.log('Cookies after login:', cookies.map(c => c.name));

  await page.goto('http://dev.localhost:9014/admin/dashboard', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  console.log('Current URL after goto /admin:', page.url());

  const cookiesAfter = await context.cookies();
  console.log('Cookies after accessing /admin:', cookiesAfter.map(c => c.name));

  await browser.close();
})();

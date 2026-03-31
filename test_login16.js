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

  console.log('Submitting via React Hook Form approach...');
  await page.waitForTimeout(1000);
  await page.locator('button[type="submit"]').click();

  let ok = false;
  try {
    await page.waitForNavigation({ url: '**/admin*', timeout: 10000 });
    ok = true;
  } catch(e) { console.log('Navigation timeout'); }

  console.log('Current URL:', page.url());
  const cookies = await context.cookies();
  console.log('Cookies:', cookies.map(c => c.name));
  await browser.close();
})();

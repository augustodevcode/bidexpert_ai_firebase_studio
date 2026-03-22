const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) console.log('NAVIGATED:', frame.url());
  });

  await page.goto('http://dev.localhost:9014/auth/login?redirect=/admin', { waitUntil: 'networkidle' });

  await page.fill('input[name="email"]', 'admin@bidexpert.com.br');
  await page.fill('input[name="password"]', 'Admin@123');
  
  console.log('Clicking via playwright');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(5000);
  
  await browser.close();
})();

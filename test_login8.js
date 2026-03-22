const fs = require('fs');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  let allHeadersCaptured = [];

  page.on('response', async res => {
    if (res.url().includes('login') && res.request().method() === 'POST') {
      try {
        allHeadersCaptured.push(await res.allHeaders());
      } catch(e) {}
    }
  });

  await page.goto('http://dev.localhost:9014/auth/login?redirect=/admin', { waitUntil: 'domcontentloaded', timeout: 120000 });
  
  await new Promise(r => setTimeout(r, 2000));
  
  await page.fill('input[name="email"]', 'admin@bidexpert.com.br');
  await page.fill('input[name="password"]', 'Admin@123');
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 6000));
  fs.writeFileSync('headers_captured.json', JSON.stringify(allHeadersCaptured, null, 2));

  await browser.close();
})();

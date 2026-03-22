const { chromium } = require('playwright');
(async () => {
  console.log('starting browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  
  page.on('response', async res => {
    if (res.url().includes('login') && res.request().method() === 'POST') {
      try {
        console.log('--- POST LOGIN RESPONSE HEADERS ---');
        console.log(await res.allHeaders());
      } catch(e) {}
    }
  });

  console.log('navigating...');
  await page.goto('http://dev.localhost:9014/auth/login?redirect=/admin', { waitUntil: 'domcontentloaded', timeout: 120000 });
  console.log('navigating done!');
  
  await new Promise(r => setTimeout(r, 4000));
  
  await page.screenshot({ path: 'login7.png' });

  // login manually
  console.log('filling inputs');
  await page.fill('input[name="email"]', 'admin@bidexpert.com.br');
  await page.fill('input[name="password"]', 'Admin@123');
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 6000));
  
  console.log("COOKIES NOW:", await context.cookies());
  await page.screenshot({ path: 'login7_after.png' });

  await browser.close();
})();

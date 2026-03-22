const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  
  page.on('response', async res => {
    if (res.url().includes('login') && res.request().method() === 'POST') {
      try {
        const text = await res.text();
        console.log('--- POST LOGIN RESPONSE (' + res.status() + ') ---');
        console.log(text.substring(0, 500));
        console.log('------------------------------');
      } catch(e) {
        console.log('Error reading response body:', e.message);
      }
    }
  });

  await page.goto('http://dev.localhost:9006/auth/login?redirect=/admin');
  
  await page.fill('#email', 'admin@bidexpert.com.br');
  await page.fill('#password', 'Admin@123');
  await page.click('button[type=submit]');
  
  await new Promise(r => setTimeout(r, 6000));
  const cookies = await context.cookies();
  console.log("COOKIES:", cookies);

  await browser.close();
})();
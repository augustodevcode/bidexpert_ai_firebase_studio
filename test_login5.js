const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  
  page.on('response', async res => {
    if (res.url().includes('login') && res.request().method() === 'POST') {
      try {
        const headers = await res.headersArray();
        const setCookies = headers.filter(h => h.name.toLowerCase() === 'set-cookie');
        console.log('--- POST LOGIN HEADERS ---');
        console.log(JSON.stringify(setCookies, null, 2));
      } catch(e) {
        console.log('Error reading headers:', e.message);
      }
    }
  });

  await page.goto('http://dev.localhost:9006/auth/login?redirect=/admin');
  
  await page.fill('#email', 'admin@bidexpert.com.br');
  await page.fill('#password', 'Admin@123');
  await page.click('button[type=submit]');
  
  await new Promise(r => setTimeout(r, 6000));
  
  await browser.close();
})();
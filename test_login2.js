const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  
  await page.addInitScript(() => {
    const origFetch = window.fetch;
    window.fetch = async (...args) => {
      const resp = await origFetch(...args);
      const clone = resp.clone();
      clone.text().then(text => console.log('FETCH RES:', text.substring(0, 300)));
      return resp;
    };
  });
  
  await page.goto('http://dev.localhost:9006/auth/login?redirect=/admin');
  
  await page.fill('#email', 'admin@bidexpert.com.br');
  await page.fill('#password', 'Admin@123');
  await page.click('button[type=submit]');
  
  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
})();
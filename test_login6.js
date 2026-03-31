const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  
  page.on('response', async res => {
    if (res.url().includes('login') && res.request().method() === 'POST') {
      try {
        console.log('--- POST LOGIN HEADERS ---');
        console.log(await res.allHeaders());
      } catch(e) {}
    }
  });

  await page.goto('http://dev.localhost:9006/auth/login?redirect=/admin');
  
  // Wait for DevUserSelector button for ADMIN to appear
  await page.waitForSelector('button:has-text("ADMIN")');
  console.log('Clicking Admin Dev User...');
  await page.click('button:has-text("ADMIN")');
  
  await new Promise(r => setTimeout(r, 6000));
  
  console.log("COOKIES NOW:", await context.cookies());

  await browser.close();
})();
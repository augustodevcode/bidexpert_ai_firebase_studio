const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://bidexpertaifirebasestudio-d1x6z24gq-augustos-projects-d51a961f.vercel.app/setup');
  try { await page.waitForLoadState('networkidle', {timeout: 8000}); } catch(e){}
  console.log(page.url());
  const content = await page.content();
  console.log(content.includes('Pular'));
  await browser.close();
})();

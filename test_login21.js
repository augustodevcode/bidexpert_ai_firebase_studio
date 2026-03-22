const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to login...');
  await page.goto('http://demo.localhost:9014/auth/login?redirect=/admin', { waitUntil: 'domcontentloaded' });
  
  await page.waitForTimeout(2000);
  
  // Fill the form
  await page.fill('input[name="email"]', 'admin@bidexpert.com.br');
  await page.fill('input[name="password"]', 'Admin@123');
  
  console.log('Submitting form...');
  await page.locator('[data-ai-id="auth-login-submit-button"]').click();
  
  try {
    await page.waitForTimeout(3000); // give it time to submit and redirect
    const url = page.url();
    console.log('Current URL after submit:', url);
    
    // screenshot
    await page.screenshot({ path: 'worktrees/bidexpert-feat-lots-v2/screenshot_admin_loaded.png' });
    console.log('Screenshot saved.');
    
    // Check if error
    const count = await page.locator('text="Failed to fetch RSC payload"').count();
    console.log('Failed to fetch count:', count);
    
    const h1 = await page.locator('h1').innerText({timeout: 1000}).catch(()=> 'NO H1');
    console.log('Dashboard H1:', h1);
    
  } catch (err) {
    console.error('Error during wait:', err);
  }

  await browser.close();
})();

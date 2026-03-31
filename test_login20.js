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
    await page.waitForTimeout(5000); // give it time to submit and redirect
    const url = page.url();
    console.log('Current URL after submit:', url);
    
    // Check cookies
    const cookies = await context.cookies();
    console.log('Cookies after login:', cookies.map(c => c.name));
    
    // Check if there is an error in DOM
    const html = await page.content();
    if (html.includes('Failed to fetch')) {
       console.log('Detected Failed to fetch in HTML');
    }
    
    // if loading
    const spinner = await page.locator('[data-ai-id="admin-loading-state"]').count();
    console.log('Spinner count:', spinner);
    
    // Explicit navigate to /admin if not already there
    if (!url.includes('/admin')) {
        console.log('Navigating to /admin explicitly...');
        await page.goto('http://demo.localhost:9014/admin', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        console.log('URL after explicit nav:', page.url());
        
        const c2 = await context.cookies();
        console.log('Cookies:', c2.map(c => c.name));
    }
    
  } catch (err) {
    console.error('Error during wait:', err);
  }

  await browser.close();
})();

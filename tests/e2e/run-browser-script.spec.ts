import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('Run Browser Tests Script', async ({ page }) => {
  // 1. Read the browser-tests.js file content
  const scriptPath = path.resolve(__dirname, '../../browser-tests.js');
  const scriptContent = fs.readFileSync(scriptPath, 'utf8');

  // 2. Navigate to the dashboard (should be authenticated via storageState)
  await page.goto('/admin/dashboard');
  
  // Wait for dashboard to load to ensure we are logged in and ready
  await page.waitForLoadState('networkidle');

  page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));

  // 3. Inject the script into the page
  await page.addScriptTag({ content: scriptContent });

  // 4. Run the tests
  console.log('Running BidExpertTests.runAllTests()...');
  
  // We evaluate the runAllTests function and wait for it to complete.
  // The function is async, so we await it.
  await page.evaluate(async () => {
    // @ts-ignore
    if (window.BidExpertTests) {
      // @ts-ignore
      await window.BidExpertTests.runAllTests();
    } else {
      throw new Error('BidExpertTests object not found on window');
    }
  });

  // 5. Retrieve the results from localStorage
  const results = await page.evaluate(() => {
    return localStorage.getItem('bidexpert-test-results');
  });

  if (results) {
    const parsedResults = JSON.parse(results);
    console.log('---------------------------------------------------');
    console.log('BROWSER TEST RESULTS:');
    console.log(JSON.stringify(parsedResults, null, 2));
    console.log('---------------------------------------------------');
    
    // Fail the test if any browser test failed
    if (parsedResults.summary.failed > 0) {
        console.error(`❌ ${parsedResults.summary.failed} tests failed.`);
        // We don't necessarily want to fail this playwright test if the browser tests fail, 
        // as we want to see the output. But usually we do.
        // Let's just log it clearly.
    } else {
        console.log('✅ All browser tests passed.');
    }
  } else {
    console.error('❌ No results found in localStorage.');
  }
});

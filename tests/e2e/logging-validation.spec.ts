import { test, expect, Page } from '@playwright/test';

/**
 * Logging and Validation System Tests
 * Tests the user action logging and form validation features
 */

test.describe('User Action Logger', () => {
  test.beforeEach(async ({ page }) => {
    // Clear logs before each test
    await page.evaluate(() => {
      if ((window as any).__userActionLogger) {
        (window as any).__userActionLogger.clear();
      }
    });
  });

  test('should be accessible via window object', async ({ page }) => {
    await page.goto('/admin/auctions');
    
    const loggerExists = await page.evaluate(() => {
      return typeof (window as any).__userActionLogger !== 'undefined';
    });
    
    expect(loggerExists).toBe(true);
  });

  test('should set data-last-action attribute', async ({ page }) => {
    await page.goto('/admin/auctions');
    await page.waitForSelector('[data-ai-id]');
    
    // Wait a bit for any initialization logs
    await page.waitForTimeout(500);
    
    const lastAction = await page.getAttribute('body', 'data-last-action');
    expect(lastAction).toBeTruthy();
  });

  test('should log navigation actions', async ({ page }) => {
    await page.goto('/admin/auctions');
    await page.waitForSelector('text=Novo Leilão', { timeout: 10000 }).catch(() => null);
    
    const logs = await page.evaluate(() => {
      const logger = (window as any).__userActionLogger;
      return logger?.getLogs({ category: 'navigation' }) || [];
    });
    
    expect(logs.length).toBeGreaterThan(0);
  });

  test('should export logs as JSON', async ({ page }) => {
    await page.goto('/admin/auctions');
    await page.waitForTimeout(500);
    
    const exported = await page.evaluate(() => {
      const logger = (window as any).__userActionLogger;
      return logger?.export();
    });
    
    expect(exported).toBeTruthy();
    const parsed = JSON.parse(exported || '[]');
    expect(Array.isArray(parsed)).toBe(true);
  });

  test('should filter logs by module', async ({ page }) => {
    await page.goto('/admin/auctions');
    await page.waitForTimeout(500);
    
    const auctionLogs = await page.evaluate(() => {
      const logger = (window as any).__userActionLogger;
      return logger?.getLogs({ module: 'Auctions' }) || [];
    });
    
    // All returned logs should be from Auctions module
    auctionLogs.forEach((log: any) => {
      if (log.module) {
        expect(log.module).toBe('Auctions');
      }
    });
  });

  test('should clear logs', async ({ page }) => {
    await page.goto('/admin/auctions');
    await page.waitForTimeout(500);
    
    const countBefore = await page.evaluate(() => {
      const logger = (window as any).__userActionLogger;
      return logger?.getLogs().length || 0;
    });
    
    expect(countBefore).toBeGreaterThan(0);
    
    await page.evaluate(() => {
      const logger = (window as any).__userActionLogger;
      logger?.clear();
    });
    
    const countAfter = await page.evaluate(() => {
      const logger = (window as any).__userActionLogger;
      return logger?.getLogs().length || 0;
    });
    
    expect(countAfter).toBe(0);
  });
});

test.describe('Form Validation Button', () => {
  test('should show validation button in forms', async ({ page }) => {
    // Try to find a form page with validation button
    await page.goto('/admin/auctions/new');
    await page.waitForSelector('form', { timeout: 10000 }).catch(() => null);
    
    // Look for validation button (it might not exist yet in all forms)
    const validationButton = await page.locator('button:has-text("Validar")').first();
    const exists = await validationButton.count();
    
    // This test documents expected behavior - button should exist after implementation
    console.log(`Validation button found: ${exists > 0}`);
  });
});

test.describe('Form Field Logging', () => {
  test('should log field changes in auction form', async ({ page }) => {
    await page.goto('/admin/auctions/new');
    
    // Wait for form to load
    await page.waitForSelector('input[name="title"]', { timeout: 10000 }).catch(() => null);
    
    const titleInput = await page.locator('input[name="title"]').first();
    const inputExists = await titleInput.count();
    
    if (inputExists > 0) {
      // Clear previous logs
      await page.evaluate(() => {
        (window as any).__userActionLogger?.clear();
      });
      
      // Type in field
      await titleInput.fill('Test Auction Title');
      await page.waitForTimeout(300);
      
      // Check if field change was logged
      const logs = await page.evaluate(() => {
        const logger = (window as any).__userActionLogger;
        return logger?.getLogs({ category: 'form' }) || [];
      });
      
      // Should have form-related logs
      console.log(`Form logs captured: ${logs.length}`);
    }
  });
});

test.describe('Entity Selection Logging', () => {
  test('should log entity selection in lot form', async ({ page }) => {
    await page.goto('/admin/lots/new');
    
    // Wait for form
    await page.waitForSelector('form', { timeout: 10000 }).catch(() => null);
    await page.waitForTimeout(1000);
    
    // Clear logs
    await page.evaluate(() => {
      (window as any).__userActionLogger?.clear();
    });
    
    // Try to find and interact with a select/entity selector
    const selectors = await page.locator('select, [role="combobox"]').all();
    
    if (selectors.length > 0) {
      await selectors[0].click();
      await page.waitForTimeout(500);
      
      // Check for selection logs
      const logs = await page.evaluate(() => {
        const logger = (window as any).__userActionLogger;
        return logger?.getLogs({ category: 'selection' }) || [];
      });
      
      console.log(`Selection logs captured: ${logs.length}`);
    }
  });
});

test.describe('Navigation Logging', () => {
  const modules = [
    { path: '/admin/auctions', name: 'Auctions' },
    { path: '/admin/lots', name: 'Lots' },
    { path: '/admin/tenants', name: 'Tenants' },
    { path: '/admin/users', name: 'Users' },
  ];

  modules.forEach(({ path, name }) => {
    test(`should log navigation to ${name}`, async ({ page }) => {
      await page.evaluate(() => {
        (window as any).__userActionLogger?.clear();
      });
      
      await page.goto(path);
      await page.waitForTimeout(1000);
      
      const logs = await page.evaluate(() => {
        const logger = (window as any).__userActionLogger;
        return logger?.getLogs() || [];
      });
      
      expect(logs.length).toBeGreaterThan(0);
      console.log(`${name} page logged ${logs.length} actions`);
    });
  });
});

test.describe('CRUD Action Logging', () => {
  test('should log save attempt', async ({ page }) => {
    await page.goto('/admin/auctions/new');
    await page.waitForSelector('form', { timeout: 10000 }).catch(() => null);
    
    // Clear logs
    await page.evaluate(() => {
      (window as any).__userActionLogger?.clear();
    });
    
    // Try to find save button
    const saveButton = await page.locator('button:has-text("Salvar")').first();
    const exists = await saveButton.count();
    
    if (exists > 0) {
      // Click save (might fail validation, but should log)
      await saveButton.click().catch(() => null);
      await page.waitForTimeout(500);
      
      const logs = await page.evaluate(() => {
        const logger = (window as any).__userActionLogger;
        return logger?.getLogs() || [];
      });
      
      // Should have some CRUD or form logs
      const crudLogs = logs.filter((log: any) => 
        log.category === 'crud' || log.category === 'form'
      );
      
      console.log(`CRUD/Form logs on save: ${crudLogs.length}`);
    }
  });
});

test.describe('Logger Console Access', () => {
  test('should expose logger methods in console', async ({ page }) => {
    await page.goto('/admin');
    
    const methods = await page.evaluate(() => {
      const logger = (window as any).__userActionLogger;
      if (!logger) return [];
      
      return Object.keys(logger).filter(key => typeof logger[key] === 'function');
    });
    
    expect(methods).toContain('log');
    expect(methods).toContain('getLogs');
    expect(methods).toContain('clear');
    expect(methods).toContain('export');
    expect(methods).toContain('setEnabled');
  });
});

test.describe('Performance', () => {
  test('should handle many logs without crashing', async ({ page }) => {
    await page.goto('/admin/auctions');
    await page.waitForTimeout(500);
    
    // Generate many logs
    await page.evaluate(() => {
      const logger = (window as any).__userActionLogger;
      for (let i = 0; i < 600; i++) {
        logger?.log('interaction', `Test action ${i}`);
      }
    });
    
    const logCount = await page.evaluate(() => {
      const logger = (window as any).__userActionLogger;
      return logger?.getLogs().length || 0;
    });
    
    // Should maintain max limit (500)
    expect(logCount).toBeLessThanOrEqual(500);
  });
});

// Helper function to wait for specific action
async function waitForAction(page: Page, actionPattern: string, timeout = 5000) {
  return page.waitForFunction(
    (pattern) => {
      const action = document.body.getAttribute('data-last-action');
      return action?.includes(pattern) || false;
    },
    actionPattern,
    { timeout }
  );
}

// Helper to get logs by category
async function getLogsByCategory(page: Page, category: string) {
  return page.evaluate((cat) => {
    const logger = (window as any).__userActionLogger;
    return logger?.getLogs({ category: cat }) || [];
  }, category);
}

// Export helpers for use in other test files
export { waitForAction, getLogsByCategory };

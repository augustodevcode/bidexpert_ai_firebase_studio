/**
 * @fileoverview Browser Console Telemetry Helper
 *
 * Attaches console listeners to a Playwright Page to route browser
 * console messages (info, warn, error) to Node.js stdout for
 * observability during E2E test runs.
 */
import { type Page } from '@playwright/test';

/**
 * Attach browser console telemetry to a Playwright page.
 * Routes console.log/warn/error from the browser to Node.js stdout,
 * prefixed with the message type for easy grep.
 */
export function attachBrowserConsoleTelemetry(page: Page): void {
  page.on('console', (msg) => {
    const type = msg.type(); // 'log' | 'info' | 'warning' | 'error' | ...
    const text = msg.text();

    // Only forward meaningful messages (skip verbose debug noise)
    if (type === 'error') {
      console.error(`[BROWSER:ERROR] ${text}`);
    } else if (type === 'warning') {
      console.warn(`[BROWSER:WARN] ${text}`);
    } else if (type === 'info' || type === 'log') {
      // Only log in verbose mode to avoid noise
      if (process.env.PLAYWRIGHT_VERBOSE === '1') {
        console.log(`[BROWSER:${type.toUpperCase()}] ${text}`);
      }
    }
  });

  page.on('pageerror', (error) => {
    console.error(`[BROWSER:PAGE_ERROR] ${error.message}`);
  });
}

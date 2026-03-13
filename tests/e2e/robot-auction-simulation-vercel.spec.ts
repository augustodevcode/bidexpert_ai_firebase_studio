/**
 * Wrapper para executar a simulação robótica no config Vercel (testMatch *-vercel.spec.ts).
 * NOTE: Playwright forbids importing other test files. This file is a no-op placeholder.
 */
import { test } from '@playwright/test';

test.skip('robot-auction-simulation-vercel placeholder', async () => {
  // Run the main robot-auction-simulation.spec.ts directly instead
});

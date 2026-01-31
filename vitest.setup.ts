// Configuração global para testes
import { expect, afterEach } from 'vitest';

// Extend Vitest's expect method with jest-dom only in node environment
let cleanupFn: (() => void) | null = null;

if (typeof window === 'undefined') {
  const matchers = await import('@testing-library/jest-dom/matchers');
  const rtl = await import('@testing-library/react');
  cleanupFn = rtl.cleanup;
  expect.extend(matchers);
}

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanupFn?.();
});
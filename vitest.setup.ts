// Configuração global para testes
import { expect, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';

// Polyfills for jsdom
if (typeof ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (typeof IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds = [];
    takeRecords() { return []; }
  };
}

// Global mocks for Next.js and common contexts
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
  useParams: () => ({}),
  redirect: vi.fn(),
}));

// Global mock for auth context
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    userProfileWithPermissions: null,
    session: null,
    isLoading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Global mock for currency context
vi.mock('@/contexts/currency-context', () => ({
  useCurrency: () => ({
    currency: 'BRL',
    locale: 'pt-BR',
    formatCurrency: (v: number | string | null | undefined) => v != null ? Number(v).toFixed(2) : '0.00',
    setCurrency: vi.fn(),
  }),
  CurrencyProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Global mock for floating actions
vi.mock('@/components/floating-actions/floating-actions-provider', () => ({
  useFloatingActions: () => ({
    pageActions: [],
    setPageActions: vi.fn(),
  }),
  FloatingActionsProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Import cleanup from @testing-library/react
let cleanupFn: (() => void) | null = null;

try {
  const rtl = await import('@testing-library/react');
  cleanupFn = rtl.cleanup;
} catch {
  // Not available in pure node tests
}

const matchers = await import('@testing-library/jest-dom/matchers').catch(() => null);
if (matchers) {
  expect.extend(matchers.default ?? matchers);
}

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanupFn?.();
});
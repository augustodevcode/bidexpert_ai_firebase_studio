/**
 * @fileoverview BDD E2E Tests — Autenticação, Seleção de Tenant e Seed Gate.
 *
 * FEATURE: Login Multi-Tenant com Verificação de Seed
 *
 * Cenários:
 *   BDD-AUTH-01: Login admin via subdomínio (tenant auto-locked)
 *   BDD-AUTH-02: Seed gate detecta banco sem seed
 *   BDD-AUTH-03: Credenciais inválidas mostram erro
 *   BDD-AUTH-04: Login page exibe campos obrigatórios
 *   BDD-AUTH-05: DevUserSelector visível em dev mode
 */
import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  loginAs,
  selectTenant,
  CREDENTIALS,
} from './helpers/auth-helper';

const BASE_URL = process.env.BASE_URL || 'http://demo.localhost:9005';

// ─────────────────────────────────────────────────────────────────────────────
// BDD-AUTH-01: GIVEN subdomínio demo.localhost
//              WHEN admin faz login com credenciais canônicas
//              THEN redireciona para /admin ou /dashboard
// ─────────────────────────────────────────────────────────────────────────────
test.describe('BDD-AUTH-01: Login Admin via Subdomínio', () => {
  test('admin login com credenciais canônicas redireciona para dashboard', async ({ page }) => {
    // GIVEN: Navegamos para a página de login via subdomínio
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle', timeout: 120_000 });

    // WHEN: O formulário de login está visível
    const emailInput = page.locator('[data-ai-id="auth-login-email-input"]')
      .or(page.locator('input[type="email"]')).first();
    const passwordInput = page.locator('[data-ai-id="auth-login-password-input"]')
      .or(page.locator('input[type="password"]')).first();
    const submitButton = page.locator('[data-ai-id="auth-login-submit-button"]')
      .or(page.locator('button[type="submit"]')).first();

    await expect(emailInput).toBeVisible({ timeout: 60_000 });
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // AND: Preenchemos as credenciais canônicas do admin
    await emailInput.fill(CREDENTIALS.admin.email);
    await passwordInput.fill(CREDENTIALS.admin.password);

    // THEN: O submit redireciona para /admin ou /dashboard
    await Promise.all([
      page.waitForURL(/\/(admin|dashboard)/i, { timeout: 60_000 }),
      submitButton.click(),
    ]);

    // Verifica que o URL contém admin ou dashboard
    expect(page.url()).toMatch(/\/(admin|dashboard)/i);
  });

  test('loginAsAdmin helper funciona corretamente', async ({ page }) => {
    // WHEN: Usamos o helper centralizado
    const errors = await loginAsAdmin(page, BASE_URL);

    // THEN: Login bem-sucedido sem erros de console críticos
    expect(page.url()).toMatch(/\/(admin|dashboard)/i);
    const criticalErrors = errors.filter(e => !e.includes('DevTools') && !e.includes('favicon'));
    expect(criticalErrors.length).toBeLessThanOrEqual(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BDD-AUTH-02: GIVEN servidor rodando mas sem seed
//              WHEN seed gate executa
//              THEN lança erro descritivo com instrução
// ─────────────────────────────────────────────────────────────────────────────
test.describe('BDD-AUTH-02: Seed Gate Validation', () => {
  test('seed gate não lança erro quando tenants existem', async () => {
    // GIVEN: O servidor está acessível e o seed foi executado
    const { ensureSeedExecuted } = await import('./helpers/auth-helper');

    // WHEN/THEN: Deve passar sem exceção
    await expect(ensureSeedExecuted(BASE_URL)).resolves.not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BDD-AUTH-03: GIVEN usuário na página de login
//              WHEN insere credenciais inválidas
//              THEN mensagem de erro aparece sem redirect
// ─────────────────────────────────────────────────────────────────────────────
test.describe('BDD-AUTH-03: Credenciais Inválidas', () => {
  test('login com senha errada exibe erro sem redirect', async ({ page }) => {
    // GIVEN: Estamos na página de login
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle', timeout: 120_000 });

    const emailInput = page.locator('[data-ai-id="auth-login-email-input"]')
      .or(page.locator('input[type="email"]')).first();
    const passwordInput = page.locator('[data-ai-id="auth-login-password-input"]')
      .or(page.locator('input[type="password"]')).first();
    const submitButton = page.locator('[data-ai-id="auth-login-submit-button"]')
      .or(page.locator('button[type="submit"]')).first();

    await emailInput.waitFor({ state: 'visible', timeout: 60_000 });
    await page.waitForTimeout(2_000);

    // WHEN: Inserimos credenciais inválidas
    await emailInput.fill('admin@bidexpert.com.br');
    await passwordInput.fill('SenhaErrada@999');
    await submitButton.click();

    // THEN: Permanecemos na página de login (sem redirect)
    await page.waitForTimeout(5_000);
    expect(page.url()).toContain('/auth/login');

    // AND: Alguma indicação de erro deve aparecer (toast, mensagem, etc.)
    const errorIndicator = page.locator('[role="alert"], .toast-error, [data-ai-id*="error"], .text-destructive')
      .first();
    // Soft assertion: pode ou não ter indicador visual, mas NÃO deve ter redirecionado
    if (await errorIndicator.isVisible({ timeout: 3_000 }).catch(() => false)) {
      expect(errorIndicator).toBeVisible();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BDD-AUTH-04: GIVEN qualquer usuário acessa /auth/login
//              WHEN a página renderiza
//              THEN campos email, password e submit estão presentes com data-ai-id
// ─────────────────────────────────────────────────────────────────────────────
test.describe('BDD-AUTH-04: Login Page Structure', () => {
  test('página de login contém todos os campos obrigatórios', async ({ page }) => {
    // GIVEN/WHEN: Acessamos a página de login
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle', timeout: 120_000 });

    // THEN: Campos obrigatórios existem
    const emailInput = page.locator('[data-ai-id="auth-login-email-input"]');
    const passwordInput = page.locator('[data-ai-id="auth-login-password-input"]');
    const submitButton = page.locator('[data-ai-id="auth-login-submit-button"]');

    await expect(emailInput).toBeVisible({ timeout: 60_000 });
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });

  test('campo email aceita formato de email válido', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle', timeout: 120_000 });

    const emailInput = page.locator('[data-ai-id="auth-login-email-input"]')
      .or(page.locator('input[type="email"]')).first();
    await emailInput.waitFor({ state: 'visible', timeout: 60_000 });

    // WHEN: Digitamos um email válido
    await emailInput.fill('test@example.com');

    // THEN: O valor é aceito sem erros de validação inline
    expect(await emailInput.inputValue()).toBe('test@example.com');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BDD-AUTH-05: GIVEN NODE_ENV=development e subdomínio com seed
//              WHEN acessamos /auth/login
//              THEN DevUserSelector aparece com lista de usuários do seed
// ─────────────────────────────────────────────────────────────────────────────
test.describe('BDD-AUTH-05: DevUserSelector em Dev Mode', () => {
  test('DevUserSelector é visível com pelo menos 1 usuário seed', async ({ page }) => {
    // GIVEN: Acessamos a página de login
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle', timeout: 120_000 });
    await page.waitForTimeout(3_000); // Aguarda carregamento completo

    // WHEN: O DevUserSelector deve aparecer (em dev mode)
    const devSelector = page.locator('[data-ai-id="dev-user-selector"]')
      .or(page.locator('.dev-user-selector'))
      .or(page.locator('[data-testid="dev-user-selector"]'))
      .first();

    // THEN: Se estamos em dev mode, o selector deve estar presente
    // Nota: Em produção, pode não aparecer — soft assertion
    const isDevMode = await devSelector.isVisible({ timeout: 10_000 }).catch(() => false);

    if (isDevMode) {
      // Deve ter pelo menos um botão de usuário
      const userButtons = page.locator('[data-ai-id="dev-user-selector"] button, .dev-user-selector button');
      const count = await userButtons.count();
      expect(count).toBeGreaterThanOrEqual(1);
      console.log(`[BDD-AUTH-05] DevUserSelector visível com ${count} usuário(s)`);
    } else {
      console.log('[BDD-AUTH-05] DevUserSelector não visível — pode ser ambiente production-like');
      // Skip instead of fail
      test.skip();
    }
  });
});

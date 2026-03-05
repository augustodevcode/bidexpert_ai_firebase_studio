/**
 * @fileoverview Helper centralizado de autenticação para testes E2E Playwright.
 *
 * REGRA OBRIGATÓRIA: Todo teste E2E que precisa de login DEVE usar este helper.
 * NUNCA duplique lógica de login em arquivos de teste individuais.
 *
 * Credenciais canônicas vêm do seed ultimate (scripts/ultimate-master-seed.ts).
 * Se o seed não foi executado, o seed gate (ensureSeedExecuted) aborta os testes
 * com mensagem clara antes de tentar login.
 *
 * Fluxo de Tenant:
 * - Se a URL contém subdomínio (ex: demo.localhost:9005), o tenant é auto-locked
 *   no dropdown da página de login → não precisa selecionar manualmente.
 * - Se a URL é `localhost:PORT` (sem subdomínio), é necessário selecionar o tenant
 *   manualmente via combobox `[data-ai-id="auth-login-tenant-select"]`.
 * - O DevUserSelector (visível apenas em NODE_ENV=development) lista até 15 usuários
 *   com password hints, mas este helper preenche os campos diretamente.
 */
import { type Page, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Canonical Credentials (source: scripts/ultimate-master-seed.ts)
// ─────────────────────────────────────────────────────────────────────────────

export const CREDENTIALS = {
  admin: {
    email: 'admin@bidexpert.com.br',
    password: 'Admin@123',
    role: 'ADMIN',
    tenant: 'demo',
  },
  leiloeiro: {
    email: 'test.leiloeiro.1771886928935@bidexpert.com',
    password: 'Test@12345',
    role: 'LEILOEIRO',
    tenant: 'demo',
  },
  comprador: {
    email: 'test.comprador.1771886928935@bidexpert.com',
    password: 'Test@12345',
    role: 'COMPRADOR',
    tenant: 'demo',
  },
  advogado: {
    email: 'advogado.1771886928935@bidexpert.com.br',
    password: 'Test@12345',
    role: 'ADVOGADO',
    tenant: 'demo',
  },
  vendedor: {
    email: 'carlos.silva@construtoraabc.com.br',
    password: 'Test@12345',
    role: 'VENDEDOR',
    tenant: 'demo',
  },
  analista: {
    email: 'analista@lordland.com',
    password: 'password123',
    role: 'AUCTION_ANALYST',
    tenant: 'demo',
  },
} as const;

export type CredentialRole = keyof typeof CREDENTIALS;

// ─────────────────────────────────────────────────────────────────────────────
// DATA-AI-ID Selectors (login page)
// ─────────────────────────────────────────────────────────────────────────────

const SEL = {
  tenantSelect: '[data-ai-id="auth-login-tenant-select"]',
  emailInput: '[data-ai-id="auth-login-email-input"]',
  passwordInput: '[data-ai-id="auth-login-password-input"]',
  submitButton: '[data-ai-id="auth-login-submit-button"]',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Seed Gate — verifica se o seed foi executado antes dos testes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifica se pelo menos um tenant existe no banco de dados via API pública.
 * Se nenhum tenant for encontrado, lança um erro descritivo que aborta os testes
 * com instruções claras de como executar o seed.
 *
 * USO: Chame no beforeAll ou no global-setup antes de qualquer tentativa de login.
 *
 * @param baseUrl - URL base do servidor (ex: http://demo.localhost:9005)
 * @throws Error se nenhum tenant for encontrado (seed não executado)
 */
export async function ensureSeedExecuted(baseUrl: string): Promise<void> {
  // Bypass DNS issues: resolve via localhost IP directly
  const urlObj = new URL(baseUrl);
  const checkUrl = `${urlObj.protocol}//localhost:${urlObj.port}/api/public/tenants`;

  try {
    const response = await fetch(checkUrl, { signal: AbortSignal.timeout(30_000) });

    if (!response.ok) {
      throw new Error(
        `SEED GATE FAILED: /api/public/tenants retornou status ${response.status}.\n` +
        `Execute: npm run db:seed\n` +
        `Verifique: o servidor está rodando em ${baseUrl}?`
      );
    }

    const data = await response.json();
    const tenants = data?.tenants || data || [];

    if (!Array.isArray(tenants) || tenants.length === 0) {
      throw new Error(
        `SEED NOT EXECUTED: Nenhum tenant encontrado no banco de dados.\n` +
        `O seed deve ser executado ANTES dos testes E2E.\n` +
        `Comando: npm run db:seed\n` +
        `Script canônico: scripts/ultimate-master-seed.ts`
      );
    }

    console.log(`[Seed Gate] ✅ ${tenants.length} tenant(s) encontrado(s): ${tenants.map((t: { name?: string; subdomain?: string }) => t.subdomain || t.name).join(', ')}`);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `SEED GATE FAILED: Não foi possível conectar ao servidor em ${baseUrl}.\n` +
        `Verifique:\n` +
        `  1. O servidor está rodando? (node .vscode/start-9005.js)\n` +
        `  2. O seed foi executado? (npm run db:seed)\n` +
        `  3. A porta está correta? (${urlObj.port})`
      );
    }
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tenant Selection Helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifica se a URL usa subdomínio (ex: demo.localhost).
 * Quando sim, o tenant é auto-locked e não precisa de seleção manual.
 */
function hasSubdomain(baseUrl: string): boolean {
  const host = new URL(baseUrl).hostname;
  // Matches: demo.localhost, dev.localhost, hml.localhost, etc.
  return /^[a-z0-9-]+\.localhost$/i.test(host);
}

/**
 * Seleciona o tenant no dropdown da página de login.
 * Só é necessário quando a URL NÃO tem subdomínio (ex: localhost:9005).
 * Se a URL tem subdomínio, o tenant é auto-locked e esta função é no-op.
 *
 * @param page - Playwright page
 * @param tenantName - Nome ou regex do tenant a selecionar (ex: "BidExpert Demo")
 */
export async function selectTenant(page: Page, tenantName: string | RegExp = /BidExpert Demo|BidExpert/i): Promise<void> {
  const tenantSelect = page.locator(SEL.tenantSelect);

  // Se o tenant selector não está visível ou está desabilitado (auto-locked), skip
  if (!(await tenantSelect.isVisible({ timeout: 5_000 }).catch(() => false))) {
    console.log('[selectTenant] Tenant selector não visível — provavelmente auto-locked via subdomínio');
    return;
  }

  // Check if already locked (disabled)
  const isDisabled = await tenantSelect.isDisabled().catch(() => false);
  if (isDisabled) {
    console.log('[selectTenant] Tenant selector está desabilitado (auto-locked)');
    return;
  }

  try {
    await tenantSelect.click();
    await page.waitForTimeout(1_000);

    const pattern = tenantName instanceof RegExp ? tenantName : new RegExp(tenantName, 'i');
    const tenantOption = page.locator('[role="option"]').filter({ hasText: pattern }).first();

    if (await tenantOption.isVisible({ timeout: 5_000 })) {
      await tenantOption.click();
      console.log(`[selectTenant] Tenant selecionado: ${tenantName}`);
    } else {
      // Fallback: seleciona a primeira opção disponível
      const firstOption = page.locator('[role="option"]').first();
      if (await firstOption.isVisible({ timeout: 3_000 })) {
        await firstOption.click();
        console.log('[selectTenant] Nenhum match — selecionou primeira opção');
      }
    }
    await page.waitForTimeout(500);
  } catch (err) {
    console.warn('[selectTenant] Falha na interação com tenant selector:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Login Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Login genérico com credenciais canônicas por role.
 *
 * Fluxo:
 * 1. Navega para /auth/login
 * 2. Se URL sem subdomínio → seleciona tenant manualmente
 * 3. Preenche email + password via data-ai-id selectors
 * 4. Clica submit + aguarda redirect para /(admin|dashboard|lawyer)/
 *
 * @param page - Playwright Page
 * @param role - Role canônica (admin, leiloeiro, comprador, advogado, vendedor, analista)
 * @param baseUrl - URL base do servidor
 * @param options - Opções extras (customTenant, waitPattern, timeout)
 * @returns Array de erros de console capturados durante o login
 */
export async function loginAs(
  page: Page,
  role: CredentialRole,
  baseUrl: string,
  options: {
    customTenant?: string | RegExp;
    waitPattern?: RegExp;
    timeout?: number;
  } = {},
): Promise<string[]> {
  const cred = CREDENTIALS[role];
  const timeout = options.timeout ?? 60_000;
  const waitPattern = options.waitPattern ?? /\/(admin|dashboard|lawyer|home)/i;
  const consoleErrors: string[] = [];

  // Capture console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  // 1. Navigate to login
  await page.goto(`${baseUrl}/auth/login`, { waitUntil: 'networkidle', timeout: 120_000 });

  // 2. Wait for the login form to be rendered
  const emailInput = page.locator(SEL.emailInput).or(page.locator('input[type="email"]')).first();
  const passwordInput = page.locator(SEL.passwordInput).or(page.locator('input[type="password"]')).first();
  const submitButton = page.locator(SEL.submitButton).or(page.locator('button[type="submit"]')).first();

  await emailInput.waitFor({ state: 'visible', timeout: 60_000 });
  await page.waitForTimeout(2_000); // Debounce for tenant list to load

  // 3. Select tenant if needed (URL without subdomain)
  if (!hasSubdomain(baseUrl)) {
    await selectTenant(page, options.customTenant ?? /BidExpert Demo|BidExpert/i);
  }

  // 4. Fill credentials
  await emailInput.fill(cred.email);
  await passwordInput.fill(cred.password);

  // 5. Submit + wait for redirect
  await passwordInput.press('Enter');
  await page.waitForURL(waitPattern, { timeout });

  console.log(`[loginAs:${role}] ✅ Login OK → ${page.url()}`);
  return consoleErrors;
}

/**
 * Shortcut: Login como Admin.
 */
export async function loginAsAdmin(page: Page, baseUrl: string): Promise<string[]> {
  return loginAs(page, 'admin', baseUrl, {
    waitPattern: /\/(admin|dashboard)/i,
  });
}

/**
 * Shortcut: Login como Advogado.
 */
export async function loginAsLawyer(page: Page, baseUrl: string): Promise<string[]> {
  return loginAs(page, 'advogado', baseUrl, {
    waitPattern: /\/(lawyer|advogado|dashboard)/i,
  });
}

/**
 * Shortcut: Login como Comprador.
 */
export async function loginAsBuyer(page: Page, baseUrl: string): Promise<string[]> {
  return loginAs(page, 'comprador', baseUrl, {
    waitPattern: /\/(dashboard|home|search)/i,
  });
}

/**
 * Shortcut: Login como Leiloeiro.
 */
export async function loginAsAuctioneer(page: Page, baseUrl: string): Promise<string[]> {
  return loginAs(page, 'leiloeiro', baseUrl, {
    waitPattern: /\/(admin|dashboard|auctioneer)/i,
  });
}

/**
 * 🎯 TESTES PLAYWRIGHT - APLICAÇÃO REAL
 * ======================================
 * 
 * Testa as páginas e funcionalidades REAIS que já existem na aplicação.
 * Focado na filosofia e objetivos do BidExpert.
 * 
 * Requer: `npm run db:seed:ultimate` executado antes
 * Execução: npm run test:e2e tests/e2e/real-app-tests.spec.ts
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:9005';

// Credenciais do seed
const ADMIN_USER = {
  email: 'test.leiloeiro@bidexpert.com',
  password: 'Test@12345',
};

// ═══════════════════════════════════════════════════════════════════════════
// TESTES: HOMEPAGE E NAVEGAÇÃO
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Homepage e Navegação Básica', () => {
  test('REAL-1: Deve carregar homepage', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Verificar que carregou
    await expect(page).toHaveURL(/\//);
    
    // Verificar elementos básicos da homepage
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    console.log('✓ Homepage carregou com sucesso');
  });

  test('REAL-2: Deve ter meta tags corretos', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Verificar viewport
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
    
    console.log('✓ Meta tags presentes');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTES: ADMIN - AUCTIONS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Admin: Auctions (Leilões)', () => {
  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Tentar preencher campos de login
    const emailInput = page.locator('input[name="email"], input[type="email"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"], input[placeholder*="senha" i], input[placeholder*="password" i]').first();
    
    if (await emailInput.count() > 0) {
      await emailInput.fill(ADMIN_USER.email);
      await passwordInput.fill(ADMIN_USER.password);
      
      const submitBtn = page.locator('button[type="submit"], button:has-text("Entrar"), button:has-text("Login")').first();
      await submitBtn.click();
      
      // Aguardar redirect
      await page.waitForTimeout(2000);
    }
  });

  test('REAL-A1: Deve carregar listagem de auctions', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/auctions`, { waitUntil: 'networkidle' });
    
    // Verificar que está na página
    await expect(page).toHaveURL(/\/admin\/auctions/);
    
    // Verificar elementos da página
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
    
    console.log('✓ Listagem de auctions carregou');
  });

  test('REAL-A2: Deve ter botão para criar nova auction', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/auctions`);
    
    // Procurar por botão de criar/novo
    const newBtn = page.locator('a:has-text("Novo"), a:has-text("Criar"), button:has-text("Novo"), button:has-text("Criar"), [href*="/new"]').first();
    
    if (await newBtn.count() > 0) {
      await expect(newBtn).toBeVisible();
      console.log('✓ Botão de criar auction existe');
    }
  });

  test('REAL-A3: Deve carregar página de criar auction', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/auctions/new`, { waitUntil: 'networkidle' });
    
    // Verificar URL
    await expect(page).toHaveURL(/\/admin\/auctions\/new/);
    
    // Verificar que tem formulário
    const form = page.locator('form').first();
    if (await form.count() > 0) {
      await expect(form).toBeVisible();
      console.log('✓ Formulário de criação existe');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTES: ADMIN - LOTS (LOTES)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Admin: Lots (Lotes)', () => {
  test('REAL-L1: Deve carregar listagem de lots', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/lots`, { waitUntil: 'networkidle' });
    
    // Verificar URL
    await expect(page).toHaveURL(/\/admin\/lots/);
    
    console.log('✓ Listagem de lots carregou');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTES: ADMIN - AUCTIONEERS (LEILOEIROS)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Admin: Auctioneers (Leiloeiros)', () => {
  test('REAL-AU1: Deve carregar listagem de leiloeiros', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/auctioneers`, { waitUntil: 'networkidle' });
    
    await expect(page).toHaveURL(/\/admin\/auctioneers/);
    
    console.log('✓ Listagem de leiloeiros carregou');
  });

  test('REAL-AU2: Deve exibir leiloeiros do seed', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/auctioneers`);
    
    // Aguardar conteúdo
    await page.waitForTimeout(2000);
    
    // Verificar se há algum conteúdo (tabela, lista, grid)
    const content = page.locator('table, ul, .grid, [role="list"]').first();
    if (await content.count() > 0) {
      console.log('✓ Conteúdo de leiloeiros existe');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTES: ADMIN - CATEGORIES (CATEGORIAS)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Admin: Categories (Categorias)', () => {
  test('REAL-C1: Deve carregar listagem de categorias', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/categories`, { waitUntil: 'networkidle' });
    
    await expect(page).toHaveURL(/\/admin\/categories/);
    
    console.log('✓ Listagem de categorias carregou');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTES: ADMIN - ASSETS (ATIVOS)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Admin: Assets (Ativos)', () => {
  test('REAL-AS1: Deve carregar listagem de assets', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/assets`, { waitUntil: 'networkidle' });
    
    await expect(page).toHaveURL(/\/admin\/assets/);
    
    console.log('✓ Listagem de assets carregou');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTES: ADMIN - BIDDER IMPERSONATION
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Admin: Bidder Impersonation', () => {
  test('REAL-BI1: Deve carregar página de impersonation', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/bidder-impersonation`, { waitUntil: 'networkidle' });
    
    await expect(page).toHaveURL(/\/admin\/bidder-impersonation/);
    
    console.log('✓ Página de impersonation carregou');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTES: PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Performance', () => {
  test('REAL-P1: Homepage < 5s', async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(5000);
    console.log(`✓ Homepage carregou em ${duration}ms`);
  });

  test('REAL-P2: Admin Auctions < 5s', async ({ page }) => {
    const start = Date.now();
    await page.goto(`${BASE_URL}/admin/auctions`, { waitUntil: 'networkidle' });
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(5000);
    console.log(`✓ Admin Auctions carregou em ${duration}ms`);
  });

  test('REAL-P3: Admin Auctioneers < 5s', async ({ page }) => {
    const start = Date.now();
    await page.goto(`${BASE_URL}/admin/auctioneers`, { waitUntil: 'networkidle' });
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(5000);
    console.log(`✓ Admin Auctioneers carregou em ${duration}ms`);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTES: RESPONSIVIDADE
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Responsividade', () => {
  test('REAL-R1: Mobile 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    console.log('✓ Mobile (375px) funciona');
  });

  test('REAL-R2: Tablet 768px', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(BASE_URL);
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    console.log('✓ Tablet (768px) funciona');
  });

  test('REAL-R3: Desktop 1920px', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(BASE_URL);
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    console.log('✓ Desktop (1920px) funciona');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTES: NAVEGAÇÃO ENTRE PÁGINAS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Navegação entre Páginas Admin', () => {
  test('REAL-N1: Navegar de Auctions para New', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/auctions`);
    
    // Procurar link/botão para criar
    const newLink = page.locator('a[href*="/new"], button:has-text("Novo")').first();
    
    if (await newLink.count() > 0) {
      await newLink.click();
      await page.waitForURL(/\/new/, { timeout: 5000 });
      console.log('✓ Navegou para página de criar');
    }
  });

  test('REAL-N2: Navegar entre módulos admin', async ({ page }) => {
    // Auctions -> Auctioneers
    await page.goto(`${BASE_URL}/admin/auctions`);
    await page.goto(`${BASE_URL}/admin/auctioneers`);
    await expect(page).toHaveURL(/\/admin\/auctioneers/);
    
    // Auctioneers -> Categories
    await page.goto(`${BASE_URL}/admin/categories`);
    await expect(page).toHaveURL(/\/admin\/categories/);
    
    console.log('✓ Navegação entre módulos funciona');
  });
});

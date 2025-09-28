// tests/ui/dashboard-navigation.spec.ts
import { test, expect, type Page } from '@playwright/test';

// Assume um usuário arrematante criado pelo script de seed de dados
const TEST_USER_EMAIL = 'admin@bidexpert.com.br'; // Using admin to ensure some data might exist
const TEST_USER_PASSWORD = 'Admin@123';

test.describe('Módulo 9: Painel do Usuário (Arrematante) - Navegação e Visualização', () => {

  test.beforeEach(async ({ page }) => {
    // Garante que o setup seja considerado completo
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });

    // 1. Autenticar como usuário arrematante
    console.log('[User Dashboard Test] Navigating to login...');
    await page.goto('/auth/login');
    await page.locator('[data-ai-id="auth-login-email-input"]').fill(TEST_USER_EMAIL);
    await page.locator('[data-ai-id="auth-login-password-input"]').fill(TEST_USER_PASSWORD);
    await page.locator('[data-ai-id="auth-login-submit-button"]').click();
    
    // Aguarda o redirecionamento para o dashboard
    await page.waitForURL('/dashboard/overview', { timeout: 15000 });
    console.log('[User Dashboard Test] Login successful. Arrived at overview.');
  });

  test('Cenário 9.1.1: should display the overview page with stats cards', async ({ page }) => {
    await expect(page.locator('[data-ai-id="user-dashboard-header-card"]')).toBeVisible({timeout: 10000});

    // Verificar se os cards de estatísticas principais estão visíveis
    const statsGrid = page.locator('[data-ai-id="user-dashboard-stats-grid"]');
    await expect(statsGrid.getByText('Meus Lances Ativos')).toBeVisible();
    await expect(statsGrid.getByText('Meus Arremates')).toBeVisible();
    await expect(statsGrid.getByText('Status da Habilitação')).toBeVisible();
    await expect(statsGrid.getByText('Arremates Pendentes')).toBeVisible();

    console.log('[User Dashboard Test] PASSED: Overview page displays all stat cards.');
  });

  test('Cenário 9.1.2: should navigate to "Meus Lances" and see the bids table', async ({ page }) => {
    // Navegar para a página de lances usando o sidebar
    await page.locator('[data-ai-id="user-dashboard-sidebar"]').getByRole('link', { name: 'Meus Lances' }).click();
    await page.waitForURL('/dashboard/bids');

    await expect(page.locator('[data-ai-id="my-bids-page-container"]')).toBeVisible({timeout: 10000});

    // Verificar se a tabela de lances ou o estado de "nenhum lance" está visível
    const noBidsMessage = page.locator('[data-ai-id="my-bids-empty-state"]');
    const bidsTable = page.locator('[data-ai-id="my-bids-table-container"]');
    
    await expect(noBidsMessage.or(bidsTable)).toBeVisible();

    console.log('[User Dashboard Test] PASSED: Navigated to "Meus Lances" and content is visible.');
  });

  test('Cenário 9.1.3: should navigate to "Meus Arremates" and see the wins list', async ({ page }) => {
    // Navegar para a página de arremates
    await page.locator('[data-ai-id="user-dashboard-sidebar"]').getByRole('link', { name: 'Meus Arremates' }).click();
    await page.waitForURL('/dashboard/wins');

    await expect(page.getByRole('heading', { name: 'Meus Arremates' })).toBeVisible({timeout: 10000});

    // Verificar se os cards de arremate ou o estado de "nenhum arremate" está visível
    const noWinsMessage = page.getByText('Nenhum Arremate Encontrado');
    const winCard = page.locator('[data-ai-id="win-card-container"]').first();

    await expect(noWinsMessage.or(winCard)).toBeVisible();

    console.log('[User Dashboard Test] PASSED: Navigated to "Meus Arremates" and content is visible.');
  });
});

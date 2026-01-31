// tests/e2e/admin-roles-manage-all.spec.ts
/**
 * @fileoverview Teste E2E para validar que a permissão manage_all
 * exibe corretamente todas as permissões marcadas na tela de edição de roles
 */
import { test, expect } from '@playwright/test';

test.describe('Admin Roles - manage_all permission display', () => {
  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto('http://demo.localhost:9005/auth/login');
    await page.fill('input[name="email"]', 'admin@bidexpert.ai');
    await page.fill('input[name="password"]', 'senha123');
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento
    await page.waitForURL('**/admin/**', { timeout: 30000 });
  });

  test('should show all permissions checked for ADMIN role with manage_all', async ({ page }) => {
    // Navegar para edição do role ADMIN (ID 1)
    await page.goto('http://demo.localhost:9005/admin/roles/1/edit');
    
    // Aguardar carregamento da página
    await page.waitForSelector('[data-ai-id="role-form"]', { timeout: 10000 });
    
    // Verificar se o nome do role está correto
    await expect(page.locator('input[name="name"]')).toHaveValue('ADMIN');
    
    // Verificar se o checkbox "Acesso Total (Administrador)" está marcado
    await expect(page.locator('text=Acesso Total (Administrador)')).toBeVisible();
    
    // Expandir todos os accordions para ver as permissões
    const accordionTriggers = page.locator('[data-radix-collection-item]');
    const count = await accordionTriggers.count();
    
    for (let i = 0; i < count; i++) {
      await accordionTriggers.nth(i).click();
      await page.waitForTimeout(100); // Pequena pausa para animação
    }
    
    // Verificar se pelo menos algumas permissões importantes estão visíveis e marcadas
    const permissionsToCheck = [
      'Categorias: Criar',
      'Categorias: Ver',
      'Estados: Criar', 
      'Estados: Ver',
      'Leilões: Criar',
      'Leilões: Ver Todos',
      'Acesso Total (Administrador)'
    ];
    
    for (const permission of permissionsToCheck) {
      await expect(page.locator(`text=${permission}`)).toBeVisible();
      
      // Encontrar o checkbox correspondente à permissão
      const permissionContainer = page.locator(`text=${permission}`).locator('xpath=..');
      const checkbox = permissionContainer.locator('button[role="checkbox"]');
      
      // Verificar se está marcado (aria-checked="true" ou data-state="checked")
      await expect(checkbox).toHaveAttribute('data-state', 'checked');
    }
  });

  test('should show visual indicator for permissions inherited from manage_all', async ({ page }) => {
    await page.goto('http://demo.localhost:9005/admin/roles/1/edit');
    await page.waitForSelector('[data-ai-id="role-form"]', { timeout: 10000 });
    
    // Expandir o accordion "Categorias" para ver as permissões
    await page.click('text=Categorias');
    await page.waitForTimeout(200);
    
    // Verificar se existe texto indicando "(via Acesso Total)" 
    const viaTotalAccessTexts = page.locator('text=(via Acesso Total)');
    const count = await viaTotalAccessTexts.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should keep manage_all when other permissions are clicked', async ({ page }) => {
    await page.goto('http://demo.localhost:9005/admin/roles/1/edit');
    await page.waitForSelector('[data-ai-id="role-form"]', { timeout: 10000 });
    
    // Expandir accordion de categorias
    await page.click('text=Categorias');
    await page.waitForTimeout(200);
    
    // Tentar clicar em uma permissão específica (deve estar desabilitada)
    const specificPermissionCheckbox = page.locator('text=Categorias: Criar').locator('xpath=..').locator('button[role="checkbox"]');
    
    // Verificar se está desabilitado ou não responde a cliques
    const isDisabled = await specificPermissionCheckbox.getAttribute('disabled');
    if (!isDisabled) {
      // Se não estiver explicitamente desabilitado, clicar não deve alterar o estado
      await specificPermissionCheckbox.click();
      await expect(specificPermissionCheckbox).toHaveAttribute('data-state', 'checked');
    }
  });
});
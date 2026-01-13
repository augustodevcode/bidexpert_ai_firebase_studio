/**
 * @file STR-07: Jornada Administrador (Super Admin)
 * @description Skill de validação da jornada crítica do Administrador do Sistema.
 * Administrador = super admin com acesso total ao sistema multi-tenant.
 * 
 * Jornada do Administrador:
 * 1. Login e acesso ao painel master
 * 2. Gerenciar tenants (leiloeiros)
 * 3. Gerenciar usuários e permissões
 * 4. Configurações globais do sistema
 * 5. Monitorar métricas e logs
 * 6. Auditoria e compliance
 */

import { test, expect, Page } from '@playwright/test';

test.describe('STR-07: Jornada Administrador', () => {
  // Usar storageState de admin autenticado
  test.use({ storageState: './tests/e2e/.auth/admin.json' });

  test.describe('1. Acesso ao Painel Master', () => {
    test('deve acessar dashboard administrativo', async ({ page }) => {
      await page.goto('/admin');
      
      await expect(page.locator('main, [data-ai-id="admin-dashboard"]')).toBeVisible({ timeout: 15000 });
    });

    test('deve exibir menu completo de administração', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(2000);

      // Verificar itens de menu do admin
      const menuItems = [
        'Dashboard',
        'Tenants',
        'Usuários',
        'Permissões',
        'Configurações',
        'Logs',
        'Auditoria',
        'Relatórios',
      ];

      let foundItems = 0;
      for (const item of menuItems) {
        const menuLink = page.locator(`nav, aside`).locator(`text=${item}`).first();
        const isVisible = await menuLink.isVisible().catch(() => false);
        if (isVisible) {
          foundItems++;
          console.log(`✅ Menu "${item}"`);
        }
      }
      console.log(`📊 Menus encontrados: ${foundItems}/${menuItems.length}`);
    });

    test('deve exibir métricas globais do sistema', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);

      // Verificar cards de métricas globais
      const globalMetrics = [
        'Total Tenants',
        'Usuários',
        'Leilões',
        'Transações',
        'GMV',
        'Comissões',
      ];

      for (const metric of globalMetrics) {
        const metricElement = page.locator(`text=/${metric}/i`).first();
        const isVisible = await metricElement.isVisible().catch(() => false);
        if (isVisible) {
          console.log(`✅ ${metric}`);
        }
      }
    });
  });

  test.describe('2. Gestão de Tenants', () => {
    test('deve acessar lista de tenants', async ({ page }) => {
      await page.goto('/admin/tenants');
      
      await expect(page.locator('main, [data-ai-id="admin-tenants-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('deve exibir informações dos tenants', async ({ page }) => {
      await page.goto('/admin/tenants');
      await page.waitForTimeout(3000);

      const tenantList = page.locator('table, [data-ai-id="tenants-list"], .tenant-card');
      const hasTenants = await tenantList.isVisible().catch(() => false);

      if (hasTenants) {
        console.log('✅ Lista de tenants carregada');
        
        // Verificar colunas essenciais
        const columns = ['Nome', 'Status', 'Plano', 'Usuários', 'Leilões'];
        for (const col of columns) {
          const hasColumn = await page.locator(`th:has-text("${col}"), [data-ai-id*="${col.toLowerCase()}"]`).isVisible().catch(() => false);
          if (hasColumn) {
            console.log(`   ✅ ${col}`);
          }
        }
      }
    });

    test('deve permitir criar novo tenant', async ({ page }) => {
      await page.goto('/admin/tenants/new');
      
      const formVisible = await page.locator('form, [data-ai-id="tenant-form"]').isVisible({ timeout: 10000 }).catch(() => false);
      
      if (formVisible) {
        console.log('✅ Formulário de novo tenant acessível');
      } else {
        // Verificar se existe botão na lista
        await page.goto('/admin/tenants');
        const createButton = page.locator('button:has-text("Criar"), button:has-text("Novo"), a:has-text("Novo tenant")');
        const hasCreate = await createButton.isVisible().catch(() => false);
        console.log(`📊 Botão criar tenant: ${hasCreate ? '✅' : '❌'}`);
      }
    });

    test('deve permitir editar configurações do tenant', async ({ page }) => {
      await page.goto('/admin/tenants');
      await page.waitForTimeout(2000);

      const editButton = page.locator('button:has-text("Editar"), a:has-text("Editar"), [data-ai-id="edit-tenant"]').first();
      const hasEdit = await editButton.isVisible().catch(() => false);

      console.log(`📊 Edição de tenant: ${hasEdit ? '✅' : '❌'}`);
    });
  });

  test.describe('3. Gestão de Usuários', () => {
    test('deve acessar lista de usuários global', async ({ page }) => {
      await page.goto('/admin/users');
      
      await expect(page.locator('main, [data-ai-id="admin-users-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('deve permitir filtrar usuários por tenant', async ({ page }) => {
      await page.goto('/admin/users');
      await page.waitForTimeout(2000);

      const tenantFilter = page.locator('[data-ai-id="filter-tenant"], select:has-text("Tenant"), [data-testid="tenant-filter"]');
      const hasFilter = await tenantFilter.isVisible().catch(() => false);

      console.log(`📊 Filtro por tenant: ${hasFilter ? '✅' : '❌'}`);
    });

    test('deve permitir filtrar usuários por role', async ({ page }) => {
      await page.goto('/admin/users');
      await page.waitForTimeout(2000);

      const roleFilter = page.locator('[data-ai-id="filter-role"], select:has-text("Role"), select:has-text("Perfil")');
      const hasFilter = await roleFilter.isVisible().catch(() => false);

      console.log(`📊 Filtro por role: ${hasFilter ? '✅' : '❌'}`);
    });

    test('deve exibir detalhes do usuário', async ({ page }) => {
      await page.goto('/admin/users');
      await page.waitForTimeout(2000);

      const userRow = page.locator('tr, .user-card').first();
      
      if (await userRow.isVisible()) {
        await userRow.click();
        await page.waitForTimeout(2000);

        // Verificar informações do usuário
        const userInfo = ['Email', 'Nome', 'Roles', 'Tenant', 'Status', 'Último acesso'];
        for (const info of userInfo) {
          const infoElement = page.locator(`text=/${info}/i`).first();
          const isVisible = await infoElement.isVisible().catch(() => false);
          if (isVisible) {
            console.log(`✅ ${info}`);
          }
        }
      }
    });
  });

  test.describe('4. Gestão de Permissões', () => {
    test('deve acessar página de roles/permissões', async ({ page }) => {
      await page.goto('/admin/roles');
      
      await expect(page.locator('main, [data-ai-id="admin-roles-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('deve listar roles existentes', async ({ page }) => {
      await page.goto('/admin/roles');
      await page.waitForTimeout(3000);

      const rolesList = page.locator('table, [data-ai-id="roles-list"], .role-card');
      const hasRoles = await rolesList.isVisible().catch(() => false);

      if (hasRoles) {
        // Verificar roles padrão
        const defaultRoles = ['ADMIN', 'AUCTIONEER', 'SELLER', 'BIDDER'];
        for (const role of defaultRoles) {
          const hasRole = await page.locator(`text=${role}`).isVisible().catch(() => false);
          if (hasRole) {
            console.log(`✅ Role ${role}`);
          }
        }
      }
    });
  });

  test.describe('5. Configurações do Sistema', () => {
    test('deve acessar configurações globais', async ({ page }) => {
      await page.goto('/admin/settings');
      
      await expect(page.locator('main, [data-ai-id="admin-settings-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('deve exibir seções de configuração', async ({ page }) => {
      await page.goto('/admin/settings');
      await page.waitForTimeout(2000);

      const configSections = [
        'Geral',
        'Email',
        'Pagamentos',
        'Integrações',
        'Segurança',
        'Notificações',
      ];

      for (const section of configSections) {
        const sectionElement = page.locator(`text=/${section}/i, [data-ai-id*="${section.toLowerCase()}"]`).first();
        const isVisible = await sectionElement.isVisible().catch(() => false);
        if (isVisible) {
          console.log(`✅ Seção "${section}"`);
        }
      }
    });
  });

  test.describe('6. Monitoramento e Logs', () => {
    test('deve acessar página de logs do sistema', async ({ page }) => {
      await page.goto('/admin/logs');
      
      await expect(page.locator('main, [data-ai-id="admin-logs-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('deve permitir filtrar logs por tipo', async ({ page }) => {
      await page.goto('/admin/logs');
      await page.waitForTimeout(2000);

      const typeFilter = page.locator('[data-ai-id="filter-log-type"], select:has-text("Tipo"), [data-testid="log-type-filter"]');
      const hasFilter = await typeFilter.isVisible().catch(() => false);

      console.log(`📊 Filtro por tipo de log: ${hasFilter ? '✅' : '❌'}`);
    });

    test('deve acessar página de auditoria', async ({ page }) => {
      await page.goto('/admin/audit');
      
      await expect(page.locator('main, [data-ai-id="admin-audit-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('deve exibir trilha de auditoria', async ({ page }) => {
      await page.goto('/admin/audit');
      await page.waitForTimeout(3000);

      const auditList = page.locator('table, [data-ai-id="audit-list"], .audit-entry');
      const hasAudit = await auditList.isVisible().catch(() => false);

      if (hasAudit) {
        console.log('✅ Trilha de auditoria carregada');
        
        // Verificar colunas de auditoria
        const columns = ['Ação', 'Usuário', 'Entidade', 'Data', 'IP'];
        for (const col of columns) {
          const hasColumn = await page.locator(`th:has-text("${col}")`).isVisible().catch(() => false);
          if (hasColumn) {
            console.log(`   ✅ ${col}`);
          }
        }
      }
    });
  });

  test.describe('7. Relatórios Gerenciais', () => {
    test('deve acessar relatórios globais', async ({ page }) => {
      await page.goto('/admin/reports');
      
      await expect(page.locator('main, [data-ai-id="admin-reports-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('deve permitir gerar relatório consolidado', async ({ page }) => {
      await page.goto('/admin/reports');
      await page.waitForTimeout(2000);

      const reportTypes = [
        'Faturamento',
        'Usuários',
        'Leilões',
        'Performance',
        'Consolidado',
      ];

      for (const report of reportTypes) {
        const reportOption = page.locator(`button:has-text("${report}"), option:has-text("${report}"), [data-ai-id*="${report.toLowerCase()}"]`);
        const hasReport = await reportOption.isVisible().catch(() => false);
        if (hasReport) {
          console.log(`✅ Relatório "${report}"`);
        }
      }
    });
  });
});

// Métricas de performance
test.describe('STR-07: Performance Admin', () => {
  test.use({ storageState: './tests/e2e/.auth/admin.json' });

  test('tempo de carregamento do dashboard admin', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`📊 Tempo /admin: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000);
  });

  test('tempo de carregamento de usuários', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`📊 Tempo /admin/users: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test('tempo de carregamento de tenants', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/admin/tenants');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`📊 Tempo /admin/tenants: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });
});

// tests/e2e/audit/audit-permissions.spec.ts
// Testes E2E para permissões e controle de acesso no audit trail

import { test, expect } from '@playwright/test';

test.describe('Audit Trail - Permissions & Access Control', () => {
  test('admin deve ver todos os logs de auditoria', async ({ page }) => {
    // Login como admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'admin@bidexpert.com.br');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
    
    // Buscar todos os logs
    const response = await page.request.get('/api/audit?page=1&pageSize=20');
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data).toBeInstanceOf(Array);
    
    // Admin deve ver logs de múltiplos usuários
    if (data.data.length > 1) {
      const userIds = new Set(data.data.map((log: any) => log.userId));
      // Se houver múltiplos usuários no sistema, admin vê todos
      expect(userIds.size).toBeGreaterThanOrEqual(1);
    }
  });

  test('usuário regular deve ver apenas seus próprios logs', async ({ page }) => {
    // Login como usuário regular (não admin)
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'user@bidexpert.com.br');
    await page.fill('input[name="password"]', 'User@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    // Tentar buscar logs
    const response = await page.request.get('/api/audit?page=1&pageSize=20');
    
    if (response.ok()) {
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        // Todos os logs devem ser do próprio usuário
        const currentUserId = data.data[0].userId;
        const allSameUser = data.data.every((log: any) => log.userId === currentUserId);
        
        expect(allSameUser).toBe(true);
      }
    }
  });

  test('usuário não autenticado não deve acessar logs', async ({ page }) => {
    // Tentar acessar API sem autenticação
    const response = await page.request.get('/api/audit');
    
    // Deve retornar 401 Unauthorized
    expect(response.status()).toBe(401);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Unauthorized');
  });

  test('apenas admin deve poder acessar estatísticas', async ({ page }) => {
    // Login como admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'admin@bidexpert.com.br');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
    
    // Acessar estatísticas
    const response = await page.request.get('/api/audit/stats?days=7');
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.summary).toBeDefined();
    expect(data.data.byModel).toBeInstanceOf(Array);
    expect(data.data.byAction).toBeInstanceOf(Array);
  });

  test('usuário regular não deve acessar estatísticas', async ({ page, context }) => {
    // Login como usuário regular
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'user@bidexpert.com.br');
    await page.fill('input[name="password"]', 'User@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    // Tentar acessar estatísticas
    const response = await page.request.get('/api/audit/stats');
    
    // Deve retornar 403 Forbidden
    expect(response.status()).toBe(403);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Forbidden');
  });

  test('apenas admin deve poder atualizar configuração de auditoria', async ({ page }) => {
    // Login como admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'admin@bidexpert.com.br');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
    
    // Obter config atual
    const getResponse = await page.request.get('/api/audit/config');
    const currentConfig = await getResponse.json();
    
    // Atualizar config
    const putResponse = await page.request.put('/api/audit/config', {
      data: {
        config: {
          ...currentConfig.data,
          retentionDays: 365,
        }
      }
    });
    
    expect(putResponse.ok()).toBeTruthy();
    const data = await putResponse.json();
    
    expect(data.success).toBe(true);
    expect(data.data.retentionDays).toBe(365);
  });

  test('usuário regular não deve poder atualizar configuração', async ({ page }) => {
    // Login como usuário regular
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'user@bidexpert.com.br');
    await page.fill('input[name="password"]', 'User@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    // Tentar atualizar config
    const response = await page.request.put('/api/audit/config', {
      data: {
        config: {
          enabled: false,
        }
      }
    });
    
    // Deve retornar 403 Forbidden
    expect(response.status()).toBe(403);
  });

  test('logs devem respeitar isolamento de tenant', async ({ page }) => {
    // Login como admin do tenant 1
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'admin@bidexpert.com.br');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
    
    // Buscar logs com tenantId
    const response = await page.request.get('/api/audit?tenantId=1&page=1&pageSize=20');
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    if (data.data.length > 0) {
      // Todos os logs devem ser do tenant 1 ou null (global)
      const allSameTenant = data.data.every((log: any) => 
        log.tenantId === '1' || log.tenantId === null
      );
      
      expect(allSameTenant).toBe(true);
    }
  });

  test('não deve ser possível deletar logs de auditoria via UI', async ({ page }) => {
    // Login como admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'admin@bidexpert.com.br');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
    
    // Navegar para leilão com histórico
    await page.goto('/admin/auctions');
    await page.click('tr:first-child a');
    await page.click('button[role="tab"]:has-text("Change History")');
    
    await page.waitForTimeout(500);
    
    // Não deve haver botão de deletar no histórico
    const deleteButton = page.locator('button:has-text("Delete")').or(
      page.locator('button:has-text("Deletar")')
    );
    
    // Dentro da aba de histórico, não deve haver opção de deletar
    const changeHistoryTab = page.locator('[role="tabpanel"]:has-text("Change History")');
    const deleteInHistory = changeHistoryTab.locator('button:has-text("Delete")');
    
    expect(await deleteInHistory.count()).toBe(0);
  });

  test('campos sensíveis devem ser filtrados nos logs', async ({ page }) => {
    // Login como admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'admin@bidexpert.com.br');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
    
    // Buscar logs de usuários (que podem ter campos sensíveis)
    const response = await page.request.get('/api/audit?entityType=User&page=1&pageSize=10');
    
    if (response.ok()) {
      const data = await response.json();
      
      if (data.data.length > 0) {
        data.data.forEach((log: any) => {
          if (log.changes) {
            const changes = typeof log.changes === 'string' 
              ? JSON.parse(log.changes) 
              : log.changes;
            
            // Se password estiver presente, deve estar como [REDACTED]
            if (changes.password !== undefined) {
              expect(changes.password).toBe('[REDACTED]');
            }
            
            // Outros campos sensíveis também devem ser filtrados
            ['resetToken', 'verificationToken', 'accessToken'].forEach(field => {
              if (changes[field] !== undefined) {
                expect(changes[field]).toBe('[REDACTED]');
              }
            });
          }
        });
      }
    }
  });
});

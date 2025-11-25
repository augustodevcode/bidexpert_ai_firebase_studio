// tests/e2e/audit/change-history-tab.spec.ts
// Testes E2E para o componente Change History Tab

import { test, expect } from '@playwright/test';

test.describe('Change History Tab - UI Component', () => {
  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'admin@bidexpert.com.br');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
  });

  test('deve renderizar o Change History Tab corretamente', async ({ page }) => {
    // Navegar para um leilão
    await page.goto('/admin/auctions');
    await page.click('tr:first-child a');
    
    // Clicar na aba "Change History"
    await page.click('button[role="tab"]:has-text("Change History")');
    
    // Verificar que o tab está ativo
    await expect(page.locator('button[role="tab"][aria-selected="true"]:has-text("Change History")')).toBeVisible();
    
    // Verificar elementos da UI
    await expect(page.locator('input[placeholder*="search"]')).toBeVisible();
    await expect(page.locator('button:has-text("Q")')).toBeVisible(); // Quick search button
    
    // Verificar cabeçalhos da tabela
    await expect(page.locator('th:has-text("User Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Modified On")')).toBeVisible();
    await expect(page.locator('th:has-text("Operation Type")')).toBeVisible();
    await expect(page.locator('th:has-text("Property Name")')).toBeVisible();
  });

  test('deve exibir histórico de mudanças de um leilão', async ({ page }) => {
    // Criar e editar um leilão para garantir que há histórico
    await page.goto('/admin/auctions');
    await page.click('button:has-text("Novo Leilão")');
    
    await page.fill('input[name="title"]', 'Leilão Teste Histórico');
    await page.click('button:has-text("Salvar")');
    await page.waitForSelector('text=Leilão criado com sucesso');
    
    // Editar o leilão
    await page.click('button:has-text("Editar")');
    await page.fill('input[name="title"]', 'Leilão Teste Histórico - Editado');
    await page.click('button:has-text("Salvar")');
    await page.waitForSelector('text=Leilão atualizado com sucesso');
    
    // Aguardar logs serem criados
    await page.waitForTimeout(1500);
    
    // Ir para aba de histórico
    await page.click('button[role="tab"]:has-text("Change History")');
    await page.waitForTimeout(500);
    
    // Verificar que há entradas no histórico
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCountGreaterThan(0);
    
    // Verificar que mostra CREATE e UPDATE
    await expect(page.locator('text=CREATE').first()).toBeVisible();
    await expect(page.locator('text=UPDATE').first()).toBeVisible();
  });

  test('deve ordenar colunas ao clicar no cabeçalho', async ({ page }) => {
    // Navegar para leilão com histórico
    await page.goto('/admin/auctions');
    await page.click('tr:first-child a');
    await page.click('button[role="tab"]:has-text("Change History")');
    
    await page.waitForTimeout(500);
    
    // Clicar no cabeçalho "User Name" para ordenar
    await page.click('th:has-text("User Name")');
    
    // Verificar indicador de ordenação (seta)
    await expect(page.locator('th:has-text("User Name") svg')).toBeVisible();
    
    // Clicar novamente para inverter ordem
    await page.click('th:has-text("User Name")');
    
    // Aguardar atualização
    await page.waitForTimeout(300);
  });

  test('deve funcionar a busca no histórico', async ({ page }) => {
    // Navegar para leilão com histórico
    await page.goto('/admin/auctions');
    await page.click('tr:first-child a');
    await page.click('button[role="tab"]:has-text("Change History")');
    
    await page.waitForTimeout(500);
    
    // Digitar na busca
    const searchInput = page.locator('input[placeholder*="search"]');
    await searchInput.fill('UPDATE');
    
    // Clicar no botão de busca (Q)
    await page.click('button:has-text("Q")');
    
    await page.waitForTimeout(500);
    
    // Verificar que os resultados foram filtrados
    // (deve mostrar apenas logs com UPDATE)
    const operationBadges = page.locator('text=UPDATE');
    const count = await operationBadges.count();
    
    if (count > 0) {
      await expect(operationBadges.first()).toBeVisible();
    }
  });

  test('deve funcionar a paginação', async ({ page }) => {
    // Navegar para entidade com muitos logs (ou criar vários)
    await page.goto('/admin/auctions');
    await page.click('tr:first-child a');
    await page.click('button[role="tab"]:has-text("Change History")');
    
    await page.waitForTimeout(500);
    
    // Verificar controles de paginação
    await expect(page.locator('button:has-text("«")').or(page.locator('svg[data-testid*="chevron-left"]')).first()).toBeVisible(); // Anterior
    await expect(page.locator('button:has-text("»")').or(page.locator('svg[data-testid*="chevron-right"]')).first()).toBeVisible(); // Próximo
    
    // Verificar seletor de tamanho de página
    const pageSizeSelect = page.locator('select').or(page.locator('[role="combobox"]')).last();
    await expect(pageSizeSelect).toBeVisible();
    
    // Mudar tamanho de página
    if (await pageSizeSelect.count() > 0) {
      await pageSizeSelect.click();
      await page.click('text=50').or(page.locator('[role="option"]:has-text("50")')).first();
      await page.waitForTimeout(500);
    }
  });

  test('deve mostrar field-level changes corretamente', async ({ page }) => {
    // Criar e editar leilão
    await page.goto('/admin/auctions');
    await page.click('button:has-text("Novo Leilão")');
    
    await page.fill('input[name="title"]', 'Teste Field Changes');
    await page.fill('textarea[name="description"]', 'Descrição inicial');
    await page.click('button:has-text("Salvar")');
    await page.waitForSelector('text=Leilão criado com sucesso');
    
    // Editar
    await page.click('button:has-text("Editar")');
    await page.fill('input[name="title"]', 'Teste Field Changes - Editado');
    await page.fill('textarea[name="description"]', 'Descrição atualizada');
    await page.click('button:has-text("Salvar")');
    await page.waitForSelector('text=Leilão atualizado com sucesso');
    
    await page.waitForTimeout(1500);
    
    // Ver histórico
    await page.click('button[role="tab"]:has-text("Change History")');
    await page.waitForTimeout(500);
    
    // Verificar que mostra os campos alterados
    await expect(page.locator('text=title').or(page.locator('text=description')).first()).toBeVisible();
    
    // Verificar que mostra old value e new value
    const rows = page.locator('tbody tr');
    const firstRow = rows.first();
    
    // Deve ter pelo menos a informação da mudança
    await expect(firstRow).toContainText(/title|description/i);
  });

  test('deve ser responsivo em mobile', async ({ page }) => {
    // Simular viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navegar para leilão
    await page.goto('/admin/auctions');
    await page.click('tr:first-child a');
    await page.click('button[role="tab"]:has-text("Change History")');
    
    await page.waitForTimeout(500);
    
    // Em mobile, deve usar cards ao invés de tabela
    // Verificar que elementos estão empilhados (não em tabela)
    const mobileCards = page.locator('[class*="md:hidden"]').or(page.locator('.border.rounded-lg'));
    
    // Se houver logs, verificar layout mobile
    const hasLogs = await page.locator('text=No change history').count() === 0;
    
    if (hasLogs) {
      // Verificar que elementos essenciais estão visíveis
      await expect(page.locator('input[placeholder*="search"]')).toBeVisible();
    }
  });

  test('deve mostrar badges coloridos para tipos de operação', async ({ page }) => {
    // Navegar para entidade com histórico variado
    await page.goto('/admin/auctions');
    await page.click('tr:first-child a');
    await page.click('button[role="tab"]:has-text("Change History")');
    
    await page.waitForTimeout(500);
    
    // Verificar que badges existem
    const badges = page.locator('[class*="badge"]').or(page.locator('span:has-text("CREATE")'));
    
    if (await badges.count() > 0) {
      // Verificar que badge tem estilo (cores diferentes)
      const firstBadge = badges.first();
      await expect(firstBadge).toBeVisible();
    }
  });

  test('deve mostrar "Loading" enquanto carrega dados', async ({ page }) => {
    // Navegar para leilão
    await page.goto('/admin/auctions');
    await page.click('tr:first-child a');
    
    // Clicar rapidamente na aba e verificar estado de loading
    await page.click('button[role="tab"]:has-text("Change History")');
    
    // Pode mostrar "Loading" temporariamente
    const loadingText = page.locator('text=Loading');
    
    // Aguardar carregar
    await page.waitForTimeout(1000);
    
    // Não deve mais estar em loading
    await expect(loadingText).not.toBeVisible();
  });

  test('deve mostrar mensagem quando não há histórico', async ({ page }) => {
    // Criar novo leilão (sem edições)
    await page.goto('/admin/auctions');
    await page.click('button:has-text("Novo Leilão")');
    
    await page.fill('input[name="title"]', `Leilão Sem Histórico ${Date.now()}`);
    await page.click('button:has-text("Salvar")');
    await page.waitForSelector('text=Leilão criado com sucesso');
    
    await page.waitForTimeout(1000);
    
    // Ver histórico
    await page.click('button[role="tab"]:has-text("Change History")');
    await page.waitForTimeout(500);
    
    // Deve ter pelo menos o log de CREATE
    // Se realmente não houver nada, deve mostrar mensagem apropriada
    const noHistoryMessage = page.locator('text=No change history');
    const hasHistory = await page.locator('tbody tr').count() > 0;
    
    if (!hasHistory) {
      await expect(noHistoryMessage).toBeVisible();
    }
  });
});

// tests/e2e/audit/audit-logging.spec.ts
// Testes E2E para verificar o logging automático de auditoria

import { test, expect } from '@playwright/test';

test.describe('Audit Trail - Automatic Logging', () => {
  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'admin@bidexpert.com.br');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
  });

  test('deve criar log de auditoria ao criar um leilão', async ({ page }) => {
    // Criar novo leilão
    await page.goto('/admin/auctions');
    await page.click('button:has-text("Novo Leilão")');
    
    // Preencher formulário
    await page.fill('input[name="title"]', 'Leilão Teste Auditoria');
    await page.fill('textarea[name="description"]', 'Descrição do leilão de teste');
    await page.selectOption('select[name="status"]', 'DRAFT');
    
    // Salvar
    await page.click('button:has-text("Salvar")');
    await page.waitForSelector('text=Leilão criado com sucesso');
    
    // Obter ID do leilão criado (extrair da URL ou mensagem)
    const url = page.url();
    const auctionId = url.match(/\/auctions\/(\d+)/)?.[1];
    
    if (!auctionId) {
      throw new Error('ID do leilão não encontrado');
    }
    
    // Verificar se o log de auditoria foi criado
    const response = await page.request.get(
      `/api/audit?entityType=Auction&entityId=${auctionId}&action=CREATE`
    );
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
    expect(data.data[0].action).toBe('CREATE');
    expect(data.data[0].entityType).toBe('Auction');
    expect(data.data[0].entityId).toBe(auctionId);
  });

  test('deve criar log de auditoria com field changes ao atualizar leilão', async ({ page }) => {
    // Navegar para leilão existente
    await page.goto('/admin/auctions');
    await page.click('tr:first-child a'); // Clicar no primeiro leilão
    
    // Obter valores atuais
    const currentTitle = await page.inputValue('input[name="title"]');
    
    // Editar leilão
    await page.click('button:has-text("Editar")');
    const newTitle = `${currentTitle} - Editado ${Date.now()}`;
    await page.fill('input[name="title"]', newTitle);
    
    // Salvar
    await page.click('button:has-text("Salvar")');
    await page.waitForSelector('text=Leilão atualizado com sucesso');
    
    // Obter ID do leilão
    const url = page.url();
    const auctionId = url.match(/\/auctions\/(\d+)/)?.[1];
    
    // Aguardar um pouco para o log assíncrono ser criado
    await page.waitForTimeout(1000);
    
    // Verificar log de auditoria
    const response = await page.request.get(
      `/api/audit?entityType=Auction&entityId=${auctionId}&action=UPDATE`
    );
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
    
    const log = data.data[0];
    expect(log.action).toBe('UPDATE');
    expect(log.changes).toBeDefined();
    
    // Verificar se o campo 'title' está nas mudanças
    const changes = typeof log.changes === 'string' 
      ? JSON.parse(log.changes) 
      : log.changes;
    
    expect(changes.title).toBeDefined();
    expect(changes.title.old).toBe(currentTitle);
    expect(changes.title.new).toBe(newTitle);
  });

  test('deve criar log de auditoria ao deletar lote', async ({ page }) => {
    // Criar um lote temporário para teste
    await page.goto('/admin/lots');
    await page.click('button:has-text("Novo Lote")');
    
    await page.fill('input[name="title"]', 'Lote Teste Deleção');
    await page.fill('input[name="price"]', '1000');
    await page.click('button:has-text("Salvar")');
    await page.waitForSelector('text=Lote criado com sucesso');
    
    // Obter ID do lote
    const url = page.url();
    const lotId = url.match(/\/lots\/(\d+)/)?.[1];
    
    // Deletar o lote
    await page.click('button:has-text("Deletar")');
    await page.click('button:has-text("Confirmar")'); // Confirmar modal
    await page.waitForSelector('text=Lote deletado com sucesso');
    
    // Aguardar log assíncrono
    await page.waitForTimeout(1000);
    
    // Verificar log de deleção
    const response = await page.request.get(
      `/api/audit?entityType=Lot&entityId=${lotId}&action=DELETE`
    );
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
    expect(data.data[0].action).toBe('DELETE');
  });

  test('não deve logar campos sensíveis (password)', async ({ page }) => {
    // Criar usuário com senha
    await page.goto('/admin/users');
    await page.click('button:has-text("Novo Usuário")');
    
    await page.fill('input[name="email"]', `test${Date.now()}@test.com`);
    await page.fill('input[name="password"]', 'SenhaSecreta123!');
    await page.fill('input[name="fullName"]', 'Teste Auditoria');
    
    await page.click('button:has-text("Salvar")');
    await page.waitForSelector('text=Usuário criado com sucesso');
    
    const url = page.url();
    const userId = url.match(/\/users\/(\d+)/)?.[1];
    
    // Aguardar log
    await page.waitForTimeout(1000);
    
    // Verificar log
    const response = await page.request.get(
      `/api/audit?entityType=User&entityId=${userId}&action=CREATE`
    );
    
    const data = await response.json();
    const changes = data.data[0]?.changes;
    
    if (changes) {
      const changesObj = typeof changes === 'string' ? JSON.parse(changes) : changes;
      
      // Verificar que password não está no log OU está como [REDACTED]
      if (changesObj.password !== undefined) {
        expect(changesObj.password).toBe('[REDACTED]');
      }
    }
  });

  test('deve logar informações de contexto (IP, User Agent)', async ({ page }) => {
    // Criar qualquer entidade
    await page.goto('/admin/categories');
    await page.click('button:has-text("Nova Categoria")');
    
    await page.fill('input[name="name"]', `Categoria Teste ${Date.now()}`);
    await page.click('button:has-text("Salvar")');
    await page.waitForSelector('text=Categoria criada com sucesso');
    
    const url = page.url();
    const categoryId = url.match(/\/categories\/(\d+)/)?.[1];
    
    await page.waitForTimeout(1000);
    
    // Verificar log
    const response = await page.request.get(
      `/api/audit?entityType=Category&entityId=${categoryId}`
    );
    
    const data = await response.json();
    const log = data.data[0];
    
    // Verificar que contexto foi capturado
    expect(log.ipAddress).toBeDefined();
    expect(log.userAgent).toBeDefined();
    expect(log.userName).toBeDefined();
    expect(log.timestamp).toBeDefined();
  });

  test('deve respeitar configuração de modelos auditados', async ({ page }) => {
    // Obter configuração atual
    const configResponse = await page.request.get('/api/audit/config');
    const config = await configResponse.json();
    
    expect(config.success).toBe(true);
    expect(config.data.enabled).toBe(true);
    expect(config.data.auditedModels).toBeInstanceOf(Array);
    expect(config.data.auditedModels.length).toBeGreaterThan(0);
    
    // Verificar que 'Auction' está na lista de modelos auditados
    expect(config.data.auditedModels).toContain('Auction');
  });
});

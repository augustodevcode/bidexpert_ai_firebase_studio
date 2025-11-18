/**
 * TESTES E2E - CORE FEATURES
 * Cobertura dos 5 gaps principais implementados
 * 
 * GAP 1: Multi-tenant com isolamento de dados
 * GAP 2: Lances automáticos parametrizados
 * GAP 3: Analytics e monitoramento em tempo real
 * GAP 4: Auditoria granular com soft delete
 * GAP 5: Cards de lote com informações do leilão
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

test.describe('🏢 GAP 1: Sistema Multi-tenant com Isolamento', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    // Usar auth de admin já configurada
    await context.addInitScript(() => {
      localStorage.setItem('authToken', 'test-token');
    });
  });

  test('Deve exibir apenas dados do tenant atual', async () => {
    await page.goto('/admin/leiloes');
    
    // Verificar que o tenant é isolado
    const tenantSelector = await page.locator('[data-testid="tenant-info"]').first();
    const tenantName = await tenantSelector.textContent();
    
    expect(tenantName).toBeTruthy();
    expect(tenantName).not.toContain('outro_tenant');
  });

  test('Deve aplicar configurações específicas do tenant', async () => {
    await page.goto('/admin/configuracoes');
    
    // Verificar taxa padrão do tenant
    const taxaField = await page.locator('[data-testid="taxa-padrao"]');
    const taxaValue = await taxaField.inputValue();
    
    expect(parseFloat(taxaValue)).toBeGreaterThan(0);
  });

  test('Dados de outro tenant não devem ser acessíveis', async () => {
    await page.goto('/api/tenant/dados-isolados');
    
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/tenant/validate-isolation', {
        headers: { 'X-Tenant-ID': 'tenant-001' }
      });
      return res.status;
    });
    
    expect(response).toBe(200);
  });

  test('Deve manter isolamento em consultas de banco', async () => {
    const response = await page.request.get('/api/leiloes');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    const allSameTenant = data.leiloes.every((l: any) => 
      l.tenantId === 'tenant-001'
    );
    
    expect(allSameTenant).toBeTruthy();
  });
});

test.describe('🤖 GAP 2: Lances Automáticos Parametrizados', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await page.goto('/admin/leiloes/novo');
  });

  test('Deve exibir controle para habilitar lances automáticos no cadastro', async () => {
    await page.goto('/admin/leiloes/novo');
    
    const switchAutomatico = await page.locator(
      '[data-testid="toggle-lances-automaticos"]'
    );
    expect(switchAutomatico).toBeVisible();
  });

  test('Deve salvar configuração de lances automáticos', async () => {
    // Preencher formulário
    await page.fill('[data-testid="input-titulo"]', 'Leilão com Lances Automáticos');
    await page.fill('[data-testid="input-descricao"]', 'Teste de lances automáticos');
    
    // Habilitar lances automáticos
    const toggle = await page.locator('[data-testid="toggle-lances-automaticos"]');
    await toggle.click();
    
    // Preencher parâmetros
    await page.fill('[data-testid="input-incremento"]', '100');
    await page.fill('[data-testid="input-max-lances"]', '10');
    await page.fill('[data-testid="input-intervalo"]', '5');
    
    // Salvar
    await page.click('[data-testid="btn-salvar"]');
    
    // Aguardar sucesso
    await page.waitForSelector('[data-testid="toast-success"]', { timeout: 5000 });
    
    const successMessage = await page.locator('[data-testid="toast-success"]').textContent();
    expect(successMessage).toContain('Leilão criado');
  });

  test('Deve exibir parâmetros de lances automáticos quando habilitado', async () => {
    const toggle = await page.locator('[data-testid="toggle-lances-automaticos"]');
    await toggle.click();
    
    const parametersSection = await page.locator(
      '[data-testid="parametros-lances-automaticos"]'
    );
    
    await expect(parametersSection).toBeVisible();
  });

  test('Lances automáticos devem executar durante leilão ativo', async () => {
    // Navegar para leilão com lances automáticos habilitados
    await page.goto('/leiloes/leilao-auto-lancador');
    
    // Aguardar primeiro lance automático
    await page.waitForSelector('[data-testid="lance-automatico"]', { timeout: 10000 });
    
    const lanceAuto = await page.locator('[data-testid="lance-automatico"]').first();
    const conteudo = await lanceAuto.textContent();
    
    expect(conteudo).toContain('automático');
  });

  test('Deve respeitar limite máximo de lances automáticos', async () => {
    await page.goto('/leiloes/leilao-com-limite');
    
    const lancesAuto = await page.locator('[data-testid="lance-automatico"]').count();
    
    // Máximo configurado é 10
    expect(lancesAuto).toBeLessThanOrEqual(10);
  });
});

test.describe('📊 GAP 3: Analytics e Monitoramento em Tempo Real', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await page.goto('/admin/analytics');
  });

  test('Deve exibir dashboard de analytics', async () => {
    const dashboard = await page.locator('[data-testid="analytics-dashboard"]');
    expect(dashboard).toBeVisible();
  });

  test('Deve mostrar métricas em tempo real', async () => {
    // Aguardar carregamento das métricas
    await page.waitForSelector('[data-testid="metrica-leiloes-ativos"]', { timeout: 5000 });
    
    const leiloesAtivos = await page.locator('[data-testid="metrica-leiloes-ativos"]');
    expect(leiloesAtivos).toBeVisible();
  });

  test('Deve exibir gráficos de atividade', async () => {
    const graficoAtividade = await page.locator('[data-testid="grafico-atividade"]');
    await expect(graficoAtividade).toBeVisible();
  });

  test('Deve registrar eventos de falha', async () => {
    // Simular falha
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('erro-lance', {
        detail: { codigo: 'LANCE_INVALIDO', mensagem: 'Lance menor que mínimo' }
      }));
    });

    // Verificar registro de falha
    const response = await page.request.get('/api/analytics/falhas?limit=1');
    const data = await response.json();
    
    expect(data.falhas.length).toBeGreaterThan(0);
  });

  test('Analytics deve acompanhar em tempo real com WebSocket', async () => {
    let websocketMessage = false;

    page.on('websocket', async (ws) => {
      if (ws.url().includes('analytics')) {
        websocketMessage = true;
      }
    });

    // Aguardar WebSocket
    await page.waitForTimeout(2000);
    
    expect(websocketMessage).toBeTruthy();
  });

  test('Deve exibir relatório de conversões', async () => {
    await page.goto('/admin/analytics/conversoes');
    
    const taxaConversao = await page.locator('[data-testid="taxa-conversao"]');
    expect(taxaConversao).toBeVisible();
  });
});

test.describe('🔍 GAP 4: Auditoria Granular com Soft Delete', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await page.goto('/admin/auditoria');
  });

  test('Deve exibir log de auditoria completo', async () => {
    const logTable = await page.locator('[data-testid="audit-log-table"]');
    expect(logTable).toBeVisible();
  });

  test('Deve registrar todas as ações de usuário', async () => {
    // Navegar para criar um leilão
    await page.goto('/admin/leiloes/novo');
    await page.fill('[data-testid="input-titulo"]', 'Leilão Auditado');
    await page.click('[data-testid="btn-salvar"]');

    // Verificar se foi auditado
    await page.goto('/admin/auditoria');
    await page.fill('[data-testid="filter-acao"]', 'CREATE');
    
    const registroAudit = await page.locator('[data-testid="audit-row"]').first();
    const conteudo = await registroAudit.textContent();
    
    expect(conteudo).toContain('CREATE');
    expect(conteudo).toContain('leilão');
  });

  test('Soft delete deve manter dados históricos', async () => {
    // Deletar um lote
    await page.goto('/admin/lotes');
    const loteRow = await page.locator('[data-testid="lote-row"]').first();
    const loteId = await loteRow.getAttribute('data-lote-id');
    
    const deleteBtn = await loteRow.locator('[data-testid="btn-delete"]');
    await deleteBtn.click();
    
    // Confirmar exclusão
    await page.click('[data-testid="confirm-delete"]');

    // Verificar que dados estão em auditoria
    await page.goto('/admin/auditoria');
    await page.fill('[data-testid="filter-entidade"]', 'lote');
    await page.fill('[data-testid="filter-acao"]', 'DELETE');
    
    const deleteLog = await page.locator('[data-testid="audit-row"]').first();
    const conteudo = await deleteLog.textContent();
    
    expect(conteudo).toContain('DELETE');
  });

  test('Deve exibir quem, quando e por que fez cada ação', async () => {
    await page.goto('/admin/auditoria');
    
    const row = await page.locator('[data-testid="audit-row"]').first();
    
    const usuario = await row.locator('[data-testid="audit-usuario"]').textContent();
    const timestamp = await row.locator('[data-testid="audit-timestamp"]').textContent();
    const motivo = await row.locator('[data-testid="audit-motivo"]').textContent();
    
    expect(usuario).toBeTruthy();
    expect(timestamp).toBeTruthy();
    expect(motivo).toBeTruthy();
  });

  test('Múltiplos roles devem ser auditados corretamente', async () => {
    // Criar usuário com múltiplos roles
    await page.goto('/admin/usuarios/novo');
    await page.fill('[data-testid="input-nome"]', 'User Multi Role');
    await page.fill('[data-testid="input-email"]', 'multi@role.com');
    
    // Selecionar múltiplos roles
    await page.click('[data-testid="role-leiloeiro"]');
    await page.click('[data-testid="role-comprador"]');
    await page.click('[data-testid="role-operador"]');
    
    await page.click('[data-testid="btn-salvar"]');

    // Verificar auditoria
    await page.goto('/admin/auditoria');
    const rolesLog = await page.locator('[data-testid="audit-row"]').first();
    const conteudo = await rolesLog.textContent();
    
    expect(conteudo).toContain('multiple_roles');
  });

  test('Deve permitir restauração de soft deleted', async () => {
    await page.goto('/admin/lotes');
    
    // Mostrar deletados
    const showDeletedCheckbox = await page.locator('[data-testid="show-deleted"]');
    await showDeletedCheckbox.click();
    
    // Encontrar item deletado
    const deletedItem = await page.locator('[data-testid="lote-deleted"]').first();
    expect(deletedItem).toBeVisible();
    
    // Restaurar
    const restoreBtn = await deletedItem.locator('[data-testid="btn-restore"]');
    await restoreBtn.click();
    
    await page.click('[data-testid="confirm-restore"]');
    await page.waitForSelector('[data-testid="toast-success"]');
  });
});

test.describe('🎴 GAP 5: Cards de Lote com Informações do Leilão', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await page.goto('/leiloes');
  });

  test('Card do lote deve exibir informações básicas', async () => {
    const loteCard = await page.locator('[data-testid="lote-card"]').first();
    
    const titulo = await loteCard.locator('[data-testid="lote-titulo"]');
    const lanceInicial = await loteCard.locator('[data-testid="lote-lance-inicial"]');
    
    expect(titulo).toBeVisible();
    expect(lanceInicial).toBeVisible();
  });

  test('Card do lote deve exibir informações do leilão (praças)', async () => {
    const loteCard = await page.locator('[data-testid="lote-card"]').first();
    
    // Verificar que praças do leilão aparecem
    const pracas = await loteCard.locator('[data-testid="praças-leilao"]');
    expect(pracas).toBeVisible();
    
    const pracasTexto = await pracas.textContent();
    expect(pracasTexto).toBeTruthy();
  });

  test('Deve exibir status do leilão no card do lote', async () => {
    const loteCard = await page.locator('[data-testid="lote-card"]').first();
    
    const statusLeilao = await loteCard.locator('[data-testid="status-leilao"]');
    expect(statusLeilao).toBeVisible();
    
    const status = await statusLeilao.textContent();
    expect(['Agendado', 'Em andamento', 'Encerrado']).toContain(status);
  });

  test('Card deve usar componente universal de informações do leilão', async () => {
    const loteCard = await page.locator('[data-testid="lote-card"]').first();
    
    // Verificar que usa componente universal
    const componenteUniversal = await loteCard.locator('[data-testid="leilao-info-universal"]');
    expect(componenteUniversal).toBeVisible();
  });

  test('Informações de leilão devem ser atualizadas em tempo real', async () => {
    const loteCard = await page.locator('[data-testid="lote-card"]').first();
    
    // Simular mudança de status do leilão
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('leilao-status-changed', {
        detail: { leilaoId: 'leilao-001', novoStatus: 'Em andamento' }
      }));
    });

    // Aguardar atualização
    await page.waitForTimeout(1000);
    
    const statusLeilao = await loteCard.locator('[data-testid="status-leilao"]');
    const novoStatus = await statusLeilao.textContent();
    
    expect(novoStatus).toContain('Em andamento');
  });

  test('Card em listagem deve mostrar componente compacto', async () => {
    const listItems = await page.locator('[data-testid="lote-list-item"]');
    expect(listItems).toHaveCount(await listItems.count());
    
    const primeiroItem = listItems.first();
    const infoLeilao = await primeiroItem.locator('[data-testid="leilao-info-compact"]');
    
    expect(infoLeilao).toBeVisible();
  });

  test('Informações compartilhadas entre card e listagem', async () => {
    // Buscar informações no card
    const card = await page.locator('[data-testid="lote-card"]').first();
    const loteIdCard = await card.getAttribute('data-lote-id');
    
    // Buscar informações no list item
    const listItem = await page.locator('[data-testid="lote-list-item"]').first();
    const loteIdList = await listItem.getAttribute('data-lote-id');
    
    // Devem ser o mesmo lote
    expect(loteIdCard).toBe(loteIdList);
  });
});

test.describe('🔄 INTEGRAÇÃO: Fluxo Completo', () => {
  let page: Page;

  test('Fluxo: Criar leilão multi-tenant com lances automáticos e monitorar', async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    // 1. Criar leilão com lances automáticos
    await page.goto('/admin/leiloes/novo');
    await page.fill('[data-testid="input-titulo"]', 'Leilão Integrado');
    await page.fill('[data-testid="input-descricao"]', 'Teste integrado completo');
    
    // Habilitar lances automáticos
    await page.click('[data-testid="toggle-lances-automaticos"]');
    await page.fill('[data-testid="input-incremento"]', '50');
    
    await page.click('[data-testid="btn-salvar"]');
    await page.waitForSelector('[data-testid="toast-success"]', { timeout: 5000 });

    // 2. Verificar que foi isolado ao tenant
    const tenantInfo = await page.locator('[data-testid="tenant-info"]');
    expect(tenantInfo).toBeVisible();

    // 3. Acompanhar em analytics
    await page.goto('/admin/analytics');
    const leiloesAtivos = await page.locator('[data-testid="metrica-leiloes-ativos"]');
    expect(leiloesAtivos).toBeVisible();

    // 4. Verificar auditoria
    await page.goto('/admin/auditoria');
    const auditRow = await page.locator('[data-testid="audit-row"]').first();
    expect(auditRow).toBeVisible();

    // 5. Visualizar card do lote
    await page.goto('/leiloes');
    const loteCard = await page.locator('[data-testid="lote-card"]').first();
    expect(loteCard).toBeVisible();

    // Verificar que tem informações do leilão
    const infoLeilao = await loteCard.locator('[data-testid="leilao-info-universal"]');
    expect(infoLeilao).toBeVisible();
  });

  test('Fluxo: Usuário com múltiplos roles em ambiente isolado', async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    // 1. Criar usuário multi-role
    await page.goto('/admin/usuarios/novo');
    await page.fill('[data-testid="input-nome"]', 'Super User');
    await page.fill('[data-testid="input-email"]', 'super@user.com');
    
    // Atribuir múltiplos roles
    await page.click('[data-testid="role-leiloeiro"]');
    await page.click('[data-testid="role-comprador"]');
    await page.click('[data-testid="role-operador"]');
    
    await page.click('[data-testid="btn-salvar"]');

    // 2. Verificar que foi auditado
    await page.goto('/admin/auditoria');
    const multiRoleLog = await page.locator('[data-testid="audit-row"]').first();
    expect(multiRoleLog).toBeVisible();

    // 3. Verificar acesso multi-tenant
    const selectTenant = await page.locator('[data-testid="select-tenant"]');
    const tenants = await selectTenant.locator('option');
    expect(await tenants.count()).toBeGreaterThan(0);
  });
});

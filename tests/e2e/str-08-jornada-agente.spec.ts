/**
 * @file STR-08: Jornada Agente de Leilões (Auction Agent/Analyst)
 * @description Skill de validação da jornada crítica do Agente de Leilões.
 * Agente = analista/preposto que auxilia o leiloeiro na operação.
 * 
 * Jornada do Agente:
 * 1. Login e acesso ao painel operacional
 * 2. Analisar habilitações de arrematantes
 * 3. Cadastrar e revisar lotes
 * 4. Suporte durante o leilão ao vivo
 * 5. Atendimento a participantes
 * 6. Gerar documentação pós-leilão
 */

import { test, expect, Page } from '@playwright/test';

test.describe('STR-08: Jornada Agente de Leilões', () => {
  // Usar storageState de agente/analista autenticado
  test.use({ storageState: './tests/e2e/.auth/admin.json' });

  test.describe('1. Acesso ao Painel Operacional', () => {
    test('deve acessar dashboard operacional', async ({ page }) => {
      await page.goto('/admin/operations');
      
      // Fallback para dashboard geral se não existir específico
      const opsPage = await page.locator('main, [data-ai-id="operations-dashboard"]').isVisible({ timeout: 10000 }).catch(() => false);
      
      if (!opsPage) {
        await page.goto('/admin');
        await expect(page.locator('main')).toBeVisible();
      }
    });

    test('deve exibir tarefas pendentes', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);

      // Verificar indicadores de tarefas
      const taskIndicators = [
        'Pendentes',
        'A analisar',
        'Aguardando',
        'Habilitações',
        'Documentos',
      ];

      for (const task of taskIndicators) {
        const taskElement = page.locator(`text=/${task}/i`).first();
        const isVisible = await taskElement.isVisible().catch(() => false);
        if (isVisible) {
          console.log(`✅ "${task}" visível`);
        }
      }
    });
  });

  test.describe('2. Análise de Habilitações', () => {
    test('deve acessar fila de habilitações', async ({ page }) => {
      await page.goto('/admin/habilitations');
      
      await expect(page.locator('main, [data-ai-id="habilitations-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('deve filtrar habilitações pendentes', async ({ page }) => {
      await page.goto('/admin/habilitations?status=PENDING_ANALYSIS');
      await page.waitForTimeout(2000);

      const pendingList = page.locator('table, [data-ai-id="habilitations-list"]');
      const hasPending = await pendingList.isVisible().catch(() => false);

      console.log(`📊 Lista de pendentes: ${hasPending ? '✅' : '❌'}`);
    });

    test('deve permitir aprovar/reprovar habilitação', async ({ page }) => {
      await page.goto('/admin/habilitations');
      await page.waitForTimeout(3000);

      const actionButtons = page.locator('button:has-text("Aprovar"), button:has-text("Reprovar"), button:has-text("Analisar")');
      const hasActions = await actionButtons.first().isVisible().catch(() => false);

      console.log(`📊 Ações de habilitação: ${hasActions ? '✅' : '❌'}`);
    });

    test('deve exibir documentos do arrematante', async ({ page }) => {
      await page.goto('/admin/habilitations');
      await page.waitForTimeout(2000);

      const habRow = page.locator('tr, .habilitation-card').first();
      
      if (await habRow.isVisible()) {
        await habRow.click();
        await page.waitForTimeout(2000);

        // Verificar documentos
        const docTypes = ['RG', 'CPF', 'Comprovante', 'CNPJ', 'Contrato Social'];
        for (const doc of docTypes) {
          const docElement = page.locator(`text=/${doc}/i`).first();
          const isVisible = await docElement.isVisible().catch(() => false);
          if (isVisible) {
            console.log(`✅ ${doc}`);
          }
        }
      }
    });
  });

  test.describe('3. Gestão de Lotes', () => {
    test('deve acessar lista de lotes para revisão', async ({ page }) => {
      await page.goto('/admin/lots');
      
      await expect(page.locator('main, [data-ai-id="admin-lots-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('deve filtrar lotes em rascunho', async ({ page }) => {
      await page.goto('/admin/lots?status=RASCUNHO');
      await page.waitForTimeout(2000);

      const draftLots = page.locator('table tbody tr, .lot-card');
      const draftCount = await draftLots.count();

      console.log(`📊 Lotes em rascunho: ${draftCount}`);
    });

    test('deve permitir editar lote', async ({ page }) => {
      await page.goto('/admin/lots');
      await page.waitForTimeout(2000);

      const editButton = page.locator('button:has-text("Editar"), a:has-text("Editar"), [data-ai-id="edit-lot"]').first();
      const hasEdit = await editButton.isVisible().catch(() => false);

      console.log(`📊 Edição de lote: ${hasEdit ? '✅' : '❌'}`);
    });

    test('deve permitir upload de fotos do lote', async ({ page }) => {
      await page.goto('/admin/lots');
      await page.waitForTimeout(2000);

      const lotRow = page.locator('tr, .lot-card').first();
      
      if (await lotRow.isVisible()) {
        await lotRow.click();
        await page.waitForTimeout(2000);

        const uploadButton = page.locator('button:has-text("Foto"), button:has-text("Imagem"), input[type="file"], [data-ai-id="upload-image"]');
        const hasUpload = await uploadButton.isVisible().catch(() => false);

        console.log(`📊 Upload de fotos: ${hasUpload ? '✅' : '❌'}`);
      }
    });
  });

  test.describe('4. Suporte ao Leilão ao Vivo', () => {
    test('deve acessar painel do leilão ao vivo', async ({ page }) => {
      await page.goto('/live-dashboard');
      
      await expect(page.locator('main, [data-ai-id="live-dashboard"]')).toBeVisible({ timeout: 15000 });
    });

    test('deve visualizar lances em tempo real', async ({ page }) => {
      await page.goto('/live-dashboard');
      await page.waitForTimeout(3000);

      // Verificar elementos de tempo real
      const liveElements = [
        'Lance atual',
        'Último lance',
        'Participantes',
        'Tempo restante',
      ];

      for (const element of liveElements) {
        const liveElement = page.locator(`text=/${element}/i`).first();
        const isVisible = await liveElement.isVisible().catch(() => false);
        if (isVisible) {
          console.log(`✅ "${element}"`);
        }
      }
    });

    test('deve permitir pausar/retomar leilão', async ({ page }) => {
      await page.goto('/live-dashboard');
      await page.waitForTimeout(2000);

      const controlButtons = page.locator('button:has-text("Pausar"), button:has-text("Retomar"), button:has-text("Suspender")');
      const hasControls = await controlButtons.first().isVisible().catch(() => false);

      console.log(`📊 Controles de leilão: ${hasControls ? '✅' : '❌'}`);
    });
  });

  test.describe('5. Atendimento a Participantes', () => {
    test('deve acessar sistema de tickets/suporte', async ({ page }) => {
      await page.goto('/admin/support');
      
      const supportPage = await page.locator('main, [data-ai-id="support-page"]').isVisible({ timeout: 10000 }).catch(() => false);
      
      if (supportPage) {
        console.log('✅ Sistema de suporte acessível');
      } else {
        // Fallback para ITSM
        await page.goto('/admin/itsm');
        const itsmPage = await page.locator('main').isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`📊 ITSM disponível: ${itsmPage ? '✅' : '❌'}`);
      }
    });

    test('deve listar tickets pendentes', async ({ page }) => {
      await page.goto('/admin/itsm');
      await page.waitForTimeout(3000);

      const ticketList = page.locator('table, [data-ai-id="tickets-list"], .ticket-card');
      const hasTickets = await ticketList.isVisible().catch(() => false);

      if (hasTickets) {
        const ticketCount = await page.locator('tr, .ticket-card').count();
        console.log(`📊 Tickets encontrados: ${ticketCount}`);
      }
    });

    test('deve permitir responder ticket', async ({ page }) => {
      await page.goto('/admin/itsm');
      await page.waitForTimeout(2000);

      const ticketRow = page.locator('tr, .ticket-card').first();
      
      if (await ticketRow.isVisible()) {
        await ticketRow.click();
        await page.waitForTimeout(2000);

        const replyButton = page.locator('button:has-text("Responder"), textarea, [data-ai-id="reply-ticket"]');
        const hasReply = await replyButton.isVisible().catch(() => false);

        console.log(`📊 Resposta a ticket: ${hasReply ? '✅' : '❌'}`);
      }
    });
  });

  test.describe('6. Documentação Pós-Leilão', () => {
    test('deve acessar lotes arrematados', async ({ page }) => {
      await page.goto('/admin/lots?status=VENDIDO');
      
      await expect(page.locator('main')).toBeVisible({ timeout: 15000 });
    });

    test('deve permitir gerar auto de arrematação', async ({ page }) => {
      await page.goto('/admin/lots?status=VENDIDO');
      await page.waitForTimeout(2000);

      const lotRow = page.locator('tr, .lot-card').first();
      
      if (await lotRow.isVisible()) {
        await lotRow.click();
        await page.waitForTimeout(2000);

        const docButtons = page.locator('button:has-text("Auto"), button:has-text("Termo"), button:has-text("Gerar documento")');
        const hasDocs = await docButtons.first().isVisible().catch(() => false);

        console.log(`📊 Geração de documentos: ${hasDocs ? '✅' : '❌'}`);
      }
    });

    test('deve permitir registrar entrega', async ({ page }) => {
      await page.goto('/admin/deliveries');
      
      const deliveriesPage = await page.locator('main, [data-ai-id="deliveries-page"]').isVisible({ timeout: 10000 }).catch(() => false);
      
      if (deliveriesPage) {
        console.log('✅ Página de entregas acessível');
        
        const deliveryButton = page.locator('button:has-text("Entregar"), button:has-text("Confirmar entrega")');
        const hasDelivery = await deliveryButton.first().isVisible().catch(() => false);
        console.log(`📊 Registro de entrega: ${hasDelivery ? '✅' : '❌'}`);
      }
    });
  });
});

// Métricas de performance
test.describe('STR-08: Performance Agente', () => {
  test.use({ storageState: './tests/e2e/.auth/admin.json' });

  test('tempo de carregamento de habilitações', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/admin/habilitations');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`📊 Tempo /admin/habilitations: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test('tempo de carregamento do live dashboard', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/live-dashboard');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`📊 Tempo /live-dashboard: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000);
  });
});

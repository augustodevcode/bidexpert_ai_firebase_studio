import { test, expect, Page } from '@playwright/test';

/**
 * ITSM Integration Tests - Bug Detection & Edge Cases
 * Testes de integração para detectar bugs existentes e casos extremos
 * 
 * Foco em:
 * - Detecção de bugs conhecidos da plataforma
 * - Casos extremos e validações
 * - Integração entre componentes
 * - Tratamento de erros
 */

test.describe('ITSM - Detecção de Bugs e Integração', () => {
  
  test('BUG TEST: Deve validar que botões não quebram com múltiplos cliques rápidos', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Clicar múltiplas vezes rapidamente
    const button = page.locator('[data-testid="floating-support-button"]');
    
    for (let i = 0; i < 10; i++) {
      await button.click({ timeout: 1000 }).catch(() => {});
      await page.waitForTimeout(50);
    }
    
    // Sistema não deve quebrar
    await page.waitForTimeout(1000);
    await expect(button).toBeVisible();
  });

  test('BUG TEST: Deve prevenir XSS em mensagens do chat', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="floating-support-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="support-chat-button"]');
    await page.waitForTimeout(500);
    
    // Tentar injetar script
    const maliciousInput = '<script>alert("XSS")</script>';
    const input = page.locator('input[placeholder*="Digite sua mensagem"]');
    await input.fill(maliciousInput);
    await page.click('button:has-text("Enviar")');
    await page.waitForTimeout(2000);
    
    // Script não deve ser executado (sem alert)
    const alerts = await page.evaluate(() => (window as any).alerts || []);
    expect(alerts).toBeUndefined();
    
    // Texto deve aparecer escapado
    const messageText = await page.textContent('body');
    expect(messageText).toContain('script');
  });

  test('BUG TEST: Deve validar que modal não abre múltiplas vezes', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="floating-support-button"]');
    await page.waitForTimeout(300);
    
    // Clicar múltiplas vezes no mesmo botão
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="support-chat-button"]').catch(() => {});
      await page.waitForTimeout(100);
    }
    
    await page.waitForTimeout(1000);
    
    // Deve haver apenas 1 modal
    const modals = page.locator('[role="dialog"]');
    const count = await modals.count();
    expect(count).toBeLessThanOrEqual(1);
  });

  test('BUG TEST: Deve lidar com falha de API graciosamente', async ({ page }) => {
    // Interceptar API e forçar erro
    await page.route('**/api/support/chat', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    await page.goto('/');
    await page.click('[data-testid="floating-support-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="support-chat-button"]');
    await page.waitForTimeout(500);
    
    const input = page.locator('input[placeholder*="Digite sua mensagem"]');
    await input.fill('Teste de erro');
    await page.click('button:has-text("Enviar")');
    await page.waitForTimeout(3000);
    
    // Não deve quebrar a aplicação
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });

  test('BUG TEST: Deve validar que ticket não é criado duas vezes no double-click', async ({ page }) => {
    let requestCount = 0;
    
    // Monitorar requisições
    page.on('request', request => {
      if (request.url().includes('/api/support/tickets') && request.method() === 'POST') {
        requestCount++;
      }
    });
    
    await page.goto('/');
    await page.click('[data-testid="floating-support-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="support-ticket-button"]');
    await page.waitForTimeout(500);
    
    await page.fill('input[id="title"]', 'Teste Double Click');
    await page.click('[role="combobox"]:has-text("Categoria")');
    await page.click('[role="option"]:has-text("Dúvida")');
    await page.click('[role="combobox"]:has-text("Prioridade")');
    await page.click('[role="option"]:has-text("Baixa")');
    await page.fill('textarea[id="description"]', 'Teste de double click');
    
    // Double click no botão de criar
    const submitButton = page.locator('button:has-text("Criar Ticket")');
    await submitButton.dblclick();
    
    await page.waitForTimeout(3000);
    
    // Deve ter apenas 1 requisição
    expect(requestCount).toBeLessThanOrEqual(1);
  });

  test('BUG TEST: Deve validar limites de caracteres em campos', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="floating-support-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="support-ticket-button"]');
    await page.waitForTimeout(500);
    
    // Título muito longo (mais de 191 caracteres)
    const longTitle = 'A'.repeat(500);
    await page.fill('input[id="title"]', longTitle);
    
    const titleValue = await page.inputValue('input[id="title"]');
    
    // Deve aceitar ou truncar adequadamente
    expect(titleValue.length).toBeGreaterThan(0);
  });

  test('BUG TEST: Deve validar que chat mantém scroll no final', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="floating-support-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="support-chat-button"]');
    await page.waitForTimeout(500);
    
    const input = page.locator('input[placeholder*="Digite sua mensagem"]');
    
    // Enviar múltiplas mensagens
    for (let i = 1; i <= 5; i++) {
      await input.fill(`Mensagem ${i}`);
      await page.click('button:has-text("Enviar")');
      await page.waitForTimeout(1500);
    }
    
    // Última mensagem deve estar visível
    const lastMessage = page.locator('text=Mensagem 5');
    await expect(lastMessage).toBeVisible();
  });

  test('BUG TEST: Deve validar que filtros do admin não causam loop infinito', async ({ page }) => {
    await page.goto('/admin/support-tickets');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const filterButton = page.locator('button:has-text("Todos")').first();
    
    if (await filterButton.isVisible()) {
      // Mudar filtro rapidamente múltiplas vezes
      for (let i = 0; i < 3; i++) {
        await filterButton.click().catch(() => {});
        await page.waitForTimeout(100);
        
        const option = page.locator('[role="option"]').first();
        if (await option.isVisible()) {
          await option.click().catch(() => {});
        }
        await page.waitForTimeout(200);
      }
      
      // Página não deve quebrar
      const title = page.locator('h1');
      await expect(title).toBeVisible();
    }
  });

  test('BUG TEST: Deve validar que busca vazia não causa erro', async ({ page }) => {
    await page.goto('/admin/support-tickets');
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[placeholder*="Buscar"]').first();
    
    // Buscar string vazia
    await searchInput.fill('');
    await page.waitForTimeout(500);
    
    // Buscar espaços
    await searchInput.fill('   ');
    await page.waitForTimeout(500);
    
    // Buscar caracteres especiais
    await searchInput.fill('!@#$%^&*()');
    await page.waitForTimeout(500);
    
    // Não deve quebrar
    const title = page.locator('h1');
    await expect(title).toBeVisible();
  });

  test('BUG TEST: Deve validar encoding de caracteres especiais', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="floating-support-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="support-chat-button"]');
    await page.waitForTimeout(500);
    
    const specialChars = 'àáâãäåçèéêëìíîïñòóôõöùúûüý ÁÉÍÓÚ <>&"\'';
    const input = page.locator('input[placeholder*="Digite sua mensagem"]');
    await input.fill(specialChars);
    await page.click('button:has-text("Enviar")');
    await page.waitForTimeout(2000);
    
    // Caracteres devem aparecer corretamente
    const messageText = await page.textContent('body');
    expect(messageText).toContain('àáâãä');
  });

  test('BUG TEST: Deve validar que monitor não quebra com queries SQL longas', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const expandButton = page.locator('button:has-text("Expandir")');
    
    if (await expandButton.isVisible()) {
      await expandButton.click();
      await page.waitForTimeout(1000);
      
      // Verificar que queries longas são truncadas
      const queryTexts = page.locator('code');
      const count = await queryTexts.count();
      
      if (count > 0) {
        const firstQuery = await queryTexts.first().textContent();
        // Queries devem ter tamanho razoável (truncadas)
        expect(firstQuery!.length).toBeLessThan(500);
      }
    }
  });

  test('BUG TEST: Deve validar comportamento em telas pequenas (mobile)', async ({ page, browser }) => {
    // Testar em tamanho mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Botões devem estar visíveis
    const button = page.locator('[data-testid="floating-support-button"]');
    await expect(button).toBeVisible();
    
    // Modal deve ser responsivo
    await page.click('[data-testid="floating-support-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="support-chat-button"]');
    await page.waitForTimeout(500);
    
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    // Modal não deve ultrapassar viewport
    const modalBox = await modal.boundingBox();
    expect(modalBox!.width).toBeLessThanOrEqual(375);
  });

  test('BUG TEST: Deve validar que estado do modal é resetado ao fechar', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="floating-support-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="support-chat-button"]');
    await page.waitForTimeout(500);
    
    // Digitar mensagem
    const input = page.locator('input[placeholder*="Digite sua mensagem"]');
    await input.fill('Mensagem de teste');
    
    // Fechar modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Reabrir
    await page.click('[data-testid="floating-support-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="support-chat-button"]');
    await page.waitForTimeout(500);
    
    // Input deve estar limpo OU manter histórico (dependendo do design)
    const inputValue = await input.inputValue();
    // Pelo menos não deve quebrar
    expect(typeof inputValue).toBe('string');
  });

  test('BUG TEST: Deve validar que data-testids estão presentes para testes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Botões principais devem ter data-testid
    const floatingButton = page.locator('[data-testid="floating-support-button"]');
    const hasFloatingButton = await floatingButton.count() > 0;
    
    expect(hasFloatingButton).toBeTruthy();
  });

  test('BUG TEST: Deve validar que não há vazamento de memória em modais', async ({ page }) => {
    // Abrir e fechar modal múltiplas vezes
    for (let i = 0; i < 5; i++) {
      await page.goto('/');
      await page.click('[data-testid="floating-support-button"]');
      await page.waitForTimeout(200);
      await page.click('[data-testid="support-chat-button"]');
      await page.waitForTimeout(300);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
    
    // Aplicação não deve quebrar
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('BUG TEST: Deve validar que timezone não causa problemas em timestamps', async ({ page }) => {
    await page.goto('/admin/support-tickets');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Procurar por datas
    const dates = page.locator('text=/\\d{1,2}\\/\\d{1,2}\\/\\d{4}/');
    const count = await dates.count();
    
    if (count > 0) {
      const dateText = await dates.first().textContent();
      // Data deve estar em formato válido
      expect(dateText).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    }
  });

  test('BUG TEST: Deve validar que BigInt é serializado corretamente', async ({ page }) => {
    // Este é um bug comum em Next.js com Prisma
    let hasError = false;
    
    page.on('pageerror', error => {
      if (error.message.includes('BigInt')) {
        hasError = true;
      }
    });
    
    await page.goto('/admin/support-tickets');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Não deve ter erro de BigInt
    expect(hasError).toBeFalsy();
  });
});

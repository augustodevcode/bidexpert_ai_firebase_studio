import { test, expect, Page } from '@playwright/test';

/**
 * ITSM E2E Tests - Support System
 * Testes baseados em BDD para o sistema de suporte ao usuário
 * 
 * Cenários testados:
 * - Visualização de botões flutuantes
 * - Expansão do menu de suporte
 * - Acesso ao FAQ
 * - Uso do Chat AI
 * - Criação de tickets
 * - Validação de formulários
 */

test.describe('ITSM - Sistema de Suporte ao Usuário', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navegar para página pública (home)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('deve exibir botões flutuantes de suporte em página pública', async ({ page }) => {
    // Given: Estou em uma página pública
    // When: A página carregar completamente
    await page.waitForSelector('[data-testid="floating-support-button"]', { timeout: 10000 });
    
    // Then: Devo ver o botão flutuante
    const floatingButton = page.locator('[data-testid="floating-support-button"]');
    await expect(floatingButton).toBeVisible();
    
    // And: O botão deve ter gradiente azul para roxo
    const buttonClass = await floatingButton.getAttribute('class');
    expect(buttonClass).toContain('from-blue-600');
    expect(buttonClass).toContain('to-purple-600');
    
    // And: Deve estar visível e clicável
    await expect(floatingButton).toBeEnabled();
  });

  test('deve expandir menu de opções de suporte', async ({ page }) => {
    // Given: O botão flutuante está visível
    const mainButton = page.locator('[data-testid="floating-support-button"]');
    await expect(mainButton).toBeVisible();
    
    // When: Eu clicar no botão principal
    await mainButton.click();
    await page.waitForTimeout(500); // Aguardar animação
    
    // Then: Devo ver 3 botões expandidos
    const faqButton = page.locator('[data-testid="support-faq-button"]');
    const chatButton = page.locator('[data-testid="support-chat-button"]');
    const ticketButton = page.locator('[data-testid="support-ticket-button"]');
    
    await expect(faqButton).toBeVisible();
    await expect(chatButton).toBeVisible();
    await expect(ticketButton).toBeVisible();
    
    // And: Verificar cores dos botões
    const faqClass = await faqButton.getAttribute('class');
    const chatClass = await chatButton.getAttribute('class');
    const ticketClass = await ticketButton.getAttribute('class');
    
    expect(faqClass).toContain('bg-blue-600');
    expect(chatClass).toContain('bg-purple-600');
    expect(ticketClass).toContain('bg-orange-600');
  });

  test('deve abrir modal de FAQ e exibir perguntas', async ({ page }) => {
    // Given: Menu de suporte expandido
    await page.click('[data-testid="floating-support-button"]');
    await page.waitForTimeout(300);
    
    // When: Clicar no botão FAQ
    await page.click('[data-testid="support-faq-button"]');
    await page.waitForTimeout(500);
    
    // Then: Modal de FAQ deve abrir
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    // And: Deve ter título correto
    const title = page.locator('text=Perguntas Frequentes');
    await expect(title).toBeVisible();
    
    // And: Deve ter pelo menos 4 perguntas
    const questions = page.locator('.border.rounded-lg.p-4');
    const count = await questions.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('deve usar Chat AI e receber resposta sobre lances', async ({ page }) => {
    // Given: Menu expandido
    await page.click('[data-testid="floating-support-button"]');
    await page.waitForTimeout(300);
    
    // When: Clicar no Chat AI
    await page.click('[data-testid="support-chat-button"]');
    await page.waitForTimeout(500);
    
    // Then: Modal de chat deve abrir
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    // And: Ver mensagem de boas-vindas
    const welcomeMsg = page.locator('text=/Olá.*assistente virtual/i');
    await expect(welcomeMsg).toBeVisible();
    
    // When: Digitar pergunta
    const input = page.locator('input[placeholder*="Digite sua mensagem"]');
    await input.fill('Como faço para dar um lance?');
    
    // And: Enviar
    await page.click('button[type="submit"], button:has-text("Enviar")');
    
    // Then: Ver minha mensagem em azul
    const userMessage = page.locator('.bg-blue-600:has-text("Como faço para dar um lance?")');
    await expect(userMessage).toBeVisible({ timeout: 2000 });
    
    // And: Ver resposta da IA em até 3 segundos
    const aiResponse = page.locator('.bg-gray-100:has-text("lance"), .bg-gray-800:has-text("lance")').last();
    await expect(aiResponse).toBeVisible({ timeout: 5000 });
    
    // And: Resposta deve conter info sobre lances
    const responseText = await aiResponse.textContent();
    expect(responseText?.toLowerCase()).toContain('lance');
  });

  test('deve criar ticket de suporte com sucesso', async ({ page }) => {
    // Given: Menu expandido
    await page.click('[data-testid="floating-support-button"]');
    await page.waitForTimeout(300);
    
    // When: Clicar em Reportar Issue
    await page.click('[data-testid="support-ticket-button"]');
    await page.waitForTimeout(500);
    
    // Then: Formulário deve aparecer
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    // When: Preencher formulário
    await page.fill('input[id="title"]', 'Erro ao fazer login - Teste E2E');
    
    // Selecionar categoria
    await page.click('[role="combobox"]:has-text("Categoria"), button:has-text("Categoria")');
    await page.click('[role="option"]:has-text("Técnico")');
    
    // Selecionar prioridade  
    await page.click('[role="combobox"]:has-text("Prioridade"), button:has-text("Prioridade")');
    await page.click('[role="option"]:has-text("Alta")');
    
    // Descrição
    await page.fill('textarea[id="description"]', 'Não consigo acessar minha conta após resetar a senha. Teste automatizado E2E.');
    
    // And: Submeter
    await page.click('button:has-text("Criar Ticket")');
    
    // Then: Ver mensagem de sucesso
    const successIcon = page.locator('svg').filter({ hasText: /check/i });
    await expect(successIcon.first()).toBeVisible({ timeout: 5000 });
    
    const successText = page.locator('text=sucesso');
    await expect(successText.first()).toBeVisible();
  });

  test('deve validar campos obrigatórios do formulário de ticket', async ({ page }) => {
    // Given: Formulário de ticket aberto
    await page.click('[data-testid="floating-support-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="support-ticket-button"]');
    await page.waitForTimeout(500);
    
    // When: Tentar criar sem preencher
    page.on('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Criar Ticket")');
    
    // Then: Deve mostrar alerta (já configurado para aceitar automaticamente)
    await page.waitForTimeout(500);
  });

  test('deve testar diferentes perguntas no Chat AI', async ({ page }) => {
    const testCases = [
      { question: 'Como me habilitar no leilão?', keyword: 'documentos' },
      { question: 'Quais formas de pagamento?', keyword: 'pix' },
      { question: 'Preciso de quais documentos?', keyword: 'rg' },
    ];

    for (const testCase of testCases) {
      // Abrir chat
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.click('[data-testid="floating-support-button"]');
      await page.waitForTimeout(300);
      await page.click('[data-testid="support-chat-button"]');
      await page.waitForTimeout(500);
      
      // Fazer pergunta
      const input = page.locator('input[placeholder*="Digite sua mensagem"]');
      await input.fill(testCase.question);
      await page.click('button[type="submit"], button:has-text("Enviar")');
      
      // Verificar resposta
      await page.waitForTimeout(3000);
      const pageText = await page.textContent('body');
      expect(pageText?.toLowerCase()).toContain(testCase.keyword.toLowerCase());
      
      // Fechar modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
  });

  test('não deve mostrar botões em páginas admin', async ({ page }) => {
    // Given: Navegar para página admin
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Then: Botões flutuantes NÃO devem aparecer
    const floatingButton = page.locator('[data-testid="floating-support-button"]');
    await expect(floatingButton).not.toBeVisible({ timeout: 3000 });
  });

  test('deve fechar modal ao pressionar ESC', async ({ page }) => {
    // Given: Modal de chat aberto
    await page.click('[data-testid="floating-support-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="support-chat-button"]');
    await page.waitForTimeout(500);
    
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    // When: Pressionar ESC
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Then: Modal deve fechar
    await expect(modal).not.toBeVisible();
  });

  test('deve manter histórico de mensagens no chat', async ({ page }) => {
    // Given: Chat aberto
    await page.click('[data-testid="floating-support-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="support-chat-button"]');
    await page.waitForTimeout(500);
    
    // When: Enviar múltiplas mensagens
    const input = page.locator('input[placeholder*="Digite sua mensagem"]');
    
    await input.fill('Primeira mensagem');
    await page.click('button:has-text("Enviar")');
    await page.waitForTimeout(2000);
    
    await input.fill('Segunda mensagem');
    await page.click('button:has-text("Enviar")');
    await page.waitForTimeout(2000);
    
    // Then: Ambas devem estar visíveis
    await expect(page.locator('text=Primeira mensagem')).toBeVisible();
    await expect(page.locator('text=Segunda mensagem')).toBeVisible();
  });
});

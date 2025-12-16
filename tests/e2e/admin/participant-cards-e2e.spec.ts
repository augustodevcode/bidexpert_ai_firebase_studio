/**
 * @file participant-cards-e2e.spec.ts
 * @description Testes E2E para exibição de cards de participantes no cadastro de leilões
 * 
 * BDD:
 * Feature: Cards de participantes no formulário de leilões
 *   Como um administrador do sistema
 *   Eu quero ver cards visuais dos participantes selecionados
 *   Para ter uma melhor experiência ao cadastrar leilões
 * 
 *   Scenario: Selecionar leiloeiro e ver card
 *     Given que estou na página de cadastro de leilão
 *     When seleciono um leiloeiro no seletor
 *     Then um card com os dados do leiloeiro deve aparecer
 * 
 *   Scenario: Selecionar comitente e ver card
 *     Given que estou na página de cadastro de leilão
 *     When seleciono um comitente no seletor
 *     Then um card com os dados do comitente deve aparecer
 * 
 *   Scenario: Remover participante pelo card
 *     Given que um participante está selecionado com card visível
 *     When clico no botão X do card
 *     Then o participante deve ser deselecionado
 */
import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:9002';

// Helper para expandir acordeon de participantes
async function expandParticipantsAccordion(page: Page) {
  const accordion = page.locator('[data-testid="accordion-participantes"], .accordion-item:has-text("Participantes")');
  const isExpanded = await accordion.getAttribute('data-state');
  
  if (isExpanded !== 'open') {
    await accordion.locator('button, [role="button"]').first().click();
    await page.waitForTimeout(300);
  }
}

// Helper para selecionar um participante
async function selectParticipant(page: Page, fieldLabel: string, optionText: string) {
  // Encontra o campo pelo label
  const field = page.locator(`text="${fieldLabel}"`).locator('..').locator('..');
  
  // Clica no seletor
  await field.locator('[role="combobox"], button:has-text("Selecione")').click();
  await page.waitForTimeout(200);
  
  // Seleciona a opção
  await page.locator(`[role="option"]:has-text("${optionText}")`).click();
  await page.waitForTimeout(300);
}

test.describe('Participant Cards in Auction Form', () => {
  test.beforeEach(async ({ page }) => {
    // Navega para a página de cadastro de leilão
    await page.goto(`${BASE_URL}/admin/auctions/new`);
    await page.waitForLoadState('networkidle');
    
    // Expande a seção de participantes se necessário
    await expandParticipantsAccordion(page);
  });

  test('should display auctioneer card when selected', async ({ page }) => {
    // Seleciona um leiloeiro
    await selectParticipant(page, 'Leiloeiro', 'Leiloeiro');
    
    // Verifica se o card aparece
    const auctioneerCard = page.locator('[data-testid="participant-card-auctioneer"]');
    await expect(auctioneerCard).toBeVisible();
    
    // Verifica se tem o badge de leiloeiro
    await expect(auctioneerCard.locator('text=Leiloeiro')).toBeVisible();
  });

  test('should display seller card when selected', async ({ page }) => {
    // Seleciona um comitente
    await selectParticipant(page, 'Comitente', 'Comitente');
    
    // Verifica se o card aparece
    const sellerCard = page.locator('[data-testid="participant-card-seller"]');
    await expect(sellerCard).toBeVisible();
    
    // Verifica se tem o badge de comitente
    await expect(sellerCard.locator('text=Comitente')).toBeVisible();
  });

  test('should display judicial process card when selected', async ({ page }) => {
    // Seleciona um processo judicial
    await selectParticipant(page, 'Processo Judicial', '.');
    
    // Verifica se o card aparece
    const processCard = page.locator('[data-testid="participant-card-judicialProcess"]');
    await expect(processCard).toBeVisible();
    
    // Verifica se tem o badge de processo judicial
    await expect(processCard.locator('text=Processo Judicial')).toBeVisible();
  });

  test('should remove participant when clicking X button', async ({ page }) => {
    // Seleciona um leiloeiro
    await selectParticipant(page, 'Leiloeiro', 'Leiloeiro');
    
    // Verifica que o card está visível
    const auctioneerCard = page.locator('[data-testid="participant-card-auctioneer"]');
    await expect(auctioneerCard).toBeVisible();
    
    // Clica no botão de remover
    await auctioneerCard.locator('button[aria-label*="Remover"]').click();
    await page.waitForTimeout(300);
    
    // Verifica que o card não está mais visível
    await expect(auctioneerCard).not.toBeVisible();
  });

  test('should show participant details in card', async ({ page }) => {
    // Seleciona um leiloeiro
    await selectParticipant(page, 'Leiloeiro', 'Leiloeiro');
    
    // Verifica se o card mostra informações
    const auctioneerCard = page.locator('[data-testid="participant-card-auctioneer"]');
    
    // Deve ter nome
    const cardContent = await auctioneerCard.textContent();
    expect(cardContent).toBeTruthy();
    expect(cardContent!.length).toBeGreaterThan(10);
  });

  test('cards should be responsive in grid layout', async ({ page }) => {
    // Seleciona leiloeiro e comitente
    await selectParticipant(page, 'Leiloeiro', 'Leiloeiro');
    await selectParticipant(page, 'Comitente', 'Comitente');
    
    // Verifica que ambos os cards estão visíveis
    const auctioneerCard = page.locator('[data-testid="participant-card-auctioneer"]');
    const sellerCard = page.locator('[data-testid="participant-card-seller"]');
    
    await expect(auctioneerCard).toBeVisible();
    await expect(sellerCard).toBeVisible();
    
    // Verifica o layout em grid (os cards devem estar lado a lado em telas grandes)
    const auctioneerBox = await auctioneerCard.boundingBox();
    const sellerBox = await sellerCard.boundingBox();
    
    if (auctioneerBox && sellerBox) {
      // Em viewport grande, os cards devem estar na mesma linha
      expect(Math.abs(auctioneerBox.y - sellerBox.y)).toBeLessThan(50);
    }
  });
});

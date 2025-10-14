import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';

// Helper function to log in before each test
async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@test.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/admin/dashboard');
}

// Helper function to create a new entity (Auctioneer or Seller)
const createNewEntity = async (page: Page, entity: 'Auctioneer' | 'Seller', name: string) => {
  const entitySlug = entity.toLowerCase();
  const entityName = entity === 'Auctioneer' ? 'Leiloeiro' : 'Comitente';
  
  // Use a specific data-ai-id to open the selector
  await page.locator(`[data-ai-id="entity-selector-${entitySlug}"] button`).click();
  
  // Click the button to open the creation modal/dialog for the entity
  await page.getByRole('button', { name: `Criar Novo ${entityName}` }).click();
  
  // Fill out the form within the dialog
  await page.getByLabel('Nome').fill(name);
  await page.getByLabel('Email').fill(faker.internet.email());
  
  // Save the new entity
  await page.getByRole('button', { name: 'Salvar' }).click();

  // Wait for the success message and for the dialog to close
  await expect(page.getByText(`${entityName} criado com sucesso`)).toBeVisible();
  await page.waitForSelector(`[role="dialog"]`, { state: 'hidden' });
};

test.describe('Robust Auction Lifecycle E2E Test', () => {
  const auctionTitle = `Leilão E2E - ${faker.commerce.productName()} ${Date.now()}`;
  const auctioneerName = `Leiloeiro E2E ${faker.person.lastName()}`;
  const sellerName = `Comitente E2E ${faker.company.name()}`;

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should allow full auction lifecycle: create, verify, edit, and see on homepage', async ({ page }) => {
    // 1. Navigate to the auction creation page
    await page.goto('/admin/auctions/new');
    await expect(page.getByRole('heading', { name: 'Novo Leilão' })).toBeVisible();

    // 2. Fill out the main auction form
    await page.getByLabel('Título do Leilão').fill(auctionTitle);
    await page.getByLabel('Descrição').fill(faker.lorem.paragraph());

    // 3. Create a new Auctioneer and Seller from the auction form
    await createNewEntity(page, 'Auctioneer', auctioneerName);
    await createNewEntity(page, 'Seller', sellerName);

    // Select the newly created auctioneer and seller
    await page.locator(`[data-ai-id="entity-selector-auctioneer"]`).click();
    await page.getByText(auctioneerName).click();

    await page.locator(`[data-ai-id="entity-selector-seller"]`).click();
    await page.getByText(sellerName).click();

    // 4. Add auction stages
    await page.getByRole('button', { name: 'Adicionar Praça' }).click();
    const firstStage = page.locator('[data-ai-id="auction-stage-0"]');
    await firstStage.getByLabel('Nome da Praça').fill('1ª Praça');
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 7);
    await firstStage.getByLabel('Data de Início').fill(startDate.toISOString().split('T')[0]);
    await firstStage.getByLabel('Data de Término').fill(endDate.toISOString().split('T')[0]);

    // 5. Save the Auction
    await page.getByRole('button', { name: 'Salvar Leilão' }).click();

    // 6. Verify successful creation and redirection to the edit page
    await expect(page.getByText('Leilão criado com sucesso!')).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/auctions\/[a-zA-Z0-9]+/);
    await expect(page.getByRole('heading', { name: auctionTitle })).toBeVisible();

    // 7. Go to the auctions list and verify the new auction is there (Scenario 1.2.1)
    await page.goto('/admin/auctions');
    const auctionRow = page.getByRole('row', { name: auctionTitle });
    await expect(auctionRow).toBeVisible();
    await expect(auctionRow.getByText('Em Breve')).toBeVisible();

    // 8. Edit the auction status (Scenario 1.2.2)
    await auctionRow.getByRole('button', { name: 'Ações' }).click();
    await page.getByRole('menuitem', { name: 'Editar' }).click();
    
    await expect(page).toHaveURL(/\/admin\/auctions\/[a-zA-Z0-9]+\/edit/);
    await page.getByLabel('Status').click();
    await page.getByRole('option', { name: 'Aberto para Lances' }).click();
    await page.getByRole('button', { name: 'Salvar Leilão' }).click();
    
    await expect(page.getByText('Leilão atualizado com sucesso!')).toBeVisible();

    // 9. Verify the status update on the list page
    await page.goto('/admin/auctions');
    await expect(auctionRow).toBeVisible();
    await expect(auctionRow.getByText('Aberto para Lances')).toBeVisible();

    // 10. Verify the new auction is displayed correctly on the homepage
    await page.goto('/');
    const auctionCard = page.locator(`[data-ai-id="auction-card"]:has-text("${auctionTitle}")`);
    await expect(auctionCard).toBeVisible();

    // Verify card content
    await expect(auctionCard.getByText(auctionTitle)).toBeVisible();
    await expect(auctionCard.getByText(auctioneerName)).toBeVisible();
    const currentYear = new Date().getFullYear();
    await expect(auctionCard.getByText(new RegExp(`${currentYear}`))).toBeVisible();
    await expect(auctionCard.locator('[data-ai-id="lot-count"]')).toHaveText('0 Lotes');
    await expect(auctionCard.locator('[data-ai-id="status-badge"]')).toHaveText('Aberto para Lances');
  });
});
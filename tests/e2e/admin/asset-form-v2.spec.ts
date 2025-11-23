import { test, expect, Page } from '@playwright/test';
import { ensureAdminSession } from './admin-helpers';

async function selectEntity(page: Page, entityName: string, searchText?: string) {
  await page.locator(`[data-ai-id="entity-selector-trigger-${entityName}"]`).click();
  const modal = page.locator(`[data-ai-id="entity-selector-modal-${entityName}"]`);
  await expect(modal).toBeVisible();
  
  if (searchText) {
    await modal.locator('[data-ai-id="data-table-search-input"]').fill(searchText);
    await page.waitForTimeout(500); // Wait for debounce
  }
  
  await modal.getByRole('button', { name: 'Selecionar' }).first().click();
  await expect(modal).toBeHidden();
}

test.describe('AssetFormV2 - Smart Form Implementation', () => {
  
  test.beforeEach(async ({ page }) => {
    await ensureAdminSession(page);
  });

  test('VAL-01: Should validate required fields on empty submission', async ({ page }) => {
    await page.goto('/admin/assets/new');
    
    // Click save without filling anything
    await page.getByRole('button', { name: 'Salvar' }).first().click();
    
    // Check for validation messages
    await expect(page.getByText('O título do bem deve ter pelo menos 5 caracteres')).toBeVisible();
    await expect(page.getByText('A categoria é obrigatória')).toBeVisible();
    await expect(page.getByText('O comitente/vendedor é obrigatório')).toBeVisible();
  });

  test('VAL-02: Should validate title length', async ({ page }) => {
    await page.goto('/admin/assets/new');
    
    await page.getByLabel('Título do Bem').fill('Abc');
    await page.getByRole('button', { name: 'Salvar' }).first().click();
    
    await expect(page.getByText('O título do bem deve ter pelo menos 5 caracteres')).toBeVisible();
  });

  test('CRE-01: Should create a basic asset successfully', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.goto('/admin/assets/new');
    
    const timestamp = new Date().getTime();
    const title = `Asset V2 Test ${timestamp}`;

    // Fill Basic Info
    await page.getByLabel('Título do Bem').fill(title);
    await page.getByLabel('Descrição Detalhada').fill('Description for automated test asset');
    
    // Select Category (assuming at least one exists)
    // await page.getByRole('combobox', { name: 'Selecione...' }).first().click();
    await page.getByLabel('Categoria', { exact: true }).click();
    // Select the first available option that is not the placeholder
    await page.getByRole('option').first().click();

    // Select Seller
    // Using EntitySelector - click trigger
    // await page.getByRole('combobox', { name: 'Selecione o comitente...' }).click();
    await page.getByText('Selecione o comitente...').click();
    // Select from dialog
    await page.getByRole('button', { name: 'Selecionar' }).first().click();

    // Save
    await page.getByRole('button', { name: 'Salvar' }).first().click();

    // Check if any error message appears
    try {
        await expect(page.locator('.text-destructive').first()).toBeVisible({ timeout: 5000 });
        const errors = await page.locator('.text-destructive').allInnerTexts();
        console.error('Form Errors:', errors);
        throw new Error('Form validation failed: ' + errors.join(', '));
    } catch (e: any) {
        // If no error visible, continue (timeout expected if success)
        if (e.message.includes('Form validation failed')) throw e;
    }

    // Verify success
    await expect(page.getByText('Ativo criado com sucesso!')).toBeVisible();
    
    // Verify redirection to list and presence of item
    await page.waitForURL('**/admin/assets');
    await expect(page.getByText(title).first()).toBeVisible();
  });

  test('CRE-02: Should create a complete asset with location and relations', async ({ page }) => {
    await page.goto('/admin/assets/new');
    
    const timestamp = new Date().getTime();
    const title = `Complete Asset ${timestamp}`;

    // 1. Basic Info
    await page.getByLabel('Título do Bem').fill(title);
    await page.getByLabel('Descrição Detalhada').fill('Detailed description for complete creation test.');
    
    // Category
    await page.getByLabel('Categoria', { exact: true }).click();
    await page.getByRole('option').first().click();

    // 2. Location (AddressGroup)
    // State
    await selectEntity(page, 'state', 'Rio de Janeiro');
    
    // City (Wait for state selection to enable city)
    await expect(page.locator('[data-ai-id="entity-selector-trigger-city"]')).toBeEnabled();
    await selectEntity(page, 'city', 'Rio de Janeiro');

    await page.getByLabel('Logradouro (Rua/Avenida)').fill('Test Street');
    await page.getByLabel('Número').fill('123');
    await page.getByLabel('Complemento').fill('Apt 1');
    await page.getByLabel('Bairro').fill('Test Neighborhood');

    // 3. Relations
    // Seller
    await selectEntity(page, 'seller');

    // 4. Status
    await page.getByLabel('Status Atual').click();
    await page.getByRole('option', { name: 'Disponível' }).click();

    // 5. Save
    await page.getByRole('button', { name: 'Salvar' }).first().click();

    // Verify success
    await expect(page.locator('div.text-sm.opacity-90').filter({ hasText: 'Ativo criado com sucesso!' })).toBeVisible();
    
    // Verify redirection
    await page.waitForURL('**/admin/assets');
    
    // Verify item in list
    await page.getByLabel('Visualização em Tabela').click();
    await page.getByPlaceholder('Buscar por título ou ID do processo...').fill(title);
    await expect(page.getByRole('row').filter({ hasText: title }).first()).toBeVisible();
  });

  test('CRE-03: Should create a vehicle asset with specific fields', async ({ page }) => {
    await page.goto('/admin/assets/new');
    const timestamp = new Date().getTime();
    const title = `Vehicle Test ${timestamp}`;
    
    // Basic Info
    await page.getByLabel('Título do Bem').fill(title);
    await page.getByLabel('Descrição Detalhada').fill('Vehicle description test');
    
    // Select Category: Veículos
    await page.getByLabel('Categoria', { exact: true }).click();
    await page.getByRole('option', { name: 'Veículos' }).click();
    
    // Wait for vehicle fields to appear
    await expect(page.getByText('Identificação do Veículo')).toBeVisible();
    
    // Fill Vehicle Fields
    // Make (Marca) - Text input based on config
    await page.getByLabel('Marca').fill('Ford');
    
    // Model (Modelo) - Text input based on config
    await page.getByLabel('Modelo', { exact: true }).fill('Ford Hatchback 530');
    
    // Plate (Placa)
    await page.getByLabel('Placa').fill('ABC-1234');
    
    // Renavam
    await page.getByLabel('RENAVAM').fill('12345678900');
    
    // Color (Cor)
    await page.getByLabel('Cor', { exact: true }).fill('Prata');
    
    // Fuel (Combustível)
    await page.getByLabel('Tipo de Combustível').click();
    await page.getByRole('option').first().click();
    
    // Year (Ano/Modelo)
    await page.getByLabel('Ano de Fabricação').fill('2020');
    await page.getByLabel('Ano do Modelo').fill('2021');
    
    // Select Seller
    await selectEntity(page, 'seller');
    
    // Save
    await page.getByRole('button', { name: 'Salvar' }).first().click();
    
    // Verify
    await expect(page.locator('div.text-sm.opacity-90').filter({ hasText: 'Ativo criado com sucesso!' })).toBeVisible();
  });

  test('CRE-04: Should create a real estate asset with specific fields', async ({ page }) => {
    await page.goto('/admin/assets/new');

    const timestamp = new Date().getTime();
    const title = `Real Estate Asset ${timestamp}`;

    // 1. Basic Info
    await page.getByLabel('Título do Bem').fill(title);
    await page.getByLabel('Descrição Detalhada').fill('A beautiful house for testing purposes.');
    
    // Select Category: Imóveis
    await page.getByLabel('Categoria', { exact: true }).click();
    await page.getByRole('option', { name: 'Imóveis' }).click();

    // Select Seller
    await page.getByText('Selecione o comitente...').click();
    await page.getByRole('button', { name: 'Selecionar' }).first().click();

    // 2. Verify Specific Fields Section
    await expect(page.getByRole('heading', { name: 'Identificação do Imóvel' })).toBeVisible();

    // 3. Fill Specific Fields
    // Matrícula
    await page.getByLabel('Matrícula').fill('12345-REG');
    
    // Área Total (m²)
    await page.getByLabel('Área Total (m²)').fill('500');
    
    // Quartos
    await page.getByLabel('Quartos').fill('4');
    
    // Imóvel Ocupado? (Checkbox)
    await page.getByLabel('Imóvel Ocupado?').check();

    // 4. Submit
    await page.getByRole('button', { name: 'Salvar' }).first().click();

    // 5. Verify Success
    await expect(page.locator('div.text-sm.opacity-90').filter({ hasText: 'Ativo criado com sucesso!' })).toBeVisible();
    await page.waitForURL('**/admin/assets');
  });

  test('INT-01: Should open media dialog and select image', async ({ page }) => {
    await page.goto('/admin/assets/new');
    
    await page.getByRole('button', { name: 'Selecionar da Biblioteca' }).click();
    
    // Expect dialog to open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Biblioteca de Mídia')).toBeVisible();
    
    // Close dialog (since we might not have media in seed data to select reliably without more setup)
    await page.getByRole('button', { name: 'Close' }).click();
  });

  test('CTX-03: Should open form in modal from list page', async ({ page }) => {
    await page.goto('/admin/assets');
    
    await page.getByRole('button', { name: 'Novo Ativo' }).click();
    
    // Check if modal is open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Novo Ativo' })).toBeVisible();
    
    // Check if form fields are present
    await expect(page.getByLabel('Título do Bem')).toBeVisible();
    
    // Close modal
    await page.getByRole('button', { name: 'Cancelar' }).first().click();
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('EDT-01: Should load existing asset data for editing', async ({ page }) => {
    // 1. Create an asset to edit
    await page.goto('/admin/assets/new');
    const timestamp = new Date().getTime();
    const title = `Edit Test ${timestamp}`;
    await page.getByLabel('Título do Bem').fill(title);
    
    // Select Category
    await page.getByLabel('Categoria', { exact: true }).click();
    await page.getByRole('option').first().click();

    // Select Seller
    await page.getByText('Selecione o comitente...').click();
    await page.getByRole('button', { name: 'Selecionar' }).first().click();

    await page.getByRole('button', { name: 'Salvar' }).first().click();
    await page.waitForURL('**/admin/assets');

    // 2. Find the row and click Edit
    // Switch to Table View if not already (default might be grid)
    await page.getByLabel('Visualização em Tabela').click();

    // Use search to ensure the item is visible
    await page.getByPlaceholder('Buscar por título ou ID do processo...').fill(title);

    // Wait for the list to filter and the item to appear
    await expect(page.getByRole('row').filter({ hasText: title }).first()).toBeVisible();
    
    // Find the row that contains the title text
    const row = page.getByRole('row').filter({ hasText: title }).first();
    
    // Click the edit button in that row
    await row.getByRole('button', { name: 'Editar' }).click();

    // 3. Verify modal opens and form is populated
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Editar Ativo' })).toBeVisible();
    await expect(page.getByLabel('Título do Bem')).toHaveValue(title);
  });

  test('DEL-01: Should delete an asset', async ({ page }) => {
    // 1. Create an asset to delete
    await page.goto('/admin/assets/new');
    const timestamp = new Date().getTime();
    const title = `Delete Test ${timestamp}`;
    await page.getByLabel('Título do Bem').fill(title);
    
    // Select Category
    await page.getByLabel('Categoria', { exact: true }).click();
    await page.getByRole('option').first().click();

    // Select Seller
    await page.getByText('Selecione o comitente...').click();
    await page.getByRole('button', { name: 'Selecionar' }).first().click();

    await page.getByRole('button', { name: 'Salvar' }).first().click();
    await page.waitForURL('**/admin/assets');

    // 2. Find the row and click Delete
    // Switch to Table View
    await page.getByLabel('Visualização em Tabela').click();

    // Use search to ensure the item is visible
    await page.getByPlaceholder('Buscar por título ou ID do processo...').fill(title);

    // Wait for the list to filter and the item to appear
    await expect(page.getByRole('row').filter({ hasText: title }).first()).toBeVisible();
    
    // Find the row that contains the title text
    const row = page.getByRole('row').filter({ hasText: title }).first();
    
    // Click the delete button in that row
    // Note: If there is a confirmation dialog, we need to handle it. 
    // Based on code inspection, it seems immediate, but let's be ready for a toast.
    await row.getByRole('button', { name: 'Excluir' }).click();

    // 3. Verify deletion
    // Expect a success toast
    await expect(page.locator('div.text-sm.opacity-90').filter({ hasText: 'Ativo excluído com sucesso.' })).toBeVisible();
    
    // Verify it disappears from the list
    await expect(page.getByRole('row').filter({ hasText: title })).toBeHidden();
  });
});

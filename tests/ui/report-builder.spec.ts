// tests/ui/report-builder.spec.ts
import { test, expect, type Page } from '@playwright/test';

test.describe('Módulo 10: Construtor de Relatórios (Self-Service) UI Test', () => {

  test.beforeEach(async ({ page }) => {
    // Garante que o setup foi concluído
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });

    // Autenticar como Admin
    await page.goto('/auth/login');
    await page.locator('input[name="email"]').fill('admin@bidexpert.com.br');
    await page.locator('input[name="password"]').fill('Admin@123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('/dashboard/overview');

    // Navegar para a página do Report Builder
    await page.goto('/admin/report-builder');
    await expect(page.getByRole('heading', { name: 'Construtor de Relatórios' })).toBeVisible();
  });

  test('Cenário 10.1: should add, select, edit, and move a text element', async ({ page }) => {
    const designSurface = page.locator('[data-ai-id="report-design-surface"]');
    const propertiesPanel = page.locator('[data-ai-id="report-builder-properties-tab"]');
    
    // --- 1. Adicionar Elemento ---
    console.log('[Report Builder Test] Adicionando elemento de texto...');
    await page.getByRole('button', { name: 'Adicionar Texto' }).click();
    
    // Verificar se o elemento apareceu na área de design
    const newElement = designSurface.getByText('Novo TextBox');
    await expect(newElement).toBeVisible();
    const elementWrapper = newElement.locator('xpath=..');
    const elementId = await elementWrapper.getAttribute('key'); // Supondo que a key seja o ID único
    expect(elementId).toBeTruthy();
    console.log(`- Elemento de texto adicionado com ID: ${elementId}`);

    // --- 2. Selecionar e Editar Elemento ---
    console.log('[Report Builder Test] Selecionando e editando o elemento...');
    await elementWrapper.click();
    
    // Verificar se o painel de propriedades reflete a seleção
    await expect(propertiesPanel.locator('input[id="prop-id"]')).toHaveValue(elementId!);
    
    // Alterar o conteúdo no painel de propriedades
    const contentInput = propertiesPanel.locator('textarea[id="prop-content"]');
    await contentInput.fill('Relatório de Vendas Mensal');
    
    // Verificar se a alteração foi refletida na área de design
    await expect(designSurface.getByText('Relatório de Vendas Mensal')).toBeVisible();
    console.log('- Conteúdo do elemento atualizado com sucesso.');

    // --- 3. Mover Elemento (Drag and Drop) ---
    console.log('[Report Builder Test] Movendo o elemento...');
    const elementToDrag = designSurface.locator(`[key="${elementId}"]`);
    
    // Pegar a posição inicial
    const initialBoundingBox = await elementToDrag.boundingBox();
    expect(initialBoundingBox).toBeDefined();

    // Simular o drag and drop
    await elementToDrag.hover();
    await page.mouse.down();
    await page.mouse.move(initialBoundingBox!.x + 150, initialBoundingBox!.y + 50);
    await page.mouse.up();

    // Verificar se a posição foi atualizada
    const finalBoundingBox = await elementToDrag.boundingBox();
    expect(finalBoundingBox).toBeDefined();
    
    expect(finalBoundingBox!.x).not.toEqual(initialBoundingBox!.x);
    expect(finalBoundingBox!.y).not.toEqual(initialBoundingBox!.y);
    
    // Verificar no painel de propriedades também
    const newX = await propertiesPanel.locator('input[id="prop-x"]').inputValue();
    const newY = await propertiesPanel.locator('input[id="prop-y"]').inputValue();
    expect(parseInt(newX)).toBeGreaterThanOrEqual(initialBoundingBox!.x);
    expect(parseInt(newY)).toBeGreaterThanOrEqual(initialBoundingBox!.y);
    
    console.log('- Elemento movido com sucesso.');
  });
});

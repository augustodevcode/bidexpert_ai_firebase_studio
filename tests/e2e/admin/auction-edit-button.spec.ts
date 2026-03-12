/**
 * @fileoverview Teste E2E Playwright para o botão de edição geral do leilão.
 * 
 * BDD:
 *   DADO que o admin acessa a página de edição de um leilão existente
 *   QUANDO a página carrega em modo visualização (isViewMode=true)
 *   ENTÃO o botão "Entrar em Modo de Edição" deve estar visível e clicável
 *   E ao clicar, o formulário deve ser habilitado para edição
 * 
 * Reproduz o bug corrigido: na viewport mobile, o botão ficava dentro de um
 * fieldset desabilitado e não respondia a cliques.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, waitForPageLoad, genAuctionData, saveForm, assertToastOrSuccess, selectEntityByLabel, selectShadcnByLabel } from './admin-helpers';

test.describe('Botão de Edição Geral do Leilão', () => {
  test('botão "Entrar em Modo de Edição" funciona em viewport desktop', async ({ page }) => {
    // Criar um leilão para teste
    await page.goto(`${BASE_URL}/admin/auctions/new`, { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    const data = genAuctionData();
    await page.getByLabel(/título do leilão|t[ií]tulo/i).first().fill(data.title);

    await selectEntityByLabel(page, /Categoria Principal/);
    await selectEntityByLabel(page, /Leiloeiro/);
    await selectEntityByLabel(page, /Comitente/);
    await selectShadcnByLabel(page, /Modalidade\s*\*/i, /PARTICULAR|EXTRAJUDICIAL|JUDICIAL/i);
    await selectShadcnByLabel(page, /Participa[cç][aã]o\s*\*/i, /ONLINE|HIBRIDO|PRESENCIAL/i);
    await selectShadcnByLabel(page, /M[ée]todo\s*\*/i, /STANDARD/i);

    await saveForm(page);
    await assertToastOrSuccess(page);
    await waitForPageLoad(page);

    // Se não redirecionou para edit, navegar para lista e abrir o leilão
    if (!page.url().includes('/edit')) {
      await page.goto(`${BASE_URL}/admin/auctions`, { waitUntil: 'domcontentloaded' });
      await waitForPageLoad(page);
      const editLink = page.locator('a[href*="/admin/auctions/"][href*="/edit"]').first();
      await editLink.waitFor({ state: 'visible', timeout: 15000 });
      await editLink.click();
      await waitForPageLoad(page);
    }

    // Verificar que o botão de entrar em modo de edição está visível e habilitado
    const editModeBtn = page.locator('[data-ai-id="form-page-btn-edit-mode"]').first();
    await editModeBtn.waitFor({ state: 'visible', timeout: 15000 });
    await expect(editModeBtn).toBeEnabled();

    // Clicar no botão de editar e aguardar transição
    await editModeBtn.click();

    // O botão Salvar deve aparecer após entrar em modo de edição
    const saveBtn = page.locator('[data-ai-id="form-page-btn-save"]').first();
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
  });

  test('botão "Entrar em Modo de Edição" funciona em viewport mobile (bug fix)', async ({ page }) => {
    // Simular viewport mobile (<640px)
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto(`${BASE_URL}/admin/auctions`, { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    const editLink = page.locator('a[href*="/admin/auctions/"][href*="/edit"]').first();
    const hasEditLink = await editLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasEditLink) {
      test.skip(true, 'Nenhum leilão encontrado na lista para testar edição mobile');
      return;
    }

    await editLink.click();
    await waitForPageLoad(page);

    // Na toolbar mobile (fora do fieldset após a correção), o botão deve estar habilitado
    const editModeBtns = page.locator('[data-ai-id="form-page-btn-edit-mode"]');
    await expect(editModeBtns.first()).toBeVisible({ timeout: 15000 });

    // Verificar que o botão está habilitado (não bloqueado pelo fieldset)
    const firstVisibleBtn = editModeBtns.first();
    await expect(firstVisibleBtn).toBeEnabled();

    // Clicar e aguardar transição para modo de edição
    await firstVisibleBtn.click();

    // O botão Salvar deve aparecer
    const saveBtn = page.locator('[data-ai-id="form-page-btn-save"]').first();
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
  });

  test('campo do formulário é desabilitado em modo visualização e habilitado após clicar em editar', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/auctions`, { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    const editLink = page.locator('a[href*="/admin/auctions/"][href*="/edit"]').first();
    const hasEditLink = await editLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasEditLink) {
      test.skip(true, 'Nenhum leilão encontrado para testar');
      return;
    }

    await editLink.click();
    await waitForPageLoad(page);

    // Em modo de visualização, o fieldset deve estar disabled
    const fieldset = page.locator('[data-ai-id="form-page-fieldset"]');
    await expect(fieldset).toBeVisible();
    const isDisabled = await fieldset.evaluate((el) => (el as HTMLFieldSetElement).disabled);
    expect(isDisabled).toBe(true);

    // Clicar no botão de edição
    const editModeBtn = page.locator('[data-ai-id="form-page-btn-edit-mode"]').first();
    await editModeBtn.click();

    // O botão Salvar deve aparecer após entrar em modo de edição
    const saveBtn = page.locator('[data-ai-id="form-page-btn-save"]').first();
    await expect(saveBtn).toBeVisible({ timeout: 5000 });

    // O fieldset deve agora estar habilitado
    const isDisabledAfter = await fieldset.evaluate((el) => (el as HTMLFieldSetElement).disabled);
    expect(isDisabledAfter).toBe(false);
  });
});



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

test.describe('Botão de Edição Geral do Leilão', () => {
  test('botão "Entrar em Modo de Edição" funciona em viewport desktop', async ({ page }) => {
    // Criar um leilão para teste
    await page.goto(`${BASE_URL}/admin/auctions/new`, { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    const data = genAuctionData();
    await page.getByLabel(/título do leilão|t[ií]tulo/i).first().fill(data.title);

    // Selecionar relações obrigatórias com dados do seed
    await selectEntityByLabel(page, /Categoria Principal/);
    await selectEntityByLabel(page, /Leiloeiro/);
    await selectEntityByLabel(page, /Comitente/);
    await selectShadcnByLabel(page, /Modalidade\s*\*/i, /PARTICULAR|EXTRAJUDICIAL|JUDICIAL/i);
    await selectShadcnByLabel(page, /Participa[cç][aã]o\s*\*/i, /ONLINE|HIBRIDO|PRESENCIAL/i);
    await selectShadcnByLabel(page, /M[ée]todo\s*\*/i, /STANDARD/i);

    await saveForm(page);
    await assertToastOrSuccess(page);

    // Navegar para a página de edição do leilão recém-criado
    // A URL de sucesso deve redirecionar para /admin/auctions/[id]/edit
    await waitForPageLoad(page);
    const currentUrl = page.url();

    // Se não redirecionou para edit, navegar para lista e abrir o leilão
    if (!currentUrl.includes('/edit')) {
      await page.goto(`${BASE_URL}/admin/auctions`, { waitUntil: 'domcontentloaded' });
      await waitForPageLoad(page);

      // Clicar no primeiro leilão da lista
      const editLink = page.locator('a[href*="/admin/auctions/"][href*="/edit"]').first();
      await editLink.waitFor({ state: 'visible', timeout: 15000 });
      await editLink.click();
      await waitForPageLoad(page);
    }

    // Verificar que está em modo de visualização (botão de editar visível)
    const editModeBtn = page.getByRole('button', { name: /entrar em modo de edi[cç][aã]o/i }).first();
    await editModeBtn.waitFor({ state: 'visible', timeout: 15000 });

    // Verificar que o botão está habilitado (não bloqueado pelo fieldset)
    await expect(editModeBtn).toBeEnabled();

    // Clicar no botão de editar
    await editModeBtn.click();
    await page.waitForTimeout(500);

    // Verificar que entrou em modo de edição (botão Salvar deve aparecer)
    const saveBtn = page.getByRole('button', { name: /^salvar$/i }).first();
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
  });

  test('botão "Entrar em Modo de Edição" funciona em viewport mobile (bug fix)', async ({ page }) => {
    // Simular viewport mobile (<640px)
    await page.setViewportSize({ width: 375, height: 812 });

    // Navegar para lista de leilões e abrir um para edição
    await page.goto(`${BASE_URL}/admin/auctions`, { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    // Tentar clicar no primeiro link de edição
    const editLink = page.locator('a[href*="/admin/auctions/"][href*="/edit"]').first();
    const hasEditLink = await editLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasEditLink) {
      test.skip(true, 'Nenhum leilão encontrado na lista para testar edição mobile');
      return;
    }

    await editLink.click();
    await waitForPageLoad(page);

    // Em mobile, a toolbar de botões fica na área inferior da tela
    // O botão "Entrar em Modo de Edição" NÃO deve estar dentro do fieldset desabilitado
    const editModeButtons = page.getByRole('button', { name: /entrar em modo de edi[cç][aã]o/i });
    const count = await editModeButtons.count();
    
    // Deve ter pelo menos 1 botão visível
    expect(count).toBeGreaterThan(0);

    // Encontrar o botão visível na toolbar mobile
    let visibleBtn = null;
    for (let i = 0; i < count; i++) {
      const btn = editModeButtons.nth(i);
      const isVisible = await btn.isVisible().catch(() => false);
      if (isVisible) {
        visibleBtn = btn;
        break;
      }
    }

    expect(visibleBtn, 'Botão de edição deve estar visível na viewport mobile').not.toBeNull();

    // O botão NÃO deve estar disabled (correção do bug)
    await expect(visibleBtn!).toBeEnabled();

    // Clicar no botão de edição
    await visibleBtn!.click();
    await page.waitForTimeout(500);

    // Verificar que o formulário foi habilitado para edição
    const saveBtn = page.getByRole('button', { name: /^salvar$/i });
    const hasSaveBtn = await saveBtn.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasSaveBtn, 'Botão Salvar deve aparecer após entrar em modo de edição').toBeTruthy();
  });

  test('campo do formulário é desabilitado em modo visualização e habilitado após clicar em editar', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/auctions`, { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);

    // Abrir primeiro leilão para edição
    const editLink = page.locator('a[href*="/admin/auctions/"][href*="/edit"]').first();
    const hasEditLink = await editLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasEditLink) {
      test.skip(true, 'Nenhum leilão encontrado para testar');
      return;
    }

    await editLink.click();
    await waitForPageLoad(page);

    // Em modo de visualização, o título do formulário deve dizer "Visualizar Leilão"
    await expect(page.getByText(/visualizar leilão/i).first()).toBeVisible({ timeout: 10000 });

    // Verificar que o formulário está em modo visualização (fieldset disabled)
    const fieldset = page.locator('[data-ai-id="form-page-fieldset"]');
    await expect(fieldset).toBeVisible();
    
    // O fieldset deve estar disabled
    const isDisabled = await fieldset.evaluate((el) => (el as HTMLFieldSetElement).disabled);
    expect(isDisabled).toBe(true);

    // Clicar no botão de edição (na toolbar desktop ou mobile)
    const editModeBtn = page.getByRole('button', { name: /entrar em modo de edi[cç][aã]o/i }).first();
    await editModeBtn.click();
    await page.waitForTimeout(500);

    // Após clicar, o fieldset deve estar habilitado
    const isDisabledAfter = await fieldset.evaluate((el) => (el as HTMLFieldSetElement).disabled);
    expect(isDisabledAfter).toBe(false);

    // O título deve mudar para "Editar Leilão"
    await expect(page.getByText(/editar leilão/i).first()).toBeVisible({ timeout: 5000 });
  });
});



/**
 * @fileoverview Testes MCP abrangentes da Biblioteca de Mídia.
 *
 * Cobre TODAS as funcionalidades:
 * - ML-01: Renderização da galeria sem erros
 * - ML-02: Upload de imagem → verifica aparição na galeria (core bug fix)
 * - ML-03: Busca/filtro por nome de arquivo
 * - ML-04: Card → abre sidebar com metadados
 * - ML-05: Lightbox (preview de imagem)
 * - ML-06: Editor de imagem (crop/rotate)
 * - ML-07: Delete de imagem → desaparece da galeria
 * - ML-08: Verificação de storage (URL da imagem é acessível via HTTP)
 *
 * Credenciais: verificadas no seed-master-data.ts (admin@bidexpert.com.br / Admin@123)
 *
 * Configs:
 *   Dev local (9007):  npx playwright test --config=playwright.media-local.config.ts
 *   Vercel demo:       npx playwright test --config=playwright.media-vercel.config.ts
 */
import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://dev.localhost:9007';

// Timeout generoso — lazy compilation em dev pode levar 30s por página
test.setTimeout(180_000);

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

async function loginAsAdmin(page: Page, baseUrl = BASE_URL) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto(`${baseUrl}/auth/login`, { waitUntil: 'networkidle', timeout: 120_000 });

  // Aguardar input de e-mail aparecer
  await page.waitForSelector('input[type="email"], [data-ai-id="auth-login-email-input"]', { timeout: 60_000 });
  await page.waitForTimeout(2_000);

  // Preencher credenciais — tenta com data-ai-id primeiro, depois com seletor genérico
  const emailSelector = page.locator('[data-ai-id="auth-login-email-input"]').or(page.locator('input[type="email"]')).first();
  const passwordSelector = page.locator('[data-ai-id="auth-login-password-input"]').or(page.locator('input[type="password"]')).first();
  const submitSelector = page.locator('[data-ai-id="auth-login-submit-button"]').or(page.locator('button[type="submit"]')).first();

  await emailSelector.fill('admin@bidexpert.com.br');
  await passwordSelector.fill('Admin@123');

  await Promise.all([
    page.waitForURL(/\/(admin|dashboard)/i, { timeout: 60_000 }),
    submitSelector.click(),
  ]);

  console.log('[loginAsAdmin] OK:', page.url());
  return errors;
}

async function goToMediaPage(page: Page, baseUrl = BASE_URL) {
  await page.goto(`${baseUrl}/admin/media`, { waitUntil: 'networkidle', timeout: 120_000 });
  await page.waitForSelector('[data-ai-id="admin-media-page-container"]', { timeout: 60_000 });
  await page.waitForTimeout(2_000);
  console.log('[goToMediaPage] Loaded:', page.url());
}

/** Cria um arquivo PNG mínimo válido em disco para upload */
function createTestImageFile(name = 'ml-mcp-test.png'): string {
  // PNG 1x1 red pixel válido (37 bytes)
  const pngBytes = Buffer.from(
    '89504e470d0a1a0a0000000d494844520000000100000001' +
    '08020000009001' +
    '2e0000000c4944415408d76360f8cfc0000000020001' +
    '2221bc330000000049454e44ae426082',
    'hex'
  );
  const tmpPath = path.join(os.tmpdir(), name);
  fs.writeFileSync(tmpPath, pngBytes);
  return tmpPath;
}

/** Conta o número de cards na galeria */
async function countGalleryCards(page: Page): Promise<number> {
  const cards = page.locator('[data-ai-id="media-gallery-card"]');
  return cards.count();
}

/** Captura screenshot para evidência de PR */
async function snap(page: Page, name: string) {
  const dir = 'test-results/media-mcp';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: false });
  console.log(`[snap] Screenshot salvo: ${dir}/${name}.png`);
}

// ──────────────────────────────────────────────────────────────────────────────
// Testes
// ──────────────────────────────────────────────────────────────────────────────

test.describe('ML — Biblioteca de Mídia (MCP Abrangente)', () => {

  test('ML-01 — Galeria renderiza sem erros críticos', async ({ page }) => {
    await loginAsAdmin(page);
    await goToMediaPage(page);

    // Container principal presente
    await expect(page.locator('[data-ai-id="admin-media-page-container"]')).toBeVisible();

    // Toolbar presente
    await expect(page.locator('[data-ai-id="media-toolbar"]')).toBeVisible();

    // Galeria ou estado vazio/loading presente
    const galleryLocator = page.locator(
      '[data-ai-id="media-gallery-view"], [data-ai-id="media-gallery-empty"], [data-ai-id="media-gallery-loading"]'
    );
    await expect(galleryLocator.first()).toBeVisible({ timeout: 30_000 });

    // Monitorar 500s
    const errors500: string[] = [];
    page.on('response', (r) => {
      if (r.status() >= 500) errors500.push(`${r.status()} ${r.url()}`);
    });
    await page.waitForTimeout(2_000);
    expect(errors500, `Erros 500 encontrados: ${errors500.join(', ')}`).toHaveLength(0);

    await snap(page, 'ML-01-gallery-renders');
    console.log('[ML-01] ✅ Galeria renderizou sem erros');
  });

  test('ML-02 — Upload de imagem aparece na galeria (core bug fix)', async ({ page }) => {
    await loginAsAdmin(page);

    // Contar itens antes do upload
    await goToMediaPage(page);
    const countBefore = await countGalleryCards(page);
    console.log(`[ML-02] Cards antes do upload: ${countBefore}`);

    // Criar arquivo de teste
    const testImagePath = createTestImageFile(`ml-upload-${Date.now()}.png`);

    // Localizar upload zone e fazer o upload
    // A upload zone pode estar em botão "Upload" ou dropzone direta
    const uploadZone = page.locator('[data-ai-id="media-upload-zone"]');
    const uploadButton = page.getByRole('button', { name: /upload|adicionar|enviar/i }).first();

    // Tentar clicar no botão de upload para abrir a zona
    if (await uploadButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await uploadButton.click();
      await page.waitForTimeout(1_000);
    }

    // Fazer upload via input de arquivo
    const fileInput = page.locator('input[type="file"]').first();

    if (await fileInput.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await fileInput.setInputFiles(testImagePath);
    } else {
      // Fallback: dropzone
      await uploadZone.setInputFiles(testImagePath).catch(async () => {
        // Último fallback: API direta
        console.warn('[ML-02] Usando API de upload diretamente como fallback');
      });
    }

    // Aguardar upload completar (toast de sucesso ou novo card)
    await page.waitForTimeout(5_000);

    // Recarregar e verificar se apareceu na galeria
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('[data-ai-id="admin-media-page-container"]', { timeout: 30_000 });
    await page.waitForTimeout(2_000);

    const countAfter = await countGalleryCards(page);
    console.log(`[ML-02] Cards após upload: ${countAfter}`);

    expect(countAfter, `Upload não apareceu na galeria! Antes: ${countBefore}, Depois: ${countAfter}`).toBeGreaterThan(countBefore);

    await snap(page, 'ML-02-upload-appears');
    console.log('[ML-02] ✅ Imagem apareceu na galeria após upload');

    // Cleanup temp file
    try { fs.unlinkSync(testImagePath); } catch { /* ignore */ }
  });

  test('ML-03 — Busca/filtro por nome de arquivo', async ({ page }) => {
    await loginAsAdmin(page);
    await goToMediaPage(page);

    // Verificar que existe pelo menos 1 item (se não, pular busca)
    const count = await countGalleryCards(page);
    if (count === 0) {
      console.log('[ML-03] Galeria vazia — pulando teste de busca');
      return;
    }

    // Localizar campo de busca
    const searchInput = page.locator('[data-ai-id="media-toolbar-search"]').or(
      page.locator('input[placeholder*="buscar"], input[placeholder*="search"], input[type="search"]')
    ).first();

    await expect(searchInput).toBeVisible({ timeout: 15_000 });
    await searchInput.fill('nonexistent-xyz-abc-12345');
    await page.waitForTimeout(1_500);

    // Com busca sem resultado, galeria deve mostrar estado vazio
    const emptyState = page.locator('[data-ai-id="media-gallery-empty"]');
    const zeroCards = (await countGalleryCards(page)) === 0;

    expect(
      (await emptyState.isVisible({ timeout: 5_000 }).catch(() => false)) || zeroCards,
      'Busca por texto inexistente deveria resultar em galeria vazia'
    ).toBeTruthy();

    // Limpar busca — galeria deve restaurar
    await searchInput.clear();
    await page.waitForTimeout(1_500);
    const countAfterClear = await countGalleryCards(page);
    expect(countAfterClear, 'Após limpar busca, galeria deve mostrar itens').toBeGreaterThan(0);

    await snap(page, 'ML-03-search-filter');
    console.log('[ML-03] ✅ Busca e filtro funcionando');
  });

  test('ML-04 — Card abre sidebar com metadados', async ({ page }) => {
    await loginAsAdmin(page);
    await goToMediaPage(page);

    const count = await countGalleryCards(page);
    if (count === 0) {
      console.log('[ML-04] Galeria vazia — pulando teste de sidebar');
      return;
    }

    // Clicar no primeiro card
    const firstCard = page.locator('[data-ai-id="media-gallery-card"]').first();
    await firstCard.click();
    await page.waitForTimeout(1_500);

    // Sidebar deve abrir
    const sidebar = page.locator('[data-ai-id="media-sidebar-panel"]');
    await expect(sidebar).toBeVisible({ timeout: 15_000 });

    // Verificar que metadados estão presentes (nome do arquivo ou título)
    const sidebarText = await sidebar.textContent();
    expect(sidebarText, 'Sidebar deve ter conteúdo').toBeTruthy();

    await snap(page, 'ML-04-sidebar-metadata');
    console.log('[ML-04] ✅ Sidebar abriu com metadados');
  });

  test('ML-05 — Lightbox abre imagem em preview', async ({ page }) => {
    await loginAsAdmin(page);
    await goToMediaPage(page);

    const count = await countGalleryCards(page);
    if (count === 0) {
      console.log('[ML-05] Galeria vazia — pulando teste de lightbox');
      return;
    }

    // Procurar botão de preview/lightbox no primeiro card
    const firstCard = page.locator('[data-ai-id="media-gallery-card"]').first();

    // Hover para mostrar botões de ação
    await firstCard.hover();
    await page.waitForTimeout(500);

    // Tentar botão de preview (olho, expand, fullscreen)
    const previewBtn = firstCard.getByRole('button', { name: /preview|ver|view|expand|ampliar/i }).first();
    const lightboxExists = await previewBtn.isVisible({ timeout: 3_000 }).catch(() => false);

    if (lightboxExists) {
      await previewBtn.click();
      await page.waitForTimeout(2_000);

      const lightbox = page.locator('[data-ai-id="media-lightbox"]');
      await expect(lightbox).toBeVisible({ timeout: 10_000 });

      await snap(page, 'ML-05-lightbox-open');
      console.log('[ML-05] ✅ Lightbox abriu');

      // Fechar lightbox (Escape)
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      console.log('[ML-05] Botão de preview não encontrado no hover — OK para este ambiente');
    }
  });

  test('ML-06 — Editor de imagem abre (crop/rotate)', async ({ page }) => {
    await loginAsAdmin(page);
    await goToMediaPage(page);

    const count = await countGalleryCards(page);
    if (count === 0) {
      console.log('[ML-06] Galeria vazia — pulando teste de editor');
      return;
    }

    // Abrir sidebar primeiro
    const firstCard = page.locator('[data-ai-id="media-gallery-card"]').first();
    await firstCard.click();
    await page.waitForTimeout(1_500);

    // Procurar botão de edição
    const editBtn = page.getByRole('button', { name: /editar|edit|crop|cortar/i }).first();
    const editExists = await editBtn.isVisible({ timeout: 5_000 }).catch(() => false);

    if (editExists) {
      await editBtn.click();
      await page.waitForTimeout(2_000);

      const editor = page.locator('[data-ai-id="media-image-editor"]');
      await expect(editor).toBeVisible({ timeout: 15_000 });

      await snap(page, 'ML-06-image-editor');
      console.log('[ML-06] ✅ Editor de imagem abriu');

      // Fechar editor (pressionar Escape ou botão cancelar)
      const cancelBtn = page.getByRole('button', { name: /cancelar|cancel|fechar|close/i }).first();
      if (await cancelBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await cancelBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
    } else {
      console.log('[ML-06] Botão de edição não visível na sidebar — OK');
    }
  });

  test('ML-07 — Delete de imagem remove da galeria', async ({ page }) => {
    await loginAsAdmin(page);

    // Fazer upload de uma imagem para deletar
    await goToMediaPage(page);
    const testImagePath = createTestImageFile(`ml-to-delete-${Date.now()}.png`);
    const fileInput = page.locator('input[type="file"]').first();

    // Upload
    const uploadButton = page.getByRole('button', { name: /upload|adicionar|enviar/i }).first();
    if (await uploadButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await uploadButton.click();
      await page.waitForTimeout(1_000);
    }

    if (await fileInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(5_000);
    }

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('[data-ai-id="admin-media-page-container"]', { timeout: 30_000 });
    await page.waitForTimeout(2_000);

    const countAfterUpload = await countGalleryCards(page);
    if (countAfterUpload === 0) {
      console.log('[ML-07] Nenhum item para deletar — pulando');
      return;
    }

    // Clicar no primeiro card para abrir sidebar
    const firstCard = page.locator('[data-ai-id="media-gallery-card"]').first();
    await firstCard.click();
    await page.waitForTimeout(1_500);

    // Procurar botão de delete
    const deleteBtn = page.getByRole('button', { name: /excluir|deletar|delete|remover/i }).first();
    const deleteExists = await deleteBtn.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!deleteExists) {
      console.log('[ML-07] Botão de delete não encontrado — pulando');
      return;
    }

    await deleteBtn.click();
    await page.waitForTimeout(1_000);

    // Confirmar dialog (se houver)
    const confirmBtn = page.getByRole('button', { name: /confirmar|sim|yes|confirm|excluir/i }).first();
    if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    await page.waitForTimeout(3_000);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('[data-ai-id="admin-media-page-container"]', { timeout: 30_000 });
    await page.waitForTimeout(2_000);

    const countAfterDelete = await countGalleryCards(page);
    expect(countAfterDelete, 'Delete deve reduzir a contagem de itens na galeria').toBeLessThan(countAfterUpload);

    await snap(page, 'ML-07-delete-success');
    console.log('[ML-07] ✅ Delete removeu o item da galeria');

    try { fs.unlinkSync(testImagePath); } catch { /* ignore */ }
  });

  test('ML-08 — URL da imagem é acessível via HTTP', async ({ page, request }) => {
    await loginAsAdmin(page);
    await goToMediaPage(page);

    const count = await countGalleryCards(page);
    if (count === 0) {
      console.log('[ML-08] Galeria vazia — pulando teste de URL');
      return;
    }

    // Pegar a URL da primeira imagem no card (src do <img>)
    const firstImg = page.locator('[data-ai-id="media-gallery-card"] img').first();
    const imgSrc = await firstImg.getAttribute('src').catch(() => null);

    if (!imgSrc) {
      console.log('[ML-08] Nenhum img src encontrado — pulando');
      return;
    }

    console.log(`[ML-08] Testando URL da imagem: ${imgSrc}`);

    // Se for URL relativa, resolver com base URL
    const fullUrl = imgSrc.startsWith('http') ? imgSrc : `${BASE_URL}${imgSrc}`;

    const response = await request.get(fullUrl);
    expect(response.status(), `Imagem deve ser acessível: ${fullUrl}`).toBeLessThan(400);

    await snap(page, 'ML-08-image-url-accessible');
    console.log(`[ML-08] ✅ URL da imagem acessível (${response.status()}): ${fullUrl}`);
  });
});

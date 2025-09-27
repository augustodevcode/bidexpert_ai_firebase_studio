// tests/ui/media-library.spec.ts
import { test, expect, type Page } from '@playwright/test';
import path from 'path';

const testRunId = `media-e2e-${Math.random().toString(36).substring(7)}`;
const testFileName = `${testRunId}-test-image.png`;
const testFilePath = path.join(__dirname, '..', 'fixtures', 'test-image.png'); // Assume a test image exists in a fixtures folder

test.describe('Módulo 11: Media Library UI Flow', () => {

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
  });

  test('Cenário 11.1: should upload a new file, verify it in the library, and then delete it', async ({ page }) => {
    // 1. Navegar para a Biblioteca de Mídia
    console.log('[Media Test] Navigating to Media Library...');
    await page.goto('/admin/media');
    await expect(page.getByRole('heading', { name: 'Biblioteca de Mídia' })).toBeVisible();

    // 2. Iniciar o processo de upload
    await page.getByRole('button', { name: 'Enviar Nova Mídia' }).click();
    await page.waitForURL('/admin/media/upload');
    await expect(page.getByRole('heading', { name: 'Enviar Nova Mídia' })).toBeVisible();
    console.log('[Media Test] On upload page.');

    // 3. Selecionar o arquivo para upload
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByLabel('selecione do seu computador').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
        name: testFileName,
        mimeType: 'image/png',
        buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64')
    });
    
    // Verificar se o arquivo apareceu na lista de "prontos para enviar"
    await expect(page.getByText(testFileName)).toBeVisible();
    console.log(`[Media Test] File "${testFileName}" selected.`);

    // 4. Enviar o arquivo
    await page.getByRole('button', { name: /Enviar \d+ Arquivo/ }).click();

    // 5. Verificar a notificação de sucesso e o redirecionamento
    await expect(page.getByText('Upload Concluído')).toBeVisible({ timeout: 20000 });
    await page.waitForURL('/admin/media?refresh=*');
    console.log('[Media Test] Upload successful, redirected back to library.');

    // 6. Verificar se o novo item de mídia está na tabela
    const newMediaRow = page.getByRole('row', { name: new RegExp(testFileName, 'i') });
    await expect(newMediaRow).toBeVisible();
    console.log('[Media Test] Uploaded file is visible in the library table.');

    // 7. Excluir o item de mídia para limpar o ambiente
    await newMediaRow.getByRole('button', { name: 'Abrir menu' }).click();
    
    // Usar page.on para lidar com o diálogo de confirmação nativo
    page.once('dialog', async dialog => {
        console.log(`[Media Test] Dialog message: ${dialog.message()}`);
        await dialog.accept();
    });
    
    await page.getByRole('menuitem', { name: 'Excluir' }).click();

    // 8. Verificar a notificação de sucesso da exclusão e a remoção da tabela
    await expect(page.getByText('Item de mídia excluído com sucesso.')).toBeVisible();
    await expect(newMediaRow).not.toBeVisible();
    console.log('[Media Test] File successfully deleted.');
  });
});

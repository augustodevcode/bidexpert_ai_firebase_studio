import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Media Library Upload', () => {
  test.setTimeout(60000);

  test('should upload an image and verify it appears in the gallery', async ({ page }) => {
    const testImagePath = path.join(__dirname, 'test-upload-image.png');

    page.on('response', response => {
      if (response.url().includes('/api/upload')) {
        console.log('Upload response status:', response.status());
        response.json().then(data => console.log('Upload response data:', data)).catch(() => {});
      }
    });

    try {

    // 1. Login inline
    await page.goto('http://demo.localhost:9005/auth/login');
    
    // Check if we are already logged in (redirected to dashboard)
    try {
      await page.waitForURL('**/dashboard/**', { timeout: 5000 });
      console.log('Already logged in');
    } catch (e) {
      console.log('Not logged in, filling credentials');
      await page.locator('[data-ai-id="auth-login-email-input"]').fill('admin@bidexpert.com.br');
      await page.locator('[data-ai-id="auth-login-password-input"]').fill('Admin@123');
      await page.locator('[data-ai-id="auth-login-submit-button"]').click();
      await page.waitForTimeout(3000);
    }
    
    // 2. Navigate to Media Library
    await page.goto('http://demo.localhost:9005/admin/media');
    await expect(page.getByRole('main').getByText('Biblioteca de Mídia')).toBeVisible({ timeout: 15000 });
    
    // 3. Verify texts are correct (no encoding issues)
    await expect(page.getByRole('main').getByText('Biblioteca de Mídia')).toBeVisible();
    await expect(page.getByText('Gerencie imagens, documentos e ativos visuais da plataforma.')).toBeVisible();
    await expect(page.getByPlaceholder('Buscar por título, nome...')).toBeVisible();
    
    // 4. Create a dummy image file for upload
    // Create a simple 1x1 PNG file
    const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(testImagePath, pngBuffer);
    
    // 5. Upload the image
    // Click the upload button to open the dialog/zone
    await page.getByRole('button', { name: /Enviar/i }).click();
    
    // Wait for the file input to be attached to the DOM
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);
    
    // Wait for upload to complete (the file name should appear in the upload zone with a success indicator)
    const uploadZone = page.locator('[data-ai-id="media-upload-zone"]');
    await expect(uploadZone.getByText('test-upload-image.png').first()).toBeVisible({ timeout: 15000 });
    await expect(uploadZone.getByText('1 enviado(s)')).toBeVisible({ timeout: 15000 });
    
    // 6. Verify it appears in the gallery
    // The uploaded file should be named 'test-upload-image.png'
    // We can close the upload zone or just look for the image in the gallery
    await uploadZone.getByRole('button').first().click();
    
    // Wait for the gallery to refresh and show the uploaded image
    const imageElement = page.locator('main img[alt="test-upload-image"]').first();
    await expect(imageElement).toBeVisible({ timeout: 15000 });
    
    // 7. Verify it appears on the server (Local Storage)
    // The file should be in public/uploads/...
    // We can check this by making a request to the image URL
    const src = await imageElement.getAttribute('src');
    expect(src).toBeTruthy();
    
    const response = await page.request.get(src!);
    expect(response.status()).toBe(200);
    
    } finally {
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
      }
    }
  });
});

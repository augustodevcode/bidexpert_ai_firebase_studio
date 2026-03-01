/**
 * @fileoverview Testes E2E visuais para o fluxo completo de mensagens de contato.
 */
import { test, expect } from '@playwright/test';

// Define o timeout base para aguardar cada step (dev mode lazy compilation mode)
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://demo.localhost:9010';

async function loginFast(page: any, email: string, pass: string) {
  await page.goto(BASE_URL + '/auth/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', pass);
  await page.click('button[type="submit"]');
  await page.waitForURL(url => url.pathname === '/dashboard' || url.pathname === '/admin/contact-messages', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
}

test.describe('ATOR 1 — Visitante/Comprador no Formulário de Contato', () => {

  test('1.1 Página /contact carrega corretamente', async ({ page }) => {
    test.setTimeout(120_000); 
    await page.goto(BASE_URL + '/contact', { waitUntil: 'domcontentloaded' });
    const heading = page.getByRole('heading', { name: /fale/i });
    await expect(heading).toBeVisible();
  });

  test('1.2 Validação HTML5 — campos obrigatórios bloqueiam envio vazio', async ({ page }) => {
    await page.goto(BASE_URL + '/contact', { waitUntil: 'domcontentloaded' });
    const submitBtn = page.getByRole('button', { name: /enviar/i });
    await submitBtn.click();
    const nameInput = page.getByPlaceholder(/nome/i).first();
    await expect(nameInput).toHaveAttribute('required', '');
  });

  test('1.3 Visitante não autenticado envia mensagem', async ({ page }) => {
    test.setTimeout(120_000); 
    await page.goto(BASE_URL + '/contact', { waitUntil: 'domcontentloaded' });
    await page.fill('input[name="name"]', 'João Teste');
    await page.fill('input[name="email"]', 'joao.teste@example.com');
    await page.fill('input[name="phone"]', '11999999999');
    await page.fill('textarea[name="message"]', 'Mensagem de teste E2E do visitante');
    
    await page.click('button[type="submit"]');
    
    // Verifica toast de sucesso e reset
    await expect(page.getByText(/mensagem enviada/i, { exact: false })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('input[name="name"]')).toHaveValue('');
  });

});

test.describe('ATOR 2 — Admin visualiza mensagens', () => {

  test('2.1 Admin visualiza mensagem no painel admin/contact-messages', async ({ page }) => {
    test.setTimeout(120_000); 
    await loginFast(page, 'admin@bidexpert.com.br', 'Admin@123');
    await page.goto(BASE_URL + '/admin/contact-messages', { waitUntil: 'domcontentloaded' });
    
    await expect(page.getByText(/João Teste/i).first()).toBeVisible({ timeout: 15_000 });
  });

});


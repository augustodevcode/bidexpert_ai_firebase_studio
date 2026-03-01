/**
 * @fileoverview Testes E2E visuais para o fluxo completo de mensagens de contato.
 * 
 * Formulário real em /contact usa os campos:
 *   - name="name"    → Nome Completo
 *   - name="email"   → Email
 *   - name="subject" → Assunto
 *   - name="message" → Mensagem
 * 
 * Heading principal: "Entre em Contato" (h1) e "Fale Conosco" (CardTitle)
 * Toast de sucesso: "Mensagem Enviada!"
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://demo.localhost:9005';

async function loginFast(page: any, email: string, pass: string) {
  await page.goto(BASE_URL + '/auth/login', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', pass);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin|\/dashboard/, { timeout: 30_000 }).catch(() => {});
}

test.describe('ATOR 1 — Visitante/Comprador no Formulário de Contato', () => {

  test('1.1 Página /contact carrega corretamente', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto(BASE_URL + '/contact', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    // Verifica o h1 da hero section
    await expect(page.getByRole('heading', { name: /Entre em Contato/i })).toBeVisible({ timeout: 30_000 });
    // Verifica o Card de formulário
    await expect(page.getByText(/Fale Conosco/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('1.2 Campos obrigatórios estão marcados como required', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto(BASE_URL + '/contact', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    // Os campos name, email, subject, message devem ter o atributo required
    await expect(page.locator('input[name="name"]')).toHaveAttribute('required', '');
    await expect(page.locator('input[name="email"]')).toHaveAttribute('required', '');
    await expect(page.locator('input[name="subject"]')).toHaveAttribute('required', '');
    await expect(page.locator('textarea[name="message"]')).toHaveAttribute('required', '');
  });

  test('1.3 Visitante não autenticado envia mensagem e recebe confirmação', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto(BASE_URL + '/contact', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    await page.fill('input[name="name"]', 'João Teste E2E');
    await page.fill('input[name="email"]', 'joao.teste@example.com');
    await page.fill('input[name="subject"]', 'Teste automatizado E2E');
    await page.fill('textarea[name="message"]', 'Mensagem de teste E2E — contato do visitante');

    await page.click('button[type="submit"]');

    // Aguarda toast de sucesso
    await expect(page.getByText(/Mensagem Enviada/i, { exact: false })).toBeVisible({ timeout: 20_000 });
    // Form deve ser resetado após envio bem-sucedido
    await expect(page.locator('input[name="name"]')).toHaveValue('', { timeout: 5_000 });
  });

});

test.describe('ATOR 2 — Admin visualiza mensagens de contato', () => {

  test('2.1 Admin visualiza mensagem no painel /admin/contact-messages', async ({ page }) => {
    test.setTimeout(120_000);
    await loginFast(page, 'admin@bidexpert.com.br', 'Admin@123');
    await page.goto(BASE_URL + '/admin/contact-messages', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    // A mensagem enviada no teste 1.3 deve aparecer na listagem
    await expect(page.getByText(/João Teste E2E/i).first()).toBeVisible({ timeout: 20_000 });
  });

});


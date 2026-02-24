/**
 * @file Script para autenticar e salvar session do Playwright
 * 
 * Executa login manualmente e salva os cookies/token em .auth/user.json
 * para que os testes possam reutilizar a sessão sem fazer login novo.
 * 
 * Uso: npx ts-node scripts/auth-setup-playwright.ts
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://demo.localhost:9005';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@bidexpert.ai';
const ADMIN_PASSWORD = 'Admin@123'; // Usar senha do seed

const AUTH_DIR = path.join(process.cwd(), 'tests/e2e/.auth');
const AUTH_FILE = path.join(AUTH_DIR, 'user.json');

async function createAuthFile() {
  console.log(`🔐 Iniciando autenticação com ${ADMIN_EMAIL}...`);
  console.log(`📍 Base URL: ${BASE_URL}`);

  // Garantir que o diretório .auth/ existe
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
    console.log(`📁 Criado diretório: ${AUTH_DIR}`);
  }

  const browser = await chromium.launch();

  try {
    const page = await browser.newPage();

    // 1. Navegar para login
    console.log('📄 Navegando para página de login...');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      console.warn('⚠️  Networkidle timeout (continuando mesmo assim)');
    });

    // 2. Preencher credenciais
    console.log('✏️  Preenchendo email e senha...');
    const emailInput = page.locator('[data-ai-id="auth-login-email-input"]');
    const passwordInput = page.locator('[data-ai-id="auth-login-password-input"]');
    const submitButton = page.locator('[data-ai-id="auth-login-submit-button"]');

    if (!(await emailInput.isVisible({ timeout: 5000 }).catch(() => false))) {
      throw new Error('Email input não encontrado. Verifique se a página de login carregou corretamente.');
    }

    await emailInput.fill(ADMIN_EMAIL);
    await passwordInput.fill(ADMIN_PASSWORD);

    // 3. Submeter
    console.log('🚀 Clicando em Login...');
    await submitButton.click();

    // 4. Aguardar redirecionamento (com timeout maior para lazy compilation)
    console.log('⏳ Aguardando redirecionamento após login...');
    try {
      await page.waitForURL(/(\/admin|\/dashboard|\/)(?:\?|$)/, { timeout: 120000 });
      console.log(`✅ Redirecionado para: ${page.url()}`);
    } catch (e) {
      console.error('❌ Timeout ao aguardar redirecionamento');
      console.error('URL atual:', page.url());
      
      // Salvar evidência de debug
      await page.screenshot({ path: path.join(AUTH_DIR, 'login-failure.png'), fullPage: true });
      const html = await page.content();
      fs.writeFileSync(path.join(AUTH_DIR, 'login-failure.html'), html);
      
      throw new Error('Login falhou. Verifique login-failure.png e login-failure.html em .auth/');
    }

    // 5. Salvar cookies/localStorage (context state)
    console.log('💾 Salvando session...');
    const storageState = await page.context().storageState();

    fs.writeFileSync(AUTH_FILE, JSON.stringify(storageState, null, 2));
    console.log(`✅ Session salva em: ${AUTH_FILE}`);

    // 6. Verificação: navegar a um endpoint autenticado para garantir que funciona
    console.log('🔍 Verificando se session é válida...');
    await page.goto(`${BASE_URL}/admin/media`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    if (page.url().includes('/auth/login')) {
      throw new Error('Session inválida: página redirecionou para login novamente');
    }

    console.log('✅ Session é válida e reutilizável!');
    console.log(`🎉 Autenticação pronta para testes. Arquivo: ${AUTH_FILE}`);

  } finally {
    await browser.close();
  }
}

createAuthFile().catch((error) => {
  console.error('❌ Erro durante autenticação:', error.message);
  process.exit(1);
});

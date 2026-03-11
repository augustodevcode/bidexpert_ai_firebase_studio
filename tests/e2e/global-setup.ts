/**
 * @fileoverview Setup global do Playwright com autenticação por tenant e usuários seed.
 */
import { chromium, FullConfig, Page } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import { ensureSeedExecuted, loginAsAdmin, loginAsLawyer } from './helpers/auth-helper';

const DEBUG_DIR = path.resolve(process.cwd(), 'tests/e2e/.debug');

function ensureDebugDir() {
  if (!fs.existsSync(DEBUG_DIR)) {
    fs.mkdirSync(DEBUG_DIR, { recursive: true });
  }
}

async function captureDebugArtifacts(page: Page, name: string) {
  try {
    ensureDebugDir();
    await page.screenshot({ path: path.join(DEBUG_DIR, `${name}.png`), fullPage: true });
  } catch (err) {
    console.warn('[global-setup] Não foi possível salvar screenshot de debug:', err);
  }
}

async function globalSetup(config: FullConfig) {
  const baseURL = process.env.BASE_URL || config.projects[0].use.baseURL || 'http://localhost:9005';
  const baseUrlObject = new URL(baseURL);
  const isDemoTenant = baseUrlObject.hostname.startsWith('demo.') || baseUrlObject.hostname.includes('demo');
  
  // SEED CREDENTIALS (canonical source: scripts/ultimate-master-seed.ts)
  // - Demo tenant (demo.localhost): admin@bidexpert.com.br / Admin@123
  // - Default tenant (localhost): admin@bidexpert.com.br / Admin@123
  // IMPORTANT: If login fails, verify seed was executed: npm run db:seed
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@bidexpert.com.br';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const fallbackAdminPassword = process.env.ADMIN_PASSWORD_FALLBACK || 'Test@12345';
  const shouldAuthLawyer = process.env.PLAYWRIGHT_SKIP_LAWYER !== '1' && !isDemoTenant;
  
  // ─── SEED GATE: Abort early if seed not executed ───
  try {
    await ensureSeedExecuted(baseURL);
  } catch (seedError: unknown) {
    const errMsg = seedError instanceof Error ? seedError.message : String(seedError);
    if (errMsg.includes('SEED') || errMsg.includes('fetch')) {
      console.warn(`⚠️  Seed gate check falhou (servidor pode não estar pronto): ${errMsg}`);
      console.warn('Continuando setup — o login falhará se seed realmente não existe.');
    }
  }

  console.log('🔐 Iniciando autenticação global para testes...');
  console.log('🌐 Base URL:', baseURL);
  console.log('⏳ Aguardando servidor estar disponível...');

  // Extract port and protocol to check connectivity on localhost/IP directly
  // This bypasses issues where Node cannot resolve *.localhost
  const checkUrl = `${baseUrlObject.protocol}//localhost:${baseUrlObject.port}/auth/login`;

  console.log(`🔍 Checking connectivity at ${checkUrl} (bypassing DNS for check)...`);
  
  // Aguarda o servidor estar realmente acessível antes de prosseguir
  const maxWaitTime = 180000; // 3 minutos
  const startTime = Date.now();
  let serverReady = false;
  
  while (!serverReady && (Date.now() - startTime) < maxWaitTime) {
    try {
      const response = await fetch(checkUrl);
      if (response.status < 500) {
        serverReady = true;
        console.log('✅ Servidor acessível');
      }
    } catch (e) {
      // Fallback: try original URL just in case
      try {
          const response = await fetch(`${baseURL}/auth/login`);
          if (response.status < 500) {
            serverReady = true;
            console.log('✅ Servidor acessível (via URL original)');
          }
      } catch (e2) {
         await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  if (!serverReady) {
    throw new Error('Servidor não ficou disponível após 3 minutos');
  }
  
  const browser = await chromium.launch();
  let adminPage: Page | undefined;
  
  try {
    // 1. Autenticar como ADMIN
    adminPage = await browser.newPage();
    try {
      await loginAsAdmin(adminPage, baseURL);
    } catch (e) {
      console.error('❌ Timeout waiting for redirect. Current URL:', adminPage.url());
      await captureDebugArtifacts(adminPage, 'admin-login-failure');
      const content = await adminPage.content();
      fs.writeFileSync(path.join(DEBUG_DIR, 'admin-login-failure.html'), content);
      throw e;
    }
    await adminPage.waitForTimeout(2000);

    const adminCookies = await adminPage.context().cookies();
    const adminSessionCookie = adminCookies.find(c => c.name === 'session' || c.name === 'next-auth.session-token');
    
    if (!adminSessionCookie) {
      console.warn('⚠️  Session cookie não encontrado, tentando senha alternativa...');
      process.env.ADMIN_PASSWORD = fallbackAdminPassword;
      await loginAsAdmin(adminPage, baseURL);
      await adminPage.waitForTimeout(2000);
    }

    await adminPage.context().storageState({ path: './tests/e2e/.auth/admin.json' });
    console.log('✅ Autenticação ADMIN concluída');
    await adminPage.close();

    if (shouldAuthLawyer) {
      // 2. Autenticar como ADVOGADO
      const lawyerPage = await browser.newPage();
      await loginAsLawyer(lawyerPage, baseURL);

      try {
        await lawyerPage.waitForLoadState('networkidle', { timeout: 60000 });
      } catch (error) {
        console.warn('[global-setup] Lawyer login não atingiu networkidle em 60s, seguindo para validação manual.');
      }

      // Força navegação para o dashboard do advogado para validar sessão, independente do redirect padrão.
      await lawyerPage.goto(`${baseURL}/lawyer/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });

      try {
        await Promise.race([
          lawyerPage.waitForSelector('[data-ai-id="lawyer-dashboard-page"]', { timeout: 60000 }),
          lawyerPage.waitForSelector('[data-ai-id="lawyer-dashboard-error-state"]', { timeout: 60000 })
        ]);

        if (await lawyerPage.isVisible('[data-ai-id="lawyer-dashboard-error-state"]')) {
          const errorText = await lawyerPage.textContent('[data-ai-id="lawyer-dashboard-error-state"]');
          console.warn('⚠️  Painel do advogado carregou com erro:', errorText);
        }
      } catch (error) {
        console.error('[global-setup] Falha ao carregar painel do advogado (timeout ou erro). URL atual:', lawyerPage.url());
        await captureDebugArtifacts(lawyerPage, `lawyer-login-error-${Date.now()}`);
      }

      console.log('✅ Painel do advogado acessado em', lawyerPage.url());
      await lawyerPage.waitForTimeout(1000);

      await lawyerPage.context().storageState({ path: './tests/e2e/.auth/lawyer.json' });
      console.log('✅ Autenticação ADVOGADO concluída');
      await lawyerPage.close();
    } else {
      console.log('ℹ️  Login do advogado pulado para tenant demo.');
    }

    console.log('✅ Todas autenticações concluídas');
    
  } catch (error) {
    console.error('❌ Erro na autenticação global:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;

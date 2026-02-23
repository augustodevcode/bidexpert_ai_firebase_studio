/**
 * @file Autenticação via API para Playwright
 * 
 * Em vez de usar Playwright UI (que está travando no redirecionamento),
 * fazemos login via API diretamente e salvamos os cookies.
 * 
 * Uso: npx ts-node scripts/auth-api-setup.ts
 */

import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://demo.localhost:9005';
const AUTH_DIR = path.join(process.cwd(), 'tests/e2e/.auth');
const AUTH_FILE = path.join(AUTH_DIR, 'user.json');

// Dados de login
const loginPayload = {
  email: 'admin@bidexpert.ai',
  password: 'Admin@123',
  // Tentar deixar sem tenant selector para ver se auto-resolve
};

async function setupAuthViaAPI() {
  // 1. Criar diretório se não existir
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  console.log(`🔐 Autenticando via API...`);
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`👤 Email: ${loginPayload.email}`);

  try {
    // 2. Fazer requisição de login
    console.log('🚀 Enviando credenciais para login...');
    
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginPayload),
      redirect: 'manual', // Não seguir redirects automaticamente
    });

    console.log(`📊 Status da resposta: ${loginResponse.status}`);

    // Extrair headers Set-Cookie
    const setCookieHeaders = loginResponse.headers.raw()['set-cookie'] || [];
    console.log(`🍪 Número de cookies: ${setCookieHeaders.length}`);

    if (setCookieHeaders.length === 0 && loginResponse.status !== 200) {
      // Se não há cookies e status != 200, pode ser um erro
      const body = await loginResponse.text();
      console.warn(`⚠️  Response body: ${body.substring(0, 200)}`);
    }

    // 3. Converter cookies em formato Playwright
    const cookies: any[] = [];
    setCookieHeaders.forEach((setCookie: string) => {
      const parts = setCookie.split(';')[0].split('=');
      const name = parts[0].trim();
      const value = parts[1]?.trim() || '';
      
      if (name && value) {
        cookies.push({
          name,
          value,
          domain: 'demo.localhost',
          path: '/',
          expires: -1,
          httpOnly: false,
          secure: false,
          sameSite: 'Lax',
        });
      }
    });

    // 4. Se houver cookies, salvar com essa estrutura
    if (cookies.length > 0) {
      const storageState = {
        cookies,
        origins: [],
      };
      
      fs.writeFileSync(AUTH_FILE, JSON.stringify(storageState, null, 2));
      console.log(`✅ Session salva em: ${AUTH_FILE}`);
      console.log(`🍪 Cookies armazenados: ${cookies.map((c) => c.name).join(', ')}`);
    } else {
      console.warn(`⚠️  Nenhum cookie retornado do servidor`);
      console.warn(`   Verificando se é necessário acessar o endpoint certo...`);
      
      // Tentar alternativas
      const alternatives = [
        `${BASE_URL}/api/login`,
        `${BASE_URL}/auth/api/login`,
        `${BASE_URL}/api/auth/callback/credentials`,
      ];

      for (const alt of alternatives) {
        console.log(`   Tentando: ${alt}`);
        try {
          const altResponse = await fetch(alt, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginPayload),
            redirect: 'manual',
          });
          
          if (altResponse.status < 400) {
            console.log(`   ✅ Status encontrado em ${alt}: ${altResponse.status}`);
            break;
          }
        } catch (e) {
          // Continuar
        }
      }
    }

    // 5. Fallback: criar arquivo .auth/user.json vazio (para que o teste pelo menos rode)
    if (!fs.existsSync(AUTH_FILE)) {
      const fallbackState = {
        cookies: [],
        origins: [],
      };
      
      fs.writeFileSync(AUTH_FILE, JSON.stringify(fallbackState, null, 2));
      console.log(`⚠️  Nenhum cookie foi obtido. Criado arquivo vazio em ${AUTH_FILE}`);
      console.log(`   Os testes rodarão sem autenticação pré-salvaa`);
    }

  } catch (error) {
    console.error(`❌ Erro during auth setup:`, error);
    
    // Ainda criar arquivo vazio como fallback
    if (!fs.existsSync(AUTH_FILE)) {
      const fallbackState = { cookies: [], origins: [] };
      fs.writeFileSync(AUTH_FILE, JSON.stringify(fallbackState, null, 2));
    }
  }
}

setupAuthViaAPI();

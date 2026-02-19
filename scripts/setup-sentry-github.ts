/**
 * Script para configurar integração Sentry → GitHub Issues
 * Executar: npx tsx scripts/setup-sentry-github.ts
 */

import { Octokit } from "@octokit/rest";

const SENTRY_ORG = process.env.SENTRY_ORG;
const SENTRY_PROJECT = process.env.SENTRY_PROJECT;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function setupSentryGitHubIntegration() {
  console.log("🔧 Configurando integração Sentry → GitHub...");
  
  // Instruções para o usuário
  console.log(`
📋 PASSOS MANUAIS NECESSÁRIOS:

1. Acesse: https://sentry.io/settings/${SENTRY_ORG}/integrations/github/

2. Clique em "Install" ou "Configure" no GitHub

3. Autorize o Sentry a acessar: augustodevcode/bidexpert_ai_firebase_studio

4. Configure Alert Rules:
   - Acesse: https://sentry.io/organizations/${SENTRY_ORG}/alerts/rules/
   - Crie nova regra:
     * Condição: "An event is seen"
     * Filtro: level:error OR level:fatal
     * Ação: "Create a new issue in GitHub"
     * Repositório: augustodevcode/bidexpert_ai_firebase_studio
     * Labels: ["bug", "sentry", "production-error"]
     * Assignee: augustodevcode
     
5. Configurar Rate Limiting:
   - Mesmo erro: apenas 1 issue a cada 24h
   - Erros similares: agrupar por fingerprint

✅ Após configurar, os erros de produção criarão issues automaticamente!
  `);
  
  // Verificar se o token do GitHub está configurado
  if (!GITHUB_TOKEN) {
    console.error("❌ GITHUB_TOKEN não encontrado no .env");
    return;
  }
  
  const octokit = new Octokit({ auth: GITHUB_TOKEN });
  
  // Testar conexão
  try {
    const { data } = await octokit.repos.get({
      owner: "augustodevcode",
      repo: "bidexpert_ai_firebase_studio",
    });
    console.log(`✅ Repositório encontrado: ${data.full_name}`);
  } catch (error) {
    console.error("❌ Erro ao acessar repositório:", error);
  }
}

setupSentryGitHubIntegration();

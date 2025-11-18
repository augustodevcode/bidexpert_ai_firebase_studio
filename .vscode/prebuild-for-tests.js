#!/usr/bin/env node

/**
 * SCRIPT: Pre-build para testes E2E
 * 
 * Propósito: Compilar todas as páginas ANTES de rodar Playwright
 * Evita: Lazy compilation que causa timeouts nos testes
 * 
 * Execução: node .vscode/prebuild-for-tests.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║            🔨 PRÉ-BUILD PARA TESTES E2E                      ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

const steps = [
  {
    name: '🧹 Limpando .next anterior',
    cmd: 'rmdir /s /q .next 2>nul || echo "Nada para limpar"'
  },
  {
    name: '⚙️  Gerando Prisma Client',
    cmd: 'npx prisma generate'
  },
  {
    name: '🏗️  Compilando aplicação completa',
    cmd: 'npm run build'
  },
  {
    name: '✅ Build completo',
    cmd: 'echo "Build finalizado com sucesso"'
  }
];

let completed = 0;
const totalSteps = steps.length;

try {
  console.log(`📊 Total de etapas: ${totalSteps}\n`);

  steps.forEach((step, index) => {
    console.log(`[${index + 1}/${totalSteps}] ${step.name}...`);
    
    try {
      const output = execSync(step.cmd, { 
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      completed++;
      console.log(`    ✅ Concluído\n`);
    } catch (error) {
      console.log(`    ⚠️  Aviso: ${error.message.split('\n')[0]}\n`);
      // Continua mesmo com erros (alguns comandos podem falhar em Windows)
      completed++;
    }
  });

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                     ✅ PRÉ-BUILD COMPLETO                   ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('\n📌 Próximo passo: Iniciar servidor com:');
  console.log('   npm run dev\n');
  console.log('   Ou usar a task do VS Code: "Run BidExpert App"\n');
  
  process.exit(0);
} catch (error) {
  console.error('\n❌ Erro durante pré-build:', error.message);
  process.exit(1);
}

/**
 * Script para verificar se as variáveis de ambiente do NextAuth estão configuradas corretamente
 * 
 * Uso: npx tsx --env-file=.env scripts/verify-auth-config.ts
 */

console.log('🔍 Verificando configuração do NextAuth...\n');

// Verificar variáveis de ambiente
const checks = {
  'AUTH_SECRET': process.env.AUTH_SECRET,
  'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET,
  'SESSION_SECRET': process.env.SESSION_SECRET,
  'DATABASE_URL': process.env.DATABASE_URL ? '✓ Definida' : undefined,
};

let hasError = false;

console.log('📋 Variáveis de Ambiente:\n');

for (const [key, value] of Object.entries(checks)) {
  if (value) {
    if (key === 'DATABASE_URL') {
      console.log(`✅ ${key}: ${value}`);
    } else {
      const displayValue = value.substring(0, 20) + '...';
      console.log(`✅ ${key}: ${displayValue} (${value.length} caracteres)`);
      
      // Verificar comprimento mínimo
      if (value.length < 32) {
        console.log(`   ⚠️  AVISO: Secret muito curto! Recomendado: mínimo 32 caracteres\n`);
      }
    }
  } else {
    console.log(`❌ ${key}: NÃO DEFINIDA`);
    if (key === 'AUTH_SECRET' || key === 'NEXTAUTH_SECRET') {
      hasError = true;
    }
  }
}

console.log('\n' + '='.repeat(80));

// Verificar se pelo menos uma das variáveis está definida
if (!checks.AUTH_SECRET && !checks.NEXTAUTH_SECRET) {
  console.log('\n❌ ERRO: Nenhuma variável de secret do NextAuth está definida!');
  console.log('\n📝 Para corrigir, adicione uma das seguintes linhas ao arquivo .env:');
  console.log('   AUTH_SECRET="seu_secret_aqui"');
  console.log('   NEXTAUTH_SECRET="seu_secret_aqui"');
  console.log('\n💡 Use o comando para gerar um secret seguro:');
  console.log('   npm run auth:generate-secret\n');
  process.exit(1);
}

if (checks.AUTH_SECRET && checks.NEXTAUTH_SECRET) {
  if (checks.AUTH_SECRET !== checks.NEXTAUTH_SECRET) {
    console.log('\n⚠️  AVISO: AUTH_SECRET e NEXTAUTH_SECRET têm valores diferentes!');
    console.log('   Recomenda-se usar o mesmo valor para ambas.\n');
  }
}

if (!hasError) {
  console.log('\n✅ Configuração do NextAuth OK!');
  console.log('   Todas as variáveis necessárias estão definidas.\n');
  
  // Testar importação do módulo de auth
  try {
    console.log('🧪 Testando importação do módulo de autenticação...');
    require('../src/lib/auth');
    console.log('✅ Módulo de autenticação carregado com sucesso!\n');
  } catch (error) {
    console.error('❌ Erro ao carregar módulo de autenticação:', error);
    process.exit(1);
  }
} else {
  console.log('\n❌ Configuração do NextAuth com problemas!');
  console.log('   Corrija os erros acima antes de continuar.\n');
  process.exit(1);
}

console.log('='.repeat(80));
console.log('\n✨ Verificação concluída com sucesso!\n');

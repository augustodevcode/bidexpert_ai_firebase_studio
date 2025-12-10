#!/usr/bin/env node

/**
 * Script para gerar um secret seguro para NextAuth
 * 
 * Uso: node scripts/generate-auth-secret.js
 */

const crypto = require('crypto');

// Gera um secret de 64 caracteres em base64
const secret = crypto.randomBytes(48).toString('base64');

console.log('='.repeat(80));
console.log('🔐 Secret gerado para NextAuth');
console.log('='.repeat(80));
console.log('\nAdicione as seguintes linhas ao seu arquivo .env ou .env.local:\n');
console.log(`AUTH_SECRET="${secret}"`);
console.log(`NEXTAUTH_SECRET="${secret}"`);
console.log('\n' + '='.repeat(80));
console.log('\n⚠️  IMPORTANTE: Mantenha este secret em segredo e não o compartilhe!');
console.log('✅ Depois de adicionar ao .env, reinicie o servidor Next.js\n');

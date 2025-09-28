// scripts/init-db.ts
// Este script foi esvaziado para remover a dependência de arquivos de dados de exemplo estáticos.
// A lógica de seed de dados essenciais precisa ser recriada aqui no futuro.

import { prisma } from '@/lib/prisma';

async function initializeDatabase() {
  console.log('🚀 [DB INIT] LOG: Starting database initialization script...');
  try {
    // A lógica de seed que estava aqui foi removida.
    // TODO: Recriar a lógica para semear dados essenciais (Roles, Settings, etc.) sem depender de arquivos JSON.
    console.log("✅ [DB INIT] LOG: Initialization script finished (currently empty).");
  } catch (error: any) {
    console.error("[DB INIT] ❌ FATAL SCRIPT ERROR during database initialization:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

initializeDatabase();

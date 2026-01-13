/**
 * Limpeza Segura de Seed Data
 *
 * Script para limpar dados de seed respeitando constraints de foreign key
 * Ordem de limpeza: dependentes primeiro, depois entidades principais
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function safeCleanSeedData() {
  console.log('🧹 Iniciando limpeza segura de dados de seed...');

  try {
    // Ordem de limpeza: dependentes primeiro, depois principais

    // 1. Limpar dados de interações e transações (tabelas que existem)
    console.log('Limpando interações e transações...');
    await prisma.installmentPayment.deleteMany({});
    await prisma.wonLot.deleteMany({});
    await prisma.userWin.deleteMany({});
    await prisma.notification.deleteMany({});

    // 2. Limpar dados de pagamentos e lances
    console.log('Limpando pagamentos e lances...');
    await prisma.bid.deleteMany({});

    // 3. Limpar dados de leilões e lotes
    console.log('Limpando leilões e lotes...');
    await prisma.lot.deleteMany({});
    await prisma.auction.deleteMany({});

    // 4. Limpar dados de ativos
    console.log('Limpando ativos...');
    await prisma.asset.deleteMany({});

    // 5. Limpar dados de usuários e relacionamentos
    console.log('Limpando usuários e relacionamentos...');
    await prisma.usersOnRoles.deleteMany({});

    // 6. Limpar usuários (exceto admin se necessário)
    console.log('Limpando usuários...');
    await prisma.user.deleteMany({
      where: {
        email: {
          not: 'admin@bidexpert.com.br' // Preservar admin se existir
        }
      }
    });

    console.log('✅ Limpeza segura concluída!');

  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  try {
    await safeCleanSeedData();
  } catch (error) {
    console.error('Erro fatal na limpeza:', error);
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main();
}

export { safeCleanSeedData };
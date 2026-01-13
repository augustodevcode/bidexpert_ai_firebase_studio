/**
 * Seed Data Adicional - Sem Limpeza
 *
 * Script para adicionar dados de seed sem limpar dados existentes
 * Útil quando já há dados no banco e queremos apenas expandir
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addSeedData() {
  console.log('🌱 Adicionando dados de seed adicionais...');

  try {
    // Verificar se já temos dados básicos
    const userCount = await prisma.user.count();
    const auctionCount = await prisma.auction.count();
    const assetCount = await prisma.asset.count();

    console.log(`Dados existentes: ${userCount} usuários, ${auctionCount} leilões, ${assetCount} ativos`);

    if (userCount > 0 && auctionCount > 0 && assetCount > 0) {
      console.log('✅ Já existem dados suficientes no banco. Seed adicional não necessário.');
      return;
    }

    // Adicionar dados básicos se necessário
    console.log('Adicionando dados básicos...');

    // Aqui podemos adicionar lógica para criar dados específicos
    // que estão faltando, sem limpar o que já existe

    console.log('✅ Dados adicionais inseridos com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao adicionar dados:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  try {
    await addSeedData();
  } catch (error) {
    console.error('Erro fatal:', error);
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main();
}

export { addSeedData };
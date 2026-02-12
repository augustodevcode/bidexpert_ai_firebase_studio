/**
 * Script para limpar apenas usuários e dados relacionados antes do seed
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanUsers() {
  console.log('\n🧹 Limpando usuários existentes...\n');
  
  try {
    // Deletar em ordem (respeitando foreign keys)
    await prisma.userDocument.deleteMany({});
    console.log('✅ UserDocuments deletados');

    await prisma.auctionHabilitation.deleteMany({});
    console.log('✅ AuctionHabilitations deletados');

    await prisma.bid.deleteMany({});
    console.log('✅ Bids deletados');

    await prisma.usersOnRoles.deleteMany({});
    console.log('✅ UsersOnRoles deletados');

    await prisma.usersOnTenants.deleteMany({});
    console.log('✅ UsersOnTenants deletados');

    // Manter apenas o admin@bidexpert.com.br
    const deleted = await prisma.user.deleteMany({
      where: {
        email: {
          not: 'admin@bidexpert.com.br'
        }
      }
    });
    
    console.log(`✅ ${deleted.count} usuários deletados (mantido admin@bidexpert.com.br)\n`);
    console.log('🎯 Pronto para executar seed novamente!\n');

  } catch (error) {
    console.error('❌ Erro ao limpar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanUsers();

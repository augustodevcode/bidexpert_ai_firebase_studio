/**
 * Script para verificar usuários com diferentes status de habilitação
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkHabilitations() {
  console.log('\n📊 Verificando Usuários por Status de Habilitação:\n');

  const stats = await prisma.user.groupBy({
    by: ['habilitationStatus'],
    _count: {
      id: true
    }
  });

  stats.forEach(stat => {
    console.log(`  - ${stat.habilitationStatus}: ${stat._count.id} usuário(s)`);
  });

  console.log('\n📋 Detalhes dos Usuários com Habilitações:');
  
  const users = await prisma.user.findMany({
    where: {
      habilitationStatus: {
        in: ['PENDING_DOCUMENTS', 'PENDING_ANALYSIS', 'REJECTED_DOCUMENTS', 'BLOCKED', 'HABILITADO']
      }
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      habilitationStatus: true,
      accountType: true,
      createdAt: true,
      UserDocument: {
        select: {
          status: true,
          DocumentType: {
            select: {
              name: true
            }
          }
        }
      }
    },
    orderBy: {
      habilitationStatus: 'asc'
    },
    take: 50
  });

  console.log(`\nTotal encontrado: ${users.length} usuários\n`);

  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.fullName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Status: ${user.habilitationStatus}`);
    console.log(`   Tipo: ${user.accountType}`);
    console.log(`   Documentos: ${user.UserDocument.length}`);
    if (user.UserDocument.length > 0) {
      user.UserDocument.forEach(doc => {
        console.log(`     - ${doc.DocumentType.name}: ${doc.status}`);
      });
    }
    console.log('');
  });

  await prisma.$disconnect();
}

checkHabilitations().catch(console.error);

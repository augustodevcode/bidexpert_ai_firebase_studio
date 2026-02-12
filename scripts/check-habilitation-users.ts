/**
 * Script para verificar usuários de habilitação criados no seed
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkHabilitationUsers() {
  console.log('\n📊 Verificando usuários por status de habilitação...\n');
  
  const stats = await prisma.user.groupBy({
    by: ['habilitationStatus'],
    _count: {
      id: true
    },
    orderBy: {
      habilitationStatus: 'asc'
    }
  });

  console.log('Status de Habilitação | Total');
  console.log('------------------------------------------');
  
  let total = 0;
  for (const stat of stats) {
    console.log(`${stat.habilitationStatus.padEnd(25)} | ${stat._count.id}`);
    total += stat._count.id;
  }
  
  console.log('------------------------------------------');
  console.log(`TOTAL                     | ${total}\n`);

  // Listar alguns exemplos de cada status
  console.log('\n📋 Exemplos de usuários por status:\n');

  for (const statusGroup of stats) {
    const examples = await prisma.user.findMany({
      where: { habilitationStatus: statusGroup.habilitationStatus },
      select: {
        id: true,
        email: true,
        fullName: true,
        habilitationStatus: true,
        updatedAt: true
      },
      take: 3,
      orderBy: { updatedAt: 'desc' }
    });

    console.log(`\n${statusGroup.habilitationStatus}:`);
    for (const user of examples) {
      console.log(`  - ${user.email} | ${user.fullName} | Atualizado: ${user.updatedAt.toLocaleDateString()}`);
    }
  }

  await prisma.$disconnect();
}

checkHabilitationUsers().catch(console.error);

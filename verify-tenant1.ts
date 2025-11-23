import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenant1 = await prisma.tenant.findFirst({
    where: { id: 1 },
    include: {
      _count: {
        select: {
          auctions: true,
          lots: true,
          users: true
        }
      }
    }
  });

  console.log('\n📊 TENANT ID 1 (Padrão) - VERIFICAÇÃO FINAL:\n');
  console.log(`Nome: ${tenant1?.name}`);
  console.log(`Subdomain: ${tenant1?.subdomain}`);
  console.log(`Leilões: ${tenant1?._count.auctions}`);
  console.log(`Lotes: ${tenant1?._count.lots}`);
  console.log(`Usuários: ${tenant1?._count.users}`);
  console.log('');

  await prisma.$disconnect();
}

main();

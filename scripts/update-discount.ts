// scripts/update-discount.ts
// Script para atualizar o discountPercent da 2ª praça do leilão 38
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Buscar stages do leilão 38
  const stages = await prisma.auctionStage.findMany({
    where: { auctionId: 38 },
    orderBy: { startDate: 'asc' }
  });

  console.log('Stages encontrados:', stages.length);
  stages.forEach((s, i) => {
    console.log(`  Praça ${i+1}: id=${s.id}, name=${s.name}, discountPercent=${s.discountPercent}`);
  });

  if (stages.length >= 2) {
    // Atualizar a 2ª praça (index 1) com discountPercent = 60
    const secondStage = stages[1];
    
    const updated = await prisma.auctionStage.update({
      where: { id: secondStage.id },
      data: { discountPercent: 60 }
    });

    console.log('\n✅ 2ª Praça atualizada com discountPercent = 60:');
    console.log(`  id=${updated.id}, name=${updated.name}, discountPercent=${updated.discountPercent}`);
  } else {
    console.log('❌ Leilão 38 não tem 2 praças');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

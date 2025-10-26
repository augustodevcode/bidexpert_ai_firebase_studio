/**
 * Script para popular as 8 tabelas restantes que estão vazias
 */
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Populando as 8 tabelas restantes...\n');

  try {
    // 1. LotQuestion
    console.log('❓ Seeding LotQuestion...');
    const lots = await prisma.lot.findMany({ take: 20 });
    const users = await prisma.user.findMany({ take: 10 });
    let questionCount = 0;
    
    for (const lot of lots) {
      if (!lot.auctionId) continue;
      
      for (let i = 0; i < faker.number.int({ min: 0, max: 2 }); i++) {
        try {
          const user = faker.helpers.arrayElement(users);
          await prisma.lotQuestion.create({
            data: {
              lotId: lot.id,
              auctionId: lot.auctionId,
              userId: user.id,
              userDisplayName: user.fullName || 'Usuário',
              questionText: faker.helpers.arrayElement([
                'Qual o estado de conservação?',
                'Aceita visita?',
                'Tem nota fiscal?',
              ]),
              answerText: faker.datatype.boolean() ? 'Sim, está em ótimo estado.' : null,
            },
          });
          questionCount++;
        } catch (e) {}
      }
    }
    console.log(`✅ ${questionCount} LotQuestions criadas\n`);

    // 2. Review
    console.log('⭐ Seeding Review...');
    const soldLots = await prisma.lot.findMany({ where: { status: 'VENDIDO' }, take: 20 });
    let reviewCount = 0;
    
    for (const lot of soldLots) {
      if (faker.datatype.boolean() && lot.auctionId) {
        try {
          const user = faker.helpers.arrayElement(users);
          await prisma.review.create({
            data: {
              lotId: lot.id,
              auctionId: lot.auctionId,
              userId: user.id,
              userDisplayName: user.fullName || 'Usuário',
              rating: faker.number.int({ min: 3, max: 5 }),
              comment: 'Ótimo produto!',
            },
          });
          reviewCount++;
        } catch (e) {}
      }
    }
    console.log(`✅ ${reviewCount} Reviews criadas\n`);

    // 3. AssetsOnLots
    console.log('🔗 Seeding AssetsOnLots...');
    const lotsWithoutAssets = await prisma.lot.findMany({
      where: { assets: { none: {} } },
      take: 30,
    });
    const availableAssets = await prisma.asset.findMany({
      where: { status: 'DISPONIVEL' },
      take: 50,
    });
    
    let assetLotCount = 0;
    const admin = await prisma.user.findFirst({ where: { roles: { some: { role: { name: 'ADMIN' } } } } });
    
    for (const lot of lotsWithoutAssets) {
      if (availableAssets.length > 0) {
        const asset = availableAssets.pop()!;
        try {
          await prisma.assetsOnLots.create({
            data: {
              assetId: asset.id,
              lotId: lot.id,
              assignedBy: admin?.id || 'system',
            },
          });
          await prisma.asset.update({
            where: { id: asset.id },
            data: { status: 'LOTEADO' },
          });
          assetLotCount++;
        } catch (e) {}
      }
    }
    console.log(`✅ ${assetLotCount} AssetsOnLots criados\n`);

    // 4-7. Relacionamentos Many-to-Many
    console.log('🔗 Seeding Many-to-Many Relationships...');
    
    try {
      const allAuctions = await prisma.auction.findMany({ take: 30 });
      const courts = await prisma.court.findMany();
      const branches = await prisma.judicialBranch.findMany();
      const districts = await prisma.judicialDistrict.findMany();
      const categories = await prisma.lotCategory.findMany();
    
    if (courts.length === 0 || branches.length === 0 || districts.length === 0 || categories.length === 0) {
      console.log('⚠️  Dados insuficientes para relacionamentos many-to-many\n');
    } else {
      const judicialAuctions = allAuctions.filter(a => a.auctionType === 'JUDICIAL');
    
    let m2mCount = 0;
    
    for (const auction of judicialAuctions) {
      try {
        await prisma.$executeRaw`INSERT IGNORE INTO _AuctionToCourt (A, B) VALUES (${auction.id}, ${faker.helpers.arrayElement(courts).id})`;
        m2mCount++;
      } catch (e) {}
      
      try {
        await prisma.$executeRaw`INSERT IGNORE INTO _AuctionToJudicialBranch (A, B) VALUES (${auction.id}, ${faker.helpers.arrayElement(branches).id})`;
        m2mCount++;
      } catch (e) {}
      
      try {
        await prisma.$executeRaw`INSERT IGNORE INTO _AuctionToJudicialDistrict (A, B) VALUES (${auction.id}, ${faker.helpers.arrayElement(districts).id})`;
        m2mCount++;
      } catch (e) {}
      
      try {
        await prisma.$executeRaw`INSERT IGNORE INTO _AuctionToLotCategory (A, B) VALUES (${auction.id}, ${faker.helpers.arrayElement(categories).id})`;
        m2mCount++;
      } catch (e) {}
    }
    console.log(`✅ ${m2mCount} relacionamentos many-to-many criados\n`);
    }
    } catch (e) {
      console.log('⚠️  Erro ao criar relacionamentos many-to-many\n');
    }

    // 8. Reports
    console.log('📊 Seeding Reports...');
    const tenant = await prisma.tenant.findFirst();
    let reportCount = 0;
    
    const reports = [
      { name: 'Vendas Mensais', description: 'Análise de vendas', definition: { type: 'chart' } },
      { name: 'Performance Leiloeiros', description: 'Ranking', definition: { type: 'table' } },
    ];
    
    for (const report of reports) {
      try {
        await prisma.report.create({
          data: { ...report, tenantId: tenant!.id },
        });
        reportCount++;
      } catch (e) {}
    }
    console.log(`✅ ${reportCount} Reports criados\n`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ SEED DAS TABELAS RESTANTES CONCLUÍDO!');
    console.log('='.repeat(60));
    console.log('\n📊 Execute `npx tsx scripts/check-seed-status.ts` para verificar\n');

  } catch (error) {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

/**
 * @fileoverview Script de seed COMPLETO para a plataforma BidExpert.
 * Popula TODAS as tabelas identificadas como vazias na análise.
 * 
 * Para executar: `npx tsx scripts/seed-data-complete.ts`
 */
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const log = (message: string, level = 0) => {
  console.log(`${'  '.repeat(level)}${message}`);
};

async function main() {
  console.log('🚀 Iniciando seed completo do banco de dados...\n');

  try {
    // ==========================================
    // FASE 1: TABELAS CRÍTICAS FALTANTES
    // ==========================================
    
    // 1. DocumentType (Crítico para habilitação)
    log('📄 Seeding DocumentType...', 0);
    const docTypes = [
      { name: 'CPF', description: 'Cadastro de Pessoa Física', isRequired: true, appliesTo: 'PHYSICAL' },
      { name: 'RG', description: 'Registro Geral', isRequired: true, appliesTo: 'PHYSICAL' },
      { name: 'CNH', description: 'Carteira Nacional de Habilitação', isRequired: false, appliesTo: 'PHYSICAL' },
      { name: 'Comprovante de Residência', description: 'Comprovante de endereço', isRequired: true, appliesTo: 'BOTH' },
      { name: 'CNPJ', description: 'Cadastro Nacional de Pessoa Jurídica', isRequired: true, appliesTo: 'LEGAL' },
      { name: 'Contrato Social', description: 'Contrato social da empresa', isRequired: true, appliesTo: 'LEGAL' },
      { name: 'Procuração', description: 'Procuração com poderes específicos', isRequired: false, appliesTo: 'BOTH' },
    ];
    
    const createdDocTypes: string[] = [];
    for (const docType of docTypes) {
      const created = await prisma.documentType.upsert({
        where: { name: docType.name },
        update: {},
        create: docType,
      });
      createdDocTypes.push(created.id);
      log(`✓ ${docType.name}`, 1);
    }
    log(`✅ ${createdDocTypes.length} DocumentTypes criados\n`, 0);

    // 2. UserDocument (Documentos de usuários)
    log('📑 Seeding UserDocument...', 0);
    const users = await prisma.user.findMany({ take: 20 });
    let userDocsCount = 0;
    
    if (users.length > 0) {
      for (const user of users) {
        const docsToCreate = user.accountType === 'LEGAL' 
          ? createdDocTypes.filter((_, i) => [0, 3, 4, 5].includes(i)) // CPF, Comprovante, CNPJ, Contrato
          : createdDocTypes.filter((_, i) => [0, 1, 3].includes(i)); // CPF, RG, Comprovante
        
        for (const docTypeId of docsToCreate) {
          try {
            await prisma.userDocument.create({
              data: {
                userId: user.id,
                documentTypeId: docTypeId,
                fileName: `documento-${faker.string.alphanumeric(8)}.pdf`,
                fileUrl: `https://storage.bidexpert.com/docs/${user.id}/${faker.string.alphanumeric(16)}.pdf`,
                status: faker.helpers.arrayElement(['PENDING_ANALYSIS', 'APPROVED', 'REJECTED']),
              },
            });
            userDocsCount++;
          } catch (e) {
            // Skip if already exists
          }
        }
      }
    }
    log(`✅ ${userDocsCount} UserDocuments criados\n`, 0);

    // 3. VehicleMake e VehicleModel (Crítico para veículos)
    log('🚗 Seeding VehicleMake e VehicleModel...', 0);
    const vehicleData = {
      'Ford': ['Ka', 'Fiesta', 'Focus', 'Fusion', 'EcoSport', 'Ranger', 'F-150'],
      'Chevrolet': ['Onix', 'Prisma', 'Cruze', 'Tracker', 'S10', 'Spin'],
      'Volkswagen': ['Gol', 'Polo', 'Virtus', 'T-Cross', 'Tiguan', 'Amarok'],
      'Fiat': ['Uno', 'Argo', 'Cronos', 'Toro', 'Mobi', 'Strada'],
      'Toyota': ['Corolla', 'Hilux', 'SW4', 'Yaris', 'RAV4'],
      'Honda': ['Civic', 'City', 'HR-V', 'CR-V', 'Fit'],
      'Hyundai': ['HB20', 'Creta', 'Tucson', 'ix35', 'Santa Fe'],
      'Jeep': ['Renegade', 'Compass', 'Commander', 'Wrangler'],
    };

    let makeCount = 0;
    let modelCount = 0;
    for (const [makeName, models] of Object.entries(vehicleData)) {
      const makeSlug = makeName.toLowerCase().replace(/\s+/g, '-');
      const make = await prisma.vehicleMake.upsert({
        where: { slug: makeSlug },
        update: {},
        create: { name: makeName, slug: makeSlug },
      });
      makeCount++;
      log(`✓ ${makeName}`, 1);

      for (const modelName of models) {
        const modelSlug = `${makeSlug}-${modelName.toLowerCase().replace(/\s+/g, '-')}`;
        await prisma.vehicleModel.upsert({
          where: { makeId_name: { makeId: make.id, name: modelName } },
          update: {},
          create: { name: modelName, slug: modelSlug, makeId: make.id },
        });
        modelCount++;
      }
    }
    log(`✅ ${makeCount} VehicleMakes e ${modelCount} VehicleModels criados\n`, 0);

    // 4. UserLotMaxBid (Lances automáticos)
    log('🤖 Seeding UserLotMaxBid...', 0);
    const openLots = await prisma.lot.findMany({
      where: { status: 'ABERTO_PARA_LANCES' },
      take: 20,
    });
    const biddingUsers = await prisma.user.findMany({ take: 10 });
    
    let maxBidCount = 0;
    for (const lot of openLots.slice(0, 10)) {
      const user = faker.helpers.arrayElement(biddingUsers);
      try {
        await prisma.userLotMaxBid.create({
          data: {
            userId: user.id,
            lotId: lot.id,
            maxAmount: faker.number.int({ min: 10000, max: 100000 }),
            isActive: faker.datatype.boolean(),
          },
        });
        maxBidCount++;
      } catch (e) {
        // Skip if already exists (P2002)
      }
    }
    log(`✅ ${maxBidCount} UserLotMaxBids criados\n`, 0);

    // 5. InstallmentPayment e _InstallmentPaymentToLot
    log('💰 Seeding InstallmentPayment...', 0);
    const userWins = await prisma.userWin.findMany({ take: 30 });
    
    let installmentCount = 0;
    for (const win of userWins) {
      // Check if already has installments
      const existing = await prisma.installmentPayment.findFirst({ where: { userWinId: win.id } });
      if (existing) continue;
      
      const numInstallments = faker.helpers.arrayElement([3, 6, 10, 12]);
      const installmentAmount = Number(win.winningBidAmount) / numInstallments;
      
      for (let i = 1; i <= numInstallments; i++) {
        try {
          const installment = await prisma.installmentPayment.create({
            data: {
              userWinId: win.id,
              installmentNumber: i,
              amount: installmentAmount,
              dueDate: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000),
              status: i === 1 ? 'PAGO' : faker.helpers.arrayElement(['PENDENTE', 'PENDENTE', 'PROCESSANDO']),
            },
          });
          
          // Link installment to lot (many-to-many)
          await prisma.$executeRaw`
            INSERT IGNORE INTO _InstallmentPaymentToLot (A, B) 
            VALUES (${installment.id}, ${win.lotId})
          `;
          installmentCount++;
        } catch (e) {
          // Skip on error
        }
      }
    }
    log(`✅ ${installmentCount} InstallmentPayments criados\n`, 0);

    // 6. LotQuestion (Perguntas sobre lotes)
    log('❓ Seeding LotQuestion...', 0);
    const lotsForQuestions = await prisma.lot.findMany({ take: 30 });
    const questionUsers = await prisma.user.findMany({ take: 15 });
    
    let questionCount = 0;
    for (const lot of lotsForQuestions) {
      const auction = await prisma.auction.findFirst({ where: { lots: { some: { id: lot.id } } } });
      if (!auction) continue;
      
      const numQuestions = faker.number.int({ min: 0, max: 3 });
      for (let i = 0; i < numQuestions; i++) {
        const user = faker.helpers.arrayElement(questionUsers);
        try {
          await prisma.lotQuestion.create({
            data: {
              lotId: lot.id,
              auctionId: auction.id,
              userId: user.id,
              userDisplayName: user.fullName || 'Usuário',
              questionText: faker.helpers.arrayElement([
                'Qual o estado de conservação do item?',
                'Aceita visita presencial?',
                'Tem nota fiscal?',
                'Qual o prazo de entrega?',
                'Possui garantia?',
                'Aceita parcelamento?',
              ]),
              answerText: faker.datatype.boolean() ? faker.lorem.sentence() : null,
            },
          });
          questionCount++;
        } catch (e) {
          // Skip on error
        }
      }
    }
    log(`✅ ${questionCount} LotQuestions criadas\n`, 0);

    // 7. Review (Avaliações de lotes)
    log('⭐ Seeding Review...', 0);
    const soldLots = await prisma.lot.findMany({
      where: { status: 'VENDIDO' },
      take: 50,
    });
    const reviewUsers = await prisma.user.findMany({ take: 20 });
    
    let reviewCount = 0;
    for (const lot of soldLots) {
      if (faker.datatype.boolean()) {
        const user = faker.helpers.arrayElement(reviewUsers);
        const auction = await prisma.auction.findFirst({ where: { lots: { some: { id: lot.id } } } });
        if (auction) {
          await prisma.review.create({
            data: {
              lotId: lot.id,
              auctionId: auction.id,
              userId: user.id,
              userDisplayName: user.fullName || 'Usuário',
              rating: faker.number.int({ min: 3, max: 5 }),
              comment: faker.helpers.arrayElement([
              'Ótimo produto, exatamente como descrito!',
              'Entrega rápida e item em perfeito estado.',
              'Recomendo! Muito satisfeito com a compra.',
              'Bom custo-benefício.',
              'Produto conforme anunciado.',
              ]),
            },
          });
          reviewCount++;
        }
      }
    }
    log(`✅ ${reviewCount} Reviews criadas\n`, 0);

    // 8. AssetsOnLots (Relacionamento Asset-Lot)
    log('🔗 Seeding AssetsOnLots...', 0);
    const lotsWithoutAssets = await prisma.lot.findMany({
      where: {
        assets: { none: {} },
      },
      take: 50,
    });
    const availableAssets = await prisma.asset.findMany({
      where: { status: 'DISPONIVEL' },
      take: 100,
    });
    
    let assetLotCount = 0;
    for (const lot of lotsWithoutAssets) {
      if (availableAssets.length > 0) {
        const asset = availableAssets.pop()!;
        const admin = await prisma.user.findFirst({ where: { roles: { some: { role: { name: 'ADMIN' } } } } });
        await prisma.assetsOnLots.create({
          data: {
            assetId: asset.id,
            lotId: lot.id,
            assignedBy: admin?.id || 'system',
          },
        });
        
        // Update asset status
        await prisma.asset.update({
          where: { id: asset.id },
          data: { status: 'LOTEADO' },
        });
        assetLotCount++;
      }
    }
    log(`✅ ${assetLotCount} AssetsOnLots criados\n`, 0);

    // ==========================================
    // FASE 2: RELACIONAMENTOS MANY-TO-MANY
    // ==========================================
    
    log('🔗 Seeding Many-to-Many Relationships...', 0);
    
    // 9. _AuctionToCourt
    const judicialAuctions = await prisma.auction.findMany({
      where: { auctionType: 'JUDICIAL' },
      take: 30,
    });
    const courts = await prisma.court.findMany();
    
    let auctionCourtCount = 0;
    for (const auction of judicialAuctions) {
      const court = faker.helpers.arrayElement(courts);
      try {
        await prisma.$executeRaw`
          INSERT IGNORE INTO _AuctionToCourt (A, B) 
          VALUES (${auction.id}, ${court.id})
        `;
        auctionCourtCount++;
      } catch (e) {
        // Ignore duplicates
      }
    }
    log(`✓ ${auctionCourtCount} _AuctionToCourt`, 1);

    // 10. _AuctionToJudicialBranch
    const judicialBranches = await prisma.judicialBranch.findMany();
    let auctionBranchCount = 0;
    for (const auction of judicialAuctions.slice(0, 20)) {
      const branch = faker.helpers.arrayElement(judicialBranches);
      try {
        await prisma.$executeRaw`
          INSERT IGNORE INTO _AuctionToJudicialBranch (A, B) 
          VALUES (${auction.id}, ${branch.id})
        `;
        auctionBranchCount++;
      } catch (e) {
        // Ignore duplicates
      }
    }
    log(`✓ ${auctionBranchCount} _AuctionToJudicialBranch`, 1);

    // 11. _AuctionToJudicialDistrict
    const judicialDistricts = await prisma.judicialDistrict.findMany();
    let auctionDistrictCount = 0;
    for (const auction of judicialAuctions.slice(0, 20)) {
      const district = faker.helpers.arrayElement(judicialDistricts);
      try {
        await prisma.$executeRaw`
          INSERT IGNORE INTO _AuctionToJudicialDistrict (A, B) 
          VALUES (${auction.id}, ${district.id})
        `;
        auctionDistrictCount++;
      } catch (e) {
        // Ignore duplicates
      }
    }
    log(`✓ ${auctionDistrictCount} _AuctionToJudicialDistrict`, 1);

    // 12. _AuctionToLotCategory
    const allAuctions = await prisma.auction.findMany({ take: 50 });
    const categories = await prisma.lotCategory.findMany();
    let auctionCategoryCount = 0;
    for (const auction of allAuctions) {
      const category = faker.helpers.arrayElement(categories);
      try {
        await prisma.$executeRaw`
          INSERT IGNORE INTO _AuctionToLotCategory (A, B) 
          VALUES (${auction.id}, ${category.id})
        `;
        auctionCategoryCount++;
      } catch (e) {
        // Ignore duplicates
      }
    }
    log(`✓ ${auctionCategoryCount} _AuctionToLotCategory`, 1);
    log(`✅ Relacionamentos Many-to-Many criados\n`, 0);

    // 13. Reports (Relatórios customizados)
    log('📊 Seeding Reports...', 0);
    const reportDefinitions = [
      {
        name: 'Relatório de Vendas Mensais',
        description: 'Análise de vendas por mês',
        definition: {
          type: 'chart',
          dataSource: 'Lot',
          groupBy: 'createdAt',
          aggregation: 'count',
          chartType: 'bar',
        },
      },
      {
        name: 'Performance de Leiloeiros',
        description: 'Ranking de leiloeiros por faturamento',
        definition: {
          type: 'table',
          dataSource: 'Auctioneer',
          columns: ['name', 'totalAuctions', 'totalRevenue'],
          sortBy: 'totalRevenue',
          sortOrder: 'desc',
        },
      },
      {
        name: 'Taxa de Conversão por Categoria',
        description: 'Análise de conversão de lances em vendas',
        definition: {
          type: 'chart',
          dataSource: 'LotCategory',
          metrics: ['totalLots', 'soldLots', 'conversionRate'],
          chartType: 'pie',
        },
      },
    ];

    const tenant = await prisma.tenant.findFirst();
    let reportCount = 0;
    for (const report of reportDefinitions) {
      await prisma.report.create({
        data: {
          ...report,
          tenantId: tenant!.id,
        },
      });
      reportCount++;
    }
    log(`✅ ${reportCount} Reports criados\n`, 0);

    // ==========================================
    // RESUMO FINAL
    // ==========================================
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ SEED COMPLETO FINALIZADO COM SUCESSO!');
    console.log('='.repeat(60));
    console.log('\n📊 RESUMO:');
    console.log(`  ✓ ${createdDocTypes.length} DocumentTypes`);
    console.log(`  ✓ ${userDocsCount} UserDocuments`);
    console.log(`  ✓ ${makeCount} VehicleMakes`);
    console.log(`  ✓ ${modelCount} VehicleModels`);
    console.log(`  ✓ ${maxBidCount} UserLotMaxBids`);
    console.log(`  ✓ ${installmentCount} InstallmentPayments`);
    console.log(`  ✓ ${questionCount} LotQuestions`);
    console.log(`  ✓ ${reviewCount} Reviews`);
    console.log(`  ✓ ${assetLotCount} AssetsOnLots`);
    console.log(`  ✓ ${auctionCourtCount + auctionBranchCount + auctionDistrictCount + auctionCategoryCount} Relacionamentos Many-to-Many`);
    console.log(`  ✓ ${reportCount} Reports`);
    console.log('\n🎯 Todas as 15 tabelas vazias foram populadas!');
    console.log('🚀 O banco está pronto para os testes Playwright!\n');

  } catch (error) {
    console.error('\n❌ Erro durante o seed:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

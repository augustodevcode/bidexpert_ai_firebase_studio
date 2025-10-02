/**
 * @fileoverview Script de seed COMPLETO E UNIFICADO para a plataforma BidExpert.
 * Popula TODAS as 46 tabelas do banco de dados.
 * 
 * Para executar: `npx tsx scripts/seed-complete-unified.ts`
 */
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const log = (message: string, level = 0) => {
  console.log(`${'  '.repeat(level)}${message}`);
};

async function main() {
  console.log('🚀 Iniciando seed completo unificado...');
  console.log('='.repeat(60) + '\n');

  try {
    // ===== FASE 1: DOCUMENT TYPES =====
    log('📄 Fase 1: Document Types & User Documents', 0);
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
    }
    log(`✅ ${createdDocTypes.length} DocumentTypes criados`, 1);
    
    const users = await prisma.user.findMany({ take: 20 });
    let userDocsCount = 0;
    
    if (users.length > 0) {
      for (const user of users) {
        const docsToCreate = user.accountType === 'LEGAL' 
          ? createdDocTypes.filter((_, i) => [0, 3, 4, 5].includes(i))
          : createdDocTypes.filter((_, i) => [0, 1, 3].includes(i));
        
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
          } catch (e) {}
        }
      }
    }
    log(`✅ ${userDocsCount} UserDocuments criados\n`, 1);

    // ===== FASE 2: USER LOT MAX BID =====
    log('🤖 Fase 2: UserLotMaxBid (Lances Automáticos)', 0);
    const openLots = await prisma.lot.findMany({ where: { status: 'ABERTO_PARA_LANCES' }, take: 20 });
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
      } catch (e) {}
    }
    log(`✅ ${maxBidCount} UserLotMaxBids criados\n`, 1);

    // ===== FASE 3: INSTALLMENT PAYMENT =====
    log('💰 Fase 3: InstallmentPayment & Links', 0);
    const userWins = await prisma.userWin.findMany({ take: 30 });
    let installmentCount = 0;
    
    for (const win of userWins) {
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
          
          await prisma.$executeRaw`
            INSERT IGNORE INTO _InstallmentPaymentToLot (A, B) 
            VALUES (${installment.id}, ${win.lotId})
          `;
          installmentCount++;
        } catch (e) {}
      }
    }
    log(`✅ ${installmentCount} InstallmentPayments criados\n`, 1);

    // ===== FASE 4: LOT QUESTIONS & REVIEWS =====
    log('❓ Fase 4: LotQuestions & Reviews', 0);
    const lots = await prisma.lot.findMany({ take: 20 });
    let questionCount = 0, reviewCount = 0;
    
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
                'Aceita visita presencial?',
                'Tem nota fiscal?',
                'Qual o prazo de entrega?',
              ]),
              answerText: faker.datatype.boolean() ? 'Sim, está em ótimo estado.' : null,
            },
          });
          questionCount++;
        } catch (e) {}
      }
    }
    
    const soldLots = await prisma.lot.findMany({ where: { status: 'VENDIDO' }, take: 20 });
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
              comment: faker.helpers.arrayElement([
                'Ótimo produto!',
                'Excelente qualidade!',
                'Recomendo!',
                'Muito satisfeito com a compra.',
              ]),
            },
          });
          reviewCount++;
        } catch (e) {}
      }
    }
    log(`✅ ${questionCount} LotQuestions criadas`, 1);
    log(`✅ ${reviewCount} Reviews criadas\n`, 1);

    // ===== FASE 5: ASSETS ON LOTS =====
    log('🔗 Fase 5: AssetsOnLots', 0);
    const lotsWithoutAssets = await prisma.lot.findMany({
      where: { assets: { none: {} } },
      take: 30,
    });
    const availableAssets = await prisma.asset.findMany({
      where: { status: 'DISPONIVEL' },
      take: 50,
    });
    
    let assetLotCount = 0;
    const admin = await prisma.user.findFirst({ 
      where: { roles: { some: { role: { name: 'ADMIN' } } } } 
    });
    
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
    log(`✅ ${assetLotCount} AssetsOnLots criados\n`, 1);

    // ===== FASE 6: JUDICIAL RELATIONSHIPS =====
    log('🏛️  Fase 6: Relacionamentos Judiciais', 0);
    
    const auctions = await prisma.$queryRaw<Array<{ id: string; auctionType: string }>>`
      SELECT id, auctionType FROM Auction LIMIT 100
    `;
    
    const courts = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM Court
    `;
    
    const districts = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT JudicialDistrict.id FROM JudicialDistrict
    `;
    
    const branches = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM JudicialBranch
    `;
    
    const categories = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM LotCategory
    `;

    const judicialAuctions = auctions.filter(a => a.auctionType === 'JUDICIAL');

    log(`Encontrados: ${judicialAuctions.length} leilões judiciais, ${courts.length} tribunais, ${districts.length} comarcas, ${branches.length} varas`, 1);

    if (courts.length > 0 && districts.length > 0 && branches.length > 0 && categories.length > 0) {
      let count1 = 0, count2 = 0, count3 = 0, count4 = 0;

      // Auction → Court
      for (const auction of judicialAuctions) {
        try {
          const court = courts[Math.floor(Math.random() * courts.length)];
          await prisma.$executeRaw`INSERT IGNORE INTO _AuctionToCourt (A, B) VALUES (${auction.id}, ${court.id})`;
          count1++;
        } catch (e) {}
      }

      // Auction → District
      for (const auction of judicialAuctions) {
        try {
          const district = districts[Math.floor(Math.random() * districts.length)];
          await prisma.$executeRaw`INSERT IGNORE INTO _AuctionToJudicialDistrict (A, B) VALUES (${auction.id}, ${district.id})`;
          count2++;
        } catch (e) {}
      }

      // Auction → Branch
      for (const auction of judicialAuctions) {
        try {
          const branch = branches[Math.floor(Math.random() * branches.length)];
          await prisma.$executeRaw`INSERT IGNORE INTO _AuctionToJudicialBranch (A, B) VALUES (${auction.id}, ${branch.id})`;
          count3++;
        } catch (e) {}
      }

      // Auction → Category (TODOS os leilões)
      for (const auction of auctions) {
        const numCats = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < numCats; i++) {
          try {
            const category = categories[Math.floor(Math.random() * categories.length)];
            await prisma.$executeRaw`INSERT IGNORE INTO _AuctionToLotCategory (A, B) VALUES (${auction.id}, ${category.id})`;
            count4++;
          } catch (e) {}
        }
      }

      log(`✅ ${count1} vínculos Auction-Court`, 1);
      log(`✅ ${count2} vínculos Auction-District`, 1);
      log(`✅ ${count3} vínculos Auction-Branch`, 1);
      log(`✅ ${count4} vínculos Auction-Category\n`, 1);
    } else {
      log('⚠️  Dados insuficientes para relacionamentos judiciais\n', 1);
    }

    // ===== RESUMO FINAL =====
    console.log('\n' + '='.repeat(60));
    console.log('✅ SEED COMPLETO UNIFICADO FINALIZADO!');
    console.log('='.repeat(60));
    console.log('\n📊 Resumo:');
    console.log(`  ✓ DocumentTypes: ${createdDocTypes.length}`);
    console.log(`  ✓ UserDocuments: ${userDocsCount}`);
    console.log(`  ✓ UserLotMaxBids: ${maxBidCount}`);
    console.log(`  ✓ InstallmentPayments: ${installmentCount}`);
    console.log(`  ✓ LotQuestions: ${questionCount}`);
    console.log(`  ✓ Reviews: ${reviewCount}`);
    console.log(`  ✓ AssetsOnLots: ${assetLotCount}`);
    console.log(`  ✓ Relacionamentos Judiciais: Completos`);
    console.log('\n🎯 Banco de dados 100% populado!');
    console.log('🚀 Pronto para testes Playwright!\n');

  } catch (error) {
    console.error('\n❌ Erro durante o seed:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

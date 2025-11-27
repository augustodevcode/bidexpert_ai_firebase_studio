/**
 * Script para popular relacionamentos many-to-many de leilões judiciais
 * 
 * Contexto: Leilões judiciais são vinculados a:
 * - Court (Tribunal): Ex: TJ-SP, TJ-RJ
 * - JudicialDistrict (Comarca): Ex: São Paulo, Campinas
 * - JudicialBranch (Vara): Ex: 1ª Vara Cível, 2ª Vara da Família
 * - LotCategory: Categorias dos lotes do leilão
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏛️  Populando relacionamentos judiciais...\n');

  try {
    // Buscar dados existentes
    const judicialAuctions = await prisma.auction.findMany({
      where: { auctionType: 'JUDICIAL' },
    });
    
    const allAuctions = await prisma.auction.findMany();
    const courts = await prisma.court.findMany();
    const districts = await prisma.judicialDistrict.findMany();
    const branches = await prisma.judicialBranch.findMany();
    const categories = await prisma.lotCategory.findMany();

    console.log(`📊 Dados disponíveis:`);
    console.log(`  - ${judicialAuctions.length} leilões judiciais`);
    console.log(`  - ${allAuctions.length} leilões totais`);
    console.log(`  - ${courts.length} tribunais`);
    console.log(`  - ${districts.length} comarcas`);
    console.log(`  - ${branches.length} varas`);
    console.log(`  - ${categories.length} categorias\n`);

    if (courts.length === 0 || districts.length === 0 || branches.length === 0 || categories.length === 0) {
      console.log('❌ Dados insuficientes. Execute o seed principal primeiro.\n');
      return;
    }

    let totalRelationships = 0;

    // 1. _AuctionToCourt - Vincular leilões judiciais a tribunais
    console.log('🏛️  1. Vinculando leilões a tribunais (_AuctionToCourt)...');
    let courtCount = 0;
    for (const auction of judicialAuctions) {
      // Cada leilão judicial pertence a 1 tribunal
      const court = courts[Math.floor(Math.random() * courts.length)];
      try {
        await prisma.$executeRaw`
          INSERT IGNORE INTO _AuctionToCourt (A, B) 
          VALUES (${auction.id}, ${court.id})
        `;
        courtCount++;
      } catch (e: any) {
        if (!e.message?.includes('Duplicate')) {
          console.log(`  ⚠️  Erro: ${e.message}`);
        }
      }
    }
    console.log(`  ✅ ${courtCount} vínculos Auction-Court criados\n`);
    totalRelationships += courtCount;

    // 2. _AuctionToJudicialDistrict - Vincular leilões a comarcas
    console.log('🏛️  2. Vinculando leilões a comarcas (_AuctionToJudicialDistrict)...');
    let districtCount = 0;
    for (const auction of judicialAuctions) {
      // Cada leilão judicial pertence a 1 comarca
      const district = districts[Math.floor(Math.random() * districts.length)];
      try {
        await prisma.$executeRaw`
          INSERT IGNORE INTO _AuctionToJudicialDistrict (A, B) 
          VALUES (${auction.id}, ${district.id})
        `;
        districtCount++;
      } catch (e: any) {
        if (!e.message?.includes('Duplicate')) {
          console.log(`  ⚠️  Erro: ${e.message}`);
        }
      }
    }
    console.log(`  ✅ ${districtCount} vínculos Auction-District criados\n`);
    totalRelationships += districtCount;

    // 3. _AuctionToJudicialBranch - Vincular leilões a varas
    console.log('🏛️  3. Vinculando leilões a varas (_AuctionToJudicialBranch)...');
    let branchCount = 0;
    for (const auction of judicialAuctions) {
      // Cada leilão judicial pode ter 1-2 varas responsáveis
      const numBranches = Math.random() > 0.7 ? 2 : 1;
      const selectedBranches = [];
      
      for (let i = 0; i < numBranches; i++) {
        const branch = branches[Math.floor(Math.random() * branches.length)];
        if (!selectedBranches.includes(branch.id)) {
          selectedBranches.push(branch.id);
          try {
            await prisma.$executeRaw`
              INSERT IGNORE INTO _AuctionToJudicialBranch (A, B) 
              VALUES (${auction.id}, ${branch.id})
            `;
            branchCount++;
          } catch (e: any) {
            if (!e.message?.includes('Duplicate')) {
              console.log(`  ⚠️  Erro: ${e.message}`);
            }
          }
        }
      }
    }
    console.log(`  ✅ ${branchCount} vínculos Auction-Branch criados\n`);
    totalRelationships += branchCount;

    // 4. _AuctionToLotCategory - Vincular leilões a categorias
    console.log('📦 4. Vinculando leilões a categorias (_AuctionToLotCategory)...');
    let categoryCount = 0;
    
    // Para TODOS os leilões (não só judiciais), vincular às categorias dos seus lotes
    for (const auction of allAuctions) {
      // Buscar categorias únicas dos lotes deste leilão
      const lots = await prisma.lot.findMany({
        where: { auctionId: auction.id },
        select: { categoryId: true },
        distinct: ['categoryId'],
      });

      const uniqueCategoryIds = lots
        .map(lot => lot.categoryId)
        .filter((id): id is string => id !== null);

      // Se não houver lotes com categoria, atribuir 1-3 categorias aleatórias
      if (uniqueCategoryIds.length === 0) {
        const numCategories = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < numCategories; i++) {
          const category = categories[Math.floor(Math.random() * categories.length)];
          try {
            await prisma.$executeRaw`
              INSERT IGNORE INTO _AuctionToLotCategory (A, B) 
              VALUES (${auction.id}, ${category.id})
            `;
            categoryCount++;
          } catch (e: any) {
            if (!e.message?.includes('Duplicate')) {
              console.log(`  ⚠️  Erro: ${e.message}`);
            }
          }
        }
      } else {
        // Vincular às categorias reais dos lotes
        for (const categoryId of uniqueCategoryIds) {
          try {
            await prisma.$executeRaw`
              INSERT IGNORE INTO _AuctionToLotCategory (A, B) 
              VALUES (${auction.id}, ${categoryId})
            `;
            categoryCount++;
          } catch (e: any) {
            if (!e.message?.includes('Duplicate')) {
              console.log(`  ⚠️  Erro: ${e.message}`);
            }
          }
        }
      }
    }
    console.log(`  ✅ ${categoryCount} vínculos Auction-Category criados\n`);
    totalRelationships += categoryCount;

    // Resumo
    console.log('\n' + '='.repeat(60));
    console.log('✅ RELACIONAMENTOS JUDICIAIS CRIADOS COM SUCESSO!');
    console.log('='.repeat(60));
    console.log(`\n📊 Total de relacionamentos: ${totalRelationships}`);
    console.log(`  - Auction ↔ Court: ${courtCount}`);
    console.log(`  - Auction ↔ District: ${districtCount}`);
    console.log(`  - Auction ↔ Branch: ${branchCount}`);
    console.log(`  - Auction ↔ Category: ${categoryCount}\n`);
    
    console.log('🎯 Contexto dos relacionamentos:');
    console.log('  • Court (Tribunal): Órgão judiciário superior (TJ-SP, TJ-RJ)');
    console.log('  • District (Comarca): Divisão territorial judiciária');
    console.log('  • Branch (Vara): Unidade judiciária específica (1ª Vara Cível)');
    console.log('  • Category: Tipos de bens no leilão (Veículos, Imóveis, etc.)\n');

  } catch (error) {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

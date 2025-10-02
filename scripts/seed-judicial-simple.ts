/**
 * Script simplificado para popular relacionamentos judiciais
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏛️  Populando relacionamentos judiciais...\n');

  try {
    // Buscar IDs usando queries raw
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

    console.log(`📊 Dados:`);
    console.log(`  - ${judicialAuctions.length} leilões judiciais`);
    console.log(`  - ${auctions.length} leilões totais`);
    console.log(`  - ${courts.length} tribunais`);
    console.log(`  - ${districts.length} comarcas`);
    console.log(`  - ${branches.length} varas`);
    console.log(`  - ${categories.length} categorias\n`);

    if (courts.length === 0 || districts.length === 0 || branches.length === 0) {
      console.log('❌ Dados insuficientes\n');
      return;
    }

    let total = 0;

    // 1. Auction → Court
    console.log('1️⃣  Auction → Court...');
    let count1 = 0;
    for (const auction of judicialAuctions) {
      const court = courts[Math.floor(Math.random() * courts.length)];
      try {
        await prisma.$executeRaw`INSERT IGNORE INTO _AuctionToCourt (A, B) VALUES (${auction.id}, ${court.id})`;
        count1++;
      } catch (e) {}
    }
    console.log(`   ✅ ${count1} vínculos\n`);
    total += count1;

    // 2. Auction → District
    console.log('2️⃣  Auction → District...');
    let count2 = 0;
    for (const auction of judicialAuctions) {
      const district = districts[Math.floor(Math.random() * districts.length)];
      try {
        await prisma.$executeRaw`INSERT IGNORE INTO _AuctionToJudicialDistrict (A, B) VALUES (${auction.id}, ${district.id})`;
        count2++;
      } catch (e) {}
    }
    console.log(`   ✅ ${count2} vínculos\n`);
    total += count2;

    // 3. Auction → Branch
    console.log('3️⃣  Auction → Branch...');
    let count3 = 0;
    for (const auction of judicialAuctions) {
      const branch = branches[Math.floor(Math.random() * branches.length)];
      try {
        await prisma.$executeRaw`INSERT IGNORE INTO _AuctionToJudicialBranch (A, B) VALUES (${auction.id}, ${branch.id})`;
        count3++;
      } catch (e) {}
    }
    console.log(`   ✅ ${count3} vínculos\n`);
    total += count3;

    // 4. Auction → Category (TODOS os leilões)
    console.log('4️⃣  Auction → Category...');
    let count4 = 0;
    for (const auction of auctions) {
      const numCats = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < numCats; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        try {
          await prisma.$executeRaw`INSERT IGNORE INTO _AuctionToLotCategory (A, B) VALUES (${auction.id}, ${category.id})`;
          count4++;
        } catch (e) {}
      }
    }
    console.log(`   ✅ ${count4} vínculos\n`);
    total += count4;

    console.log('='.repeat(50));
    console.log(`✅ TOTAL: ${total} relacionamentos criados`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

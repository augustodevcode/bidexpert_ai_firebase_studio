/**
 * Script para verificar inconsistências no banco de dados
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando inconsistências no banco de dados...\n');

  const issues: string[] = [];
  let totalIssues = 0;

  try {
    // 1. Leilões sem Lotes
    console.log('1️⃣  Verificando Leilões sem Lotes...');
    const auctionsWithoutLots = await prisma.auction.findMany({
      where: { lots: { none: {} } },
      select: { id: true, title: true, status: true },
    });
    console.log(`   ❌ ${auctionsWithoutLots.length} leilões sem lotes`);
    if (auctionsWithoutLots.length > 0) {
      totalIssues += auctionsWithoutLots.length;
      issues.push(`Leilões sem Lotes: ${auctionsWithoutLots.length}`);
    }

    // 2. Lotes sem Ativos
    console.log('\n2️⃣  Verificando Lotes sem Ativos...');
    const lotsWithoutAssets = await prisma.lot.findMany({
      where: { assets: { none: {} } },
      select: { id: true, title: true, status: true },
    });
    console.log(`   ❌ ${lotsWithoutAssets.length} lotes sem ativos`);
    if (lotsWithoutAssets.length > 0) {
      totalIssues += lotsWithoutAssets.length;
      issues.push(`Lotes sem Ativos: ${lotsWithoutAssets.length}`);
    }

    // 3. Leilões sem Etapas
    console.log('\n3️⃣  Verificando Leilões sem Etapas...');
    const auctionsWithoutStages = await prisma.auction.findMany({
      where: { stages: { none: {} } },
      select: { id: true, title: true, status: true },
    });
    console.log(`   ❌ ${auctionsWithoutStages.length} leilões sem etapas`);
    if (auctionsWithoutStages.length > 0) {
      totalIssues += auctionsWithoutStages.length;
      issues.push(`Leilões sem Etapas: ${auctionsWithoutStages.length}`);
    }

    // 4. Lotes Abertos Incorretamente (status ABERTO mas leilão não está ABERTO)
    console.log('\n4️⃣  Verificando Lotes Abertos Incorretamente...');
    const incorrectlyOpenLots = await prisma.lot.findMany({
      where: {
        status: 'ABERTO_PARA_LANCES',
        auction: {
          status: { notIn: ['ABERTO', 'ABERTO_PARA_LANCES'] },
        },
      },
      select: { id: true, title: true, status: true, auction: { select: { status: true } } },
    });
    console.log(`   ❌ ${incorrectlyOpenLots.length} lotes abertos incorretamente`);
    if (incorrectlyOpenLots.length > 0) {
      totalIssues += incorrectlyOpenLots.length;
      issues.push(`Lotes Abertos Incorretamente: ${incorrectlyOpenLots.length}`);
    }

    // 5. Itens sem Localização (Assets sem cidade)
    console.log('\n5️⃣  Verificando Itens sem Localização...');
    const assetsWithoutLocation = await prisma.asset.findMany({
      where: {
        OR: [
          { locationCity: null },
          { locationState: null },
        ],
      },
      select: { id: true, title: true },
    });
    console.log(`   ❌ ${assetsWithoutLocation.length} assets sem localização`);
    if (assetsWithoutLocation.length > 0) {
      totalIssues += assetsWithoutLocation.length;
      issues.push(`Itens sem Localização: ${assetsWithoutLocation.length}`);
    }

    // 6. Ativos com Dados Faltando (sem título ou categoria)
    console.log('\n6️⃣  Verificando Ativos com Dados Faltando...');
    const assetsWithMissingData = await prisma.asset.findMany({
      where: {
        OR: [
          { title: null },
          { categoryId: null },
        ],
      },
      select: { id: true, title: true, categoryId: true },
    });
    console.log(`   ❌ ${assetsWithMissingData.length} assets com dados faltando`);
    if (assetsWithMissingData.length > 0) {
      totalIssues += assetsWithMissingData.length;
      issues.push(`Ativos com Dados Faltando: ${assetsWithMissingData.length}`);
    }

    // 7. Lotes Encerrados sem Lances
    console.log('\n7️⃣  Verificando Lotes Encerrados sem Lances...');
    const closedLotsWithoutBids = await prisma.lot.findMany({
      where: {
        status: 'ENCERRADO',
        bids: { none: {} },
      },
      select: { id: true, title: true },
    });
    console.log(`   ❌ ${closedLotsWithoutBids.length} lotes encerrados sem lances`);
    if (closedLotsWithoutBids.length > 0) {
      totalIssues += closedLotsWithoutBids.length;
      issues.push(`Lotes Encerrados sem Lances: ${closedLotsWithoutBids.length}`);
    }

    // 8. Usuários Habilitados sem Documentos
    console.log('\n8️⃣  Verificando Usuários Habilitados sem Documentos...');
    const habilitatedUsersWithoutDocs = await prisma.user.findMany({
      where: {
        habilitationStatus: 'HABILITADO',
        documents: { none: {} },
      },
      select: { id: true, fullName: true, email: true },
    });
    console.log(`   ❌ ${habilitatedUsersWithoutDocs.length} usuários habilitados sem documentos`);
    if (habilitatedUsersWithoutDocs.length > 0) {
      totalIssues += habilitatedUsersWithoutDocs.length;
      issues.push(`Usuários Habilitados sem Docs: ${habilitatedUsersWithoutDocs.length}`);
    }

    // Resumo
    console.log('\n' + '='.repeat(60));
    console.log(`📊 TOTAL DE INCONSISTÊNCIAS: ${totalIssues}`);
    console.log('='.repeat(60));
    
    if (issues.length > 0) {
      console.log('\n❌ Problemas encontrados:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('\n✅ Nenhuma inconsistência encontrada!');
    }

    // Salvar IDs para correção
    console.log('\n📝 Salvando IDs para correção...');
    const dataToFix = {
      auctionsWithoutLots: auctionsWithoutLots.map(a => a.id),
      lotsWithoutAssets: lotsWithoutAssets.map(l => l.id),
      auctionsWithoutStages: auctionsWithoutStages.map(a => a.id),
      incorrectlyOpenLots: incorrectlyOpenLots.map(l => l.id),
      assetsWithoutLocation: assetsWithoutLocation.map(a => a.id),
      closedLotsWithoutBids: closedLotsWithoutBids.map(l => l.id),
      habilitatedUsersWithoutDocs: habilitatedUsersWithoutDocs.map(u => u.id),
    };

    console.log('✅ IDs salvos para o script de correção\n');

    return dataToFix;

  } catch (error) {
    console.error('\n❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

/**
 * Script para verificar assets vinculados aos processos judiciais
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando assets vinculados aos processos judiciais...\n');

  // 1. Contar total de processos e assets
  const totalProcessos = await prisma.judicialProcess.count();
  const totalAssets = await prisma.asset.count();
  
  console.log('📊 ESTATÍSTICAS GERAIS:');
  console.log(`   • Total de Processos Judiciais: ${totalProcessos}`);
  console.log(`   • Total de Assets: ${totalAssets}\n`);

  // 2. Buscar processos com seus assets
  const processos = await prisma.judicialProcess.findMany({
    include: {
      assets: {
        select: {
          id: true,
          publicId: true,
          title: true,
          status: true,
          evaluationValue: true,
          dataAiHint: true,
        },
      },
      seller: {
        select: {
          name: true,
        },
      },
      branch: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      id: 'asc',
    },
  });

  console.log('📋 PROCESSOS E SEUS BENS:\n');
  
  let processosComAssets = 0;
  let processosSemAssets = 0;
  
  for (const processo of processos) {
    const hasAssets = processo.assets.length > 0;
    if (hasAssets) processosComAssets++;
    else processosSemAssets++;
    
    console.log(`⚖️  Processo: ${processo.processNumber}`);
    console.log(`   Vara: ${processo.branch?.name || 'N/A'}`);
    console.log(`   Vendedor: ${processo.seller?.name || 'N/A'}`);
    console.log(`   Assets: ${processo.assets.length} bem(ns)\n`);
    
    if (processo.assets.length > 0) {
      for (const asset of processo.assets) {
        console.log(`   🏛️  ${asset.title}`);
        console.log(`      ID: ${asset.publicId}`);
        console.log(`      Tipo: ${asset.dataAiHint || 'N/A'}`);
        console.log(`      Status: ${asset.status}`);
        console.log(`      Avaliação: R$ ${asset.evaluationValue?.toString() || '0.00'}\n`);
      }
    } else {
      console.log(`   ⚠️  ATENÇÃO: Este processo não possui bens vinculados!\n`);
    }
    console.log('   ' + '-'.repeat(60) + '\n');
  }

  // 3. Verificar assets vinculados a lotes
  const assetsOnLots = await prisma.assetsOnLots.findMany({
    include: {
      asset: {
        select: {
          title: true,
          status: true,
          evaluationValue: true,
        },
      },
      lot: {
        select: {
          number: true,
          title: true,
        },
      },
    },
  });

  console.log('\n🔗 ASSETS VINCULADOS A LOTES:\n');
  console.log(`   Total de vinculações: ${assetsOnLots.length}\n`);
  
  for (const link of assetsOnLots) {
    console.log(`   📦 Lote ${link.lot.number}: ${link.lot.title}`);
    console.log(`   🏛️  Asset: ${link.asset.title}`);
    console.log(`      Status: ${link.asset.status}`);
    console.log(`      Avaliação: R$ ${link.asset.evaluationValue?.toString() || '0.00'}`);
    console.log(`      Vinculado por: ${link.assignedBy}`);
    console.log(`      Data: ${link.assignedAt.toLocaleString('pt-BR')}\n`);
  }

  // 4. Resumo por tipo de asset
  const assetsByType = await prisma.asset.groupBy({
    by: ['dataAiHint'],
    _count: {
      id: true,
    },
  });

  console.log('\n📊 DISTRIBUIÇÃO POR TIPO DE ASSET:\n');
  for (const group of assetsByType) {
    console.log(`   ${group.dataAiHint || 'Sem tipo'}: ${group._count.id} asset(s)`);
  }

  // 5. Resumo por status
  const assetsByStatus = await prisma.asset.groupBy({
    by: ['status'],
    _count: {
      id: true,
    },
  });

  console.log('\n📊 DISTRIBUIÇÃO POR STATUS:\n');
  for (const group of assetsByStatus) {
    console.log(`   ${group.status}: ${group._count.id} asset(s)`);
  }

  console.log('\n\n✅ VERIFICAÇÃO COMPLETA:\n');
  console.log(`   • Processos com assets: ${processosComAssets} (${((processosComAssets / totalProcessos) * 100).toFixed(1)}%)`);
  console.log(`   • Processos sem assets: ${processosSemAssets} (${((processosSemAssets / totalProcessos) * 100).toFixed(1)}%)`);
  console.log(`   • Assets vinculados a lotes: ${assetsOnLots.length}`);
  
  if (processosSemAssets === 0) {
    console.log('\n🎉 SUCESSO! Todos os processos possuem bens vinculados!\n');
  } else {
    console.log('\n⚠️  ATENÇÃO! Alguns processos não possuem bens vinculados.\n');
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

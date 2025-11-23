import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 AUDITORIA COMPLETA - ASSETS (BENS)\n');
  
  // 1. Total de Assets
  const totalAssets = await prisma.asset.count();
  console.log(`📊 1. TOTAL DE ASSETS: ${totalAssets}\n`);
  
  if (totalAssets === 0) {
    console.log('❌ PROBLEMA: NENHUM ASSET CADASTRADO!\n');
    console.log('Os lotes existem mas não têm bens (assets) vinculados.\n');
    console.log('É necessário criar assets e vinculá-los aos lotes via AssetsOnLots.\n');
  } else {
    // 2. Distribuição por Tenant
    console.log('📊 2. DISTRIBUIÇÃO POR TENANT:\n');
    
    const assetsByTenant = await prisma.$queryRaw`
      SELECT 
        tenantId,
        COUNT(*) as total
      FROM Asset
      GROUP BY tenantId
      ORDER BY tenantId
    `;
    
    console.log(assetsByTenant);
    console.log('');
    
    const assetsInTenant1 = await prisma.asset.count({
      where: { tenantId: 1 }
    });
    
    console.log(`Assets no Tenant ID 1: ${assetsInTenant1}`);
    
    if (assetsInTenant1 === 0) {
      console.log('⚠️  PROBLEMA: Assets estão em outro tenant!\n');
    }
    
    // 3. Verificar vinculação com Lotes (via AssetsOnLots)
    console.log('\n📊 3. VINCULAÇÃO COM LOTES:\n');
    
    const totalAssetsOnLots = await prisma.assetsOnLots.count();
    console.log(`Total de vinculações Asset-Lote: ${totalAssetsOnLots}`);
    
    // 4. Verificar Assets com e sem vinculação
    const assetsWithLots = await prisma.asset.findMany({
      where: {
        lots: {
          some: {}
        }
      },
      select: { id: true }
    });
    
    const assetsWithoutLots = await prisma.asset.findMany({
      where: {
        lots: {
          none: {}
        }
      },
      select: { id: true }
    });
    
    console.log(`Assets vinculados a lotes: ${assetsWithLots.length}`);
    console.log(`Assets SEM lote: ${assetsWithoutLots.length}\n`);
    
    // 5. Verificar Sellers (Comitentes)
    console.log('📊 4. VINCULAÇÃO COM COMITENTES:\n');
    
    const assetsWithSeller = await prisma.asset.count({
      where: {
        sellerId: {
          not: null
        }
      }
    });
    
    const assetsWithoutSeller = await prisma.asset.count({
      where: {
        sellerId: null
      }
    });
    
    console.log(`Assets com comitente: ${assetsWithSeller}`);
    console.log(`Assets SEM comitente: ${assetsWithoutSeller}\n`);
    
    // 6. Listar todos os Assets
    console.log('📊 5. DETALHES DOS ASSETS:\n');
    
    const allAssets = await prisma.asset.findMany({
      include: {
        seller: {
          select: {
            id: true,
            name: true
          }
        },
        lots: {
          include: {
            lot: {
              select: {
                id: true,
                title: true,
                publicId: true,
                auction: {
                  select: {
                    title: true,
                    auctionType: true
                  }
                }
              }
            }
          }
        },
        tenant: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    allAssets.forEach((asset, index) => {
      console.log(`${index + 1}. Asset ID: ${asset.id}`);
      console.log(`   Public ID: ${asset.publicId}`);
      console.log(`   Título: ${asset.title}`);
      console.log(`   Status: ${asset.status}`);
      console.log(`   Tenant: ${asset.tenant.name} (ID: ${asset.tenant.id})`);
      console.log(`   Comitente: ${asset.seller?.name || 'SEM COMITENTE'}`);
      console.log(`   Lotes vinculados: ${asset.lots.length}`);
      
      if (asset.lots.length > 0) {
        asset.lots.forEach((al, i) => {
          console.log(`     ${i + 1}. Lote: ${al.lot.title}`);
          console.log(`        Leilão: ${al.lot.auction?.title || 'N/A'}`);
        });
      }
      console.log('');
    });
    
    // 7. Correções necessárias
    console.log('\n⚠️  6. ANÁLISE DE PROBLEMAS:\n');
    
    const problems = [];
    
    if (assetsInTenant1 < totalAssets) {
      problems.push(`${totalAssets - assetsInTenant1} assets fora do Tenant 1`);
    }
    
    if (assetsWithoutLots.length > 0) {
      problems.push(`${assetsWithoutLots.length} assets sem lote vinculado`);
    }
    
    if (assetsWithoutSeller > 0) {
      problems.push(`${assetsWithoutSeller} assets sem comitente`);
    }
    
    if (problems.length > 0) {
      console.log('Problemas encontrados:');
      problems.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
      console.log('');
      
      // Aplicar correções
      console.log('🔄 APLICANDO CORREÇÕES...\n');
      
      // Mover assets para Tenant 1
      if (assetsInTenant1 < totalAssets) {
        const moved = await prisma.asset.updateMany({
          where: {
            tenantId: {
              not: 1
            }
          },
          data: {
            tenantId: 1
          }
        });
        console.log(`✅ ${moved.count} assets movidos para Tenant 1`);
      }
      
    } else {
      console.log('✅ Nenhum problema encontrado!\n');
    }
  }
  
  // 8. Verificar Lotes sem Assets
  console.log('\n📊 7. LOTES SEM ASSETS:\n');
  
  const lotsWithoutAssets = await prisma.lot.findMany({
    where: {
      lots: {
        none: {}
      }
    },
    select: {
      id: true,
      title: true,
      publicId: true
    },
    take: 10
  });
  
  console.log(`Total de lotes SEM assets vinculados: ${lotsWithoutAssets.length} (amostra de 10)`);
  
  if (lotsWithoutAssets.length > 0) {
    console.log('\nPrimeiros 10 lotes sem assets:');
    lotsWithoutAssets.forEach((lot, i) => {
      console.log(`  ${i + 1}. ${lot.title} (ID: ${lot.id})`);
    });
    console.log('');
  }

  await prisma.$disconnect();
}

main().catch(console.error);

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 AUDITORIA COMPLETA DA TABELA ASSETS (BENS)\n');
  
  // 1. Verificar se a tabela Asset existe e quantos registros tem
  console.log('📊 1. VERIFICAÇÃO GERAL:\n');
  
  try {
    const totalAssets = await prisma.asset.count();
    console.log(`Total de Assets (Bens) no sistema: ${totalAssets}\n`);
    
    if (totalAssets === 0) {
      console.log('⚠️  NENHUM ASSET ENCONTRADO NA TABELA!\n');
      console.log('Os lotes existem mas não têm bens (assets) cadastrados.\n');
    } else {
      // 2. Verificar distribuição por tenant
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
      
      // 3. Verificar Assets no Tenant 1
      const assetsInTenant1 = await prisma.asset.count({
        where: { tenantId: 1 }
      });
      
      console.log(`Assets no Tenant ID 1: ${assetsInTenant1}\n`);
      
      // 4. Verificar vinculação com Lotes
      console.log('📊 3. VINCULAÇÃO COM LOTES:\n');
      
      const assetsWithLot = await prisma.asset.count({
        where: {
          lotId: {
            not: null
          }
        }
      });
      
      const assetsWithoutLot = await prisma.asset.count({
        where: {
          lotId: null
        }
      });
      
      console.log(`Assets vinculados a lotes: ${assetsWithLot}`);
      console.log(`Assets SEM lote: ${assetsWithoutLot}\n`);
      
      // 5. Verificar vinculação com Sellers (Comitentes)
      console.log('📊 4. VINCULAÇÃO COM COMITENTES (SELLERS):\n');
      
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
      
      console.log(`Assets vinculados a comitentes: ${assetsWithSeller}`);
      console.log(`Assets SEM comitente: ${assetsWithoutSeller}\n`);
      
      // 6. Amostra de Assets (primeiros 10)
      console.log('📊 5. AMOSTRA DE ASSETS (primeiros 10):\n');
      
      const sampleAssets = await prisma.asset.findMany({
        take: 10,
        select: {
          id: true,
          description: true,
          tenantId: true,
          lotId: true,
          sellerId: true,
          lot: {
            select: {
              title: true,
              auction: {
                select: {
                  title: true,
                  auctionType: true
                }
              }
            }
          },
          seller: {
            select: {
              name: true
            }
          }
        }
      });
      
      sampleAssets.forEach((asset, index) => {
        console.log(`${index + 1}. Asset ID: ${asset.id}`);
        console.log(`   Descrição: ${asset.description || 'N/A'}`);
        console.log(`   Tenant ID: ${asset.tenantId}`);
        console.log(`   Lot ID: ${asset.lotId || 'SEM LOTE'}`);
        console.log(`   Lote: ${asset.lot?.title || 'N/A'}`);
        console.log(`   Leilão: ${asset.lot?.auction?.title || 'N/A'}`);
        console.log(`   Tipo: ${asset.lot?.auction?.auctionType || 'N/A'}`);
        console.log(`   Seller ID: ${asset.sellerId || 'SEM COMITENTE'}`);
        console.log(`   Comitente: ${asset.seller?.name || 'N/A'}`);
        console.log('');
      });
      
      // 7. Assets que precisam correção
      const assetsToFix = await prisma.asset.findMany({
        where: {
          OR: [
            { tenantId: { not: 1 } },
            { lotId: null },
            { sellerId: null }
          ]
        },
        select: {
          id: true,
          description: true,
          tenantId: true,
          lotId: true,
          sellerId: true
        },
        take: 20
      });
      
      if (assetsToFix.length > 0) {
        console.log('\n⚠️  6. ASSETS QUE PRECISAM CORREÇÃO:\n');
        assetsToFix.forEach((asset, index) => {
          const issues = [];
          if (asset.tenantId !== 1) issues.push(`Tenant errado: ${asset.tenantId}`);
          if (!asset.lotId) issues.push('Sem lote');
          if (!asset.sellerId) issues.push('Sem comitente');
          
          console.log(`${index + 1}. Asset ID ${asset.id}: ${issues.join(', ')}`);
        });
        console.log('');
      }
    }
    
  } catch (error: any) {
    console.log('❌ ERRO AO ACESSAR TABELA ASSET:\n');
    console.log(error.message);
    console.log('\nA tabela Asset pode não existir no schema do Prisma.\n');
  }
  
  // 8. Verificar schema do Prisma para Asset
  console.log('\n📊 7. VERIFICANDO MODELO ASSET NO SCHEMA:\n');
  console.log('Verificando se o modelo Asset existe no schema do Prisma...\n');

  await prisma.$disconnect();
}

main().catch(console.error);

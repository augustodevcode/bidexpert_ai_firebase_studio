import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔧 CORREÇÃO - MOVENDO ASSETS PARA TENANT 1\n');
  
  // 1. Verificar situação atual
  const totalAssets = await prisma.asset.count();
  const assetsInTenant1 = await prisma.asset.count({ where: { tenantId: 1 } });
  
  console.log(`Total de Assets: ${totalAssets}`);
  console.log(`Assets no Tenant 1: ${assetsInTenant1}\n`);
  
  if (assetsInTenant1 < totalAssets) {
    console.log('🔄 Movendo assets para Tenant 1...\n');
    
    const updated = await prisma.asset.updateMany({
      where: {
        tenantId: {
          not: 1
        }
      },
      data: {
        tenantId: 1
      }
    });
    
    console.log(`✅ ${updated.count} assets movidos para Tenant ID 1\n`);
  }
  
  // 2. Verificação final
  const finalCheck = await prisma.asset.findMany({
    select: {
      id: true,
      publicId: true,
      title: true,
      tenantId: true,
      sellerId: true,
      lots: {
        select: {
          lot: {
            select: {
              id: true,
              title: true
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
  
  console.log('📊 ASSETS APÓS CORREÇÃO:\n');
  
  finalCheck.forEach((asset, index) => {
    console.log(`${index + 1}. ${asset.title}`);
    console.log(`   ID: ${asset.id} | Public ID: ${asset.publicId}`);
    console.log(`   Tenant ID: ${asset.tenantId}`);
    console.log(`   Comitente: ${asset.seller?.name || 'SEM COMITENTE'}`);
    console.log(`   Lotes: ${asset.lots.length}`);
    
    asset.lots.forEach((al, i) => {
      console.log(`     ${i + 1}. ${al.lot.title} (ID: ${al.lot.id})`);
    });
    console.log('');
  });
  
  console.log('\n✅ CORREÇÃO CONCLUÍDA!\n');

  await prisma.$disconnect();
}

main().catch(console.error);

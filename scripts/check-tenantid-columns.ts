import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTenantIdColumns() {
  console.log('🔍 Verificando colunas tenantId nas tabelas...\n');
  
  const tables = [
    'AuctionStage', 'LotStagePrice', 'JudicialParty', 'AssetsOnLots', 
    'AssetMedia', 'UserWin', 'InstallmentPayment', 'UserLotMaxBid',
    'AuctionHabilitation', 'Review', 'LotQuestion', 'MediaItem',
    'UserDocument', 'LotCategory', 'Subcategory'
  ];
  
  for (const table of tables) {
    try {
      const result = await prisma.$queryRawUnsafe(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = '${table}'
        AND COLUMN_NAME = 'tenantId'
      `);
      
      const hasColumn = Array.isArray(result) && result.length > 0;
      console.log(`${table.padEnd(25)} ${hasColumn ? '✅ TEM tenantId' : '❌ NÃO TEM tenantId'}`);
    } catch (e) {
      console.log(`${table.padEnd(25)} ⚠️  ERRO: ${e.message}`);
    }
  }
  
  await prisma.$disconnect();
}

checkTenantIdColumns().catch(console.error);

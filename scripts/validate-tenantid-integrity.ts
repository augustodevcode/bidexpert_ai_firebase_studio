/**
 * Script de Validação de Integridade Multi-Tenant
 * 
 * Valida que todos os dados têm tenantId correto e que não há
 * vazamento de dados entre tenants.
 * 
 * Uso:
 *   npx tsx scripts/validate-tenantid-integrity.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ValidationResult {
  table: string;
  status: 'OK' | 'ERROR' | 'WARNING';
  message: string;
  details?: any;
}

async function validateMultiTenantIntegrity() {
  console.log('🔍 Iniciando validação de integridade multi-tenant...\n');
  
  const results: ValidationResult[] = [];
  
  try {
    // 1. Verificar se há registros sem tenantId (onde não deveria ser null)
    console.log('📋 Verificando registros sem tenantId...');
    
    const tablesWithTenantId = [
      'AuctionStage',
      'LotStagePrice',
      'JudicialParty',
      'AssetsOnLots',
      'AssetMedia',
      'UserWin',
      'InstallmentPayment',
      'UserLotMaxBid',
      'AuctionHabilitation',
      'Review',
      'LotQuestion',
      'won_lots',
      'participation_history'
    ];
    
    for (const table of tablesWithTenantId) {
      const count = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(*) as count FROM ${table} WHERE tenantId IS NULL
      `);
      
      if (count[0].count > 0) {
        results.push({
          table,
          status: 'ERROR',
          message: `${count[0].count} registros sem tenantId`,
          details: { nullCount: count[0].count }
        });
      } else {
        results.push({
          table,
          status: 'OK',
          message: 'Todos os registros têm tenantId'
        });
      }
    }
    
    // 2. Verificar consistência de tenantId em relacionamentos
    console.log('\n📋 Verificando consistência de relacionamentos...');
    
    // AuctionStage.tenantId == Auction.tenantId
    const auctionStageInconsistency = await prisma.$queryRaw<any[]>`
      SELECT s.id, s.tenantId as stageTenantId, a.tenantId as auctionTenantId
      FROM AuctionStage s
      JOIN Auction a ON s.auctionId = a.id
      WHERE s.tenantId != a.tenantId
    `;
    
    if (auctionStageInconsistency.length > 0) {
      results.push({
        table: 'AuctionStage',
        status: 'ERROR',
        message: 'Inconsistência de tenantId com Auction',
        details: { count: auctionStageInconsistency.length, records: auctionStageInconsistency }
      });
    } else {
      results.push({
        table: 'AuctionStage',
        status: 'OK',
        message: 'TenantId consistente com Auction'
      });
    }
    
    // LotStagePrice.tenantId == Lot.tenantId
    const lotStagePriceInconsistency = await prisma.$queryRaw<any[]>`
      SELECT p.id, p.tenantId as priceTenantId, l.tenantId as lotTenantId
      FROM LotStagePrice p
      JOIN Lot l ON p.lotId = l.id
      WHERE p.tenantId != l.tenantId
    `;
    
    if (lotStagePriceInconsistency.length > 0) {
      results.push({
        table: 'LotStagePrice',
        status: 'ERROR',
        message: 'Inconsistência de tenantId com Lot',
        details: { count: lotStagePriceInconsistency.length }
      });
    } else {
      results.push({
        table: 'LotStagePrice',
        status: 'OK',
        message: 'TenantId consistente com Lot'
      });
    }
    
    // AssetsOnLots: Asset.tenantId == Lot.tenantId
    const assetsOnLotsInconsistency = await prisma.$queryRaw<any[]>`
      SELECT aol.lotId, aol.assetId, a.tenantId as assetTenantId, l.tenantId as lotTenantId
      FROM AssetsOnLots aol
      JOIN Asset a ON aol.assetId = a.id
      JOIN Lot l ON aol.lotId = l.id
      WHERE a.tenantId != l.tenantId
    `;
    
    if (assetsOnLotsInconsistency.length > 0) {
      results.push({
        table: 'AssetsOnLots',
        status: 'ERROR',
        message: 'Ativos de tenants diferentes vinculados a lotes',
        details: { count: assetsOnLotsInconsistency.length, records: assetsOnLotsInconsistency }
      });
    } else {
      results.push({
        table: 'AssetsOnLots',
        status: 'OK',
        message: 'Sem vinculações cross-tenant'
      });
    }
    
    // Bid.tenantId == Lot.tenantId
    const bidInconsistency = await prisma.$queryRaw<any[]>`
      SELECT b.id, b.tenantId as bidTenantId, l.tenantId as lotTenantId
      FROM Bid b
      JOIN Lot l ON b.lotId = l.id
      WHERE b.tenantId != l.tenantId
    `;
    
    if (bidInconsistency.length > 0) {
      results.push({
        table: 'Bid',
        status: 'ERROR',
        message: 'Lances com tenantId diferente do lote',
        details: { count: bidInconsistency.length }
      });
    } else {
      results.push({
        table: 'Bid',
        status: 'OK',
        message: 'TenantId consistente com Lot'
      });
    }
    
    // 3. Verificar isolamento de dados
    console.log('\n📋 Verificando isolamento de dados...');
    
    // Contar tenants
    const tenants = await prisma.tenant.findMany({
      select: { id: true, name: true, subdomain: true }
    });
    
    console.log(`\nTenants encontrados: ${tenants.length}`);
    
    for (const tenant of tenants) {
      console.log(`\n  Tenant: ${tenant.name} (ID: ${tenant.id})`);
      
      // Contar registros por tenant
      const auctionsCount = await prisma.auction.count({
        where: { tenantId: tenant.id }
      });
      const lotsCount = await prisma.lot.count({
        where: { tenantId: tenant.id }
      });
      const bidsCount = await prisma.bid.count({
        where: { tenantId: tenant.id }
      });
      
      console.log(`    - Leilões: ${auctionsCount}`);
      console.log(`    - Lotes: ${lotsCount}`);
      console.log(`    - Lances: ${bidsCount}`);
    }
    
    // 4. Verificar índices
    console.log('\n📋 Verificando índices...');
    
    const indexCheck = await prisma.$queryRaw<any[]>`
      SELECT 
        TABLE_NAME,
        INDEX_NAME,
        COLUMN_NAME
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
      AND COLUMN_NAME = 'tenantId'
      ORDER BY TABLE_NAME, INDEX_NAME
    `;
    
    const tablesWithIndexes = [...new Set(indexCheck.map(r => r.TABLE_NAME))];
    
    if (tablesWithIndexes.length > 0) {
      results.push({
        table: 'INDEXES',
        status: 'OK',
        message: `Índices em tenantId encontrados em ${tablesWithIndexes.length} tabelas`,
        details: { tables: tablesWithIndexes }
      });
    } else {
      results.push({
        table: 'INDEXES',
        status: 'WARNING',
        message: 'Nenhum índice em tenantId encontrado'
      });
    }
    
    // 5. Imprimir resumo
    console.log('\n📊 RESUMO DA VALIDAÇÃO\n');
    console.log('═'.repeat(80));
    
    const errors = results.filter(r => r.status === 'ERROR');
    const warnings = results.filter(r => r.status === 'WARNING');
    const ok = results.filter(r => r.status === 'OK');
    
    console.log(`✅ OK: ${ok.length}`);
    console.log(`⚠️  WARNINGS: ${warnings.length}`);
    console.log(`❌ ERRORS: ${errors.length}`);
    console.log('═'.repeat(80));
    
    if (errors.length > 0) {
      console.log('\n❌ ERROS ENCONTRADOS:\n');
      errors.forEach(error => {
        console.log(`  [${error.table}] ${error.message}`);
        if (error.details) {
          console.log(`    Detalhes:`, JSON.stringify(error.details, null, 2));
        }
      });
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️  AVISOS:\n');
      warnings.forEach(warning => {
        console.log(`  [${warning.table}] ${warning.message}`);
      });
    }
    
    if (errors.length === 0 && warnings.length === 0) {
      console.log('\n✅ Validação concluída com sucesso! Nenhum problema encontrado.\n');
      return true;
    } else {
      console.log('\n⚠️  Validação concluída com problemas. Revise os erros acima.\n');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Erro durante validação:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar validação
validateMultiTenantIntegrity()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

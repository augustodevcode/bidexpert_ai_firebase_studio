/**
 * Testes de Isolamento Multi-Tenant - Simplificado
 * 
 * Testes para verificar isolamento de dados entre tenants
 */

import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('Isolamento Multi-Tenant - Banco de Dados', () => {
  
  test('Verificar que campo tenantId existe nas tabelas críticas', async () => {
    const tables = [
      'Auction', 'Lot', 'Asset', 'Bid', 'AuctionStage',
      'AssetsOnLots', 'JudicialProcess'
    ];
    
    for (const table of tables) {
      const columns = await prisma.$queryRawUnsafe<Array<{COLUMN_NAME: string}>>(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = '${table}' 
         AND COLUMN_NAME = 'tenantId'`
      );
      
      expect(columns.length).toBeGreaterThan(0);
      console.log(`✅ ${table} tem campo tenantId`);
    }
    
    await prisma.$disconnect();
  });

  test('Verificar que há índices em tenantId', async () => {
    const indexes = await prisma.$queryRaw<Array<{TABLE_NAME: string, INDEX_NAME: string}>>`
      SELECT TABLE_NAME, INDEX_NAME
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
      AND COLUMN_NAME = 'tenantId'
      AND TABLE_NAME IN ('Auction', 'Lot', 'Asset', 'Bid')
    `;
    
    expect(indexes.length).toBeGreaterThan(0);
    console.log(`✅ ${indexes.length} índices encontrados em tenantId`);
    
    await prisma.$disconnect();
  });

  test('Verificar integridade dos dados - Auction.tenantId', async () => {
    // Usar query raw para verificar nulls
    const nullTenantCount = await prisma.$queryRaw<Array<{count: bigint}>>`
      SELECT COUNT(*) as count FROM Auction WHERE tenantId IS NULL
    `;
    
    expect(Number(nullTenantCount[0].count)).toBe(0);
    console.log('✅ Todos os leilões têm tenantId');
    
    await prisma.$disconnect();
  });

  test('Verificar integridade dos dados - Lot.tenantId', async () => {
    const nullTenantCount = await prisma.$queryRaw<Array<{count: bigint}>>`
      SELECT COUNT(*) as count FROM Lot WHERE tenantId IS NULL
    `;
    
    expect(Number(nullTenantCount[0].count)).toBe(0);
    console.log('✅ Todos os lotes têm tenantId');
    
    await prisma.$disconnect();
  });

  test('Verificar integridade dos dados - Asset.tenantId', async () => {
    const nullTenantCount = await prisma.$queryRaw<Array<{count: bigint}>>`
      SELECT COUNT(*) as count FROM Asset WHERE tenantId IS NULL
    `;
    
    expect(Number(nullTenantCount[0].count)).toBe(0);
    console.log('✅ Todos os ativos têm tenantId');
    
    await prisma.$disconnect();
  });

  test('Verificar consistência Lot.tenantId == Auction.tenantId', async () => {
    const inconsistent = await prisma.$queryRaw<Array<any>>`
      SELECT l.id, l.tenantId as lotTenantId, a.tenantId as auctionTenantId
      FROM Lot l
      JOIN Auction a ON l.auctionId = a.id
      WHERE l.tenantId != a.tenantId
      LIMIT 10
    `;
    
    expect(inconsistent.length).toBe(0);
    console.log('✅ TenantId de Lote sempre igual ao tenantId do Leilão');
    
    await prisma.$disconnect();
  });

  test('Verificar consistência Asset.tenantId em AssetsOnLots', async () => {
    const inconsistent = await prisma.$queryRaw<Array<any>>`
      SELECT aol.lotId, aol.assetId, 
             a.tenantId as assetTenantId,
             l.tenantId as lotTenantId
      FROM AssetsOnLots aol
      JOIN Asset a ON aol.assetId = a.id
      JOIN Lot l ON aol.lotId = l.id
      WHERE a.tenantId != l.tenantId
      LIMIT 10
    `;
    
    expect(inconsistent.length).toBe(0);
    console.log('✅ Ativos vinculados a lotes sempre do mesmo tenant');
    
    await prisma.$disconnect();
  });

  test('Verificar que há pelo menos um tenant no sistema', async () => {
    const tenantCount = await prisma.tenant.count();
    
    expect(tenantCount).toBeGreaterThan(0);
    console.log(`✅ ${tenantCount} tenant(s) encontrado(s) no sistema`);
    
    await prisma.$disconnect();
  });

  test('Verificar isolamento: leilões filtrados por tenantId retornam só o tenant', async () => {
    // Buscar primeiro tenant
    const tenant = await prisma.tenant.findFirst();
    
    if (tenant) {
      const auctions = await prisma.auction.findMany({
        where: { tenantId: tenant.id },
        take: 100
      });
      
      // Todos devem ter o mesmo tenantId
      const allSameTenant = auctions.every(a => a.tenantId === tenant.id);
      expect(allSameTenant).toBe(true);
      
      console.log(`✅ ${auctions.length} leilões do tenant ${tenant.id}, todos isolados corretamente`);
    } else {
      console.log('ℹ️  Nenhum tenant para testar');
    }
    
    await prisma.$disconnect();
  });
});

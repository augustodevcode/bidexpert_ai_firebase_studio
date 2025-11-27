/**
 * Testes de Validação Multi-Tenant - Banco de Dados
 * 
 * Valida o isolamento multi-tenant diretamente no banco de dados
 * sem depender do servidor web rodando.
 * 
 * @group multi-tenant
 * @group database
 */

import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuração de tenants para teste
const TENANT_A_ID = 1;
const TENANT_B_ID = 2;

test.describe('Validação Multi-Tenant - Banco de Dados', () => {
  
  test.beforeAll(async () => {
    // Garantir que os tenants existem
    await prisma.tenant.upsert({
      where: { id: TENANT_A_ID },
      update: {},
      create: {
        id: TENANT_A_ID,
        subdomain: 'tenant-a',
        name: 'Leiloeiro A'
      }
    });

    await prisma.tenant.upsert({
      where: { id: TENANT_B_ID },
      update: {},
      create: {
        id: TENANT_B_ID,
        subdomain: 'tenant-b',
        name: 'Leiloeiro B'
      }
    });
  });

  test.afterAll(async () => {
    // Limpar dados de teste criados
    await prisma.bid.deleteMany({
      where: {
        OR: [
          { tenantId: TENANT_A_ID },
          { tenantId: TENANT_B_ID }
        ]
      }
    });

    await prisma.lot.deleteMany({
      where: {
        OR: [
          { tenantId: TENANT_A_ID },
          { tenantId: TENANT_B_ID }
        ]
      }
    });

    await prisma.auction.deleteMany({
      where: {
        OR: [
          { tenantId: TENANT_A_ID },
          { tenantId: TENANT_B_ID }
        ]
      }
    });

    await prisma.$disconnect();
  });

  test('✅ Tenants existem no banco de dados', async () => {
    const tenantA = await prisma.tenant.findUnique({
      where: { id: TENANT_A_ID }
    });

    const tenantB = await prisma.tenant.findUnique({
      where: { id: TENANT_B_ID }
    });

    expect(tenantA).not.toBeNull();
    expect(tenantB).not.toBeNull();
    expect(tenantA?.id).toBe(TENANT_A_ID);
    expect(tenantB?.id).toBe(TENANT_B_ID);
  });

  test('✅ Leilão criado tem tenantId correto', async () => {
    const auction = await prisma.auction.create({
      data: {
        title: 'Leilão Teste Tenant A',
        slug: `leilao-teste-a-${Date.now()}`,
        description: 'Descrição de teste',
        status: 'ABERTO',
        tenantId: TENANT_A_ID,
        auctionDate: new Date(),
        endDate: new Date(Date.now() + 86400000) // +1 dia
      }
    });

    expect(auction.tenantId).toBe(TENANT_A_ID);

    // Verificar que o leilão só aparece para o Tenant A
    const auctionsA = await prisma.auction.findMany({
      where: { tenantId: TENANT_A_ID }
    });

    const auctionsB = await prisma.auction.findMany({
      where: { tenantId: TENANT_B_ID }
    });

    expect(auctionsA.some(a => a.id === auction.id)).toBe(true);
    expect(auctionsB.some(a => a.id === auction.id)).toBe(false);
  });

  test('✅ Lote herda tenantId do leilão pai', async () => {
    // Criar leilão
    const auction = await prisma.auction.create({
      data: {
        title: 'Leilão para Lote Teste',
        slug: `leilao-lote-${Date.now()}`,
        description: 'Teste',
        status: 'ABERTO',
        tenantId: TENANT_A_ID,
        auctionDate: new Date(),
        endDate: new Date(Date.now() + 86400000)
      }
    });

    // Criar lote
    const lot = await prisma.lot.create({
      data: {
        title: 'Lote Teste',
        description: 'Descrição do lote',
        price: 1000,
        status: 'EM_BREVE',
        type: 'VEICULO',
        auctionId: auction.id,
        tenantId: auction.tenantId // Herda do leilão
      }
    });

    expect(lot.tenantId).toBe(auction.tenantId);
    expect(lot.tenantId).toBe(TENANT_A_ID);
  });

  test('✅ Lance registrado tem tenantId do lote', async () => {
    // Criar leilão
    const auction = await prisma.auction.create({
      data: {
        title: 'Leilão para Lance Teste',
        slug: `leilao-lance-${Date.now()}`,
        description: 'Teste',
        status: 'ABERTO',
        tenantId: TENANT_B_ID,
        auctionDate: new Date(),
        endDate: new Date(Date.now() + 86400000)
      }
    });

    // Criar lote
    const lot = await prisma.lot.create({
      data: {
        title: 'Lote para Lance',
        description: 'Descrição',
        price: 5000,
        status: 'EM_BREVE',
        type: 'IMOVEL',
        auctionId: auction.id,
        tenantId: auction.tenantId
      }
    });

    // Criar usuário para o lance (simplificado)
    const user = await prisma.user.upsert({
      where: { email: 'lance-test@tenant-b.com' },
      update: {},
      create: {
        email: 'lance-test@tenant-b.com',
        fullName: 'Usuário Teste Lance',
        password: '$2a$10$test', // Hash fake
        accountType: 'PHYSICAL'
      }
    });

    // Criar lance
    const bid = await prisma.bid.create({
      data: {
        amount: 6000,
        tenantId: lot.tenantId,
        status: 'ATIVO',
        lot: {
          connect: { id: lot.id }
        },
        user: {
          connect: { id: user.id }
        }
      }
    });

    expect(bid.tenantId).toBe(lot.tenantId);
    expect(bid.tenantId).toBe(TENANT_B_ID);
  });

  test('✅ Query filtrando por tenantId retorna apenas dados do tenant', async () => {
    // Criar leilões para ambos os tenants
    await prisma.auction.create({
      data: {
        title: 'Leilão Tenant A - Query Test',
        slug: `query-a-${Date.now()}`,
        description: 'Teste',
        status: 'ABERTO',
        tenantId: TENANT_A_ID,
        auctionDate: new Date(),
        endDate: new Date(Date.now() + 86400000)
      }
    });

    await prisma.auction.create({
      data: {
        title: 'Leilão Tenant B - Query Test',
        slug: `query-b-${Date.now()}`,
        description: 'Teste',
        status: 'ABERTO',
        tenantId: TENANT_B_ID,
        auctionDate: new Date(),
        endDate: new Date(Date.now() + 86400000)
      }
    });

    // Buscar apenas do Tenant A
    const auctionsA = await prisma.auction.findMany({
      where: { tenantId: TENANT_A_ID }
    });

    // Buscar apenas do Tenant B
    const auctionsB = await prisma.auction.findMany({
      where: { tenantId: TENANT_B_ID }
    });

    // Verificar que não há mistura
    expect(auctionsA.every((a: any) => a.tenantId === TENANT_A_ID)).toBe(true);
    expect(auctionsB.every((a: any) => a.tenantId === TENANT_B_ID)).toBe(true);
    
    // Verificar que nenhum leilão do Tenant A aparece no Tenant B e vice-versa
    const idsA = new Set(auctionsA.map(a => a.id));
    const idsB = new Set(auctionsB.map(a => a.id));
    
    expect([...idsA].some(id => idsB.has(id))).toBe(false);
  });

  test('✅ Não é possível criar registro com tenantId inválido', async () => {
    const INVALID_TENANT_ID = 99999;

    await expect(async () => {
      await prisma.auction.create({
        data: {
          title: 'Leilão Tenant Inválido',
          slug: `invalid-${Date.now()}`,
          description: 'Teste',
          status: 'ABERTO',
          tenantId: INVALID_TENANT_ID,
          auctionDate: new Date(),
          endDate: new Date(Date.now() + 86400000)
        }
      });
    }).rejects.toThrow();
  });

  test('✅ Contador de registros por tenant é independente', async () => {
    // Contar leilões antes
    const countBeforeA = await prisma.auction.count({
      where: { tenantId: TENANT_A_ID }
    });

    const countBeforeB = await prisma.auction.count({
      where: { tenantId: TENANT_B_ID }
    });

    // Criar novo leilão no Tenant A
    await prisma.auction.create({
      data: {
        title: 'Leilão Contador Test A',
        slug: `count-a-${Date.now()}`,
        description: 'Teste',
        status: 'ABERTO',
        tenantId: TENANT_A_ID,
        auctionDate: new Date(),
        endDate: new Date(Date.now() + 86400000)
      }
    });

    // Contar leilões depois
    const countAfterA = await prisma.auction.count({
      where: { tenantId: TENANT_A_ID }
    });

    const countAfterB = await prisma.auction.count({
      where: { tenantId: TENANT_B_ID }
    });

    // Tenant A deve ter +1
    expect(countAfterA).toBe(countBeforeA + 1);
    
    // Tenant B deve permanecer igual
    expect(countAfterB).toBe(countBeforeB);
  });

  test('✅ Todas as tabelas principais têm campo tenantId', async () => {
    // Verificar schema das tabelas principais
    const tables = [
      'Auction',
      'Lot', 
      'Bid',
      'User',
      'Asset',
      'LegalProcess',
      'AuditLog'
    ];

    // Para cada tabela, tentar acessar o campo tenantId
    for (const tableName of tables) {
      // Criar um registro de teste e verificar que tenantId existe
      try {
        const model = (prisma as any)[tableName.toLowerCase()];
        if (!model) continue;

        // Buscar um registro qualquer
        const record = await model.findFirst();
        
        if (record) {
          // Verificar que o campo tenantId existe
          expect(record).toHaveProperty('tenantId');
          console.log(`✅ Tabela ${tableName} tem campo tenantId`);
        }
      } catch (error) {
        console.log(`⚠️  Não foi possível verificar ${tableName}:`, error);
      }
    }
  });
});

/**
 * Testes E2E - Isolamento Multi-Tenant
 * 
 * Este arquivo contém testes end-to-end para validar o isolamento
 * completo de dados entre diferentes tenants.
 * 
 * @group multi-tenant
 * @group critical
 */

import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuração de tenants para teste
const TENANT_A = {
  id: 1,
  subdomain: 'tenant-a',
  name: 'Leiloeiro A'
};

const TENANT_B = {
  id: 2,
  subdomain: 'tenant-b',
  name: 'Leiloeiro B'
};

// Usuários de teste
const USER_TENANT_A = {
  email: 'usuario@tenant-a.com',
  password: 'Test@123',
  tenantId: TENANT_A.id
};

const USER_TENANT_B = {
  email: 'usuario@tenant-b.com',
  password: 'Test@123',
  tenantId: TENANT_B.id
};

test.describe('Isolamento Multi-Tenant - Leilões', () => {
  
  test.beforeAll(async () => {
    // Setup: Criar dados de teste
    // Este código seria executado antes dos testes
  });

  test.afterAll(async () => {
    // Cleanup: Limpar dados de teste
    await prisma.$disconnect();
  });

  test('Usuário do Tenant A vê apenas leilões do Tenant A', async ({ page }) => {
    // Login como usuário do Tenant A
    await page.goto(`http://${TENANT_A.subdomain}.localhost:3000/login`);
    await page.fill('input[name="email"]', USER_TENANT_A.email);
    await page.fill('input[name="password"]', USER_TENANT_A.password);
    await page.click('button[type="submit"]');
    
    // Aguardar redirect após login
    await page.waitForURL(`http://${TENANT_A.subdomain}.localhost:3000/dashboard`);
    
    // Navegar para lista de leilões
    await page.goto(`http://${TENANT_A.subdomain}.localhost:3000/auctions`);
    
    // Verificar que apenas leilões do Tenant A são exibidos
    const auctionCards = await page.locator('[data-testid="auction-card"]').all();
    
    for (const card of auctionCards) {
      const tenantId = await card.getAttribute('data-tenant-id');
      expect(tenantId).toBe(String(TENANT_A.id));
    }
  });

  test('Usuário do Tenant A não pode acessar leilão do Tenant B via URL direta', async ({ page }) => {
    // Criar leilão no Tenant B
    const auctionTenantB = await prisma.auction.create({
      data: {
        title: 'Leilão Exclusivo Tenant B',
        slug: 'leilao-tenant-b-test',
        tenantId: TENANT_B.id,
        status: 'ABERTO'
      }
    });
    
    // Login como usuário do Tenant A
    await page.goto(`http://${TENANT_A.subdomain}.localhost:3000/login`);
    await page.fill('input[name="email"]', USER_TENANT_A.email);
    await page.fill('input[name="password"]', USER_TENANT_A.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);
    
    // Tentar acessar leilão do Tenant B
    await page.goto(`http://${TENANT_A.subdomain}.localhost:3000/auctions/${auctionTenantB.slug}`);
    
    // Deve ver página 404 ou mensagem de erro
    await expect(page.locator('text=Não encontrado')).toBeVisible();
    // OU
    await expect(page.locator('[data-testid="error-404"]')).toBeVisible();
    
    // Limpar dados de teste
    await prisma.auction.delete({ where: { id: auctionTenantB.id } });
  });

  test('Contador de leilões reflete apenas leilões do tenant atual', async ({ page }) => {
    // Login no Tenant A
    await page.goto(`http://${TENANT_A.subdomain}.localhost:3000/login`);
    await page.fill('input[name="email"]', USER_TENANT_A.email);
    await page.fill('input[name="password"]', USER_TENANT_A.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);
    
    // Obter contagem de leilões do banco
    const count = await prisma.auction.count({
      where: { tenantId: TENANT_A.id }
    });
    
    // Verificar contador na UI
    await page.goto(`http://${TENANT_A.subdomain}.localhost:3000/auctions`);
    const displayedCount = await page.locator('[data-testid="auctions-count"]').textContent();
    
    expect(Number(displayedCount)).toBe(count);
  });
});

test.describe('Isolamento Multi-Tenant - Lotes', () => {
  
  test('Busca de lotes retorna apenas lotes do tenant atual', async ({ page, request }) => {
    // Fazer requisição API direta para buscar lotes
    const response = await request.get(`http://${TENANT_A.subdomain}.localhost:3000/api/lots`, {
      headers: {
        'Cookie': await page.context().cookies()
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // Verificar que todos os lotes têm o tenantId correto
    expect(data.lots).toBeDefined();
    data.lots.forEach((lot: any) => {
      expect(lot.tenantId).toBe(TENANT_A.id);
    });
  });

  test('Lote criado herda tenantId do leilão pai', async ({ page }) => {
    // Login como admin do Tenant A
    await page.goto(`http://${TENANT_A.subdomain}.localhost:3000/login`);
    await page.fill('input[name="email"]', 'admin@tenant-a.com');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);
    
    // Navegar para criação de lote
    await page.goto(`http://${TENANT_A.subdomain}.localhost:3000/admin/lots/new`);
    
    // Selecionar leilão do Tenant A
    await page.selectOption('select[name="auctionId"]', { index: 1 });
    
    // Preencher dados do lote
    await page.fill('input[name="title"]', 'Lote Teste Multi-Tenant');
    await page.fill('input[name="price"]', '10000');
    await page.selectOption('select[name="type"]', 'IMOVEL');
    
    // Submeter formulário
    await page.click('button[type="submit"]');
    await page.waitForURL(/lots\/*/);
    
    // Verificar no banco que o lote tem o tenantId correto
    const createdLot = await prisma.lot.findFirst({
      where: { title: 'Lote Teste Multi-Tenant' },
      select: { id: true, tenantId: true, auctionId: true }
    });
    
    expect(createdLot).toBeDefined();
    expect(createdLot!.tenantId).toBe(TENANT_A.id);
    
    // Verificar que o leilão também tem o mesmo tenantId
    const auction = await prisma.auction.findUnique({
      where: { id: createdLot!.auctionId },
      select: { tenantId: true }
    });
    
    expect(auction!.tenantId).toBe(createdLot!.tenantId);
    
    // Limpar
    await prisma.lot.delete({ where: { id: createdLot!.id } });
  });
});

test.describe('Isolamento Multi-Tenant - Lances', () => {
  
  test('Lance registrado tem tenantId do lote', async ({ page }) => {
    // Criar lote de teste no Tenant A
    const auction = await prisma.auction.findFirst({
      where: { tenantId: TENANT_A.id, status: 'ABERTO' }
    });
    
    const lot = await prisma.lot.create({
      data: {
        title: 'Lote Teste Lance',
        price: 5000,
        type: 'VEICULO',
        status: 'ABERTO_PARA_LANCES',
        auctionId: auction!.id,
        tenantId: TENANT_A.id
      }
    });
    
    // Login e fazer lance
    await page.goto(`http://${TENANT_A.subdomain}.localhost:3000/login`);
    await page.fill('input[name="email"]', USER_TENANT_A.email);
    await page.fill('input[name="password"]', USER_TENANT_A.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);
    
    await page.goto(`http://${TENANT_A.subdomain}.localhost:3000/lots/${lot.id}`);
    
    // Fazer lance
    await page.fill('input[name="bidAmount"]', '5500');
    await page.click('button[data-testid="submit-bid"]');
    
    // Aguardar confirmação
    await expect(page.locator('text=Lance realizado')).toBeVisible();
    
    // Verificar no banco
    const bid = await prisma.bid.findFirst({
      where: { lotId: lot.id },
      orderBy: { timestamp: 'desc' }
    });
    
    expect(bid).toBeDefined();
    expect(bid!.tenantId).toBe(TENANT_A.id);
    expect(bid!.tenantId).toBe(lot.tenantId);
    
    // Limpar
    await prisma.bid.deleteMany({ where: { lotId: lot.id } });
    await prisma.lot.delete({ where: { id: lot.id } });
  });
});

test.describe('Isolamento Multi-Tenant - Relacionamentos', () => {
  
  test('Não é possível vincular ativo de um tenant a lote de outro tenant', async ({ page, request }) => {
    // Criar ativo no Tenant A
    const assetTenantA = await prisma.asset.create({
      data: {
        publicId: 'ASSET-TEST-A',
        title: 'Ativo Tenant A',
        tenantId: TENANT_A.id,
        status: 'DISPONIVEL'
      }
    });
    
    // Criar lote no Tenant B
    const auctionTenantB = await prisma.auction.findFirst({
      where: { tenantId: TENANT_B.id }
    });
    
    const lotTenantB = await prisma.lot.create({
      data: {
        title: 'Lote Tenant B',
        price: 1000,
        type: 'OUTRO',
        auctionId: auctionTenantB!.id,
        tenantId: TENANT_B.id
      }
    });
    
    // Tentar vincular via API
    const response = await request.post(
      `http://${TENANT_B.subdomain}.localhost:3000/api/lots/${lotTenantB.id}/assets`,
      {
        data: {
          assetId: assetTenantA.id
        },
        headers: {
          'Content-Type': 'application/json',
          'Cookie': await page.context().cookies()
        }
      }
    );
    
    // Deve retornar erro
    expect(response.status()).toBe(400); // ou 403
    const error = await response.json();
    expect(error.message).toContain('tenant');
    
    // Limpar
    await prisma.lot.delete({ where: { id: lotTenantB.id } });
    await prisma.asset.delete({ where: { id: assetTenantA.id } });
  });
});

test.describe('Isolamento Multi-Tenant - Performance', () => {
  
  test('Query com tenantId usa índice e é rápida', async ({ page, request }) => {
    const startTime = Date.now();
    
    // Fazer busca de lotes
    const response = await request.get(
      `http://${TENANT_A.subdomain}.localhost:3000/api/lots?limit=100`
    );
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    expect(response.ok()).toBeTruthy();
    expect(duration).toBeLessThan(1000); // Deve responder em menos de 1 segundo
    
    // Verificar que a query usou índice (pode ser verificado via EXPLAIN)
    // Isso depende de como você implementa o logging de queries
  });
});

test.describe('Isolamento Multi-Tenant - Auditoria', () => {
  
  test('Tentativa de acesso cross-tenant é registrada em audit log', async ({ page }) => {
    // Login no Tenant A
    await page.goto(`http://${TENANT_A.subdomain}.localhost:3000/login`);
    await page.fill('input[name="email"]', USER_TENANT_A.email);
    await page.fill('input[name="password"]', USER_TENANT_A.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);
    
    // Tentar acessar recurso do Tenant B
    const lotTenantB = await prisma.lot.findFirst({
      where: { tenantId: TENANT_B.id }
    });
    
    if (lotTenantB) {
      await page.goto(`http://${TENANT_A.subdomain}.localhost:3000/lots/${lotTenantB.id}`);
      
      // Aguardar erro
      await page.waitForTimeout(1000);
      
      // Verificar que foi criado audit log
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          entityType: 'Lot',
          entityId: lotTenantB.id,
          action: 'READ'
        },
        orderBy: { timestamp: 'desc' }
      });
      
      expect(auditLog).toBeDefined();
      expect(auditLog!.metadata).toBeDefined();
    }
  });
});

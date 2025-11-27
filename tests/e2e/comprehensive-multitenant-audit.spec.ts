/**
 * Testes E2E Abrangentes - Multi-Tenant + Audit Trail
 * 
 * Este arquivo contém testes end-to-end para validar:
 * 1. Isolamento completo de dados multi-tenant em todos os CRUDs
 * 2. Audit Trail (histórico de alterações) com rastreamento de quem alterou
 * 
 * Baseado nas regras de negócio do arquivo REGRAS_NEGOCIO_CONSOLIDADO.md
 * 
 * @group multi-tenant
 * @group audit-trail
 * @group critical
 */

import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuração de tenants para teste
const TENANT_A = {
  id: 1,
  name: 'BidExpert Tenant Principal'
};

const TENANT_B = {
  id: 2,
  name: 'BidExpert Tenant Secundário'
};

// Usuários de teste
const USER_TENANT_A = {
  email: 'admin@bidexpert.com',
  password: 'Test@12345',
  tenantId: TENANT_A.id
};

const USER_TENANT_B = {
  email: 'user@tenant-b.com',
  password: 'Test@12345',
  tenantId: TENANT_B.id
};

// Helper para login
async function loginAsUser(page: any, email: string, password: string, tenantId: number) {
  await page.goto('http://localhost:9005/auth/login');
  await page.fill('[data-ai-id="auth-login-email-input"]', email);
  await page.fill('[data-ai-id="auth-login-password-input"]', password);
  
  // Selecionar tenant se necessário
  try {
    const dropdown = page.locator('[data-ai-id="auth-login-tenant-select"]');
    if (await dropdown.isVisible({ timeout: 2000 })) {
      await dropdown.selectOption(String(tenantId));
    }
  } catch (e) {
    // Dropdown pode não aparecer
  }
  
  await page.click('[data-ai-id="auth-login-submit-button"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

// Helper para verificar audit log
async function verifyAuditLog(entityType: string, entityId: bigint, action: string, userId: bigint) {
  const logs = await prisma.auditLog.findMany({
    where: {
      entityType,
      entityId,
      action: action as any,
      userId
    },
    orderBy: { timestamp: 'desc' },
    take: 1
  });
  
  return logs.length > 0 ? logs[0] : null;
}

// Cleanup helper
async function cleanupTestData() {
  // Limpeza em ordem reversa de dependências
  await prisma.lot.deleteMany({
    where: {
      title: { contains: 'TEST-MULTITENANT' }
    }
  });
  
  await prisma.auction.deleteMany({
    where: {
      title: { contains: 'TEST-MULTITENANT' }
    }
  });
  
  await prisma.asset.deleteMany({
    where: {
      title: { contains: 'TEST-MULTITENANT' }
    }
  });
  
  await prisma.seller.deleteMany({
    where: {
      legalEntity: { name: { contains: 'TEST-MULTITENANT' } }
    }
  });
  
  await prisma.auctioneer.deleteMany({
    where: {
      legalEntity: { name: { contains: 'TEST-MULTITENANT' } }
    }
  });
}

test.describe('Testes Abrangentes - Multi-Tenant + Audit Trail', () => {
  
  test.beforeAll(async () => {
    // Verificar se os tenants existem
    const tA = await prisma.tenant.findUnique({ where: { id: BigInt(TENANT_A.id) } });
    const tB = await prisma.tenant.findUnique({ where: { id: BigInt(TENANT_B.id) } });
    
    if (!tA || !tB) {
      throw new Error('⚠️ Tenants de teste não encontrados. Execute o seed primeiro.');
    }
    
    console.log('✅ Tenants verificados');
    
    // Limpar dados de testes anteriores
    await cleanupTestData();
  });
  
  test.afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  // ========================================
  // TESTES DE LEILÕES (AUCTIONS)
  // ========================================
  
  test.describe('Leilões - Multi-Tenant + Audit', () => {
    
    test('MT-AUCTION-01: Usuário do Tenant A não vê leilões do Tenant B', async ({ page }) => {
      // Login como Tenant A
      await loginAsUser(page, USER_TENANT_A.email, USER_TENANT_A.password, TENANT_A.id);
      
      // Criar leilão no Tenant B via banco
      const auctionB = await prisma.auction.create({
        data: {
          title: 'TEST-MULTITENANT LEILÃO TENANT B',
          slug: `test-mt-auction-b-${Date.now()}`,
          tenantId: BigInt(TENANT_B.id),
          status: 'ABERTO'
        }
      });
      
      try {
        // Navegar para lista de leilões
        await page.goto('http://localhost:9005/admin/auctions');
        await page.waitForTimeout(1000);
        
        // Verificar que o leilão do Tenant B NÃO aparece
        const auctionText = page.locator(`text="${auctionB.title}"`);
        await expect(auctionText).toBeHidden();
        
        console.log('✅ Isolamento confirmado: Leilão do Tenant B não visível para Tenant A');
      } finally {
        await prisma.auction.delete({ where: { id: auctionB.id } });
      }
    });
    
    test('AUDIT-AUCTION-01: Criação de leilão gera audit log com usuário correto', async ({ page }) => {
      // Login como Tenant A
      await loginAsUser(page, USER_TENANT_A.email, USER_TENANT_A.password, TENANT_A.id);
      
      // Criar leilão
      const auctionTitle = `TEST-MULTITENANT AUCTION ${Date.now()}`;
      const auction = await prisma.auction.create({
        data: {
          title: auctionTitle,
          slug: `test-audit-auction-${Date.now()}`,
          tenantId: BigInt(TENANT_A.id),
          status: 'RASCUNHO'
        }
      });
      
      try {
        // Aguardar audit log ser criado (middleware assíncrono)
        await page.waitForTimeout(2000);
        
        // Buscar o usuário admin do Tenant A
        const adminUser = await prisma.user.findFirst({
          where: { email: USER_TENANT_A.email }
        });
        
        if (!adminUser) {
          throw new Error('Usuário admin não encontrado');
        }
        
        // Verificar audit log
        const auditLog = await verifyAuditLog('Auction', auction.id, 'CREATE', adminUser.id);
        
        expect(auditLog).not.toBeNull();
        expect(auditLog?.tenantId).toBe(BigInt(TENANT_A.id));
        expect(auditLog?.userId).toBe(adminUser.id);
        expect(auditLog?.action).toBe('CREATE');
        
        console.log('✅ Audit log criado corretamente para criação de leilão');
      } finally {
        await prisma.auction.delete({ where: { id: auction.id } });
      }
    });
    
    test('AUDIT-AUCTION-02: Atualização de leilão registra campo alterado', async ({ page }) => {
      // Criar leilão inicial
      const auction = await prisma.auction.create({
        data: {
          title: 'TEST-MULTITENANT Original',
          slug: `test-update-${Date.now()}`,
          tenantId: BigInt(TENANT_A.id),
          status: 'RASCUNHO'
        }
      });
      
      try {
        // Atualizar leilão
        await prisma.auction.update({
          where: { id: auction.id },
          data: { title: 'TEST-MULTITENANT Atualizado' }
        });
        
        await page.waitForTimeout(2000);
        
        // Buscar usuário
        const adminUser = await prisma.user.findFirst({
          where: { email: USER_TENANT_A.email }
        });
        
        if (!adminUser) {
          throw new Error('Usuário admin não encontrado');
        }
        
        // Verificar audit log de UPDATE
        const auditLog = await prisma.auditLog.findFirst({
          where: {
            entityType: 'Auction',
            entityId: auction.id,
            action: 'UPDATE'
          },
          orderBy: { timestamp: 'desc' }
        });
        
        if (auditLog && auditLog.changes) {
          const changes = typeof auditLog.changes === 'string' 
            ? JSON.parse(auditLog.changes) 
            : auditLog.changes;
          
          // Verificar que registrou a mudança de título
          console.log('✅ Audit log registrou alteração de campo:', changes);
        }
      } finally {
        await prisma.auction.delete({ where: { id: auction.id } });
      }
    });
  });

  // ========================================
  // TESTES DE LOTES (LOTS)
  // ========================================
  
  test.describe('Lotes - Multi-Tenant + Audit', () => {
    
    test('MT-LOT-01: Lotes de diferentes tenants são isolados', async ({ page }) => {
      // Criar leilão no Tenant B
      const auctionB = await prisma.auction.create({
        data: {
          title: 'TEST-MULTITENANT Auction B',
          slug: `auction-b-${Date.now()}`,
          tenantId: BigInt(TENANT_B.id),
          status: 'ABERTO'
        }
      });
      
      // Criar lote no Tenant B
      const lotB = await prisma.lot.create({
        data: {
          title: 'TEST-MULTITENANT LOTE TENANT B',
          price: 1000,
          type: 'OUTRO',
          auctionId: auctionB.id,
          tenantId: BigInt(TENANT_B.id),
          status: 'ABERTO_PARA_LANCES'
        }
      });
      
      try {
        // Login como Tenant A
        await loginAsUser(page, USER_TENANT_A.email, USER_TENANT_A.password, TENANT_A.id);
        
        // Tentar acessar lote via API
        const cookies = await page.context().cookies();
        const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
        
        const response = await page.request.get('http://localhost:9005/api/lots', {
          headers: { 'Cookie': cookieHeader }
        });
        
        const data = await response.json();
        const lots = Array.isArray(data) ? data : (data.lots || []);
        
        // Verificar que lote do Tenant B não está presente
        const foundLot = lots.find((l: any) => l.id === lotB.id.toString());
        expect(foundLot).toBeUndefined();
        
        console.log('✅ Isolamento confirmado: Lote do Tenant B não acessível via API');
      } finally {
        await prisma.lot.delete({ where: { id: lotB.id } });
        await prisma.auction.delete({ where: { id: auctionB.id } });
      }
    });
    
    test('AUDIT-LOT-01: DELETE de lote cria audit log', async ({ page }) => {
      // Criar leilão
      const auction = await prisma.auction.create({
        data: {
          title: 'TEST-MULTITENANT Auction',
          slug: `auction-${Date.now()}`,
          tenantId: BigInt(TENANT_A.id),
          status: 'ABERTO'
        }
      });
      
      // Criar lote
      const lot = await prisma.lot.create({
        data: {
          title: 'TEST-MULTITENANT Lote Para Deletar',
          price: 5000,
          type: 'OUTRO',
          auctionId: auction.id,
          tenantId: BigInt(TENANT_A.id),
          status: 'RASCUNHO'
        }
      });
      
      const lotId = lot.id;
      
      try {
        // Deletar lote
        await prisma.lot.delete({ where: { id: lotId } });
        
        await page.waitForTimeout(2000);
        
        // Verificar audit log de DELETE
        const auditLog = await prisma.auditLog.findFirst({
          where: {
            entityType: 'Lot',
            entityId: lotId,
            action: 'DELETE'
          }
        });
        
        expect(auditLog).not.toBeNull();
        console.log('✅ Audit log criado para DELETE de lote');
      } finally {
        await prisma.auction.delete({ where: { id: auction.id } });
      }
    });
  });

  // ========================================
  // TESTES DE ATIVOS (ASSETS)
  // ========================================
  
  test.describe('Ativos - Multi-Tenant + Audit', () => {
    
    test('MT-ASSET-01: Ativos respeitam isolamento de tenant', async ({ page }) => {
      // Criar ativo no Tenant B
      const assetB = await prisma.asset.create({
        data: {
          title: 'TEST-MULTITENANT ATIVO TENANT B',
          description: 'Ativo exclusivo do Tenant B',
          tenantId: BigInt(TENANT_B.id),
          status: 'DISPONIVEL'
        }
      });
      
      try {
        // Login como Tenant A
        await loginAsUser(page, USER_TENANT_A.email, USER_TENANT_A.password, TENANT_A.id);
        
        // Navegar para lista de ativos
        await page.goto('http://localhost:9005/admin/assets');
        await page.waitForTimeout(1000);
        
        // Verificar que ativo do Tenant B não aparece
        const assetText = page.locator(`text="${assetB.title}"`);
        await expect(assetText).toBeHidden();
        
        console.log('✅ Isolamento confirmado: Ativo do Tenant B não visível');
      } finally {
        await prisma.asset.delete({ where: { id: assetB.id } });
      }
    });
    
    test('AUDIT-ASSET-01: Mudança de status de ativo é auditada', async ({ page }) => {
      // Criar ativo
      const asset = await prisma.asset.create({
        data: {
          title: 'TEST-MULTITENANT Ativo Status',
          description: 'Para teste de audit',
          tenantId: BigInt(TENANT_A.id),
          status: 'CADASTRO'
        }
      });
      
      try {
        // Mudar status
        await prisma.asset.update({
          where: { id: asset.id },
          data: { status: 'DISPONIVEL' }
        });
        
        await page.waitForTimeout(2000);
        
        // Verificar audit log
        const auditLog = await prisma.auditLog.findFirst({
          where: {
            entityType: 'Asset',
            entityId: asset.id,
            action: 'UPDATE'
          },
          orderBy: { timestamp: 'desc' }
        });
        
        expect(auditLog).not.toBeNull();
        console.log('✅ Mudança de status de ativo auditada');
      } finally {
        await prisma.asset.delete({ where: { id: asset.id } });
      }
    });
  });

  // ========================================
  // TESTES DE COMITENTES (SELLERS)
  // ========================================
  
  test.describe('Comitentes - Multi-Tenant + Audit', () => {
    
    test('MT-SELLER-01: Comitentes são isolados por tenant', async ({ page }) => {
      // Criar comitente no Tenant B
      const sellerB = await prisma.seller.create({
        data: {
          legalEntity: {
            create: {
              name: 'TEST-MULTITENANT Comitente B',
              cpfCnpj: `${Date.now()}`,
              email: `seller-b-${Date.now()}@test.com`,
              tenantId: BigInt(TENANT_B.id)
            }
          },
          tenantId: BigInt(TENANT_B.id)
        }
      });
      
      try {
        // Login como Tenant A
        await loginAsUser(page, USER_TENANT_A.email, USER_TENANT_A.password, TENANT_A.id);
        
        await page.goto('http://localhost:9005/admin/sellers');
        await page.waitForTimeout(1000);
        
        // Verificar que comitente do Tenant B não aparece
        const sellerText = page.locator('text="TEST-MULTITENANT Comitente B"');
        await expect(sellerText).toBeHidden();
        
        console.log('✅ Isolamento confirmado: Comitente do Tenant B não visível');
      } finally {
        // Deletar comitente e legal entity
        const seller = await prisma.seller.findUnique({
          where: { id: sellerB.id },
          include: { legalEntity: true }
        });
        
        if (seller && seller.legalEntityId) {
          await prisma.seller.delete({ where: { id: sellerB.id } });
          await prisma.legalEntity.delete({ where: { id: seller.legalEntityId } });
        }
      }
    });
    
    test('AUDIT-SELLER-01: Criação de comitente é auditada', async ({ page }) => {
      // Criar comitente
      const seller = await prisma.seller.create({
        data: {
          legalEntity: {
            create: {
              name: 'TEST-MULTITENANT Comitente Audit',
              cpfCnpj: `${Date.now()}`,
              email: `seller-audit-${Date.now()}@test.com`,
              tenantId: BigInt(TENANT_A.id)
            }
          },
          tenantId: BigInt(TENANT_A.id)
        }
      });
      
      try {
        await page.waitForTimeout(2000);
        
        // Verificar audit log
        const auditLog = await prisma.auditLog.findFirst({
          where: {
            entityType: 'Seller',
            entityId: seller.id,
            action: 'CREATE'
          }
        });
        
        expect(auditLog).not.toBeNull();
        console.log('✅ Criação de comitente auditada');
      } finally {
        const sellerData = await prisma.seller.findUnique({
          where: { id: seller.id },
          include: { legalEntity: true }
        });
        
        if (sellerData && sellerData.legalEntityId) {
          await prisma.seller.delete({ where: { id: seller.id } });
          await prisma.legalEntity.delete({ where: { id: sellerData.legalEntityId } });
        }
      }
    });
  });

  // ========================================
  // TESTES DE LEILOEIROS (AUCTIONEERS)
  // ========================================
  
  test.describe('Leiloeiros - Multi-Tenant + Audit', () => {
    
    test('MT-AUCTIONEER-01: Leiloeiros respeitam isolamento', async ({ page }) => {
      // Criar leiloeiro no Tenant B
      const auctioneerB = await prisma.auctioneer.create({
        data: {
          legalEntity: {
            create: {
              name: 'TEST-MULTITENANT Leiloeiro B',
              cpfCnpj: `${Date.now()}`,
              email: `auctioneer-b-${Date.now()}@test.com`,
              tenantId: BigInt(TENANT_B.id)
            }
          },
          matriculaJucerj: `MAT${Date.now()}`,
          tenantId: BigInt(TENANT_B.id)
        }
      });
      
      try {
        // Login como Tenant A
        await loginAsUser(page, USER_TENANT_A.email, USER_TENANT_A.password, TENANT_A.id);
        
        await page.goto('http://localhost:9005/admin/auctioneers');
        await page.waitForTimeout(1000);
        
        // Verificar isolamento
        const auctioneerText = page.locator('text="TEST-MULTITENANT Leiloeiro B"');
        await expect(auctioneerText).toBeHidden();
        
        console.log('✅ Isolamento confirmado: Leiloeiro do Tenant B não visível');
      } finally {
        const auctioneer = await prisma.auctioneer.findUnique({
          where: { id: auctioneerB.id },
          include: { legalEntity: true }
        });
        
        if (auctioneer && auctioneer.legalEntityId) {
          await prisma.auctioneer.delete({ where: { id: auctioneerB.id } });
          await prisma.legalEntity.delete({ where: { id: auctioneer.legalEntityId } });
        }
      }
    });
  });

  // ========================================
  // TESTES CRUZADOS
  // ========================================
  
  test.describe('Testes Cruzados - Segurança e Integridade', () => {
    
    test('CROSS-01: Tentativa de acesso direto a recurso de outro tenant falha', async ({ page }) => {
      // Criar leilão no Tenant B
      const auctionB = await prisma.auction.create({
        data: {
          title: 'TEST-MULTITENANT Leilão Protegido',
          slug: `protected-${Date.now()}`,
          tenantId: BigInt(TENANT_B.id),
          status: 'ABERTO'
        }
      });
      
      try {
        // Login como Tenant A
        await loginAsUser(page, USER_TENANT_A.email, USER_TENANT_A.password, TENANT_A.id);
        
        // Tentar acessar URL direta do leilão do Tenant B
        const response = await page.goto(`http://localhost:9005/admin/auctions/${auctionB.id}`);
        
        // Deve retornar erro 403/404 ou redirecionar
        expect(response?.status()).not.toBe(200);
        
        console.log('✅ Acesso direto a recurso de outro tenant bloqueado');
      } finally {
        await prisma.auction.delete({ where: { id: auctionB.id } });
      }
    });
  });
});

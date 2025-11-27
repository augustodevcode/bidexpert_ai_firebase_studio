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

// Configuração de tenants para teste (Baseado no Seed V4)
const TENANT_A = {
  id: 1, // Principal
  name: 'BidExpert Tenant Principal'
};

const TENANT_B = {
  id: 2, // Secundário (criado no seed atualizado)
  name: 'BidExpert Tenant Secundário'
};

// Usuários de teste (Baseado no Seed V4)
const USER_TENANT_A = {
  email: 'admin@bidexpert.com', // Admin do Tenant A
  password: 'Test@12345',
  tenantId: TENANT_A.id
};

const USER_TENANT_B = {
  email: 'user@tenant-b.com', // Usuário do Tenant B
  password: 'Test@12345',
  tenantId: TENANT_B.id
};

test.describe('Isolamento Multi-Tenant', () => {
  
  test.beforeAll(async () => {
    // Verificar se os tenants existem (criados pelo seed)
    const tA = await prisma.tenant.findUnique({ where: { id: BigInt(TENANT_A.id) } });
    const tB = await prisma.tenant.findUnique({ where: { id: BigInt(TENANT_B.id) } });

    if (!tA || !tB) {
      console.warn('⚠️ Tenants de teste não encontrados. O teste pode falhar se o seed não foi atualizado.');
    } else {
      console.log('✅ Tenants verificados');
    }
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test('Usuário do Tenant A vê apenas leilões do Tenant A', async ({ page }) => {
    // Login como usuário do Tenant A
    await page.goto('http://localhost:9005/auth/login');
    await page.fill('[data-ai-id="auth-login-email-input"]', USER_TENANT_A.email);
    await page.fill('[data-ai-id="auth-login-password-input"]', USER_TENANT_A.password);
    
    // Selecionar Tenant se o dropdown aparecer
    try {
        const dropdown = page.locator('[data-ai-id="auth-login-tenant-select"]');
        if (await dropdown.isVisible({ timeout: 2000 })) {
             await dropdown.selectOption(String(TENANT_A.id));
        }
    } catch (e) {
        // Dropdown pode não aparecer se o usuário só tiver um tenant ou auto-seleção
    }

    await page.click('[data-ai-id="auth-login-submit-button"]');
    
    // Aguardar redirect após login
    await page.waitForURL('**/dashboard');
    
    // Navegar para lista de leilões
    await page.goto('http://localhost:9005/admin/auctions');
    
    // Criar um leilão específico no Tenant B para garantir
    const auctionB = await prisma.auction.create({
        data: {
            title: 'LEILÃO EXCLUSIVO TENANT B',
            slug: `leilao-tenant-b-${Date.now()}`,
            tenantId: BigInt(TENANT_B.id),
            status: 'ABERTO'
        }
    });

    try {
        await page.reload();
        await expect(page.getByText('LEILÃO EXCLUSIVO TENANT B')).toBeHidden();
    } finally {
        // Limpar
        await prisma.auction.delete({ where: { id: auctionB.id } });
    }
  });

  test('Busca de lotes via API retorna apenas lotes do tenant atual', async ({ page, request }) => {
    // Login primeiro para pegar o cookie
    await page.goto('http://localhost:9005/auth/login');
    await page.fill('[data-ai-id="auth-login-email-input"]', USER_TENANT_A.email);
    await page.fill('[data-ai-id="auth-login-password-input"]', USER_TENANT_A.password);
    try {
        const dropdown = page.locator('[data-ai-id="auth-login-tenant-select"]');
        if (await dropdown.isVisible({ timeout: 2000 })) {
             await dropdown.selectOption(String(TENANT_A.id));
        }
    } catch (e) {}
    await page.click('[data-ai-id="auth-login-submit-button"]');
    await page.waitForURL('**/dashboard');

    // Criar lote no Tenant B
    const auctionB = await prisma.auction.create({
        data: {
            title: 'Leilão B API Test',
            slug: `leilao-b-api-${Date.now()}`,
            tenantId: BigInt(TENANT_B.id),
            status: 'ABERTO'
        }
    });
    const lotB = await prisma.lot.create({
        data: {
            title: 'LOTE TENANT B SECRETO',
            price: 1000,
            type: 'OUTRO',
            auctionId: auctionB.id,
            tenantId: BigInt(TENANT_B.id),
            status: 'ABERTO_PARA_LANCES'
        }
    });

    try {
        // Fazer requisição API direta para buscar lotes
        const response = await request.get('http://localhost:9005/api/lots', {
            headers: {
                'Cookie': (await page.context().cookies()).map(c => `${c.name}=${c.value}`).join('; ')
            }
        });
        
        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        const lots = data.lots || data; // Ajustar conforme estrutura de retorno

        if (Array.isArray(lots)) {
            const found = lots.find((l: any) => l.title === 'LOTE TENANT B SECRETO');
            expect(found).toBeUndefined();
        }
    } finally {
        // Limpar
        await prisma.lot.delete({ where: { id: lotB.id } });
        await prisma.auction.delete({ where: { id: auctionB.id } });
    }
  });

});

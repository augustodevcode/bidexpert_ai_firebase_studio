// tests/multi-tenant.test.ts
import { describe, test, beforeAll, afterAll, expect } from 'vitest';
import assert from 'node:assert';
import { prisma } from '@/lib/prisma';
import { tenantContext } from '@/lib/prisma';
import { AuctionService } from '@/services/auction.service';
import type { Tenant } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { NextRequest } from 'next/server';
import { POST as createTenantApi } from '@/app/api/v1/tenant/create/route';
import { CreateTenantInput } from '@/app/api/v1/tenant/create/schema';

const auctionService = new AuctionService();
const testRunId = `tenant-e2e-${uuidv4().substring(0, 8)}`;

let tenant1: Tenant;
let tenant2: Tenant;
let auctioneer: any;
let seller: any;
let category: any;

// Helper para executar código dentro de um contexto de tenant
async function runInTenant<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
  return tenantContext.run({ tenantId }, fn);
}

// Helper para simular uma chamada de API
async function mockApiRequest(body: any, apiKey?: string) {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    if (apiKey) {
        headers.set('Authorization', `Bearer ${apiKey}`);
    }
    const request = new NextRequest('http://localhost/api/v1/tenant/create', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });
    return createTenantApi(request);
}

describe(`[E2E] Multi-Tenant Architecture Validation (ID: ${testRunId})`, () => {

  beforeAll(async () => {
    // Configura a API Key para o ambiente de teste
    process.env.TENANT_API_KEY = `test-api-key-${testRunId}`;
    
    await prisma.auction.deleteMany({ where: { title: { contains: testRunId } } });
    await prisma.tenant.deleteMany({ where: { name: { contains: testRunId } } });
    await prisma.seller.deleteMany({ where: { name: { contains: testRunId } } });
    await prisma.auctioneer.deleteMany({ where: { name: { contains: testRunId } } });
    await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.lotCategory.deleteMany({ where: { name: { contains: testRunId } } });

    [tenant1, tenant2] = await prisma.$transaction([
      prisma.tenant.create({ data: { name: `Leiloeiro X ${testRunId}`, subdomain: `leiloeiro-x-${testRunId}` } }),
      prisma.tenant.create({ data: { name: `Leiloeiro Y ${testRunId}`, subdomain: `leiloeiro-y-${testRunId}` } })
    ]);

    auctioneer = await runInTenant(tenant1.id, () => 
        prisma.auctioneer.create({ data: { name: `Leiloeiro Teste Tenant ${testRunId}`, publicId: `pub-auct-${testRunId}`, slug: `leiloeiro-tenant-${testRunId}`, tenantId: tenant1.id } })
    );
    seller = await runInTenant(tenant1.id, () => 
        prisma.seller.create({ data: { name: `Comitente Teste Tenant ${testRunId}`, publicId: `pub-sel-${testRunId}`, slug: `comitente-tenant-${testRunId}`, isJudicial: false, tenantId: tenant1.id } })
    );
    category = await prisma.lotCategory.create({ data: { name: `Categoria Teste ${testRunId}`, slug: `categoria-teste-${testRunId}`, hasSubcategories: false } });

    assert.ok(tenant1, 'Tenant 1 should be created');
    assert.ok(tenant2, 'Tenant 2 should be created');
  });

  afterAll(async () => {
    await prisma.auction.deleteMany({ where: { title: { contains: testRunId } } });
    await prisma.usersOnRoles.deleteMany({ where: { user: { email: { contains: testRunId } } } });
    await prisma.usersOnTenants.deleteMany({ where: { user: { email: { contains: testRunId } } } });
    await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.seller.deleteMany({ where: { name: { contains: testRunId } } });
    await prisma.auctioneer.deleteMany({ where: { name: { contains: testRunId } } });
    await prisma.tenant.deleteMany({ where: { name: { contains: testRunId } } });
    await prisma.$disconnect();
    console.log(`[Multi-Tenant Test] Teardown complete.`);
  });

  test('should create data for Tenant 1 and not be visible to Tenant 2', async () => {
    const auctionTitle = `Leilão do Leiloeiro X ${testRunId}`;
    const createResult = await runInTenant(tenant1.id, () => 
      auctionService.createAuction(tenant1.id, {
        title: auctionTitle,
        auctioneerId: auctioneer.id,
        sellerId: seller.id,
        categoryId: category.id,
        status: 'ABERTO_PARA_LANCES',
        auctionDate: new Date(),
        auctionType: 'EXTRAJUDICIAL',
        auctionStages: [{ name: '1ª Praça', startDate: new Date(), endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5)}],
      } as any)
    );

    assert.ok(createResult.success, `Failed to create auction for Tenant 1: ${createResult.message}`);
    assert.ok(createResult.auctionId, 'createAuction should return an auctionId');

    const auctionsForTenant1 = await runInTenant(tenant1.id, () => auctionService.getAuctions(tenant1.id));
    assert.ok(auctionsForTenant1.some(a => a.id === createResult.auctionId), 'Newly created auction should be in the list for Tenant 1');

    const auctionsForTenant2 = await runInTenant(tenant2.id, () => auctionService.getAuctions(tenant2.id));
    assert.strictEqual(auctionsForTenant2.length, 0, 'getAuctions for Tenant 2 should return an empty array');
  });
  
  test('should prevent direct access to data from another tenant', async () => {
     const auctionTitle = `Leilão do Leiloeiro Y ${testRunId}`;
     const createResult = await runInTenant(tenant2.id, () => 
      auctionService.createAuction(tenant2.id, {
        title: auctionTitle,
        auctioneerId: auctioneer.id,
        sellerId: seller.id,
        categoryId: category.id,
        status: 'ABERTO_PARA_LANCES',
        auctionDate: new Date(),
        auctionType: 'EXTRAJUDICIAL',
        auctionStages: [{ name: '1ª Praça', startDate: new Date(), endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5)}],
      } as any)
    );
     assert.ok(createResult.success && createResult.auctionId, 'Failed to create auction for Tenant 2');
     const auctionIdFromTenant2 = createResult.auctionId;

    const fetchedAuction = await runInTenant(tenant1.id, () => auctionService.getAuctionById(tenant1.id, auctionIdFromTenant2));
    assert.strictEqual(fetchedAuction, null, 'Should not be able to fetch an auction from another tenant by its ID');
  });

  describe('Tenant Creation API Endpoint (/api/v1/tenant/create)', () => {
    
    it('should return 401 Unauthorized if API key is missing or invalid', async () => {
        const body: CreateTenantInput = { name: 'Unauthorized Tenant', subdomain: 'unauthorized', adminUser: { email: `unauth-${testRunId}@test.com`, fullName: 'Test' } };
        
        // Test with no API key
        const responseNoKey = await mockApiRequest(body);
        assert.strictEqual(responseNoKey.status, 401, 'Request without API key should be unauthorized');

        // Test with invalid API key
        const responseInvalidKey = await mockApiRequest(body, 'invalid-key');
        assert.strictEqual(responseInvalidKey.status, 401, 'Request with invalid API key should be unauthorized');
    });

    it('should return 400 Bad Request if data is invalid', async () => {
        const body = { name: 'Bad Data' }; // Missing subdomain and adminUser
        const response = await mockApiRequest(body, process.env.TENANT_API_KEY);
        assert.strictEqual(response.status, 400, 'Request with invalid data should be a bad request');
        const json = await response.json();
        assert.ok(json.errors, 'Response should contain validation errors');
    });

    it('should successfully create a new tenant and admin user via API call', async () => {
        const subdomain = `api-tenant-${testRunId}`;
        const adminEmail = `admin-${subdomain}@test.com`;
        const body: CreateTenantInput = {
            name: `API Tenant ${testRunId}`,
            subdomain: subdomain,
            adminUser: {
                email: adminEmail,
                fullName: 'Admin via API'
            }
        };

        const response = await mockApiRequest(body, process.env.TENANT_API_KEY);
        const json = await response.json();

        assert.strictEqual(response.status, 201, 'Successful request should return 201 Created');
        assert.ok(json.success, 'Success should be true');
        assert.ok(json.tenant, 'Response should include tenant info');
        assert.ok(json.user, 'Response should include user info');
        assert.strictEqual(json.tenant.subdomain, subdomain, 'Created tenant subdomain should match');

        // Verify in database
        const newTenant = await prisma.tenant.findUnique({ where: { subdomain } });
        assert.ok(newTenant, 'Tenant should exist in the database');
        
        const newUser = await prisma.user.findUnique({ 
            where: { email: adminEmail },
            include: { tenants: true, roles: { include: { role: true } } }
        });
        assert.ok(newUser, 'Admin user for tenant should exist');
        assert.ok(newUser.tenants.some(t => t.tenantId === newTenant!.id), 'User should be linked to the new tenant');
        assert.ok(newUser.roles.some(r => r.role.nameNormalized === 'TENANT_ADMIN'), 'User should have the TENANT_ADMIN role');
    });

    it('should return 409 Conflict if subdomain already exists', async () => {
        const body: CreateTenantInput = { name: 'Duplicate Tenant', subdomain: tenant1.subdomain, adminUser: { email: `duplicate-${testRunId}@test.com`, fullName: 'Duplicate Admin' } };
        const response = await mockApiRequest(body, process.env.TENANT_API_KEY);
        assert.strictEqual(response.status, 409, 'Request with duplicate subdomain should be a conflict');
        const json = await response.json();
        assert.strictEqual(json.success, false);
        assert.match(json.message, /subdomínio '.+' já está em uso/);
    });

  });
});

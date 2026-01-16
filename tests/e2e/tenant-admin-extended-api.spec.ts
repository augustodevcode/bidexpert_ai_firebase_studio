/**
 * @fileoverview Testes E2E para APIs administrativas adicionais.
 * 
 * Testa os endpoints solicitados pelo BidExpertCRM:
 * - Listar todos os tenants
 * - Suspender/Reativar tenant
 * - Dashboard de métricas
 * - Gerenciar usuários
 * - Logs de auditoria
 * - Histórico financeiro
 */
import { test, expect } from '@playwright/test';

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'test-admin-api-key-32chars-minimum';
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

const authHeaders = {
  'Authorization': `Bearer ${ADMIN_API_KEY}`,
  'Content-Type': 'application/json',
};

// Helper para criar tenant de teste
const generateUniqueSubdomain = () => `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;

test.describe('Admin API - Listar Tenants', () => {
  test('GET /api/v1/admin/tenants - deve listar tenants com paginação', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/admin/tenants`, {
      headers: authHeaders,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    
    expect(body.success).toBe(true);
    expect(body.data.tenants).toBeDefined();
    expect(Array.isArray(body.data.tenants)).toBe(true);
    expect(body.data.pagination).toBeDefined();
    expect(body.data.pagination.page).toBe(1);
    expect(body.data.pagination.total).toBeGreaterThanOrEqual(0);
  });

  test('GET /api/v1/admin/tenants - deve suportar filtros', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/admin/tenants?status=ACTIVE&limit=5`, {
      headers: authHeaders,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    
    expect(body.success).toBe(true);
    expect(body.data.pagination.limit).toBe(5);
    
    // Todos os tenants retornados devem ter status ACTIVE
    body.data.tenants.forEach((tenant: any) => {
      expect(tenant.status).toBe('ACTIVE');
    });
  });

  test('GET /api/v1/admin/tenants - deve suportar busca', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/admin/tenants?search=test`, {
      headers: authHeaders,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('GET /api/v1/admin/tenants - deve rejeitar sem API Key', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/admin/tenants`);
    expect(response.status()).toBe(401);
  });
});

test.describe('Admin API - Suspender/Reativar Tenant', () => {
  let testTenantId: string;
  let testSubdomain: string;

  test.beforeAll(async ({ request }) => {
    // Criar tenant de teste
    testSubdomain = generateUniqueSubdomain();
    const createResponse = await request.post(`${BASE_URL}/api/v1/admin/tenant/provision`, {
      headers: authHeaders,
      data: {
        name: 'Tenant Suspend Test',
        subdomain: testSubdomain,
        status: 'ACTIVE',
        adminUser: {
          email: `admin-${testSubdomain}@test.com`,
          fullName: 'Admin Test',
          password: 'TestPassword123!',
          cpf: '11122233344',
          phone: '11999999999',
        },
      },
    });
    
    if (createResponse.status() === 201) {
      const body = await createResponse.json();
      testTenantId = body.data.tenant.id;
    }
  });

  test('POST /api/v1/admin/tenant/{id}/suspend - deve suspender tenant', async ({ request }) => {
    test.skip(!testTenantId, 'Tenant de teste não foi criado');

    const response = await request.post(`${BASE_URL}/api/v1/admin/tenant/${testTenantId}/suspend`, {
      headers: authHeaders,
      data: {
        reason: 'Teste de suspensão - inadimplência simulada',
        notifyAdmin: false,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    
    expect(body.success).toBe(true);
    expect(body.data.tenant.status).toBe('SUSPENDED');
    expect(body.data.tenant.suspendedReason).toBeDefined();
  });

  test('POST /api/v1/admin/tenant/{id}/suspend - deve rejeitar tenant já suspenso', async ({ request }) => {
    test.skip(!testTenantId, 'Tenant de teste não foi criado');

    const response = await request.post(`${BASE_URL}/api/v1/admin/tenant/${testTenantId}/suspend`, {
      headers: authHeaders,
      data: {
        reason: 'Tentativa de suspensão duplicada',
      },
    });

    expect(response.status()).toBe(409);
  });

  test('POST /api/v1/admin/tenant/{id}/reactivate - deve reativar tenant', async ({ request }) => {
    test.skip(!testTenantId, 'Tenant de teste não foi criado');

    const response = await request.post(`${BASE_URL}/api/v1/admin/tenant/${testTenantId}/reactivate`, {
      headers: authHeaders,
      data: {
        reason: 'Pagamento regularizado',
        newStatus: 'ACTIVE',
        notifyAdmin: false,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    
    expect(body.success).toBe(true);
    expect(body.data.tenant.status).toBe('ACTIVE');
  });

  test('POST /api/v1/admin/tenant/{id}/reactivate - com extensão de trial', async ({ request }) => {
    test.skip(!testTenantId, 'Tenant de teste não foi criado');

    // Primeiro suspender novamente
    await request.post(`${BASE_URL}/api/v1/admin/tenant/${testTenantId}/suspend`, {
      headers: authHeaders,
      data: { reason: 'Suspensão para teste de trial' },
    });

    // Reativar como TRIAL com extensão
    const response = await request.post(`${BASE_URL}/api/v1/admin/tenant/${testTenantId}/reactivate`, {
      headers: authHeaders,
      data: {
        newStatus: 'TRIAL',
        extendTrialDays: 14,
        notifyAdmin: false,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    
    expect(body.success).toBe(true);
    expect(body.data.tenant.status).toBe('TRIAL');
    expect(body.data.tenant.trialExpiresAt).toBeDefined();
  });

  test('POST /api/v1/admin/tenant/{id}/suspend - deve rejeitar tenant principal', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/v1/admin/tenant/1/suspend`, {
      headers: authHeaders,
      data: {
        reason: 'Tentativa de suspensão do landlord',
      },
    });

    expect(response.status()).toBe(403);
  });
});

test.describe('Admin API - Dashboard de Métricas', () => {
  test('GET /api/v1/admin/stats - deve retornar métricas agregadas', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/admin/stats`, {
      headers: authHeaders,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    
    expect(body.success).toBe(true);
    
    // Verificar estrutura de tenants
    expect(body.data.tenants).toBeDefined();
    expect(body.data.tenants.total).toBeGreaterThanOrEqual(0);
    expect(body.data.tenants.active).toBeGreaterThanOrEqual(0);
    expect(body.data.tenants.trial).toBeGreaterThanOrEqual(0);
    
    // Verificar estrutura de leilões
    expect(body.data.auctions).toBeDefined();
    expect(body.data.auctions.total).toBeGreaterThanOrEqual(0);
    
    // Verificar estrutura de lotes
    expect(body.data.lots).toBeDefined();
    expect(body.data.lots.total).toBeGreaterThanOrEqual(0);
    
    // Verificar estrutura de usuários
    expect(body.data.users).toBeDefined();
    expect(body.data.users.total).toBeGreaterThanOrEqual(0);
    
    // Verificar estrutura financeira
    expect(body.data.financial).toBeDefined();
    expect(body.data.financial.totalVolume).toBeGreaterThanOrEqual(0);
    expect(body.data.financial.currency).toBe('BRL');
    
    // Verificar top tenants
    expect(body.data.topTenants).toBeDefined();
    expect(Array.isArray(body.data.topTenants)).toBe(true);
    
    // Verificar metadata
    expect(body.data.generatedAt).toBeDefined();
  });

  test('GET /api/v1/admin/stats - deve rejeitar sem API Key', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/admin/stats`);
    expect(response.status()).toBe(401);
  });
});

test.describe('Admin API - Gerenciar Usuários do Tenant', () => {
  let testTenantId: string;

  test.beforeAll(async ({ request }) => {
    // Criar tenant de teste
    const subdomain = generateUniqueSubdomain();
    const createResponse = await request.post(`${BASE_URL}/api/v1/admin/tenant/provision`, {
      headers: authHeaders,
      data: {
        name: 'Tenant Users Test',
        subdomain,
        adminUser: {
          email: `admin-users-${subdomain}@test.com`,
          fullName: 'Admin Users Test',
          password: 'TestPassword123!',
          cpf: '22233344455',
          phone: '11988888888',
        },
      },
    });
    
    if (createResponse.status() === 201) {
      const body = await createResponse.json();
      testTenantId = body.data.tenant.id;
    }
  });

  test('GET /api/v1/admin/tenant/{id}/users - deve listar usuários', async ({ request }) => {
    test.skip(!testTenantId, 'Tenant de teste não foi criado');

    const response = await request.get(`${BASE_URL}/api/v1/admin/tenant/${testTenantId}/users`, {
      headers: authHeaders,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    
    expect(body.success).toBe(true);
    expect(body.data.tenant).toBeDefined();
    expect(body.data.users).toBeDefined();
    expect(Array.isArray(body.data.users)).toBe(true);
    expect(body.data.users.length).toBeGreaterThan(0); // Pelo menos o admin
    expect(body.data.pagination).toBeDefined();
  });

  test('GET /api/v1/admin/tenant/{id}/users - deve filtrar por role', async ({ request }) => {
    test.skip(!testTenantId, 'Tenant de teste não foi criado');

    const response = await request.get(`${BASE_URL}/api/v1/admin/tenant/${testTenantId}/users?role=ADMIN`, {
      headers: authHeaders,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    
    expect(body.success).toBe(true);
    // Usuários retornados devem ter role ADMIN
    body.data.users.forEach((user: any) => {
      expect(user.roles).toContain('ADMIN');
    });
  });

  test('GET /api/v1/admin/tenant/{id}/users - tenant inexistente', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/admin/tenant/999999/users`, {
      headers: authHeaders,
    });

    expect(response.status()).toBe(404);
  });
});

test.describe('Admin API - Reset de Senha', () => {
  let testTenantId: string;
  let testUserId: string;

  test.beforeAll(async ({ request }) => {
    // Criar tenant de teste
    const subdomain = generateUniqueSubdomain();
    const createResponse = await request.post(`${BASE_URL}/api/v1/admin/tenant/provision`, {
      headers: authHeaders,
      data: {
        name: 'Tenant Reset Password Test',
        subdomain,
        adminUser: {
          email: `admin-reset-${subdomain}@test.com`,
          fullName: 'Admin Reset Test',
          password: 'TestPassword123!',
          cpf: '33344455566',
          phone: '11977777777',
        },
      },
    });
    
    if (createResponse.status() === 201) {
      const body = await createResponse.json();
      testTenantId = body.data.tenant.id;
      testUserId = body.data.adminUser.id;
    }
  });

  test('POST /api/v1/admin/tenant/{id}/reset-password - deve resetar senha', async ({ request }) => {
    test.skip(!testTenantId || !testUserId, 'Tenant ou usuário de teste não foi criado');

    const response = await request.post(`${BASE_URL}/api/v1/admin/tenant/${testTenantId}/reset-password`, {
      headers: authHeaders,
      data: {
        userId: testUserId,
        generateRandom: true,
        sendEmail: false,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    
    expect(body.success).toBe(true);
    expect(body.data.user).toBeDefined();
    expect(body.data.temporaryPassword).toBeDefined();
    expect(body.data.temporaryPassword.length).toBeGreaterThanOrEqual(8);
  });

  test('POST /api/v1/admin/tenant/{id}/reset-password - com senha específica', async ({ request }) => {
    test.skip(!testTenantId || !testUserId, 'Tenant ou usuário de teste não foi criado');

    const newPassword = 'NewSecurePassword123!';
    
    const response = await request.post(`${BASE_URL}/api/v1/admin/tenant/${testTenantId}/reset-password`, {
      headers: authHeaders,
      data: {
        userId: testUserId,
        generateRandom: false,
        newPassword,
        sendEmail: false,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    
    expect(body.success).toBe(true);
    // Não deve retornar senha quando não é gerada aleatoriamente
    expect(body.data.temporaryPassword).toBeUndefined();
  });

  test('POST /api/v1/admin/tenant/{id}/reset-password - usuário não pertence ao tenant', async ({ request }) => {
    test.skip(!testTenantId, 'Tenant de teste não foi criado');

    const response = await request.post(`${BASE_URL}/api/v1/admin/tenant/${testTenantId}/reset-password`, {
      headers: authHeaders,
      data: {
        userId: '999999',
        generateRandom: true,
      },
    });

    expect(response.status()).toBe(404);
  });
});

test.describe('Admin API - Logs de Auditoria', () => {
  test('GET /api/v1/admin/tenant/{id}/audit-logs - deve retornar logs', async ({ request }) => {
    // Usar tenant 1 (landlord) que provavelmente tem logs
    const response = await request.get(`${BASE_URL}/api/v1/admin/tenant/1/audit-logs`, {
      headers: authHeaders,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    
    expect(body.success).toBe(true);
    expect(body.data.tenant).toBeDefined();
    expect(body.data.logs).toBeDefined();
    expect(Array.isArray(body.data.logs)).toBe(true);
    expect(body.data.stats).toBeDefined();
    expect(body.data.pagination).toBeDefined();
  });

  test('GET /api/v1/admin/tenant/{id}/audit-logs - deve filtrar por action', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/admin/tenant/1/audit-logs?action=CREATE`, {
      headers: authHeaders,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    
    expect(body.success).toBe(true);
    // Logs retornados devem ter action CREATE
    body.data.logs.forEach((log: any) => {
      expect(log.action).toBe('CREATE');
    });
  });

  test('GET /api/v1/admin/tenant/{id}/audit-logs - deve filtrar por entityType', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/admin/tenant/1/audit-logs?entityType=auction`, {
      headers: authHeaders,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    
    expect(body.success).toBe(true);
  });

  test('GET /api/v1/admin/tenant/{id}/audit-logs - tenant inexistente', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/admin/tenant/999999/audit-logs`, {
      headers: authHeaders,
    });

    expect(response.status()).toBe(404);
  });
});

test.describe('Admin API - Histórico Financeiro', () => {
  let testTenantId: string;

  test.beforeAll(async ({ request }) => {
    // Criar tenant de teste
    const subdomain = generateUniqueSubdomain();
    const createResponse = await request.post(`${BASE_URL}/api/v1/admin/tenant/provision`, {
      headers: authHeaders,
      data: {
        name: 'Tenant Invoices Test',
        subdomain,
        adminUser: {
          email: `admin-invoices-${subdomain}@test.com`,
          fullName: 'Admin Invoices Test',
          password: 'TestPassword123!',
          cpf: '44455566677',
          phone: '11966666666',
        },
      },
    });
    
    if (createResponse.status() === 201) {
      const body = await createResponse.json();
      testTenantId = body.data.tenant.id;
    }
  });

  test('GET /api/v1/admin/tenant/{id}/invoices - deve retornar histórico', async ({ request }) => {
    test.skip(!testTenantId, 'Tenant de teste não foi criado');

    const response = await request.get(`${BASE_URL}/api/v1/admin/tenant/${testTenantId}/invoices`, {
      headers: authHeaders,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    
    expect(body.success).toBe(true);
    expect(body.data.tenant).toBeDefined();
    expect(body.data.invoices).toBeDefined();
    expect(Array.isArray(body.data.invoices)).toBe(true);
    expect(body.data.summary).toBeDefined();
    expect(body.data.pagination).toBeDefined();
  });

  test('POST /api/v1/admin/tenant/{id}/invoices - deve criar invoice', async ({ request }) => {
    test.skip(!testTenantId, 'Tenant de teste não foi criado');

    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias

    const response = await request.post(`${BASE_URL}/api/v1/admin/tenant/${testTenantId}/invoices`, {
      headers: authHeaders,
      data: {
        amount: 299.90,
        description: 'Mensalidade Plano Professional - Janeiro/2026',
        dueDate: dueDate.toISOString(),
        items: [
          { description: 'Plano Professional', quantity: 1, unitPrice: 299.90 },
        ],
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    
    expect(body.success).toBe(true);
    expect(body.data.invoice).toBeDefined();
    expect(body.data.invoice.amount).toBe(299.90);
    expect(body.data.invoice.status).toBe('PENDING');
  });

  test('GET /api/v1/admin/tenant/{id}/invoices - após criar invoice', async ({ request }) => {
    test.skip(!testTenantId, 'Tenant de teste não foi criado');

    const response = await request.get(`${BASE_URL}/api/v1/admin/tenant/${testTenantId}/invoices`, {
      headers: authHeaders,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    
    expect(body.success).toBe(true);
    expect(body.data.invoices.length).toBeGreaterThan(0);
    expect(body.data.summary.totalPending).toBeGreaterThan(0);
  });
});

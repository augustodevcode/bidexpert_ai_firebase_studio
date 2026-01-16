/**
 * @fileoverview Testes E2E para APIs administrativas de tenants.
 * 
 * Testa os endpoints do Control Plane (CRM) para:
 * - Provisionar novos tenants
 * - Atualizar configurações de tenants
 * - Gerenciar domínios customizados
 * - Autenticação via API Key
 */
import { test, expect } from '@playwright/test';

// Configuração da API Key (deve corresponder ao ADMIN_API_KEY no .env)
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'test-admin-api-key-32chars-minimum';
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

// Headers padrão para requisições autenticadas
const authHeaders = {
  'Authorization': `Bearer ${ADMIN_API_KEY}`,
  'Content-Type': 'application/json',
};

// Gera um subdomain único para cada teste
const generateUniqueSubdomain = () => `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;

test.describe('Tenant Admin API - Provision', () => {
  test.describe.configure({ mode: 'serial' });

  let createdTenantId: string;
  let createdSubdomain: string;

  test('deve rejeitar requisições sem API Key', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/v1/admin/tenant/provision`, {
      headers: { 'Content-Type': 'application/json' },
      data: { name: 'Test Tenant' },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  test('deve rejeitar API Key inválida', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/v1/admin/tenant/provision`, {
      headers: {
        'Authorization': 'Bearer invalid-key',
        'Content-Type': 'application/json',
      },
      data: { name: 'Test Tenant' },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  test('deve validar campos obrigatórios', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/v1/admin/tenant/provision`, {
      headers: authHeaders,
      data: {}, // Sem campos obrigatórios
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(body.details).toBeDefined();
  });

  test('deve provisionar tenant com dados mínimos', async ({ request }) => {
    createdSubdomain = generateUniqueSubdomain();
    
    const response = await request.post(`${BASE_URL}/api/v1/admin/tenant/provision`, {
      headers: authHeaders,
      data: {
        name: 'Tenant de Teste',
        subdomain: createdSubdomain,
        adminUser: {
          email: `admin-${createdSubdomain}@test.com`,
          fullName: 'Admin Test',
          password: 'TestPassword123!',
          cpf: '12345678901',
          phone: '11999999999',
        },
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    
    expect(body.success).toBe(true);
    expect(body.data.tenant).toBeDefined();
    expect(body.data.tenant.subdomain).toBe(createdSubdomain);
    expect(body.data.tenant.status).toBe('TRIAL');
    expect(body.data.adminUser).toBeDefined();
    expect(body.data.adminUser.email).toBe(`admin-${createdSubdomain}@test.com`);
    expect(body.data.accessUrl).toBeDefined();
    
    createdTenantId = body.data.tenant.id;
  });

  test('deve provisionar tenant com todos os campos', async ({ request }) => {
    const subdomain = generateUniqueSubdomain();
    
    const response = await request.post(`${BASE_URL}/api/v1/admin/tenant/provision`, {
      headers: authHeaders,
      data: {
        name: 'Tenant Completo',
        subdomain,
        resolutionStrategy: 'SUBDOMAIN',
        planId: 'enterprise',
        status: 'ACTIVE',
        maxUsers: 100,
        maxStorageBytes: 1073741824, // 1GB
        maxAuctions: 500,
        externalId: `ext-${subdomain}`,
        webhookUrl: 'https://example.com/webhook',
        metadata: { industry: 'real-estate', tier: 'gold' },
        adminUser: {
          email: `admin-full-${subdomain}@test.com`,
          fullName: 'Admin Completo',
          password: 'ComplexPass123!@#',
          cpf: '98765432100',
          phone: '21988888888',
        },
        branding: {
          siteTitle: 'Portal de Leilões',
          siteTagline: 'Os melhores leilões',
          logoUrl: 'https://example.com/logo.png',
          faviconUrl: 'https://example.com/favicon.ico',
          primaryColorHsl: '220 90% 45%',
          secondaryColorHsl: '180 60% 50%',
        },
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    
    expect(body.success).toBe(true);
    expect(body.data.tenant.planId).toBe('enterprise');
    expect(body.data.tenant.status).toBe('ACTIVE');
    expect(body.data.tenant.maxUsers).toBe(100);
    expect(body.data.tenant.externalId).toBe(`ext-${subdomain}`);
  });

  test('deve rejeitar subdomain duplicado', async ({ request }) => {
    // Tenta criar outro tenant com o mesmo subdomain
    const response = await request.post(`${BASE_URL}/api/v1/admin/tenant/provision`, {
      headers: authHeaders,
      data: {
        name: 'Tenant Duplicado',
        subdomain: createdSubdomain, // Mesmo subdomain do teste anterior
        adminUser: {
          email: `admin-dup-${Date.now()}@test.com`,
          fullName: 'Admin Dup',
          password: 'TestPassword123!',
          cpf: '11122233344',
          phone: '11977777777',
        },
      },
    });

    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body.error).toContain('já está em uso');
  });

  test('deve provisionar tenant com estratégia PATH', async ({ request }) => {
    const subdomain = generateUniqueSubdomain();
    
    const response = await request.post(`${BASE_URL}/api/v1/admin/tenant/provision`, {
      headers: authHeaders,
      data: {
        name: 'Tenant Path-Based',
        subdomain,
        resolutionStrategy: 'PATH',
        adminUser: {
          email: `admin-path-${subdomain}@test.com`,
          fullName: 'Admin Path',
          password: 'TestPassword123!',
          cpf: '44455566677',
          phone: '11966666666',
        },
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    
    expect(body.data.tenant.resolutionStrategy).toBe('PATH');
    // PATH strategy uses /app/[slug] format
    expect(body.data.accessUrl).toContain('/app/');
  });

  test('deve provisionar tenant com estratégia CUSTOM_DOMAIN', async ({ request }) => {
    const subdomain = generateUniqueSubdomain();
    const customDomain = `${subdomain}.example.com`;
    
    const response = await request.post(`${BASE_URL}/api/v1/admin/tenant/provision`, {
      headers: authHeaders,
      data: {
        name: 'Tenant Custom Domain',
        subdomain,
        resolutionStrategy: 'CUSTOM_DOMAIN',
        customDomain,
        adminUser: {
          email: `admin-custom-${subdomain}@test.com`,
          fullName: 'Admin Custom',
          password: 'TestPassword123!',
          cpf: '55566677788',
          phone: '11955555555',
        },
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    
    expect(body.data.tenant.resolutionStrategy).toBe('CUSTOM_DOMAIN');
    expect(body.data.tenant.customDomain).toBe(customDomain);
    expect(body.data.tenant.customDomainVerified).toBe(false);
    expect(body.data.tenant.customDomainVerifyToken).toBeDefined();
    // Custom domain shows setup URL with verification steps
    expect(body.data.setupUrl).toBeDefined();
  });
});

test.describe('Tenant Admin API - Settings', () => {
  let tenantId: string;
  let subdomain: string;

  test.beforeAll(async ({ request }) => {
    // Cria um tenant para testar as configurações
    subdomain = generateUniqueSubdomain();
    
    const response = await request.post(`${BASE_URL}/api/v1/admin/tenant/provision`, {
      headers: authHeaders,
      data: {
        name: 'Tenant Settings Test',
        subdomain,
        adminUser: {
          email: `admin-settings-${subdomain}@test.com`,
          fullName: 'Admin Settings',
          password: 'TestPassword123!',
          cpf: '66677788899',
          phone: '11944444444',
        },
      },
    });

    const body = await response.json();
    tenantId = body.data.tenant.id;
  });

  test('deve obter configurações do tenant', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/admin/tenant/settings?tenantId=${tenantId}`, {
      headers: authHeaders,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    
    expect(body.success).toBe(true);
    expect(body.data.tenant).toBeDefined();
    expect(body.data.tenant.subdomain).toBe(subdomain);
    expect(body.data.settings).toBeDefined();
  });

  test('deve atualizar nome do tenant', async ({ request }) => {
    const newName = `Updated Name ${Date.now()}`;
    
    const response = await request.patch(`${BASE_URL}/api/v1/admin/tenant/settings`, {
      headers: authHeaders,
      data: {
        tenantId,
        name: newName,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    
    expect(body.success).toBe(true);
    expect(body.data.tenant.name).toBe(newName);
  });

  test('deve atualizar limites do tenant', async ({ request }) => {
    const response = await request.patch(`${BASE_URL}/api/v1/admin/tenant/settings`, {
      headers: authHeaders,
      data: {
        tenantId,
        maxUsers: 50,
        maxStorageBytes: 536870912, // 512MB
        maxAuctions: 200,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    
    expect(body.data.tenant.maxUsers).toBe(50);
    expect(body.data.tenant.maxStorageBytes).toBe(536870912);
    expect(body.data.tenant.maxAuctions).toBe(200);
  });

  test('deve atualizar status do tenant', async ({ request }) => {
    // Suspender
    let response = await request.patch(`${BASE_URL}/api/v1/admin/tenant/settings`, {
      headers: authHeaders,
      data: {
        tenantId,
        status: 'SUSPENDED',
      },
    });

    expect(response.status()).toBe(200);
    let body = await response.json();
    expect(body.data.tenant.status).toBe('SUSPENDED');

    // Reativar
    response = await request.patch(`${BASE_URL}/api/v1/admin/tenant/settings`, {
      headers: authHeaders,
      data: {
        tenantId,
        status: 'ACTIVE',
      },
    });

    expect(response.status()).toBe(200);
    body = await response.json();
    expect(body.data.tenant.status).toBe('ACTIVE');
  });

  test('deve atualizar branding do tenant', async ({ request }) => {
    const response = await request.patch(`${BASE_URL}/api/v1/admin/tenant/settings`, {
      headers: authHeaders,
      data: {
        tenantId,
        branding: {
          siteTitle: 'Novo Portal',
          siteTagline: 'Leilões modernos',
          primaryColorHsl: '200 85% 50%',
          secondaryColorHsl: '160 70% 45%',
          accentColorHsl: '30 90% 55%',
        },
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    
    expect(body.data.settings.siteTitle).toBe('Novo Portal');
    expect(body.data.settings.siteTagline).toBe('Leilões modernos');
    expect(body.data.settings.primaryColorHsl).toBe('200 85% 50%');
  });

  test('deve atualizar features do tenant', async ({ request }) => {
    const response = await request.patch(`${BASE_URL}/api/v1/admin/tenant/settings`, {
      headers: authHeaders,
      data: {
        tenantId,
        features: {
          enableBlockchain: true,
          enableRealtime: true,
          enableSoftClose: false,
          enableAIFeatures: true,
        },
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    
    expect(body.data.settings.enableBlockchain).toBe(true);
    expect(body.data.settings.enableRealtime).toBe(true);
    expect(body.data.settings.enableSoftClose).toBe(false);
    expect(body.data.settings.enableAIFeatures).toBe(true);
  });

  test('deve regenerar API key do tenant', async ({ request }) => {
    // Primeiro, obtém a API key atual
    let response = await request.get(`${BASE_URL}/api/v1/admin/tenant/settings?tenantId=${tenantId}`, {
      headers: authHeaders,
    });
    const originalKey = (await response.json()).data.tenant.apiKey;

    // Regenera a API key
    response = await request.patch(`${BASE_URL}/api/v1/admin/tenant/settings`, {
      headers: authHeaders,
      data: {
        tenantId,
        regenerateApiKey: true,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    
    expect(body.data.tenant.apiKey).toBeDefined();
    expect(body.data.tenant.apiKey).not.toBe(originalKey);
  });

  test('deve configurar domínio customizado', async ({ request }) => {
    const customDomain = `custom-${Date.now()}.example.com`;
    
    const response = await request.patch(`${BASE_URL}/api/v1/admin/tenant/settings`, {
      headers: authHeaders,
      data: {
        tenantId,
        domain: {
          customDomain,
          resolutionStrategy: 'CUSTOM_DOMAIN',
        },
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    
    expect(body.data.tenant.customDomain).toBe(customDomain);
    expect(body.data.tenant.customDomainVerified).toBe(false);
    expect(body.data.tenant.customDomainVerifyToken).toBeDefined();
    expect(body.data.tenant.resolutionStrategy).toBe('CUSTOM_DOMAIN');
  });
});

test.describe('Tenant Admin API - Error Handling', () => {
  test('deve retornar 404 para tenant inexistente (GET)', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/admin/tenant/settings?tenantId=999999`, {
      headers: authHeaders,
    });

    expect(response.status()).toBe(404);
  });

  test('deve retornar 404 para tenant inexistente (PATCH)', async ({ request }) => {
    const response = await request.patch(`${BASE_URL}/api/v1/admin/tenant/settings`, {
      headers: authHeaders,
      data: {
        tenantId: '999999',
        name: 'Test',
      },
    });

    expect(response.status()).toBe(404);
  });

  test('deve rejeitar status inválido', async ({ request }) => {
    const subdomain = generateUniqueSubdomain();
    
    // Cria tenant primeiro
    const createResponse = await request.post(`${BASE_URL}/api/v1/admin/tenant/provision`, {
      headers: authHeaders,
      data: {
        name: 'Test Invalid Status',
        subdomain,
        adminUser: {
          email: `admin-invalid-${subdomain}@test.com`,
          fullName: 'Admin',
          password: 'TestPassword123!',
          cpf: '77788899900',
          phone: '11933333333',
        },
      },
    });
    const tenantId = (await createResponse.json()).data.tenant.id;

    // Tenta atualizar com status inválido
    const response = await request.patch(`${BASE_URL}/api/v1/admin/tenant/settings`, {
      headers: authHeaders,
      data: {
        tenantId,
        status: 'INVALID_STATUS',
      },
    });

    expect(response.status()).toBe(400);
  });
});

/**
 * @fileoverview Testes unitários para utilitários de resiliência de banco de dados.
 * @vitest-environment node
 *
 * BDD: Em VERCEL_ENV=preview com DB indisponível, fallback tenantId=1 é retornado.
 * TDD: Validar detecção de erros de DB, condições de fallback e integração com
 *      getTenantIdFromRequest/getPlatformSettings.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isDbUnavailableError, isVercelPreviewOrDevelopment, shouldAllowDbFallback, getEnvironmentLabel } from '../../src/lib/db-resilience';

// ---------------------------------------------------------------------------
// isDbUnavailableError
// ---------------------------------------------------------------------------

describe('isDbUnavailableError', () => {
  it('retorna true para PrismaClientInitializationError', () => {
    const error = Object.assign(new Error('Cannot connect'), {
      name: 'PrismaClientInitializationError',
    });
    expect(isDbUnavailableError(error)).toBe(true);
  });

  it('retorna true quando mensagem contém "Can\'t reach database server"', () => {
    const error = new Error("Can't reach database server at db.example.com:5432");
    expect(isDbUnavailableError(error)).toBe(true);
  });

  it('retorna true quando mensagem contém "db.prisma.io"', () => {
    const error = new Error('Connection error to db.prisma.io:5432');
    expect(isDbUnavailableError(error)).toBe(true);
  });

  it('retorna true quando mensagem contém código P1001', () => {
    const error = new Error('P1001: Can\'t reach database server');
    expect(isDbUnavailableError(error)).toBe(true);
  });

  it('retorna true quando mensagem contém "ECONNREFUSED"', () => {
    const error = new Error('connect ECONNREFUSED 127.0.0.1:5432');
    expect(isDbUnavailableError(error)).toBe(true);
  });

  it('retorna false para erro de validação de query (não é falha de conexão)', () => {
    const error = Object.assign(new Error('Invalid value for field'), {
      name: 'PrismaClientValidationError',
    });
    expect(isDbUnavailableError(error)).toBe(false);
  });

  it('retorna false para erros genéricos de lógica de negócio', () => {
    const error = new Error('Tenant not found');
    expect(isDbUnavailableError(error)).toBe(false);
  });

  it('retorna false para valores falsy', () => {
    expect(isDbUnavailableError(null)).toBe(false);
    expect(isDbUnavailableError(undefined)).toBe(false);
    expect(isDbUnavailableError('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isVercelPreviewOrDevelopment
// ---------------------------------------------------------------------------

describe('isVercelPreviewOrDevelopment', () => {
  const original = process.env.VERCEL_ENV;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = original;
    }
  });

  it('retorna true quando VERCEL_ENV=preview', () => {
    process.env.VERCEL_ENV = 'preview';
    expect(isVercelPreviewOrDevelopment()).toBe(true);
  });

  it('retorna true quando VERCEL_ENV=development', () => {
    process.env.VERCEL_ENV = 'development';
    expect(isVercelPreviewOrDevelopment()).toBe(true);
  });

  it('retorna false quando VERCEL_ENV=production', () => {
    process.env.VERCEL_ENV = 'production';
    expect(isVercelPreviewOrDevelopment()).toBe(false);
  });

  it('retorna false quando VERCEL_ENV não está definida', () => {
    delete process.env.VERCEL_ENV;
    expect(isVercelPreviewOrDevelopment()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getEnvironmentLabel
// ---------------------------------------------------------------------------

describe('getEnvironmentLabel', () => {
  const original = process.env.VERCEL_ENV;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = original;
    }
  });

  it('retorna "Vercel preview" quando VERCEL_ENV=preview', () => {
    process.env.VERCEL_ENV = 'preview';
    expect(getEnvironmentLabel()).toBe('Vercel preview');
  });

  it('retorna "Vercel development" quando VERCEL_ENV=development', () => {
    process.env.VERCEL_ENV = 'development';
    expect(getEnvironmentLabel()).toBe('Vercel development');
  });

  it('retorna "desenvolvimento local" quando VERCEL_ENV não está definido', () => {
    delete process.env.VERCEL_ENV;
    expect(getEnvironmentLabel()).toBe('desenvolvimento local');
  });

  it('retorna "desenvolvimento local" quando VERCEL_ENV=production', () => {
    process.env.VERCEL_ENV = 'production';
    expect(getEnvironmentLabel()).toBe('desenvolvimento local');
  });
});

// ---------------------------------------------------------------------------
// shouldAllowDbFallback
// ---------------------------------------------------------------------------

describe('shouldAllowDbFallback', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalVercelEnv = process.env.VERCEL_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalVercelEnv === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = originalVercelEnv;
    }
  });

  const dbError = Object.assign(new Error('Cannot connect'), {
    name: 'PrismaClientInitializationError',
  });
  const businessError = new Error('Tenant not found');

  it('retorna false para erros que não são de DB, mesmo em preview', () => {
    process.env.VERCEL_ENV = 'preview';
    expect(shouldAllowDbFallback(businessError)).toBe(false);
  });

  it('retorna true para erro de DB em NODE_ENV=test (desenvolvimento)', () => {
    // NODE_ENV já é 'test' no ambiente de testes
    expect(process.env.NODE_ENV).toBe('test');
    expect(shouldAllowDbFallback(dbError)).toBe(true);
  });

  it('retorna true para erro de DB em VERCEL_ENV=preview (mesmo NODE_ENV=production)', () => {
    process.env.NODE_ENV = 'production';
    process.env.VERCEL_ENV = 'preview';
    expect(shouldAllowDbFallback(dbError)).toBe(true);
  });

  it('retorna true para erro de DB em VERCEL_ENV=development', () => {
    process.env.NODE_ENV = 'production';
    process.env.VERCEL_ENV = 'development';
    expect(shouldAllowDbFallback(dbError)).toBe(true);
  });

  it('retorna false para erro de DB em VERCEL_ENV=production (NODE_ENV=production)', () => {
    process.env.NODE_ENV = 'production';
    process.env.VERCEL_ENV = 'production';
    expect(shouldAllowDbFallback(dbError)).toBe(false);
  });

  it('retorna false para erro de DB em NODE_ENV=production sem VERCEL_ENV', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.VERCEL_ENV;
    expect(shouldAllowDbFallback(dbError)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getTenantIdFromRequest (integração com mocks)
// ---------------------------------------------------------------------------

describe('getTenantIdFromRequest em VERCEL_ENV=preview com DB indisponível', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalVercelEnv = process.env.VERCEL_ENV;

  beforeEach(() => {
    vi.resetModules();
    process.env.NODE_ENV = 'production';
    process.env.VERCEL_ENV = 'preview';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalVercelEnv === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = originalVercelEnv;
    }
    vi.restoreAllMocks();
  });

  it('retorna "1" quando ensureDefaultTenant lança PrismaClientInitializationError', async () => {
    const prismaInitError = Object.assign(
      new Error("Can't reach database server at db.prisma.io:5432"),
      { name: 'PrismaClientInitializationError' }
    );

    const mockFindFirst = vi.fn().mockRejectedValue(prismaInitError);
    vi.doMock('../../src/lib/prisma', () => ({
      prisma: {
        tenant: {
          findFirst: mockFindFirst,
          create: vi.fn().mockRejectedValue(prismaInitError),
        },
      },
    }));

    vi.doMock('../../src/server/lib/session', () => ({
      getSession: vi.fn().mockResolvedValue(null),
    }));

    vi.doMock('next/headers', () => ({
      headers: vi.fn().mockReturnValue({ get: vi.fn().mockReturnValue(null) }),
    }));

    const { getTenantIdFromRequest } = await import('../../src/lib/actions/auth');
    const tenantId = await getTenantIdFromRequest(true);

    expect(tenantId).toBe('1');
    // Confirma que o Prisma foi invocado e que o erro ativou o caminho de fallback
    expect(mockFindFirst).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// getPlatformSettings (integração com mocks)
// ---------------------------------------------------------------------------

describe('getPlatformSettings em VERCEL_ENV=preview com DB indisponível', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalVercelEnv = process.env.VERCEL_ENV;

  beforeEach(() => {
    vi.resetModules();
    process.env.NODE_ENV = 'production';
    process.env.VERCEL_ENV = 'preview';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalVercelEnv === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = originalVercelEnv;
    }
    vi.restoreAllMocks();
  });

  it('retorna null quando o serviço lança PrismaClientInitializationError', async () => {
    const prismaInitError = Object.assign(
      new Error("Can't reach database server at db.prisma.io:5432"),
      { name: 'PrismaClientInitializationError' }
    );

    const mockGetSettings = vi.fn().mockRejectedValue(prismaInitError);
    vi.doMock('../../src/services/platform-settings.service', () => ({
      PlatformSettingsService: vi.fn().mockImplementation(() => ({
        getSettings: mockGetSettings,
      })),
    }));

    // getTenantIdFromRequest também usará o fallback pois prisma está indisponível
    vi.doMock('../../src/lib/actions/auth', () => ({
      getTenantIdFromRequest: vi.fn().mockResolvedValue('1'),
    }));

    vi.doMock('next/cache', () => ({
      revalidatePath: vi.fn(),
    }));

    const { getPlatformSettings } = await import('../../src/app/admin/settings/actions');
    const result = await getPlatformSettings();

    expect(result).toBeNull();
    // Confirma que o serviço foi invocado e o caminho de fallback foi ativado
    expect(mockGetSettings).toHaveBeenCalledWith('1');
  });

  it('não retorna null (relança) quando o erro não é de DB indisponível', async () => {
    const logicError = Object.assign(
      new Error('Tenant configuration invalid'),
      { name: 'Error' }
    );

    vi.doMock('../../src/services/platform-settings.service', () => ({
      PlatformSettingsService: vi.fn().mockImplementation(() => ({
        getSettings: vi.fn().mockRejectedValue(logicError),
      })),
    }));

    vi.doMock('../../src/lib/actions/auth', () => ({
      getTenantIdFromRequest: vi.fn().mockResolvedValue('1'),
    }));

    vi.doMock('next/cache', () => ({
      revalidatePath: vi.fn(),
    }));

    const { getPlatformSettings } = await import('../../src/app/admin/settings/actions');
    await expect(getPlatformSettings()).rejects.toThrow('[getPlatformSettings Action] Error:');
  });
});

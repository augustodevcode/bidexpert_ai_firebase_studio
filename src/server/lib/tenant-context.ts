// src/server/lib/tenant-context.ts
/**
 * @fileoverview Serviço de contexto de tenant com AsyncLocalStorage para propagação
 * automática do tenantId em todas as requisições. Inclui cache LRU para otimização
 * de lookups de subdomain/domain → tenantId.
 * 
 * Este módulo é central para a arquitetura multi-tenant do BidExpert Data Plane.
 * Ele resolve o tenant a partir de subdomínios, domínios customizados ou paths,
 * e disponibiliza o contexto para todas as camadas da aplicação.
 */

import { AsyncLocalStorage } from 'async_hooks';
import prisma from '@/lib/prisma';
import type { Tenant, PlatformSettings, ResolutionStrategy, TenantStatus } from '@prisma/client';

// ============================================================================
// Tipos e Interfaces
// ============================================================================

export interface TenantContext {
  tenantId: string;
  subdomain: string;
  domain: string | null;
  resolutionStrategy: ResolutionStrategy;
  status: TenantStatus;
  name: string;
  isLandlord: boolean;
}

export interface ResolvedTenant {
  tenant: TenantContext;
  settings: PlatformSettings | null;
}

interface CacheEntry {
  value: ResolvedTenant | null;
  expiresAt: number;
}

// ============================================================================
// AsyncLocalStorage para Contexto de Tenant
// ============================================================================

export const tenantContextStorage = new AsyncLocalStorage<TenantContext>();

/**
 * Obtém o contexto do tenant atual da AsyncLocalStorage.
 * @returns TenantContext ou undefined se não estiver em um contexto de tenant
 */
export function getCurrentTenant(): TenantContext | undefined {
  return tenantContextStorage.getStore();
}

/**
 * Obtém o tenantId atual do contexto.
 * @returns string do tenantId ou '1' (landlord) se não houver contexto
 */
export function getCurrentTenantId(): string {
  const context = tenantContextStorage.getStore();
  return context?.tenantId ?? '1';
}

/**
 * Verifica se o contexto atual é do landlord (admin da plataforma).
 * @returns boolean
 */
export function isCurrentTenantLandlord(): boolean {
  const context = tenantContextStorage.getStore();
  return context?.isLandlord ?? false;
}

/**
 * Executa uma função dentro de um contexto de tenant específico.
 * @param context Contexto do tenant
 * @param fn Função a ser executada
 * @returns Resultado da função
 */
export function runWithTenantContext<T>(context: TenantContext, fn: () => T): T {
  return tenantContextStorage.run(context, fn);
}

// ============================================================================
// Cache LRU para Resolução de Tenant
// ============================================================================

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
const MAX_CACHE_SIZE = 1000;

class TenantCache {
  private cache = new Map<string, CacheEntry>();
  private accessOrder: string[] = [];

  get(key: string): ResolvedTenant | null | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      return undefined;
    }
    
    // Move to end (most recently used)
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);
    
    return entry.value;
  }

  set(key: string, value: ResolvedTenant | null): void {
    // Evict oldest if at capacity
    if (this.cache.size >= MAX_CACHE_SIZE && !this.cache.has(key)) {
      const oldest = this.accessOrder.shift();
      if (oldest) this.cache.delete(oldest);
    }
    
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);
  }

  invalidate(key: string): void {
    this.cache.delete(key);
    this.accessOrder = this.accessOrder.filter(k => k !== key);
  }

  invalidateByTenantId(tenantId: string): void {
    // Invalidate all keys that might reference this tenant
    const keysToDelete: string[] = [];
    this.cache.forEach((entry, key) => {
      if (entry.value?.tenant.tenantId === tenantId) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.invalidate(key));
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }
}

const tenantCache = new TenantCache();

// Export para invalidação externa (ex: após atualizar tenant)
export function invalidateTenantCache(tenantId: string): void {
  tenantCache.invalidateByTenantId(tenantId);
}

export function clearTenantCache(): void {
  tenantCache.clear();
}

// ============================================================================
// Resolução de Tenant
// ============================================================================

const LANDLORD_ID = '1';
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:9002';
const LANDLORD_DOMAINS = [
  process.env.LANDLORD_URL || 'bidexpert.com.br',
  `www.${process.env.LANDLORD_URL || 'bidexpert.com.br'}`,
  APP_DOMAIN,
  'localhost',
  'localhost:9002',
  'localhost:9005',
  'localhost:3000',
  // Vercel domains
  'bidexpertaifirebasestudio.vercel.app',
  'bidexpertaifirebasestudio-augustos-projects-d51a961f.vercel.app',
];

/**
 * Resolve o tenant a partir do hostname e path.
 * 
 * Ordem de prioridade:
 * 1. Domínio customizado (se não for domínio padrão)
 * 2. Subdomínio (se terminar em APP_DOMAIN)
 * 3. Path (/app/[slug])
 * 
 * @param hostname Host da requisição (ex: "tenant.bidexpert.com.br")
 * @param pathname Path da requisição (ex: "/app/tenant/auctions")
 * @param forwardedHost Host original se atrás de proxy (X-Forwarded-Host)
 * @returns ResolvedTenant ou null se não encontrado
 */
export async function resolveTenant(
  hostname: string,
  pathname: string = '/',
  forwardedHost?: string | null
): Promise<ResolvedTenant | null> {
  // Usa X-Forwarded-Host se disponível (SSL termination no proxy)
  const effectiveHost = forwardedHost || hostname;
  const normalizedHost = effectiveHost.toLowerCase().replace(/:\d+$/, ''); // Remove porta
  
  // Cache key inclui hostname e path para suportar path-based routing
  const pathSlug = extractPathSlug(pathname);
  const cacheKey = pathSlug ? `path:${pathSlug}` : `host:${normalizedHost}`;
  
  // Check cache
  const cached = tenantCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }
  
  let resolved: ResolvedTenant | null = null;
  
  try {
    // 1. Check if it's the landlord domain
    if (LANDLORD_DOMAINS.includes(normalizedHost) && !pathSlug) {
      resolved = await loadTenantById(BigInt(LANDLORD_ID));
    }
    // 2. Try custom domain
    else if (!normalizedHost.endsWith(APP_DOMAIN.replace(/:\d+$/, '')) && !pathSlug) {
      resolved = await loadTenantByDomain(normalizedHost);
    }
    // 3. Try subdomain
    else if (!pathSlug) {
      const subdomain = extractSubdomain(normalizedHost);
      if (subdomain) {
        resolved = await loadTenantBySubdomain(subdomain);
      }
    }
    // 4. Try path-based
    if (!resolved && pathSlug) {
      resolved = await loadTenantBySubdomain(pathSlug);
    }
    
    // Fallback to landlord for local development
    if (!resolved && (normalizedHost.includes('localhost') || normalizedHost.includes('127.0.0.1'))) {
      resolved = await loadTenantById(BigInt(LANDLORD_ID));
    }
    
    tenantCache.set(cacheKey, resolved);
    return resolved;
    
  } catch (error) {
    console.error('[TenantContext] Error resolving tenant:', error);
    tenantCache.set(cacheKey, null);
    return null;
  }
}

/**
 * Extrai o slug do path se for path-based routing (/app/[slug]/...)
 */
function extractPathSlug(pathname: string): string | null {
  const match = pathname.match(/^\/app\/([a-z0-9-]+)/i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Extrai o subdomínio do hostname
 */
function extractSubdomain(hostname: string): string | null {
  const appDomainNormalized = APP_DOMAIN.replace(/:\d+$/, '');
  
  // Match: subdomain.appdomain.com ou subdomain.localhost
  const pattern = new RegExp(`^(?!www\\.)([a-z0-9-]+)\\.${appDomainNormalized.replace('.', '\\.')}$`, 'i');
  const match = hostname.match(pattern);
  
  if (match) {
    return match[1].toLowerCase();
  }
  
  // Match for localhost with subdomain: subdomain.localhost
  const localhostPattern = /^(?!www\.)([a-z0-9-]+)\.localhost$/i;
  const localhostMatch = hostname.match(localhostPattern);
  
  return localhostMatch ? localhostMatch[1].toLowerCase() : null;
}

/**
 * Carrega tenant por ID com settings
 */
async function loadTenantById(id: bigint): Promise<ResolvedTenant | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: { settings: true },
  });
  
  if (!tenant) return null;
  
  return {
    tenant: {
      tenantId: tenant.id.toString(),
      subdomain: tenant.subdomain,
      domain: tenant.domain,
      resolutionStrategy: tenant.resolutionStrategy,
      status: tenant.status,
      name: tenant.name,
      isLandlord: tenant.id === BigInt(LANDLORD_ID),
    },
    settings: tenant.settings,
  };
}

/**
 * Carrega tenant por subdomínio
 */
async function loadTenantBySubdomain(subdomain: string): Promise<ResolvedTenant | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain: subdomain.toLowerCase() },
    include: { settings: true },
  });
  
  if (!tenant) return null;
  
  return {
    tenant: {
      tenantId: tenant.id.toString(),
      subdomain: tenant.subdomain,
      domain: tenant.domain,
      resolutionStrategy: tenant.resolutionStrategy,
      status: tenant.status,
      name: tenant.name,
      isLandlord: tenant.id === BigInt(LANDLORD_ID),
    },
    settings: tenant.settings,
  };
}

/**
 * Carrega tenant por domínio customizado
 */
async function loadTenantByDomain(domain: string): Promise<ResolvedTenant | null> {
  const tenant = await prisma.tenant.findFirst({
    where: { 
      domain: domain.toLowerCase(),
      customDomainVerified: true, // Só resolve se domínio verificado
    },
    include: { settings: true },
  });
  
  if (!tenant) return null;
  
  return {
    tenant: {
      tenantId: tenant.id.toString(),
      subdomain: tenant.subdomain,
      domain: tenant.domain,
      resolutionStrategy: tenant.resolutionStrategy,
      status: tenant.status,
      name: tenant.name,
      isLandlord: tenant.id === BigInt(LANDLORD_ID),
    },
    settings: tenant.settings,
  };
}

// ============================================================================
// Validação de Status do Tenant
// ============================================================================

/**
 * Verifica se o tenant pode acessar o sistema (status válido)
 */
export function isTenantAccessible(status: TenantStatus): boolean {
  return ['TRIAL', 'ACTIVE'].includes(status);
}

/**
 * Verifica se o trial do tenant expirou
 */
export function isTenantTrialExpired(tenant: { status: TenantStatus; trialExpiresAt: Date | null }): boolean {
  if (tenant.status !== 'TRIAL') return false;
  if (!tenant.trialExpiresAt) return false;
  return new Date() > tenant.trialExpiresAt;
}

// ============================================================================
// Utilitários para APIs Administrativas
// ============================================================================

/**
 * Gera um token de verificação para domínio customizado
 */
export function generateDomainVerifyToken(): string {
  return `bidexpert-verify-${crypto.randomUUID().replace(/-/g, '')}`;
}

/**
 * Gera uma API key para o tenant
 */
export function generateTenantApiKey(): string {
  return `bx_${crypto.randomUUID().replace(/-/g, '')}`;
}

/**
 * Calcula a data de expiração do trial (30 dias)
 */
export function calculateTrialExpiration(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date;
}

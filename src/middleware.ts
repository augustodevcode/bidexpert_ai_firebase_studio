// src/middleware.ts
/**
 * @fileoverview Middleware de roteamento multi-tenant inteligente para BidExpert.
 * 
 * Resolve o tenant através de quatro estratégias (em ordem de prioridade):
 * 1. Subdomínio localhost - demo.localhost:9005 → tenant "demo"
 * 2. Domínio Landlord / Vercel - bidexpert.com.br, *.vercel.app → Landlord
 * 3. Subdomínio de tenant - crm.bidexpert.com.br → tenant "crm"
 *    (subdomínios reservados como hml, demo, www são tratados como landlord)
 * 4. Domínio customizado - meusite.com → tenant via DNS CNAME
 * 
 * Ambientes Vercel por branch:
 * - main → bidexpert.com.br (produção)
 * - demo-stable → demo.bidexpert.com.br
 * - hml → hml.bidexpert.com.br
 * 
 * Suporta SSL termination via X-Forwarded-Host para proxies reversos
 * (Nginx, Caddy, Cloudflare for SaaS).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/server/lib/session';
import { normalizeTenantToken } from '@/lib/tenant-token';

// ============================================================================
// Configuração do Matcher
// ============================================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (public assets)
     * - uploads (uploaded files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|assets|uploads).*)',
  ],
};

// ============================================================================
// Constantes de Configuração
// ============================================================================

const LANDLORD_ID = '1';
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:9002';
const LANDLORD_URL = process.env.LANDLORD_URL || 'bidexpert.com.br';

/**
 * Subdomínios reservados que NÃO representam tenants.
 * Quando acessados como <reserved>.bidexpert.com.br, são tratados como domínio landlord
 * (ambiente/infraestrutura) em vez de subdomínio de tenant.
 *
 * - hml / demo / staging: Ambientes Vercel mapeados por branch
 * - www / api / admin / app: Subdomínios de infraestrutura
 * - mail / smtp / ftp / ns1 / ns2: Subdomínios DNS/infra
 */
const RESERVED_SUBDOMAINS = new Set([
  'www',
  'hml',
  'demo',
  'staging',
  'api',
  'admin',
  'app',
  'mail',
  'smtp',
  'ftp',
  'ns1',
  'ns2',
]);

// Domínios que resolvem para o Landlord (admin da plataforma)
const LANDLORD_DOMAINS = [
  LANDLORD_URL,
  `www.${LANDLORD_URL}`,
  `hml.${LANDLORD_URL}`,
  `demo.${LANDLORD_URL}`,
  `staging.${LANDLORD_URL}`,
  APP_DOMAIN,
  'localhost',
  'localhost:9002',
  'localhost:9005',
  'localhost:3000',
  '127.0.0.1',
  '127.0.0.1:9002',
  '127.0.0.1:9005',
  '127.0.0.1:3000',
  // Vercel domains
  'bidexpertaifirebasestudio.vercel.app',
  'bidexpertaifirebasestudio-augustos-projects-d51a961f.vercel.app',
];

// ============================================================================
// Funções de Resolução de Tenant
// ============================================================================

interface TenantResolution {
  tenantId: string;
  subdomain: string | null;
  isCustomDomain: boolean;
  isPathBased: boolean;
}

/**
 * Resolve o tenant a partir do hostname, pathname e headers de proxy.
 * 
 * Esta função é chamada no middleware e não acessa o banco de dados diretamente
 * para evitar latência. A validação completa é feita nas rotas.
 * 
 * @param hostname Host da requisição
 * @param pathname Path da requisição
 * @param forwardedHost Header X-Forwarded-Host (se atrás de proxy)
 * @returns Resolução do tenant
 */
async function resolveTenantFromRequest(
  hostname: string,
  pathname: string,
  forwardedHost: string | null
): Promise<TenantResolution> {
  // Usa X-Forwarded-Host se disponível (SSL termination no proxy)
  const effectiveHost = normalizeTenantToken(forwardedHost || hostname) || '';
  const normalizedHost = effectiveHost.toLowerCase();
  const hostWithoutPort = normalizedHost.replace(/:\d+$/, ''); // Remove porta

  // 1. Check for localhost subdomain pattern: [subdomain].localhost or [subdomain].localhost:port
  // This supports demo.localhost:3000, crm.localhost:9002, etc.
  const localhostSubdomainMatch = hostWithoutPort.match(/^([a-z0-9-]+)\.localhost$/i);
  if (localhostSubdomainMatch) {
    const subdomain = normalizeTenantToken(localhostSubdomainMatch[1]);
    if (!subdomain) {
      return {
        tenantId: LANDLORD_ID,
        subdomain: null,
        isCustomDomain: false,
        isPathBased: false,
      };
    }
    // www is treated as landlord
    if (subdomain === 'www') {
      return {
        tenantId: LANDLORD_ID,
        subdomain: null,
        isCustomDomain: false,
        isPathBased: false,
      };
    }
    return {
      tenantId: subdomain, // Será resolvido para ID na rota via slug lookup
      subdomain,
      isCustomDomain: false,
      isPathBased: false,
    };
  }

  // 2. Check if it's a plain Landlord domain (no subdomain)
  // Also match any *.vercel.app deployment URLs dynamically (Vercel generates unique URLs per deployment)
  const isVercelDomain = /\.vercel\.app$/i.test(hostWithoutPort);
  if (isVercelDomain || LANDLORD_DOMAINS.some(d => hostWithoutPort === d.toLowerCase().replace(/:\d+$/, ''))) {
    // Check for path-based routing on landlord domain: /app/[slug]
    const pathMatch = pathname.match(/^\/app\/([a-z0-9-]+)/i);
    if (pathMatch) {
      const slug = normalizeTenantToken(pathMatch[1]);
      if (!slug) {
        return {
          tenantId: LANDLORD_ID,
          subdomain: null,
          isCustomDomain: false,
          isPathBased: false,
        };
      }
      return {
        tenantId: slug, // Será validado na rota/layout
        subdomain: slug,
        isCustomDomain: false,
        isPathBased: true,
      };
    }
    
    // If NEXT_PUBLIC_DEFAULT_TENANT is configured, use it as the default tenant for this
    // landlord/Vercel domain. It pre-selects the tenant but does NOT lock the selector,
    // because there is no actual subdomain in the URL. The user can still change the tenant.
    // subdomain is set to null intentionally so the login page keeps the selector editable.
    const defaultTenant = normalizeTenantToken(process.env.NEXT_PUBLIC_DEFAULT_TENANT);
    if (defaultTenant) {
      return {
        tenantId: defaultTenant,
        subdomain: null, // Not a real URL subdomain — pre-select only, do NOT lock
        isCustomDomain: false,
        isPathBased: false,
      };
    }

    return {
      tenantId: LANDLORD_ID,
      subdomain: null,
      isCustomDomain: false,
      isPathBased: false,
    };
  }

  // 3. Check for subdomain pattern: [subdomain].bidexpert.com.br
  //    Also matches against LANDLORD_URL for production wildcard tenants.
  const appDomainNormalized = APP_DOMAIN.replace(/:\d+$/, '');
  const landlordUrlNormalized = LANDLORD_URL.replace(/:\d+$/, '');
  
  // Match against both APP_DOMAIN and LANDLORD_URL (may differ in dev vs prod)
  const domainsToCheck = new Set([appDomainNormalized, landlordUrlNormalized]);
  let resolvedSubdomain: string | null = null;

  for (const baseDomain of domainsToCheck) {
    const subdomainPattern = new RegExp(
      `^([a-z0-9-]+)\\.${baseDomain.replace(/\./g, '\\.')}$`,
      'i'
    );
    const subdomainMatch = hostWithoutPort.match(subdomainPattern);
    if (subdomainMatch) {
      resolvedSubdomain = normalizeTenantToken(subdomainMatch[1]);
      break;
    }
  }

  if (resolvedSubdomain) {
    // Reserved subdomains (hml, demo, www, api, etc.) are NOT tenants —
    // they are infrastructure/environment endpoints treated as landlord.
    if (RESERVED_SUBDOMAINS.has(resolvedSubdomain)) {
      const defaultTenant = normalizeTenantToken(process.env.NEXT_PUBLIC_DEFAULT_TENANT);
      return {
        tenantId: defaultTenant || LANDLORD_ID,
        subdomain: null, // Not a tenant subdomain — keep selector editable
        isCustomDomain: false,
        isPathBased: false,
      };
    }

    return {
      tenantId: resolvedSubdomain, // Será resolvido para ID na rota
      subdomain: resolvedSubdomain,
      isCustomDomain: false,
      isPathBased: false,
    };
  }

  // 4. Assume it's a custom domain
  return {
    tenantId: normalizedHost, // Será resolvido para ID na rota
    subdomain: null,
    isCustomDomain: true,
    isPathBased: false,
  };
}

// ============================================================================
// Middleware Principal
// ============================================================================

export async function middleware(req: NextRequest) {
  const hostname = normalizeTenantToken(req.headers.get('host')) || '';
  const pathname = req.nextUrl.pathname;
  
  // Headers de proxy reverso para SSL termination
  const forwardedHost = normalizeTenantToken(req.headers.get('x-forwarded-host'));
  const forwardedProto = req.headers.get('x-forwarded-proto');
  
  // Resolve o tenant
  const resolution = await resolveTenantFromRequest(hostname, pathname, forwardedHost);

  // REDIRECT STRATEGY: Root path on Landlord domain redirects to CRM (Sales Page)
  // Only applies if we are at root path '/' and resolved to Landlord (not a specific tenant subdomain)
  // Also skips redirect for environment subdomains (hml.bidexpert.com.br, demo.bidexpert.com.br)
  if (resolution.tenantId === LANDLORD_ID && pathname === '/') {
    const protocol = req.nextUrl.protocol;
    const portSuffix = req.nextUrl.port ? `:${req.nextUrl.port}` : '';
    const rawHost = (forwardedHost || hostname || '').toLowerCase().replace(/:\d+$/, '');

    // Skip redirect if accessing via IP address (avoids malformed URL crm.127.0.0.1)
    if (/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/.test(rawHost)) {
      return NextResponse.next();
    }

    // Skip redirect for .vercel.app domains (Vercel does NOT support wildcard subdomains)
    if (/\.vercel\.app$/i.test(rawHost)) {
      return NextResponse.next();
    }

    // Skip redirect for environment subdomains (hml.*, demo.*, staging.*)
    // These are standalone apps that should NOT redirect to crm.*
    const landlordUrlNorm = LANDLORD_URL.replace(/:\d+$/, '').toLowerCase();
    const envSubdomainMatch = rawHost.match(
      new RegExp(`^([a-z0-9-]+)\\.${landlordUrlNorm.replace(/\./g, '\\.')}$`)
    );
    if (envSubdomainMatch && RESERVED_SUBDOMAINS.has(envSubdomainMatch[1])) {
      return NextResponse.next();
    }

    // Only redirect apex (bidexpert.com.br) or www to CRM
    const baseDomain = rawHost.replace('www.', '');
    
    // Construct CRM URL
    const crmUrl = `${protocol}//crm.${baseDomain}${portSuffix}`;
    
    return NextResponse.redirect(crmUrl);
  }
  
  // Obtém a sessão do usuário (se logado)
  const session = await getSession();
  
  // O tenant da URL/subdomain SEMPRE tem precedência para garantir isolamento multi-tenant correto.
  // A sessão só é usada para validar se o usuário logado pertence ao tenant acessado.
  // Se a URL resolve para um subdomain/tenant específico, esse é o tenant ativo.
  const activeTenantId = normalizeTenantToken(resolution.tenantId) || LANDLORD_ID;
  const activeSubdomain = normalizeTenantToken(resolution.subdomain);
  
  // Se a resolução retornou um slug (não numérico), mantém para lookup posterior
  // Se retornou LANDLORD_ID, e usuário tem sessão de outro tenant, mantém landlord
  // Isso garante que demo.localhost sempre use tenant "demo" (depois resolvido para ID 3)
  
  // Prepara headers para a requisição
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-tenant-id', activeTenantId);
  requestHeaders.set('x-tenant-subdomain', activeSubdomain || '');
  requestHeaders.set('x-tenant-is-custom-domain', resolution.isCustomDomain.toString());
  requestHeaders.set('x-tenant-is-path-based', resolution.isPathBased.toString());
  requestHeaders.set('x-original-host', hostname);
  
  // Se estiver usando proxy, propaga informações
  if (forwardedHost) {
    requestHeaders.set('x-forwarded-host-original', forwardedHost);
  }
  if (forwardedProto) {
    requestHeaders.set('x-forwarded-proto-original', forwardedProto);
  }

  // ============================================================================
  // URL Rewriting para Path-based Routing
  // ============================================================================
  
  // Se for path-based (/app/[slug]/...), reescreve para /_tenants/[slug]/...
  // mantendo a URL original na barra de endereços
  if (resolution.isPathBased && resolution.subdomain) {
    const rewritePathMatch = pathname.match(/^\/app\/([a-z0-9-]+)(\/.*)?$/i);
    if (rewritePathMatch) {
      const slug = rewritePathMatch[1];
      const remainingPath = rewritePathMatch[2] || '';
      
      // Rewrite interno: /app/tenant/page → /_tenants/tenant/page
      const rewriteUrl = req.nextUrl.clone();
      rewriteUrl.pathname = `/_tenants/${slug}${remainingPath}`;
      
      return NextResponse.rewrite(rewriteUrl, {
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  // ============================================================================
  // Continue com a requisição normal
  // ============================================================================
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

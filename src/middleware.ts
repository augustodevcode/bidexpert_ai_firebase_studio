// src/middleware.ts
/**
 * @fileoverview Middleware de roteamento multi-tenant inteligente para BidExpert.
 * 
 * Resolve o tenant através de três estratégias (em ordem de prioridade):
 * 1. Domínio Customizado - Se o host não for bidexpert.com.br
 * 2. Subdomínio - Se o host terminar em .bidexpert.com.br
 * 3. Path - Se a URL começar com /app/[slug]
 * 
 * Suporta SSL termination via X-Forwarded-Host para proxies reversos
 * (Nginx, Caddy, Cloudflare for SaaS).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/server/lib/session';

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

// Domínios que resolvem para o Landlord (admin da plataforma)
const LANDLORD_DOMAINS = [
  LANDLORD_URL,
  `www.${LANDLORD_URL}`,
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
  const effectiveHost = forwardedHost || hostname;
  const normalizedHost = effectiveHost.toLowerCase();
  const hostWithoutPort = normalizedHost.replace(/:\d+$/, ''); // Remove porta

  console.log(`[resolveTenantFromRequest] hostname='${hostname}', forwardedHost='${forwardedHost}', effectiveHost='${effectiveHost}', hostWithoutPort='${hostWithoutPort}'`);

  // 1. Check for localhost subdomain pattern: [subdomain].localhost or [subdomain].localhost:port
  // This supports demo.localhost:3000, crm.localhost:9002, etc.
  const localhostSubdomainMatch = hostWithoutPort.match(/^([a-z0-9-]+)\.localhost$/i);
  console.log(`[resolveTenantFromRequest] localhostSubdomainMatch:`, localhostSubdomainMatch);
  if (localhostSubdomainMatch) {
    const subdomain = localhostSubdomainMatch[1].toLowerCase();
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
      const slug = pathMatch[1].toLowerCase();
      return {
        tenantId: slug, // Será validado na rota/layout
        subdomain: slug,
        isCustomDomain: false,
        isPathBased: true,
      };
    }
    
    // If it's Vercel and we have a default tenant configured, use it
    if (isVercelDomain && process.env.NEXT_PUBLIC_DEFAULT_TENANT) {
      return {
        tenantId: process.env.NEXT_PUBLIC_DEFAULT_TENANT,
        subdomain: process.env.NEXT_PUBLIC_DEFAULT_TENANT,
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
  const appDomainNormalized = APP_DOMAIN.replace(/:\d+$/, '');
  const subdomainPattern = new RegExp(
    `^(?!www\\.)([a-z0-9-]+)\\.${appDomainNormalized.replace(/\./g, '\\.')}$`,
    'i'
  );
  const subdomainMatch = hostWithoutPort.match(subdomainPattern);
  
  if (subdomainMatch) {
    const subdomain = subdomainMatch[1].toLowerCase();
    return {
      tenantId: subdomain, // Será resolvido para ID na rota
      subdomain,
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
  const hostname = req.headers.get('host') || '';
  const pathname = req.nextUrl.pathname;
  
  // Headers de proxy reverso para SSL termination
  const forwardedHost = req.headers.get('x-forwarded-host');
  const forwardedProto = req.headers.get('x-forwarded-proto');
  
  // Resolve o tenant
  const resolution = await resolveTenantFromRequest(hostname, pathname, forwardedHost);

  // REDIRECT STRATEGY: Root path on Landlord domain redirects to CRM (Sales Page)
  // Only applies if we are at root path '/' and resolved to Landlord (not a specific tenant subdomain)
  if (resolution.tenantId === LANDLORD_ID && pathname === '/') {
    const protocol = req.nextUrl.protocol;
    const portSuffix = req.nextUrl.port ? `:${req.nextUrl.port}` : '';
    // Determine base domain from hostname (remove subdomains if any, though LANDLORD mostly doesn't have them except www)
    const baseDomain = hostname.replace('www.', '').replace(/:\d+$/, ''); 

    // Skip redirect if accessing via IP address (avoids malformed URL crm.127.0.0.1)
    if (/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/.test(baseDomain)) {
      return NextResponse.next();
    }

    // Skip redirect for .vercel.app domains (Vercel does NOT support wildcard subdomains)
    if (/\.vercel\.app$/i.test(baseDomain)) {
      return NextResponse.next();
    }
    
    // Construct CRM URL
    const crmUrl = `${protocol}//crm.${baseDomain}${portSuffix}`;
    
    return NextResponse.redirect(crmUrl);
  }
  
  // Obtém a sessão do usuário (se logado)
  const session = await getSession();
  
  // DEBUG: Log session state
  console.log(`[Middleware] Resolution: tenantId='${resolution.tenantId}', subdomain='${resolution.subdomain}'`);
  console.log(`[Middleware] Session: ${session ? `tenantId='${session.tenantId}', userId='${session.userId}'` : 'null'}`);
  
  // O tenant da URL/subdomain SEMPRE tem precedência para garantir isolamento multi-tenant correto.
  // A sessão só é usada para validar se o usuário logado pertence ao tenant acessado.
  // Se a URL resolve para um subdomain/tenant específico, esse é o tenant ativo.
  let activeTenantId = resolution.tenantId;
  
  // Se a resolução retornou um slug (não numérico), mantém para lookup posterior
  // Se retornou LANDLORD_ID, e usuário tem sessão de outro tenant, mantém landlord
  // Isso garante que demo.localhost sempre use tenant "demo" (depois resolvido para ID 3)
  
  console.log(`[Middleware] Active Tenant ID set to: '${activeTenantId}'`);
  
  // Prepara headers para a requisição
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-tenant-id', activeTenantId);
  requestHeaders.set('x-tenant-subdomain', resolution.subdomain || '');
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

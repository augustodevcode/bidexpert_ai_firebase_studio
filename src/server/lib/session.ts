// src/server/lib/session.ts
/**
 * @fileoverview Gerenciamento de sessão JWT com suporte multi-tenant.
 * 
 * Este módulo gerencia a autenticação baseada em JWT com cookies seguros.
 * 
 * CONFIGURAÇÃO MULTI-TENANT:
 * - Em desenvolvimento: cookies funcionam normalmente em localhost
 * - Em produção com subdomínios: cookie domain é definido como `.APP_DOMAIN`
 *   para permitir compartilhamento entre subdomínios (ex: .bidexpert.com.br)
 * 
 * SEGURANÇA:
 * - Cookies são HttpOnly (não acessíveis via JavaScript)
 * - Secure em produção (HTTPS apenas)
 * - SameSite: 'lax' para proteção CSRF básica
 * 
 * VARIÁVEIS DE AMBIENTE:
 * - SESSION_SECRET: Chave de 32+ caracteres para assinar JWTs
 * - NEXT_PUBLIC_APP_DOMAIN: Domínio base para cookies cross-subdomain
 * - COOKIE_DOMAIN: (opcional) Domínio específico para cookies
 */
import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { UserProfileWithPermissions, Role, Tenant } from '@/types';
import { UserService } from '@/services/user.service';

const secretKey = process.env.SESSION_SECRET;
let hasWarnedInvalidSessionSecret = false;

function getEncodedKeyOrNull(): Uint8Array | null {
    if (!secretKey || secretKey.length < 32) {
        if (!hasWarnedInvalidSessionSecret) {
            console.error('[Session] SESSION_SECRET inválido ou ausente. Sessões serão ignoradas até a variável ser corrigida.');
            hasWarnedInvalidSessionSecret = true;
        }
        return null;
    }

    return new TextEncoder().encode(secretKey);
}

function requireEncodedKey(): Uint8Array {
    const key = getEncodedKeyOrNull();
    if (!key) {
        throw new Error('A variável de ambiente SESSION_SECRET deve ser definida e ter pelo menos 32 caracteres.');
    }
    return key;
}

// ============================================================================
// Configuração de Cookie Domain para Multi-tenant
// ============================================================================

/**
 * Obtém o domínio do cookie para configuração STRICT de tenant.
 * 
 * IMPORTANTE: Para isolamento estrito entre tenants, NÃO compartilhamos
 * cookies entre subdomínios. Cada subdomain terá sua própria sessão.
 * 
 * Isso significa que:
 * - demo.localhost:3000 terá sua própria sessão
 * - crm.localhost:3000 terá sua própria sessão
 * - O usuário precisa fazer login em cada subdomain separadamente
 * 
 * Esta é uma decisão de segurança para evitar vazamento de dados entre tenants.
 */
function getCookieDomain(): string | undefined {
  // STRICT MODE: Sempre retorna undefined para que o cookie seja
  // associado apenas ao host atual (não compartilhado entre subdomínios)
  // 
  // Se no futuro precisar de SSO entre subdomínios, mude para:
  // return `.${appDomain}` em produção
  
  // Se COOKIE_DOMAIN estiver explicitamente definido, respeita
  if (process.env.COOKIE_DOMAIN) {
    return process.env.COOKIE_DOMAIN;
  }
  
  // Por padrão: undefined = cookie restrito ao host atual
  return undefined;
}

export async function encrypt(payload: any) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
    .sign(requireEncodedKey());
}

export async function decrypt(session: string | undefined = '') {
    if (!session) return null;
    try {
        const encodedKey = getEncodedKeyOrNull();
        if (!encodedKey) {
            return null;
        }

        const { payload } = await jwtVerify(session, encodedKey, {
            algorithms: ['HS256'],
        });
        return payload;
    } catch (error) {
        console.error('[Session Decrypt] Falha ao verificar a sessão JWT:', error);
        return null;
    }
}

export async function createSession(user: UserProfileWithPermissions, tenantId: string) {
    if (!tenantId) {
        throw new Error('O Tenant ID é obrigatório para criar uma sessão.');
    }

    console.log(`[Create Session] Criando sessão para usuário ${user.email} no tenant ${tenantId}`);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const sessionPayload = {
        userId: user.id.toString(),
        email: user.email,
        tenantId: tenantId.toString(),
        roleNames: user.roleNames,
        permissions: user.permissions,
        sellerId: user.sellerId?.toString() || null,
        auctioneerId: user.auctioneerId?.toString() || null,
    };

    const session = await encrypt(sessionPayload);

    console.log('[Create Session] Token JWT gerado. Definindo cookie com tamanho:', session.length);
    console.log('[Create Session] NODE_ENV:', process.env.NODE_ENV);

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieDomain = getCookieDomain();
    
    console.log('[Create Session] Cookie domain:', cookieDomain || 'undefined (localhost)');

    // Configuração do cookie com suporte multi-tenant
    const cookieOptions: any = {
        httpOnly: true,
        secure: isProduction,
        expires: expiresAt,
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        path: '/',
    };

    // Em produção, usa 'lax' para proteção CSRF. Em dev (localhost), omitimos (default browser behavior)
    // para evitar problemas com subdomínios e localhost
    if (isProduction) {
        cookieOptions.sameSite = 'lax';
    }
    
    // Só define domain em produção (para cross-subdomain)
    if (cookieDomain) {
        cookieOptions.domain = cookieDomain;
    }

    cookies().set('session', session, cookieOptions);
}

export async function getSession(): Promise<{ userId: string; tenantId: string;[key: string]: any } | null> {
    const cookie = cookies().get('session')?.value;
    if (!cookie) {
        console.log('[Get Session] Cookie "session" NAO encontrado nos headers da requisicao.');
        const allCookies = cookies().getAll().map(c => c.name).join(', ');
        console.log('[Get Session] Cookies disponiveis:', allCookies || '(nenhum)');
        return null;
    }
    const session = await decrypt(cookie);
    if (!session) {
        console.log('[Get Session] Falha ao descriptografar sessão.');
    } else {
        // console.log('[Get Session] Sessão recuperada para usuário:', session.userId);
    }

    return session as { userId: string; tenantId: string;[key: string]: any } | null;
}

export async function deleteSession() {
    console.log('[Delete Session] Excluindo o cookie de sessão.');
    
    const cookieDomain = getCookieDomain();
    
    // Remove o cookie com as mesmas opções de domain
    if (cookieDomain) {
        cookies().delete({
            name: 'session',
            domain: cookieDomain,
            path: '/',
        });
    } else {
        cookies().delete('session');
    }
}

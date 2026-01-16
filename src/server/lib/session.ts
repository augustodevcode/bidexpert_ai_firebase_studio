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
const encodedKey = new TextEncoder().encode(secretKey);

if (!secretKey || secretKey.length < 32) {
    throw new Error('A variável de ambiente SESSION_SECRET deve ser definida e ter pelo menos 32 caracteres.');
}

// ============================================================================
// Configuração de Cookie Domain para Multi-tenant
// ============================================================================

/**
 * Obtém o domínio do cookie para suporte cross-subdomain.
 * 
 * Em produção: retorna ".bidexpert.com.br" (com ponto no início)
 * para que o cookie seja compartilhado entre todos os subdomínios.
 * 
 * Em desenvolvimento: retorna undefined (cookie funciona só no localhost)
 */
function getCookieDomain(): string | undefined {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Em desenvolvimento, não define domain (funciona em localhost)
  if (!isProduction) {
    return undefined;
  }
  
  // Usa COOKIE_DOMAIN se definido explicitamente
  if (process.env.COOKIE_DOMAIN) {
    return process.env.COOKIE_DOMAIN;
  }
  
  // Em produção, usa o APP_DOMAIN com ponto no início
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'bidexpert.com.br';
  
  // Remove porta se houver
  const domainWithoutPort = appDomain.replace(/:\d+$/, '');
  
  // Adiciona ponto no início para cross-subdomain
  // Ex: ".bidexpert.com.br" permite cookies em *.bidexpert.com.br
  return `.${domainWithoutPort}`;
}

export async function encrypt(payload: any) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(encodedKey);
}

export async function decrypt(session: string | undefined = '') {
    if (!session) return null;
    try {
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
        sameSite: 'lax' as const,
        path: '/',
    };
    
    // Só define domain em produção (para cross-subdomain)
    if (cookieDomain) {
        cookieOptions.domain = cookieDomain;
    }

    cookies().set('session', session, cookieOptions);
}

export async function getSession(): Promise<{ userId: string; tenantId: string;[key: string]: any } | null> {
    const cookie = cookies().get('session')?.value;
    if (!cookie) {
        console.log('[Get Session] Cookie "session" não encontrado.');
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

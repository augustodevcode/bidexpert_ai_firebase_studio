// src/server/lib/session.ts
import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { UserProfileWithPermissions } from '@/types';

const secretKey = process.env.SESSION_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

if (!secretKey || secretKey.length < 32) {
    throw new Error('A variável de ambiente SESSION_SECRET deve ser definida e ter pelo menos 32 caracteres.');
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
    // Simplificando o payload para ser mais leve e garantindo que tudo seja serializável
    const sessionPayload = {
        userId: user.id.toString(), // Garantir que é string
        email: user.email,
        tenantId: tenantId.toString(), // Garantir que é string
        roleNames: user.roleNames,
        permissions: user.permissions,
        sellerId: user.sellerId?.toString() || null,
        auctioneerId: user.auctioneerId?.toString() || null,
    };
    
    const session = await encrypt(sessionPayload);
    console.log('[Create Session] Token JWT gerado. Definindo cookie.');

    cookies().set('session', session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: expiresAt,
        sameSite: 'lax',
        path: '/',
    });
}

export async function getSession(): Promise<{ userId: string; tenantId: string; [key: string]: any } | null> {
    const cookie = cookies().get('session')?.value;
    const session = await decrypt(cookie);
    return session as { userId: string; tenantId: string; [key: string]: any } | null;
}

export async function deleteSession() {
    console.log('[Delete Session] Excluindo o cookie de sessão.');
    cookies().delete('session');
}

// src/server/lib/session.ts
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

    cookies().set('session', session, {
        httpOnly: true,
        secure: isProduction,
        expires: expiresAt,
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        sameSite: 'lax',
        path: '/',
    });
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
    cookies().delete('session');
}

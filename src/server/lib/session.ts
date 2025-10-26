// src/server/lib/session.ts
import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { UserProfileWithPermissions, Role, Tenant } from '@/types';
import { UserService } from '@/services/user.service'; // Movido para cá

const secretKey = process.env.SESSION_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

if (!secretKey || secretKey.length < 32) {
    throw new Error('A variável de ambiente SESSION_SECRET deve ser definida e ter pelo menos 32 caracteres.');
}

function formatUserForSession(user: any): UserProfileWithPermissions | null {
    if (!user) return null;

    const roles: Role[] = user.roles?.map((ur: any) => ur.role) || [];
    const permissions = Array.from(new Set(roles.flatMap((r: any) => r.permissions || [])));
    const tenants: Tenant[] = user.tenants?.map((ut: any) => ut.tenant) || [];
    
    return {
        ...user,
        roles,
        tenants,
        roleIds: roles.map((r: any) => r.id),
        roleNames: roles.map((r: any) => r.name),
        permissions,
        roleName: roles[0]?.name,
    };
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
        userId: user.id.toString(),
        email: user.email,
        tenantId: tenantId.toString(),
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
    let session = await decrypt(cookie);

    // Lógica de auto-login do admin em ambiente de desenvolvimento
    if (process.env.NODE_ENV === 'development' && !session) {
        console.log('[getSession] No session found in dev. Attempting admin auto-login.');
        const userService = new UserService();
        const adminUser = await userService.findUserByEmail('admin@bidexpert.com.br');
        
        if (adminUser) {
            await createSession(adminUser, '1');
            const newCookie = cookies().get('session')?.value;
            session = await decrypt(newCookie);
            console.log('[getSession] Admin auto-login successful.');
        }
    }
    
    return session as { userId: string; tenantId: string; [key: string]: any } | null;
}

export async function deleteSession() {
    console.log('[Delete Session] Excluindo o cookie de sessão.');
    cookies().delete('session');
}

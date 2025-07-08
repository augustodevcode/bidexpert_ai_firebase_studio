// src/lib/session.ts
import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { UserProfileWithPermissions } from '@/types';

const secretKey = process.env.SESSION_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

if (!secretKey || secretKey.length < 32) {
    throw new Error('A variável de ambiente SESSION_SECRET deve ser definida e ter pelo menos 32 caracteres.');
}

/**
 * Criptografa um payload para criar um token de sessão JWT.
 * @param {object} payload - Os dados a serem incluídos no token.
 * @returns {Promise<string>} O token de sessão assinado.
 */
export async function encrypt(payload: any) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d') // A sessão expira em 7 dias
        .sign(encodedKey);
}

/**
 * Descriptografa e verifica um token de sessão JWT.
 * @param {string | undefined} session - O token de sessão do cookie.
 * @returns {Promise<any | null>} O payload do token se for válido, caso contrário, null.
 */
export async function decrypt(session: string | undefined = '') {
    try {
        const { payload } = await jwtVerify(session, encodedKey, {
            algorithms: ['HS256'],
        });
        return payload;
    } catch (error) {
        console.log('Falha ao verificar a sessão JWT.');
        return null;
    }
}

/**
 * Cria uma nova sessão para o usuário e a define em um cookie HTTP-only.
 * @param {UserProfileWithPermissions} user - O objeto de perfil do usuário.
 */
export async function createSession(user: UserProfileWithPermissions) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const sessionPayload = {
        userId: user.uid,
        email: user.email,
        role: user.roleName,
        permissions: user.permissions,
        // Não inclua dados sensíveis ou muito grandes aqui
    };
    const session = await encrypt(sessionPayload);

    cookies().set('session', session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: expiresAt,
        sameSite: 'lax',
        path: '/',
    });
}

/**
 * Recupera e verifica a sessão do cookie atual.
 * @returns {Promise<any | null>} O payload da sessão se válida, senão null.
 */
export async function getSession() {
    const cookie = cookies().get('session')?.value;
    const session = await decrypt(cookie);
    return session;
}

/**
 * Exclui a sessão do usuário, removendo o cookie.
 */
export async function deleteSession() {
    cookies().delete('session');
}
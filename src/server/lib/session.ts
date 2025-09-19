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
    console.log('[Session Encrypt] Payload para ser criptografado:', payload);
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
    console.log('[Session Decrypt] Tentando decodificar a sessão do cookie.');
    if (!session) {
        console.log('[Session Decrypt] Sessão não fornecida.');
        return null;
    }
    try {
        const { payload } = await jwtVerify(session, encodedKey, {
            algorithms: ['HS256'],
        });
        console.log('[Session Decrypt] Sessão verificada com sucesso. Payload:', payload);
        return payload;
    } catch (error) {
        console.error('[Session Decrypt] Falha ao verificar a sessão JWT:', error);
        return null;
    }
}

/**
 * Cria uma nova sessão para o usuário e a define em um cookie HTTP-only.
 * @param {UserProfileWithPermissions} user - O objeto de perfil do usuário.
 * @param {string} tenantId - O ID do tenant no qual o usuário está logando.
 */
export async function createSession(user: UserProfileWithPermissions, tenantId: string) {
    if (!tenantId) {
        throw new Error('O Tenant ID é obrigatório para criar uma sessão.');
    }
    
    console.log(`[Create Session] Criando sessão para usuário ${user.email} no tenant ${tenantId}`);
    
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const sessionPayload = {
        userId: user.id,
        email: user.email,
        tenantId: tenantId, // Adiciona o tenantId ao payload da sessão
        roleNames: user.roleNames,
        permissions: user.permissions,
    };
    console.log('[Create Session] Criando payload da sessão:', sessionPayload);
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


/**
 * Recupera e verifica a sessão do cookie atual.
 * @returns {Promise<{userId: string; tenantId: string; [key: string]: any} | null>} O payload da sessão se válida, senão null.
 */
export async function getSession(): Promise<{ userId: string; tenantId: string; [key: string]: any } | null> {
    console.log('[Get Session] Tentando obter o cookie de sessão.');
    const cookie = cookies().get('session')?.value;
    if (!cookie) {
        console.log('[Get Session] Cookie de sessão não encontrado.');
        return null;
    }
    console.log('[Get Session] Cookie encontrado, prosseguindo para a decodificação.');
    const session = await decrypt(cookie);
    // Retorna a sessão, garantindo que o tipo inclua o tenantId
    return session as { userId: string; tenantId: string; [key: string]: any } | null;
}

/**
 * Exclui a sessão do usuário, removendo o cookie.
 */
export async function deleteSession() {
    console.log('[Delete Session] Excluindo o cookie de sessão.');
    cookies().delete('session');
}

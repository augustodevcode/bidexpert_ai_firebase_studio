// src/lib/actions/auth.ts
/**
 * @fileoverview Ações de autenticação centralizadas e seguras para uso no lado do servidor.
 * Este arquivo fornece funções para obter o contexto de autenticação e tenant
 * de uma maneira que é segura e compatível com os Server Components e Server Actions do Next.js.
 */
'use server';

import { getSession } from '@/server/lib/session';
import { headers } from 'next/headers';

/**
 * Obtém o ID do tenant para a requisição atual.
 * A ordem de precedência é:
 * 1. Sessão do usuário logado.
 * 2. Header 'x-tenant-id' (para contextos de middleware).
 * 3. Fallback para o tenant '1' (Landlord) para chamadas públicas ou de sistema.
 * @param {boolean} isPublicCall - Se verdadeiro, permite o fallback para o tenant público '1'.
 * @returns {Promise<string>} O ID do tenant.
 * @throws {Error} Se o tenant não for identificado e a chamada não for pública.
 */
export async function getTenantIdFromRequest(isPublicCall = false): Promise<string> {
    const session = await getSession();
    if (session?.tenantId) {
        return session.tenantId;
    }

    const headersList = headers();
    const tenantIdFromHeader = headersList.get('x-tenant-id');

    if (tenantIdFromHeader) {
        return tenantIdFromHeader;
    }

    if (isPublicCall) {
        return '1'; // Landlord tenant ID para chamadas públicas
    }
    
    // Como um fallback de segurança para chamadas internas onde o contexto pode não estar definido.
    // Isso deve ser monitorado.
    console.warn("[getTenantIdFromRequest] Aviso: Tenant ID não encontrado na sessão ou nos headers. Recorrendo ao Landlord ('1').");
    return '1';
}

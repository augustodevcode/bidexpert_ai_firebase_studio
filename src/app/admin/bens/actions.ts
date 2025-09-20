// src/app/admin/bens/actions.ts
/**
 * @fileoverview Server Actions para a entidade Bem (Ativo).
 * Este arquivo define as funções que o cliente pode chamar para interagir
 * com os dados dos bens no servidor. Ele atua como a camada de Controller,
 * recebendo as requisições, aplicando a lógica de negócio necessária (através
 * do BemService) e gerenciando o contexto de tenant e revalidação de cache.
 */
'use server';

import { revalidatePath } from 'next/cache';
import type { Bem, BemFormData } from '@/types';
import { BemService } from '@/services/bem.service';
import { getSession } from '@/app/auth/actions';
import { headers } from 'next/headers';

const bemService = new BemService();

/**
 * Obtém o tenantId do contexto da requisição (sessão ou header).
 * Essencial para garantir o isolamento de dados em um ambiente multi-tenant.
 * @param {boolean} isPublicCall - Se a chamada deve ser considerada pública, usando o tenant "Landlord".
 * @returns {Promise<string>} O ID do tenant.
 */
async function getTenantIdFromRequest(isPublicCall: boolean = false): Promise<string> {
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
        return '1'; // Landlord tenant ID for public data
    }
    
    throw new Error("Acesso não autorizado ou tenant não identificado.");
}


/**
 * Busca uma lista de bens, com filtros opcionais.
 * @param {object} filter - Objeto com filtros como `judicialProcessId` ou `sellerId`.
 * @returns {Promise<Bem[]>} Uma lista de bens.
 */
export async function getBens(filter?: { judicialProcessId?: string, sellerId?: string }): Promise<Bem[]> {
    const tenantId = await getTenantIdFromRequest();
    return bemService.getBens({ ...filter, tenantId });
}

/**
 * Busca um bem específico pelo seu ID (interno ou público).
 * @param {string} id - O ID do bem.
 * @returns {Promise<Bem | null>} O bem encontrado ou null.
 */
export async function getBem(id: string): Promise<Bem | null> {
    return bemService.getBemById(id);
}

/**
 * Cria um novo bem no banco de dados.
 * @param {BemFormData} data - Os dados do formulário do novo bem.
 * @returns {Promise<{ success: boolean; message: string; bemId?: string; }>} O resultado da operação.
 */
export async function createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string; }> {
    const tenantId = await getTenantIdFromRequest();
    const result = await bemService.createBem(tenantId, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/bens');
    }
    return result;
}

/**
 * Atualiza um bem existente.
 * @param {string} id - O ID do bem a ser atualizado.
 * @param {Partial<BemFormData>} data - Os dados a serem modificados.
 * @returns {Promise<{ success: boolean; message: string; }>} O resultado da operação.
 */
export async function updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> {
    const result = await bemService.updateBem(id, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/bens');
        revalidatePath(`/admin/bens/${id}/edit`);
    }
    return result;
}

/**
 * Exclui um bem.
 * @param {string} id - O ID do bem a ser excluído.
 * @returns {Promise<{ success: boolean; message: string; }>} O resultado da operação.
 */
export async function deleteBem(id: string): Promise<{ success: boolean; message: string; }> {
    const result = await bemService.deleteBem(id);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/bens');
    }
    return result;
}

/**
 * Busca uma lista de bens pelos seus IDs.
 * @param {string[]} ids - Um array de IDs de bens.
 * @returns {Promise<Bem[]>} Uma lista de bens.
 */
export async function getBensByIdsAction(ids: string[]): Promise<Bem[]> {
    return bemService.getBensByIds(ids);
}

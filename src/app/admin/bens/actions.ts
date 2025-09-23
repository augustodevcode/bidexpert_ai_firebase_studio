// src/app/admin/assets/actions.ts
/**
 * @fileoverview Server Actions para a entidade Asset (Ativo).
 * Este arquivo define as funções que o cliente pode chamar para interagir
 * com os dados dos bens no servidor. Ele atua como a camada de Controller,
 * recebendo as requisições, aplicando a lógica de negócio necessária (através
 * do AssetService) e gerenciando o contexto de tenant e revalidação de cache.
 */
'use server';

import { revalidatePath } from 'next/cache';
import type { Asset, AssetFormData } from '@/types';
import { AssetService } from '@/services/asset.service';
import { getSession } from '@/app/auth/actions';
import { headers } from 'next/headers';

const assetService = new AssetService();

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
 * @returns {Promise<Asset[]>} Uma lista de bens.
 */
export async function getAssets(filter?: { judicialProcessId?: string, sellerId?: string }): Promise<Asset[]> {
    const tenantId = await getTenantIdFromRequest();
    return assetService.getAssets({ ...filter, tenantId });
}

/**
 * Busca um bem específico pelo seu ID (interno ou público).
 * @param {string} id - O ID do bem.
 * @returns {Promise<Asset | null>} O bem encontrado ou null.
 */
export async function getAsset(id: string): Promise<Asset | null> {
    return assetService.getAssetById(id);
}

/**
 * Cria um novo bem no banco de dados.
 * @param {AssetFormData} data - Os dados do formulário do novo bem.
 * @returns {Promise<{ success: boolean; message: string; assetId?: string; }>} O resultado da operação.
 */
export async function createAsset(data: AssetFormData): Promise<{ success: boolean; message: string; assetId?: string; }> {
    const tenantId = await getTenantIdFromRequest();
    const result = await assetService.createAsset(tenantId, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/assets');
    }
    return result;
}

/**
 * Atualiza um bem existente.
 * @param {string} id - O ID do bem a ser atualizado.
 * @param {Partial<AssetFormData>} data - Os dados a serem modificados.
 * @returns {Promise<{ success: boolean; message: string; }>} O resultado da operação.
 */
export async function updateAsset(id: string, data: Partial<AssetFormData>): Promise<{ success: boolean; message: string; }> {
    const result = await assetService.updateAsset(id, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/assets');
        revalidatePath(`/admin/assets/${id}/edit`);
    }
    return result;
}

/**
 * Exclui um bem.
 * @param {string} id - O ID do bem a ser excluído.
 * @returns {Promise<{ success: boolean; message: string; }>} O resultado da operação.
 */
export async function deleteAsset(id: string): Promise<{ success: boolean; message: string; }> {
    const result = await assetService.deleteAsset(id);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/assets');
    }
    return result;
}

/**
 * Busca uma lista de bens pelos seus IDs.
 * @param {string[]} ids - Um array de IDs de bens.
 * @returns {Promise<Asset[]>} Uma lista de bens.
 */
export async function getAssetsByIdsAction(ids: string[]): Promise<Asset[]> {
    return assetService.getAssetsByIds(ids);
}

export async function getBensForLotting(filter?: { judicialProcessId?: string, sellerId?: string }): Promise<Asset[]> {
    const tenantId = await getTenantIdFromRequest();
    return assetService.getAssets({ ...filter, tenantId });
}

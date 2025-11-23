// src/app/admin/assets/actions.ts
/**
 * @fileoverview Server Actions para a entidade Asset (Ativo).
 * Este arquivo define as funções que o cliente pode chamar para interagir
 * com os dados dos ativos no servidor. Ele atua como a camada de Controller,
 * recebendo as requisições, aplicando a lógica de negócio necessária (através
 * do AssetService) e gerenciando o contexto de tenant e revalidação de cache.
 */
'use server';

import { revalidatePath } from 'next/cache';
import type { Asset, AssetFormData } from '@/types';
import { AssetService } from '@/services/asset.service';
import { getTenantIdFromRequest } from '@/lib/actions/auth';
import { sanitizeResponse } from '@/lib/serialization-helper';

const assetService = new AssetService();

/**
 * Busca uma lista de ativos, com filtros opcionais.
 * @param {object} filter - Objeto com filtros como `judicialProcessId` ou `sellerId`.
 * @returns {Promise<Asset[]>} Uma lista de ativos.
 */
export async function getAssets(filter?: { judicialProcessId?: string, sellerId?: string, status?: string }): Promise<Asset[]> {
    console.log('getAssets called');
    const tenantId = await getTenantIdFromRequest();
    const result = await assetService.getAssets({ ...filter, tenantId });
    return sanitizeResponse(result);
}

/**
 * Busca um ativo específico pelo seu ID (interno ou público).
 * @param {string} id - O ID do ativo.
 * @returns {Promise<Asset | null>} O ativo encontrado ou null.
 */
export async function getAsset(id: string): Promise<Asset | null> {
    const tenantId = await getTenantIdFromRequest();
    const result = await assetService.getAssetById(tenantId, id);
    return sanitizeResponse(result);
}

/**
 * Cria um novo ativo no banco de dados.
 * @param {AssetFormData} data - Os dados do formulário do novo ativo.
 * @returns {Promise<{ success: boolean; message: string; assetId?: string; }>} O resultado da operação.
 */
export async function createAsset(data: AssetFormData): Promise<{ success: boolean; message: string; assetId?: string; }> {
    console.log('createAsset called with data:', JSON.stringify(data)); // Debug
    const tenantId = await getTenantIdFromRequest();
    const result = await assetService.createAsset(tenantId, data);
    console.log('createAsset result:', JSON.stringify(result)); // Debug
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/assets');
    }
    return result;
}

/**
 * Atualiza um ativo existente.
 * @param {string} id - O ID do ativo a ser atualizado.
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
 * Exclui um ativo.
 * @param {string} id - O ID do ativo a ser excluído.
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
 * Busca uma lista de ativos pelos seus IDs.
 * @param {string[]} ids - Um array de IDs de ativos.
 * @returns {Promise<Asset[]>} Uma lista de ativos.
 */
export async function getAssetsByIdsAction(ids: string[]): Promise<Asset[]> {
    return assetService.getAssetsByIds(ids);
}

export async function getAssetsForLotting(filter?: { judicialProcessId?: string, sellerId?: string }): Promise<Asset[]> {
    const tenantId = await getTenantIdFromRequest();
    return assetService.getAssets({ ...filter, tenantId, status: 'DISPONIVEL' });
}

// src/app/consignor-dashboard/actions.ts
'use server';

import { updateSeller } from '@/app/admin/sellers/actions';
import type { SellerFormData } from '@bidexpert/core';

/**
 * Atualiza o perfil de um comitente.
 * Esta é uma Server Action específica para o dashboard do comitente.
 * @param sellerId O ID do comitente a ser atualizado.
 * @param data Os dados a serem atualizados.
 * @returns O resultado da operação de atualização.
 */
export async function atualizarPerfilComitente(sellerId: string, data: Partial<SellerFormData>) {
    if (!sellerId) {
        return { success: false, message: "ID do comitente não encontrado. Não é possível salvar." };
    }
    // Reutiliza a ação principal de atualização de comitente
    return updateSeller(sellerId, data);
}
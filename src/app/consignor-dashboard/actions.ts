// src/app/consignor-dashboard/actions.ts
/**
 * @fileoverview Server Actions para o Painel do Comitente.
 * Este arquivo contém ações que são específicas para o dashboard do comitente,
 * como a atualização do seu próprio perfil. Ele atua como um invólucro
 * para as ações de administração mais genéricas, garantindo que o contexto
 * correto seja aplicado.
 */
'use server';

import { updateSeller } from '@/app/admin/sellers/actions';
import type { Partial } from '@/types'; // Assuming Partial is in types
import type { SellerFormData } from '@/types'; // Assuming SellerFormData is in types

export async function updateConsignorProfile(sellerId: string, data: Partial<SellerFormData>) {
    if (!sellerId) {
        return { success: false, message: "ID do comitente não encontrado. Não é possível salvar." };
    }
    return updateSeller(sellerId, data);
}

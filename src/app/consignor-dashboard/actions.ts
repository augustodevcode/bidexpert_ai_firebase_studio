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
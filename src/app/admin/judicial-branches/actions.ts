// src/app/admin/judicial-branches/actions.ts
/**
 * @fileoverview Server Actions para a entidade JudicialBranch (Vara Judicial).
 * Este arquivo define as funções que o cliente pode chamar para executar
 * operações de CRUD (Criar, Ler, Atualizar, Excluir) nas varas. As ações
 * invocam a JudicialBranchService para aplicar a lógica de negócio, garantir
 * a consistência dos dados e revalidar o cache quando necessário.
 */
'use server';

import { revalidatePath } from 'next/cache';
import type { JudicialBranch, JudicialBranchFormData } from '@/types';
import { JudicialBranchService } from '@/services/judicial-branch.service';

const judicialBranchService = new JudicialBranchService();

export async function getJudicialBranches(): Promise<JudicialBranch[]> {
    return judicialBranchService.getJudicialBranches();
}

export async function getJudicialBranch(id: string): Promise<JudicialBranch | null> {
    return judicialBranchService.getJudicialBranchById(id);
}

export async function createJudicialBranch(data: JudicialBranchFormData): Promise<{ success: boolean; message: string; branchId?: string; }> {
    const result = await judicialBranchService.createJudicialBranch(data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/judicial-branches');
    }
    return result;
}

export async function updateJudicialBranch(id: string, data: Partial<JudicialBranchFormData>): Promise<{ success: boolean; message: string; }> {
    const result = await judicialBranchService.updateJudicialBranch(id, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/judicial-branches');
        revalidatePath(`/admin/judicial-branches/${id}/edit`);
    }
    return result;
}

export async function deleteJudicialBranch(id: string): Promise<{ success: boolean; message: string; }> {
    const result = await judicialBranchService.deleteJudicialBranch(id);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/judicial-branches');
    }
    return result;
}

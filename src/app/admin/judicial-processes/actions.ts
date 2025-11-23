// src/app/admin/judicial-processes/actions.ts
/**
 * @fileoverview Server Actions para a entidade JudicialProcess (Processo Judicial).
 * Este arquivo funciona como a camada de Controller para todas as operações de CRUD
 * relacionadas a processos judiciais, garantindo a aplicação correta do contexto
 * de tenant e revalidando o cache do Next.js quando ocorrem mutações de dados.
 * Ele delega a lógica de negócio para a `JudicialProcessService`.
 */
'use server';

import type { JudicialProcess, JudicialProcessFormData } from '@/types';
import { revalidatePath } from 'next/cache';
import { JudicialProcessService } from '@/services/judicial-process.service';
import { getTenantIdFromRequest } from '@/lib/actions/auth';
import { sanitizeResponse } from '@/lib/serialization-helper';

const judicialProcessService = new JudicialProcessService();


export async function getJudicialProcesses(tenantId?: string): Promise<JudicialProcess[]> {
    const id = tenantId || await getTenantIdFromRequest();
    const result = await judicialProcessService.getJudicialProcesses(id);
    return sanitizeResponse(result);
}

export async function getJudicialProcess(id: string): Promise<JudicialProcess | null> {
    const tenantId = await getTenantIdFromRequest();
    return judicialProcessService.getJudicialProcessById(tenantId, id);
}

export async function createJudicialProcessAction(data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: string; }> {
    const tenantId = await getTenantIdFromRequest();
    const result = await judicialProcessService.createJudicialProcess(tenantId, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/judicial-processes');
    }
    return result;
}

export async function updateJudicialProcessAction(id: string, data: Partial<JudicialProcessFormData>): Promise<{ success: boolean; message: string; }> {
    const tenantId = await getTenantIdFromRequest();
    const result = await judicialProcessService.updateJudicialProcess(tenantId, id, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/judicial-processes');
        revalidatePath(`/admin/judicial-processes/${id}/edit`);
    }
    return result;
}

export async function deleteJudicialProcess(id: string): Promise<{ success: boolean; message: string; }> {
    const tenantId = await getTenantIdFromRequest();
    const result = await judicialProcessService.deleteJudicialProcess(tenantId, id);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/judicial-processes');
    }
    return result;
}

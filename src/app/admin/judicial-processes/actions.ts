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
import { getSession } from '@/app/auth/actions';
import { headers } from 'next/headers';

const judicialProcessService = new JudicialProcessService();

async function getTenantIdFromRequest(): Promise<string> {
    const session = await getSession();
    if (session?.tenantId) {
        return session.tenantId;
    }

    const headersList = headers();
    const tenantIdFromHeader = headersList.get('x-tenant-id');

    if (tenantIdFromHeader) {
        return tenantIdFromHeader;
    }
    
    // Unlike other actions, judicial processes likely should not have a public fallback.
    // Throwing an error here is safer if no context can be found.
    throw new Error("Acesso não autorizado ou tenant não identificado.");
}


export async function getJudicialProcesses(tenantId?: string): Promise<JudicialProcess[]> {
    const id = tenantId || await getTenantIdFromRequest();
    return judicialProcessService.getJudicialProcesses(id);
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

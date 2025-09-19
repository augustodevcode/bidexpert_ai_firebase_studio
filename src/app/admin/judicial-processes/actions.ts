// src/app/admin/judicial-processes/actions.ts
'use server';

import type { JudicialProcess, JudicialProcessFormData } from '@/types';
import { revalidatePath } from 'next/cache';
import { JudicialProcessService } from '@/services/judicial-process.service';
import { getSession } from '@/app/auth/actions';

const judicialProcessService = new JudicialProcessService();

async function getTenantIdFromSession(): Promise<string> {
    const session = await getSession();
    // For judicial processes, we must have a tenant context. No public fallback.
    if (!session?.tenantId) {
        throw new Error("Acesso não autorizado ou tenant não identificado.");
    }
    return session.tenantId;
}

export async function getJudicialProcesses(tenantId?: string): Promise<JudicialProcess[]> {
    const id = tenantId || await getTenantIdFromSession();
    return judicialProcessService.getJudicialProcesses(id);
}

export async function getJudicialProcess(id: string): Promise<JudicialProcess | null> {
    const tenantId = await getTenantIdFromSession();
    return judicialProcessService.getJudicialProcessById(tenantId, id);
}

export async function createJudicialProcessAction(data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: string; }> {
    const tenantId = await getTenantIdFromSession();
    const result = await judicialProcessService.createJudicialProcess(tenantId, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/judicial-processes');
    }
    return result;
}

export async function updateJudicialProcessAction(id: string, data: Partial<JudicialProcessFormData>): Promise<{ success: boolean; message: string; }> {
    const tenantId = await getTenantIdFromSession();
    const result = await judicialProcessService.updateJudicialProcess(tenantId, id, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/judicial-processes');
        revalidatePath(`/admin/judicial-processes/${id}/edit`);
    }
    return result;
}

export async function deleteJudicialProcess(id: string): Promise<{ success: boolean; message: string; }> {
    const tenantId = await getTenantIdFromSession();
    const result = await judicialProcessService.deleteJudicialProcess(tenantId, id);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/judicial-processes');
    }
    return result;
}
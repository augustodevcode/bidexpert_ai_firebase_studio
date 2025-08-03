
// src/app/admin/judicial-processes/actions.ts
'use server';

import type { JudicialProcess, JudicialProcessFormData } from '@/types';
import { revalidatePath } from 'next/cache';
import { JudicialProcessService } from '@/services/judicial-process.service';

const judicialProcessService = new JudicialProcessService();

export async function getJudicialProcesses(): Promise<JudicialProcess[]> {
    return judicialProcessService.getJudicialProcesses();
}

export async function getJudicialProcess(id: string): Promise<JudicialProcess | null> {
    return judicialProcessService.getJudicialProcessById(id);
}

export async function createJudicialProcessAction(data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: string; }> {
    const result = await judicialProcessService.createJudicialProcess(data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/judicial-processes');
    }
    return result;
}

export async function updateJudicialProcessAction(id: string, data: Partial<JudicialProcessFormData>): Promise<{ success: boolean; message: string; }> {
    const result = await judicialProcessService.updateJudicialProcess(id, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/judicial-processes');
        revalidatePath(`/admin/judicial-processes/${id}/edit`);
    }
    return result;
}

export async function deleteJudicialProcess(id: string): Promise<{ success: boolean; message: string; }> {
    const result = await judicialProcessService.deleteJudicialProcess(id);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/judicial-processes');
    }
    return result;
}

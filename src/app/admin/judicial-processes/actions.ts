// src/app/admin/judicial-processes/actions.ts
'use server';

import type { JudicialProcessFormData } from '@bidexpert/core';
import { JudicialProcessService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const judicialProcessService = new JudicialProcessService();

const processActions = createCrudActions({
    service: judicialProcessService,
    entityName: 'JudicialProcess',
    entityNamePlural: 'JudicialProcesses',
    routeBase: '/admin/judicial-processes'
});

export const {
    getAll: getJudicialProcesses,
    getById: getJudicialProcess,
    delete: deleteJudicialProcess,
} = processActions;

// Manter as actions de create e update que possuem lógica customizada
export async function createJudicialProcessAction(data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: string; }> {
    return judicialProcessService.createJudicialProcess(data);
}

export async function updateJudicialProcessAction(id: string, data: Partial<JudicialProcessFormData>): Promise<{ success: boolean; message: string; }> {
    return judicialProcessService.updateJudicialProcess(id, data);
}

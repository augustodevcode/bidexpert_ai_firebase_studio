
// src/app/admin/judicial-processes/actions.ts
'use server';

import type { JudicialProcessFormData } from '@bidexpert/core';
import { JudicialProcessService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const judicialProcessService = new JudicialProcessService();

const { 
  obterTodos: getJudicialProcesses, 
  obterPorId: getJudicialProcess, 
  excluir: deleteJudicialProcess,
  criar: createJudicialProcessAction,
  atualizar: updateJudicialProcessAction,
} = createCrudActions({
    service: judicialProcessService,
    entityName: 'Processo Judicial',
    routeBase: '/admin/judicial-processes'
});

export { getJudicialProcesses, getJudicialProcess, deleteJudicialProcess, createJudicialProcessAction, updateJudicialProcessAction };


// src/app/admin/judicial-branches/actions.ts
'use server';

import { JudicialBranchService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const judicialBranchService = new JudicialBranchService();

const { 
  obterTodos: getJudicialBranches, 
  obterPorId: getJudicialBranch, 
  criar: createJudicialBranch, 
  atualizar: updateJudicialBranch, 
  excluir: deleteJudicialBranch 
} = createCrudActions({
    service: judicialBranchService,
    entityName: 'Vara Judicial',
    routeBase: '/admin/judicial-branches'
});

export { getJudicialBranches, getJudicialBranch, createJudicialBranch, updateJudicialBranch, deleteJudicialBranch };

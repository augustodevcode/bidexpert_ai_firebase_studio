// src/app/admin/bens/actions.ts
'use server';

import { BemService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const bemService = new BemService();

const { 
  obterTodos: getBens, 
  obterPorId: getBem, 
  criar: createBem, 
  atualizar: updateBem, 
  excluir: deleteBem 
} = createCrudActions({
  service: bemService,
  entityName: 'Bem',
  routeBase: '/admin/bens',
});

export { getBens, getBem, createBem, updateBem, deleteBem };


export async function getBensByIdsAction(ids: string[]) {
    return bemService.getBensByIds(ids);
}

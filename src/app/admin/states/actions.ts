// src/app/admin/states/actions.ts
'use server';

import { StateService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const stateService = new StateService();

const { 
  obterTodos: getStates, 
  obterPorId: getState, 
  criar: createState, 
  atualizar: updateState, 
  excluir: deleteState 
} = createCrudActions({
  service: stateService,
  entityName: 'Estado',
  routeBase: '/admin/states',
});

export { getStates, getState, createState, updateState, deleteState };

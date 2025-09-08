// src/app/admin/courts/actions.ts
'use server';

import { CourtService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const courtService = new CourtService();

const { 
  obterTodos: getCourts, 
  obterPorId: getCourt, 
  criar: createCourt, 
  atualizar: updateCourt, 
  excluir: deleteCourt 
} = createCrudActions({
  service: courtService,
  entityName: 'Tribunal',
  routeBase: '/admin/courts',
});

export { getCourts, getCourt, createCourt, updateCourt, deleteCourt };

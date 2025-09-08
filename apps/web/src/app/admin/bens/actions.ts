// src/app/admin/bens/actions.ts
'use server';

import { BemService } from '@bidexpert/core';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const bemService = new BemService();
const bemActions = createCrudActions({
  service: bemService,
  entityName: 'Bem',
  entityNamePlural: 'Bens',
  routeBase: '/admin/bens',
});

export const {
    getAll: getBens,
    getById: getBem,
    create: createBem,
    update: updateBem,
    delete: deleteBem,
} = bemActions;


export async function getBensByIdsAction(ids: string[]) {
    return bemService.getBensByIds(ids);
}

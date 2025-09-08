// src/app/admin/states/actions.ts
'use server';

import { StateService } from '@bidexpert/core';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const stateService = new StateService();
const stateActions = createCrudActions({
  service: stateService,
  entityName: 'State',
  entityNamePlural: 'States',
  routeBase: '/admin/states',
});

export const {
  getAll: getStates,
  getById: getState,
  create: createState,
  update: updateState,
  delete: deleteState,
} = stateActions;

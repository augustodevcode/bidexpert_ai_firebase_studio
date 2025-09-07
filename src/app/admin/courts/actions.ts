// src/app/admin/courts/actions.ts
'use server';

import { CourtService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const courtService = new CourtService();
const courtActions = createCrudActions({
  service: courtService,
  entityName: 'Court',
  entityNamePlural: 'Courts',
  routeBase: '/admin/courts',
});

export const {
  getAll: getCourts,
  getById: getCourt,
  create: createCourt,
  update: updateCourt,
  delete: deleteCourt,
} = courtActions;

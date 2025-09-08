// src/app/admin/roles/actions.ts
'use server';

import { RoleService } from '@bidexpert/core';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const roleService = new RoleService();
const roleActions = createCrudActions({
  service: roleService,
  entityName: 'Role',
  entityNamePlural: 'Roles',
  routeBase: '/admin/roles',
});

export const {
  getAll: getRoles,
  getById: getRole,
  create: createRole,
  update: updateRole,
  delete: deleteRole,
} = roleActions;

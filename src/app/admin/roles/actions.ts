// src/app/admin/roles/actions.ts
'use server';

import { RoleService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const roleService = new RoleService();

const { 
  obterTodos: getRoles, 
  obterPorId: getRole, 
  criar: createRole, 
  atualizar: updateRole, 
  excluir: deleteRole 
} = createCrudActions({
  service: roleService,
  entityName: 'Perfil',
  routeBase: '/admin/roles',
});

export { getRoles, getRole, createRole, updateRole, deleteRole };

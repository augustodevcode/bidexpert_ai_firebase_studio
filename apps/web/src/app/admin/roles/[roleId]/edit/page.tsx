// src/app/admin/roles/[roleId]/edit/page.tsx
'use client';

import React, { useCallback } from 'react';
import RoleForm from '../../role-form';
import { getRole, updateRole, deleteRole } from '../../actions';
import type { RoleFormData } from '@bidexpert/core';
import FormPageLayout from '@/components/admin/form-page-layout';
import { ShieldCheck } from 'lucide-react';

export default function EditRolePage({ params }: { params: { roleId: string } }) {
  const handleUpdate = useCallback(async (id: string, data: RoleFormData) => {
    return updateRole(id, data);
  }, []);

  return (
    <FormPageLayout
      pageTitle="Perfil"
      fetchAction={() => getRole(params.roleId)}
      deleteAction={deleteRole}
      entityId={params.roleId}
      entityName="Perfil de Usuário"
      routeBase="/admin/roles"
      icon={ShieldCheck}
    >
      {(initialData) => (
        <RoleForm
          initialData={initialData}
          onSubmitAction={(data) => handleUpdate(params.roleId, data)}
        />
      )}
    </FormPageLayout>
  );
}

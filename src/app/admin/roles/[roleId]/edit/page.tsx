// src/app/admin/roles/[roleId]/edit/page.tsx
/**
 * @fileoverview Página de edição para um Perfil de Usuário (Role) específico.
 * Este componente Server-Side busca os dados iniciais do perfil a ser editado
 * e os passa para o `RoleForm`. A ação de atualização (`handleUpdateRole`)
 * também é definida aqui e passada como prop, permitindo a modificação de
 * um perfil de usuário existente.
 */
import RoleForm from '../../role-form';
import { getRole, updateRole, type RoleFormData } from '../../actions';
import { notFound } from 'next/navigation';

export default async function EditRolePage({ params }: { params: { roleId: string } }) {
  const roleId = params.roleId;
  const role = await getRole(roleId);

  if (!role) {
    notFound();
  }

  async function handleUpdateRole(data: Partial<RoleFormData>) {
    'use server';
    return updateRole(roleId, data);
  }

  return (
    <RoleForm
      initialData={role}
      onSubmitAction={handleUpdateRole}
      formTitle="Editar Perfil de Usuário"
      formDescription="Modifique os detalhes do perfil existente."
      submitButtonText="Salvar Alterações"
    />
  );
}

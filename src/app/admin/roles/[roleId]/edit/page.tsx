
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

    
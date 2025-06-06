
import RoleForm from '../role-form';
import { createRole, type RoleFormData } from '../actions';

export default async function NewRolePage() {
  async function handleCreateRole(data: RoleFormData) {
    'use server';
    return createRole(data);
  }

  return (
    <RoleForm
      onSubmitAction={handleCreateRole}
      formTitle="Novo Perfil de Usuário"
      formDescription="Defina o nome, descrição e permissões para um novo perfil."
      submitButtonText="Criar Perfil"
    />
  );
}

    
// src/app/admin/roles/new/page.tsx
/**
 * @fileoverview Página para criação de um novo Perfil de Usuário.
 * Este componente Server-Side renderiza o `RoleForm` para entrada de dados
 * e passa a server action `createRole` para persistir o novo registro,
 * permitindo a criação de novos papéis com diferentes conjuntos de permissões.
 */
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

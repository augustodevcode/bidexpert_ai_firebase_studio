// src/app/admin/users/new/page.tsx
import UserForm from '../user-form';
import { createUser, type UserFormData } from '../actions'; 
import { getRoles } from '@/app/admin/roles/actions'; 

export default async function NewUserPage() {
  const roles = await getRoles(); 

  async function handleCreateUser(data: UserFormData) {
    'use server';
    return createUser(data); 
  }

  return (
    <UserForm
      roles={roles}
      onSubmitAction={handleCreateUser}
      formTitle="Novo Usuário"
      formDescription="Preencha os detalhes para criar uma nova conta de usuário na plataforma."
      submitButtonText="Criar Usuário"
    />
  );
}

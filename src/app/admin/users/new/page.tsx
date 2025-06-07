
// src/app/admin/users/new/page.tsx
import UserForm from '../user-form';
import { createUser, type UserFormData } from '../actions'; // Renomeado para UserFormData e createUser
import { getRoles } from '@/app/admin/roles/actions';

export default async function NewUserPage() {
  const roles = await getRoles();

  async function handleCreateUser(data: UserFormData) {
    'use server';
    // A action `createUser` lidará apenas com a criação no Firestore por enquanto.
    // A criação no Firebase Auth pelo admin é mais complexa.
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

    
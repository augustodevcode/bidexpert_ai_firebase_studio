// src/app/admin/users/new/page.tsx
import UserForm from '../user-form';
import { getRoles } from '@/app/admin/roles/actions'; 

export default async function NewUserPage() {
  const roles = await getRoles(); 

  return (
    <UserForm
      roles={roles}
      formTitle="Novo Usuário"
      formDescription="Preencha os detalhes para criar uma nova conta de usuário na plataforma."
      submitButtonText="Criar Usuário"
    />
  );
}

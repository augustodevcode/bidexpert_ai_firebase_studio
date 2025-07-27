// src/app/admin/users/[userId]/edit/page.tsx
import UserProfileForm from '../../user-profile-form'; // Importando o novo formulário de perfil
import UserRoleForm from '../../user-role-form';
import { getUserProfileData, updateUserProfile, updateUserRoles } from '../../actions'; 
import { getRoles } from '@/app/admin/roles/actions'; 
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default async function EditUserPage({ params }: { params: { userId: string } }) {
  const userId = params.userId;
  
  const [userProfile, roles] = await Promise.all([
      getUserProfileData(userId),
      getRoles()
  ]);

  if (!userProfile) {
     return (
        <div className="max-w-2xl mx-auto p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Usuário Não Encontrado</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>O perfil de usuário com o ID "{userId}" não foi encontrado ou ocorreu um erro ao carregá-lo.</p>
                </CardContent>
            </Card>
        </div>
     );
  }

  // Ação para o formulário de perfil
  async function handleUpdateUserProfile(data: any) {
    'use server';
    return updateUserProfile(userId, data);
  }

  // Ação para o formulário de roles
  async function handleUpdateUserRoles(uid: string, roleIds: string[]) {
    'use server';
    return updateUserRoles(uid, roleIds);
  }
  
  return (
    <div className="space-y-6">
      <UserProfileForm
        initialData={userProfile}
        onSubmitAction={handleUpdateUserProfile}
      />

      <Separator />

      <UserRoleForm
        user={userProfile
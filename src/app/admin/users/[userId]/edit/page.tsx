
// src/app/admin/users/[userId]/edit/page.tsx
import UserRoleForm from '../../user-role-form'; 
import { getUserProfileData, updateUserRole } from '../../actions'; 
// Importar a Server Action getRoles de roles/actions.ts
import { getRoles } from '@/app/admin/roles/actions'; 
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FileText, Mail, Phone, UserCircle, MapPin, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { UserProfileData } from '@/types'; 


export default async function EditUserPage({ params }: { params: { userId: string } }) {
  const userId = params.userId;
  
  let userProfile: UserProfileData | null = null;
  try {
    userProfile = await getUserProfileData(userId);
  } catch (error) {
    console.error("Failed to fetch user profile for edit:", error);
  }
  
  // Chamar a Server Action getRoles
  const roles = await getRoles(); 

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

  async function handleUpdateUserRole(uid: string, roleId: string | null) {
    'use server';
    return updateUserRole(uid, roleId);
  }
  
  const formattedDateOfBirth = userProfile.dateOfBirth ? format(new Date(userProfile.dateOfBirth), 'dd/MM/yyyy', { locale: ptBR }) : 'Não informado';
  const formattedRgIssueDate = userProfile.rgIssueDate ? format(new Date(userProfile.rgIssueDate), 'dd/MM/yyyy', { locale: ptBR }) : 'Não informado';

  return (
    <div className="space-y-6">
      <UserRoleForm
        user={userProfile}
        roles={roles}
        onSubmitAction={handleUpdateUserRole}
      />

      <Card className="max-w-lg mx-auto shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Detalhes do Usuário</CardTitle>
          <CardDescription>Informações adicionais do perfil (somente leitura).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
           <div className="flex items-center">
            <UserCircle className="h-4 w-4 mr-2 text-muted-foreground" />
            <strong>Nome:</strong> <span className="ml-1 text-muted-foreground">{userProfile.fullName || 'Não informado'}</span>
          </div>
           <div className="flex items-center">
            <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
            <strong>Email:</strong> <span className="ml-1 text-muted-foreground">{userProfile.email}</span>
          </div>
          <div className="flex items-center">
            <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
            <strong>CPF:</strong> <span className="ml-1 text-muted-foreground">{userProfile.cpf || 'Não informado'}</span>
          </div>
          <div className="flex items-center">
            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
            <strong>Celular:</strong> <span className="ml-1 text-muted-foreground">{userProfile.cellPhone || 'Não informado'}</span>
          </div>
          <div className="flex items-center">
            <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
            <strong>Data de Nasc.:</strong> <span className="ml-1 text-muted-foreground">{formattedDateOfBirth}</span>
          </div>
           <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
            <strong>Endereço:</strong> <span className="ml-1 text-muted-foreground">
                {userProfile.street || 'Rua não informada'}, {userProfile.number || 'S/N'} - {userProfile.neighborhood || 'Bairro não informado'}, {userProfile.city || 'Cidade não informada'} - {userProfile.state || 'UF'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

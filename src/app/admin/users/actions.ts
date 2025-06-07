
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  deleteDoc as deleteFirestoreDoc, 
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
  where,
  limit,
  FieldValue, 
} from 'firebase/firestore';
import type { UserProfileData, Role, UserHabilitationStatus } from '@/types';
import { getRoleByName, ensureDefaultRolesExist, getRole } from '@/app/admin/roles/actions';

function safeConvertToDate(timestampField: any): Date | null {
  if (!timestampField) return null;
  if (timestampField.toDate && typeof timestampField.toDate === 'function') {
    return timestampField.toDate();
  }
  if (typeof timestampField === 'object' && timestampField !== null &&
      typeof timestampField.seconds === 'number' && typeof timestampField.nanoseconds === 'number') {
    return new Date(timestampField.seconds * 1000 + timestampField.nanoseconds / 1000000);
  }
  if (timestampField instanceof Date) return timestampField;
  const parsedDate = new Date(timestampField);
  if (!isNaN(parsedDate.getTime())) return parsedDate;
  console.warn(`[users/actions] Could not convert timestamp to Date: ${JSON.stringify(timestampField)}. Returning null.`);
  return null;
}

export async function getUsersWithRoles(): Promise<UserProfileData[]> {
  console.log("[getUsersWithRoles] Iniciando busca de usuários...");
  try {
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, orderBy('fullName', 'asc'));
    const snapshot = await getDocs(q);
    console.log(`[getUsersWithRoles] Found ${snapshot.docs.length} user documents.`);

    const users = await Promise.all(snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      let roleName: string | undefined = undefined;
      if (data.roleId) {
        const roleDoc = await getRole(data.roleId);
        if (roleDoc) {
          roleName = roleDoc.name;
        } else {
          console.warn(`[getUsersWithRoles] Role with ID ${data.roleId} not found for user ${docSnap.id}`);
        }
      }
      return {
        uid: docSnap.id,
        email: data.email,
        fullName: data.fullName,
        roleId: data.roleId,
        roleName: roleName || 'N/A',
        status: data.status || 'ATIVO',
        habilitationStatus: data.habilitationStatus || 'PENDENTE_DOCUMENTOS',
        createdAt: safeConvertToDate(data.createdAt),
      } as UserProfileData;
    }));
    console.log(`[getUsersWithRoles] Mapeados ${users.length} usuários com perfis.`);
    return users;
  } catch (error: any) {
    console.error("[getUsersWithRoles] Error fetching users:", error.message, error.code);
    console.error("[getUsersWithRoles] Error details:", error.details);
    return [];
  }
}

export async function getUserProfileData(userId: string): Promise<UserProfileData | null> {
  console.log(`[getUserProfileData] Buscando perfil para UID: ${userId}`);
  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      let roleName: string | undefined = undefined;
      if (data.roleId) {
        const roleDoc = await getRole(data.roleId);
        if (roleDoc) {
          roleName = roleDoc.name;
        } else {
           console.warn(`[getUserProfileData] Role com ID ${data.roleId} não encontrada para usuário ${userId}`);
        }
      }
      console.log(`[getUserProfileData] Perfil encontrado para UID: ${userId}, RoleName: ${roleName}`);
      return {
        uid: docSnap.id,
        ...data,
        roleName: roleName || 'N/A',
        habilitationStatus: data.habilitationStatus || 'PENDENTE_DOCUMENTOS',
        createdAt: safeConvertToDate(data.createdAt),
        updatedAt: safeConvertToDate(data.updatedAt),
        dateOfBirth: safeConvertToDate(data.dateOfBirth),
        rgIssueDate: safeConvertToDate(data.rgIssueDate),
      } as UserProfileData;
    }
    console.log(`[getUserProfileData] Nenhum perfil encontrado para UID: ${userId}`);
    return null;
  } catch (error: any) {
    console.error(`[getUserProfileData] ERRO ao buscar perfil para UID ${userId}:`, error.message, error.code);
    return null;
  }
}


export async function updateUserProfileAndRole(
  userId: string,
  data: { roleId?: string | null; habilitationStatus?: UserHabilitationStatus | null }
): Promise<{ success: boolean; message: string }> {
  if (!userId) {
    return { success: false, message: 'ID do usuário é obrigatório.' };
  }
  console.log(`[updateUserProfileAndRole] Tentando atualizar usuário ${userId} com dados:`, data);

  try {
    const userDocRef = doc(db, 'users', userId);
    const updateData: { roleId?: string | null; roleName?: string | null; habilitationStatus?: UserHabilitationStatus | null; updatedAt: any } = {
      updatedAt: serverTimestamp(),
    };

    if (data.hasOwnProperty('roleId')) {
      if (data.roleId) {
          console.log(`[updateUserProfileAndRole] Tentando definir roleId: ${data.roleId}`);
          const roleDoc = await getRole(data.roleId);
          if (roleDoc) {
              console.log(`[updateUserProfileAndRole] Perfil encontrado: ${roleDoc.name}`);
              updateData.roleId = data.roleId;
              updateData.roleName = roleDoc.name;
          } else {
              console.warn(`[updateUserProfileAndRole] Perfil com ID ${data.roleId} não encontrado.`);
              return { success: false, message: 'Perfil (Role) não encontrado.'};
          }
      } else { 
          console.log(`[updateUserProfileAndRole] Definindo roleId e roleName para null`);
          updateData.roleId = null;
          updateData.roleName = null;
          (updateData as any).role = FieldValue.delete(); 
      }
    }

    if (data.hasOwnProperty('habilitationStatus')) {
        console.log(`[updateUserProfileAndRole] Definindo habilitationStatus para: ${data.habilitationStatus}`);
        updateData.habilitationStatus = data.habilitationStatus || null;
    }


    await updateDoc(userDocRef, updateData);
    console.log(`[updateUserProfileAndRole] Usuário ${userId} atualizado com sucesso.`);
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}/edit`);
    return { success: true, message: 'Usuário atualizado com sucesso!' };
  } catch (error: any)    {
    console.error("[updateUserProfileAndRole] ERRO ao atualizar usuário:", error.message, error.code, error.details);
    return { success: false, message: `Falha ao atualizar usuário: ${error.message}` };
  }
}


export async function deleteUser(
  userId: string
): Promise<{ success: boolean; message: string }> {
  console.log(`[deleteUser] Tentando excluir usuário do Firestore: ${userId}`);
  try {
    const userDocRef = doc(db, 'users', userId);
    await deleteFirestoreDoc(userDocRef); 
    console.log(`[deleteUser] Usuário ${userId} excluído do Firestore.`);
    revalidatePath('/admin/users');
    return { success: true, message: 'Usuário excluído do Firestore com sucesso!' };
  } catch (error: any) {
    console.error("[deleteUser] ERRO ao excluir usuário do Firestore:", error);
    return { success: false, message: error.message || 'Falha ao excluir usuário do Firestore.' };
  }
}

export async function ensureUserRoleInFirestore(
  userId: string,
  email: string | null,
  fullName: string | null,
  targetRoleName: string
): Promise<{ success: boolean; message: string; userProfile?: UserProfileData}> {
  if (!userId || !email) {
    console.error(`[ensureUserRoleInFirestore] Chamada inválida: userId ou email ausentes.`);
    return { success: false, message: 'UID do usuário e email são obrigatórios.' };
  }
  console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Iniciando...`);

  try {
    console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Passo 1: Garantindo perfis padrão...`);
    const rolesEnsured = await ensureDefaultRolesExist(); 
    
    if (!rolesEnsured || !rolesEnsured.success) {
      const errorMsg = `Falha crítica ao garantir perfis padrão: ${rolesEnsured?.message || 'Resultado indefinido de ensureDefaultRolesExist'}`;
      console.error(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] ${errorMsg}`);
      return { success: false, message: errorMsg };
    }
    console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Passo 1.1: Perfis padrão verificados/criados. Success: ${rolesEnsured.success}, Message: ${rolesEnsured.message}`);

    console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Passo 2: Buscando o perfil "${targetRoleName}"...`);
    const targetRole = await getRoleByName(targetRoleName);
    if (!targetRole) {
      console.error(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Perfil "${targetRoleName}" NÃO encontrado após ensureDefaultRolesExist.`);
      return { success: false, message: `Perfil "${targetRoleName}" não pôde ser encontrado ou criado.` };
    }
    console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Passo 2.1: Perfil "${targetRoleName}" encontrado com ID: ${targetRole.id}`);

    const userDocRef = doc(db, 'users', userId);
    console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Passo 3: Buscando documento do usuário ${userId}...`);
    const userSnap = await getDoc(userDocRef);
    console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] UserSnap exists: ${userSnap.exists()}`);


    if (userSnap.exists()) {
      const userData = userSnap.data() as UserProfileData;
      console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Passo 3.1: Documento do usuário encontrado. RoleId atual: ${userData.roleId}, RoleName: ${userData.roleName}, Habilitation: ${userData.habilitationStatus}`);
      
      const updatePayload: Partial<UserProfileData> = { updatedAt: serverTimestamp() as Timestamp };
      let needsUpdate = false;

      if (userData.roleId !== targetRole.id) {
        updatePayload.roleId = targetRole.id;
        console.log(`[ensureUserRoleInFirestore] Necessário atualizar roleId para ${targetRole.id}`);
        needsUpdate = true;
      }
      if (userData.roleName !== targetRole.name) {
        updatePayload.roleName = targetRole.name;
        console.log(`[ensureUserRoleInFirestore] Necessário atualizar roleName para ${targetRole.name}`);
        needsUpdate = true;
      }
      if (targetRoleName === 'ADMINISTRATOR' && userData.habilitationStatus !== 'HABILITADO') {
        updatePayload.habilitationStatus = 'HABILITADO';
        console.log(`[ensureUserRoleInFirestore] Necessário atualizar habilitationStatus para HABILITADO para Admin.`);
        needsUpdate = true;
      }
      
      if (userData.hasOwnProperty('role')) {
        (updatePayload as any).role = FieldValue.delete(); 
        console.log(`[ensureUserRoleInFirestore] Necessário remover campo 'role' legado.`);
        needsUpdate = true;
      }

      if (needsUpdate) {
        console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Passo 4: Atualizando perfil/habilitação do usuário... Payload:`, JSON.stringify(updatePayload));
        await updateDoc(userDocRef, updatePayload);
        console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Passo 4.1: Perfil/habilitação do usuário atualizado.`);
        const updatedProfile = await getUserProfileData(userId); 
        return { success: true, message: 'Perfil do usuário atualizado.', userProfile: updatedProfile || undefined };
      }
      
      console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Usuário já possui o perfil correto e está habilitado (se admin). Nenhuma alteração necessária.`);
      return { success: true, message: 'Perfil do usuário já está correto.', userProfile: userData };
    } else {
      console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Passo 3.1: Documento do usuário não encontrado. Criando...`);
      const newUserProfile: UserProfileData = {
        uid: userId,
        email: email!,
        fullName: fullName || email!.split('@')[0],
        roleId: targetRole.id,
        roleName: targetRole.name,
        status: 'ATIVO',
        habilitationStatus: targetRoleName === 'ADMINISTRATOR' ? 'HABILITADO' : 'PENDENTE_DOCUMENTOS',
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        permissions: targetRole.permissions || [],
      };
      console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Tentando criar documento do usuário com dados:`, JSON.stringify(newUserProfile));
      await setDoc(userDocRef, newUserProfile);
      console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Perfil de usuário criado.`);
      const createdProfile = await getUserProfileData(userId);
      return { success: true, message: 'Perfil de usuário criado e perfil atribuído.', userProfile: createdProfile || undefined };
    }
  } catch (error: any) {
    console.error(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Error:`, error.message, error.code, error.details ? JSON.stringify(error.details) : '');
    return { success: false, message: `Falha ao configurar perfil para ${targetRoleName}: ${error.message}` };
  }

  // Fallback return, should ideally not be reached if all paths within try are handled.
  // console.error(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Fallback return - logic error or unhandled path.`);
  // return { success: false, message: 'Falha inesperada na configuração do perfil.' };
}

    

```
  </change>
  <change>
    <file>/src/app/admin/users/page.tsx</file>
    <content><![CDATA[
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getUsersWithRoles, deleteUser } from './actions'; 
import type { UserProfileData } from '@/types';
import { Edit, Trash2, Users, AlertTriangle, UserCog, PlusCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function DeleteUserButton({ userId, userName, onDelete }: { userId: string; userName: string; onDelete: (id: string) => Promise<void> }) {
  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" aria-label="Excluir Usuário">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent><p>Excluir Usuário (Placeholder)</p></TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o usuário "{userName}" (ID: {userId})? Esta ação é IRREVERSÍVEL e removerá o usuário do sistema de autenticação e (opcionalmente) seus dados associados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
                await onDelete(userId);
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled // Desabilitar até a lógica real de exclusão ser implementada
          >
            Excluir (Desabilitado)
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    console.log("[AdminUsersPage] fetchUsers chamada");
    setIsLoading(true);
    try {
      const fetchedUsers = await getUsersWithRoles();
      console.log("[AdminUsersPage] Usuários recebidos da action:", fetchedUsers.length);
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("[AdminUsersPage] Erro ao buscar usuários:", error);
      toast({
        title: "Erro ao Carregar Usuários",
        description: "Não foi possível buscar a lista de usuários.",
        variant: "destructive",
      });
      setUsers([]); // Garante que users seja um array vazio em caso de erro
    } finally {
      setIsLoading(false);
      console.log("[AdminUsersPage] fetchUsers concluída, isLoading:", false);
    }
  };

  useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDeleteUser(id: string) {
    const result = await deleteUser(id);
    if (result.success) {
        toast({
            title: 'Sucesso!',
            description: result.message,
        });
        fetchUsers(); 
    } else {
        toast({
            title: 'Erro ao Excluir',
            description: result.message,
            variant: 'destructive',
        });
    }
  }
  
  console.log("[AdminUsersPage] Renderizando. IsLoading:", isLoading, "Número de usuários:", users.length);

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">Carregando usuários...</p>
        </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold font-headline flex items-center">
                <Users className="h-6 w-6 mr-2 text-primary" />
                Gerenciar Usuários da Plataforma
              </CardTitle>
              <CardDescription>
                Visualize usuários, atribua perfis e gerencie o acesso.
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/admin/users/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Novo Usuário
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground bg-secondary/30 rounded-md">
                <AlertTriangle className="mx-auto h-10 w-10 mb-3" />
                <p className="font-semibold">Nenhum usuário encontrado.</p>
                <p className="text-sm">Aguarde novos registros ou crie usuários manualmente.</p>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Nome Completo</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data de Criação</TableHead>
                      <TableHead className="text-right w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.uid}>
                        <TableCell className="font-medium">{user.fullName || 'Não informado'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.roleName && user.roleName !== 'N/A' ? 'default' : 'secondary'}>
                            {user.roleName || 'Sem Perfil'}
                          </Badge>
                        </TableCell>
                         <TableCell className="text-xs text-muted-foreground">{user.status || 'Ativo'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {user.createdAt ? format(new Date(user.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                           <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" asChild className="text-blue-600 hover:text-blue-700" aria-label="Editar Perfil do Usuário">
                                <Link href={`/admin/users/${user.uid}/edit`}>
                                  <UserCog className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Editar Perfil/Atribuir Role</p></TooltipContent>
                           </Tooltip>
                          <DeleteUserButton userId={user.uid} userName={user.fullName || user.email} onDelete={handleDeleteUser} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
    

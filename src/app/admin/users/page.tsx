
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
        <TooltipContent><p>Excluir Usuário</p></TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o usuário "{userName}" (ID: {userId})? Esta ação é IRREVERSÍVEL e removerá o usuário do sistema de autenticação e seus dados associados do Firestore.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
                await onDelete(userId);
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir
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
        description: "Não foi possível buscar la lista de usuários.",
        variant: "destructive",
      });
      setUsers([]); 
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
                      <TableHead>Status Habilitação</TableHead>
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
                         <TableCell className="text-xs text-muted-foreground">
                           <Badge variant={
                            user.habilitationStatus === 'HABILITADO' ? 'default' :
                            user.habilitationStatus === 'PENDENTE_ANALYSIS' || user.habilitationStatus === 'PENDENTE_DOCUMENTOS' ? 'outline' :
                            'destructive'
                           } 
                           className={
                            user.habilitationStatus === 'HABILITADO' ? 'bg-green-500 text-white' :
                            user.habilitationStatus === 'PENDENTE_ANALYSIS' || user.habilitationStatus === 'PENDENTE_DOCUMENTOS' ? 'border-yellow-500 text-yellow-600' :
                            'border-red-500 text-red-600'
                           }>
                            {user.habilitationStatus || 'Pendente'}
                           </Badge>
                        </TableCell>
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
                            <TooltipContent><p>Editar Perfil/Habilitação</p></TooltipContent>
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


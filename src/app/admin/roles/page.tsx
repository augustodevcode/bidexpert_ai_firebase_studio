
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// Importar as Server Actions getRoles e deleteRole
import { getRoles, deleteRole } from './actions'; 
import type { Role } from '@/types';
import { PlusCircle, Edit, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';
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
import { useEffect, useState, useCallback } from 'react'; // useCallback adicionado
import { Loader2 } from 'lucide-react';

function DeleteRoleButton({ roleId, roleName, onDelete }: { roleId: string; roleName: string; onDelete: (id: string) => Promise<void> }) {
  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" aria-label="Excluir Perfil">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent><p>Excluir Perfil</p></TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o perfil "{roleName}"? Esta ação não pode ser desfeita e pode afetar usuários associados. Perfis padrão como "ADMINISTRATOR" ou "USER" não podem ser excluídos se esta lógica estiver implementada na action.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
                await onDelete(roleId);
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


export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Usar useCallback para fetchRoles
  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      // Chamar a Server Action getRoles
      const fetchedRoles = await getRoles(); 
      setRoles(fetchedRoles);
    } catch (error) {
        console.error("Error fetching roles:", error);
        toast({ title: "Erro", description: "Falha ao buscar perfis.", variant: "destructive"});
    } finally {
        setIsLoading(false);
    }
  }, [toast]); // toast é uma dependência estável

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]); // fetchRoles agora é estável

  async function handleDeleteRole(id: string) {
    // Chamar a Server Action deleteRole
    const result = await deleteRole(id); 
    if (result.success) {
        toast({
            title: 'Sucesso!',
            description: result.message,
        });
        fetchRoles(); 
    } else {
        toast({
            title: 'Erro ao Excluir',
            description: result.message,
            variant: 'destructive',
        });
    }
  }
  
  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">Carregando perfis...</p>
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
                <ShieldCheck className="h-6 w-6 mr-2 text-primary" />
                Gerenciar Perfis de Usuário
              </CardTitle>
              <CardDescription>
                Crie, edite ou remova perfis (roles) para controlar o acesso na plataforma.
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/admin/roles/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Novo Perfil
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {roles.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground bg-secondary/30 rounded-md">
                <AlertTriangle className="mx-auto h-10 w-10 mb-3" />
                <p className="font-semibold">Nenhum perfil encontrado.</p>
                <p className="text-sm">Comece adicionando um novo perfil de usuário.</p>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Nome do Perfil</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-center">Permissões</TableHead>
                      <TableHead className="text-right w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground truncate max-w-xs">
                          {role.description || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{role.permissions?.length || 0}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" asChild className="text-blue-600 hover:text-blue-700" aria-label="Editar Perfil">
                                <Link href={`/admin/roles/${role.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Editar Perfil</p></TooltipContent>
                          </Tooltip>
                          <DeleteRoleButton roleId={role.id} roleName={role.name} onDelete={handleDeleteRole} />
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

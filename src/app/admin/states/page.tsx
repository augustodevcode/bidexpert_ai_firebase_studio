
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getStates, deleteState } from './actions';
import type { StateInfo } from '@/types';
import { PlusCircle, Edit, Trash2, Landmark, AlertTriangle, Map } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast'; // Import useToast
import { useEffect, useState, useCallback } from 'react'; // Import useEffect, useState, useCallback
import { Loader2 } from 'lucide-react';

function DeleteStateButtonClient({ stateId, stateName, onDeleteSuccess }: { stateId: string; stateName: string; onDeleteSuccess: () => void }) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    // Chama a Server Action `deleteState` diretamente
    const result = await deleteState(stateId);
    if (result.success) {
      toast({ title: "Sucesso", description: "Estado excluído com sucesso.", variant: "default" });
      onDeleteSuccess(); // Atualiza a lista na página pai
    } else {
      toast({ title: "Erro", description: result.message || "Falha ao excluir estado.", variant: "destructive" });
    }
    setIsDeleting(false);
  };
  
  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80 h-8 w-8" aria-label="Excluir Estado" disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent><p>Excluir Estado</p></TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o estado "{stateName}" (UF: {stateId.slice(-2)})? Esta ação não pode ser desfeita e pode afetar cidades associadas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


export default function AdminStatesPage() {
  const [states, setStates] = useState<StateInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchStates = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedStates = await getStates();
      setStates(fetchedStates);
    } catch (error) {
        console.error("Error fetching states:", error);
        toast({ title: "Erro", description: "Falha ao buscar estados.", variant: "destructive"});
        setStates([]);
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStates();
  }, [fetchStates]);

  // Esta função agora é uma função async normal dentro do client component,
  // que chama a Server Action `deleteState`.
  async function handleDeleteStateCallback(id: string) {
    // REMOVIDO: 'use server'; (esta linha estava causando o erro)
    const result = await deleteState(id);
    if (result.success) {
      toast({ title: "Sucesso!", description: "Estado excluído com sucesso.", variant: "default" });
      fetchStates(); // Re-fetch para atualizar a lista
    } else {
      toast({ title: "Erro", description: result.message || "Falha ao excluir estado.", variant: "destructive" });
    }
  }
  
  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">Carregando estados...</p>
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
                <Map className="h-6 w-6 mr-2 text-primary" />
                Gerenciar Estados
              </CardTitle>
              <CardDescription>
                Adicione, edite ou remova estados da plataforma.
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/admin/states/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Novo Estado
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {states.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground bg-secondary/30 rounded-md">
                <AlertTriangle className="mx-auto h-10 w-10 mb-3" />
                <p className="font-semibold">Nenhum estado encontrado.</p>
                <p className="text-sm">Comece adicionando um novo estado.</p>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">UF</TableHead>
                      <TableHead className="min-w-[250px]">Nome</TableHead>
                      <TableHead className="text-center">Cidades</TableHead>
                      <TableHead className="text-right w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {states.map((state) => (
                      <TableRow key={state.id}>
                        <TableCell className="font-medium">{state.uf}</TableCell>
                        <TableCell>{state.name}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{state.cityCount || 0}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" asChild className="text-blue-600 hover:text-blue-700" aria-label="Editar Estado">
                                <Link href={`/admin/states/${state.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Editar Estado</p></TooltipContent>
                          </Tooltip>
                          <DeleteStateButtonClient stateId={state.id} stateName={state.name} onDeleteSuccess={fetchStates} />
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


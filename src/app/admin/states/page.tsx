
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

function DeleteStateButton({ stateId, stateName, onDelete }: { stateId: string; stateName: string; onDelete: (id: string) => Promise<void> }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
 <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" aria-label="Excluir Estado" onClick={() => setIsOpen(true)}>
 <Trash2 className="h-4 w-4" />
 </Button>
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
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
                await onDelete(stateId);
 setIsOpen(false);
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

export default async function AdminStatesPage() {
  const states = await getStates();

  async function handleDeleteState(id: string) {
    'use server';
    const result = await deleteState(id);
    if (!result.success) {
        console.error("Failed to delete state:", result.message);
    }
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
                          <DeleteStateButton stateId={state.id} stateName={state.name} onDelete={handleDeleteState} />
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

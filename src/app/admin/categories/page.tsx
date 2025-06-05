
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getLotCategories, deleteLotCategory } from './actions';
import type { LotCategory } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PlusCircle, Edit, Trash2, ExternalLink, AlertTriangle, ListChecks } from 'lucide-react';
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

function DeleteCategoryButton({ categoryId, categoryName, onDelete }: { categoryId: string; categoryName: string; onDelete: (id: string) => Promise<void> }) {
  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" aria-label="Excluir Categoria">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent><p>Excluir Categoria</p></TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a categoria "{categoryName}"? Esta ação não pode ser desfeita e pode afetar lotes associados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
                await onDelete(categoryId);
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


export default async function AdminCategoriesPage() {
  const categories = await getLotCategories();

  async function handleDeleteCategory(id: string) {
    'use server';
    const result = await deleteLotCategory(id);
    if (!result.success) {
        console.error("Failed to delete category:", result.message);
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold font-headline flex items-center">
                <ListChecks className="h-6 w-6 mr-2 text-primary" />
                Gerenciar Categorias de Lotes
              </CardTitle>
              <CardDescription>
                Adicione, edite ou remova categorias para organizar os lotes no site.
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/admin/categories/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Nova Categoria
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground bg-secondary/30 rounded-md">
                <AlertTriangle className="mx-auto h-10 w-10 mb-3" />
                <p className="font-semibold">Nenhuma categoria encontrada.</p>
                <p className="text-sm">Comece adicionando uma nova categoria.</p>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Nome</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-center">Lotes</TableHead>
                      <TableHead>Criada em</TableHead>
                      <TableHead className="text-right w-[120px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          <Link href={`/category/${category.slug}`} target="_blank" className="hover:underline flex items-center gap-1">
                              /{category.slug} <ExternalLink className="h-3 w-3" />
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground truncate max-w-xs">
                          {category.description || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                           <Badge variant="secondary">{category.itemCount || 0}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {category.createdAt?.toDate ? format(category.createdAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" asChild className="text-blue-600 hover:text-blue-700" aria-label="Editar Categoria">
                                <Link href={`/admin/categories/${category.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Editar Categoria</p></TooltipContent>
                          </Tooltip>
                          <DeleteCategoryButton categoryId={category.id} categoryName={category.name} onDelete={handleDeleteCategory} />
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


'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getSubcategoriesByParentIdAction, deleteSubcategoryAction } from './actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import type { Subcategory, LotCategory } from '@/types';
import { PlusCircle, Edit, Trash2, Layers, AlertTriangle, ChevronDown } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import React, { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

function DeleteSubcategoryButtonClient({ subcategoryId, subcategoryName, onDeleteSuccess }: { subcategoryId: string; subcategoryName: string; onDeleteSuccess: () => void }) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteSubcategoryAction(subcategoryId);
    if (result.success) {
      toast({ title: "Sucesso", description: "Subcategoria excluída com sucesso.", variant: "default" });
      onDeleteSuccess();
    } else {
      toast({ title: "Erro", description: result.message || "Falha ao excluir subcategoria.", variant: "destructive" });
    }
    setIsDeleting(false);
  };

  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80 h-8 w-8" aria-label="Excluir Subcategoria" disabled={isDeleting}>
               {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent><p>Excluir Subcategoria</p></TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a subcategoria "{subcategoryName}"? Esta ação não pode ser desfeita.
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


export default function AdminSubcategoriesPage() {
  const [allParentCategories, setAllParentCategories] = useState<LotCategory[]>([]);
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState<string | undefined>(undefined);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(false);
  const { toast } = useToast();

  const fetchParentCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedCategories = await getLotCategories();
      setAllParentCategories(fetchedCategories);
      if (fetchedCategories.length > 0 && !selectedParentCategoryId) {
        setSelectedParentCategoryId(fetchedCategories[0].id);
      }
    } catch (error) {
      console.error("Error fetching parent categories:", error);
      toast({ title: "Erro", description: "Falha ao buscar categorias principais.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, selectedParentCategoryId]);

  const fetchSubcategories = useCallback(async () => {
    if (!selectedParentCategoryId) {
      setSubcategories([]);
      return;
    }
    setIsLoadingSubcategories(true);
    try {
      const fetchedSubcategories = await getSubcategoriesByParentIdAction(selectedParentCategoryId);
      setSubcategories(fetchedSubcategories);
    } catch (error) {
      console.error(`Error fetching subcategories for ${selectedParentCategoryId}:`, error);
      toast({ title: "Erro", description: "Falha ao buscar subcategorias.", variant: "destructive" });
      setSubcategories([]);
    } finally {
      setIsLoadingSubcategories(false);
    }
  }, [selectedParentCategoryId, toast]);

  useEffect(() => {
    fetchParentCategories();
  }, [fetchParentCategories]);

  useEffect(() => {
    if (selectedParentCategoryId) {
      fetchSubcategories();
    }
  }, [selectedParentCategoryId, fetchSubcategories]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Carregando dados...</p>
      </div>
    );
  }
  
  const selectedParentCategoryName = allParentCategories.find(c => c.id === selectedParentCategoryId)?.name || "Nenhuma";

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold font-headline flex items-center">
                <Layers className="h-6 w-6 mr-2 text-primary" />
                Gerenciar Subcategorias
              </CardTitle>
              <CardDescription>
                Adicione, edite ou remova subcategorias. Selecione uma categoria principal para ver suas subcategorias.
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/admin/subcategories/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Nova Subcategoria
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Label htmlFor="parentCategorySelect" className="text-sm font-medium">Filtrar por Categoria Principal:</Label>
              <Select 
                value={selectedParentCategoryId} 
                onValueChange={setSelectedParentCategoryId}
                disabled={allParentCategories.length === 0}
              >
                <SelectTrigger id="parentCategorySelect" className="mt-1 w-full sm:w-auto sm:min-w-[250px]">
                  <SelectValue placeholder={allParentCategories.length > 0 ? "Selecione uma categoria principal" : "Nenhuma categoria principal cadastrada"} />
                </SelectTrigger>
                <SelectContent>
                  {allParentCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                   {allParentCategories.length === 0 && <p className="p-2 text-xs text-muted-foreground">Cadastre categorias principais primeiro.</p>}
                </SelectContent>
              </Select>
            </div>

            {isLoadingSubcategories ? (
                <div className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /><p className="mt-2 text-sm text-muted-foreground">Carregando subcategorias...</p></div>
            ) : !selectedParentCategoryId && allParentCategories.length > 0 ? (
                 <div className="text-center py-10 text-muted-foreground bg-secondary/30 rounded-md">
                    <p className="font-semibold">Selecione uma categoria principal acima para ver suas subcategorias.</p>
                </div>
            ) : subcategories.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground bg-secondary/30 rounded-md">
                <AlertTriangle className="mx-auto h-10 w-10 mb-3" />
                <p className="font-semibold">Nenhuma subcategoria encontrada para "{selectedParentCategoryName}".</p>
                <p className="text-sm">Comece adicionando uma nova subcategoria para "{selectedParentCategoryName}".</p>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Nome da Subcategoria</TableHead>
                      <TableHead>Categoria Principal</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-center">Ordem</TableHead>
                      <TableHead className="text-right w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subcategories.map((subcat) => (
                      <TableRow key={subcat.id}>
                        <TableCell className="font-medium">{subcat.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{allParentCategories.find(c=>c.id === subcat.parentCategoryId)?.name || 'N/A'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground truncate max-w-xs">
                          {subcat.description || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                           <Badge variant="outline">{subcat.displayOrder || 0}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" asChild className="text-blue-600 hover:text-blue-700 h-8 w-8" aria-label="Editar Subcategoria">
                                <Link href={`/admin/subcategories/${subcat.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Editar Subcategoria</p></TooltipContent>
                          </Tooltip>
                          <DeleteSubcategoryButtonClient subcategoryId={subcat.id} subcategoryName={subcat.name} onDeleteSuccess={fetchSubcategories} />
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

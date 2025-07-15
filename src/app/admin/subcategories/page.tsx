
// src/app/admin/subcategories/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSubcategoriesByParentIdAction, deleteSubcategoryAction } from './actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import type { Subcategory, LotCategory } from '@/types';
import { Layers, PlusCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import Link from 'next/link';

export default function AdminSubcategoriesPage() {
  const [allParentCategories, setAllParentCategories] = useState<LotCategory[]>([]);
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState<string | undefined>(undefined);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchParentCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedCategories = await getLotCategories();
      const categoriesWithSubcats = fetchedCategories.filter(c => c.hasSubcategories);
      setAllParentCategories(categoriesWithSubcats);
      if (categoriesWithSubcats.length > 0 && !selectedParentCategoryId) {
        setSelectedParentCategoryId(categoriesWithSubcats[0].id);
      }
    } catch (e) {
      setError("Falha ao buscar categorias principais.");
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
      setError(null);
      try {
        const fetchedSubcategories = await getSubcategoriesByParentIdAction(selectedParentCategoryId);
        const parentName = allParentCategories.find(c => c.id === selectedParentCategoryId)?.name || '';
        setSubcategories(fetchedSubcategories.map(s => ({...s, parentCategoryName: parentName})));
      } catch (e) {
        setError("Falha ao buscar subcategorias.");
        toast({ title: "Erro", description: "Falha ao buscar subcategorias.", variant: "destructive" });
        setSubcategories([]);
      } finally {
        setIsLoadingSubcategories(false);
      }
  }, [selectedParentCategoryId, toast, allParentCategories]);

  useEffect(() => {
    fetchParentCategories();
  }, [fetchParentCategories]);

  useEffect(() => {
    if(selectedParentCategoryId) {
        fetchSubcategories();
    }
  }, [selectedParentCategoryId, fetchSubcategories]);
  
  const handleDelete = async (id: string) => {
    const result = await deleteSubcategoryAction(id);
    if (result.success) {
        toast({ title: "Sucesso!", description: "Subcategoria excluída."});
        fetchSubcategories(); // Refresh list
    } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
  };
  
  const columns = useMemo(() => createColumns(), []);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Layers className="h-6 w-6 mr-2 text-primary" />
              Subcategorias
            </CardTitle>
            <CardDescription>
              Visualize e gerencie as subcategorias da plataforma.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/subcategories/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Nova Subcategoria
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
            <div className="mb-4">
              <Select 
                value={selectedParentCategoryId} 
                onValueChange={setSelectedParentCategoryId}
                disabled={allParentCategories.length === 0 || isLoading}
              >
                <SelectTrigger id="parentCategorySelect" className="w-full sm:w-auto sm:min-w-[250px]">
                  <SelectValue placeholder={allParentCategories.length > 0 ? "Selecione uma categoria principal" : "Nenhuma categoria com subcategorias"} />
                </SelectTrigger>
                <SelectContent>
                  {allParentCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                   {allParentCategories.length === 0 && <p className="text-xs text-muted-foreground p-2">Nenhuma categoria com subcategorias encontrada.</p>}
                </SelectContent>
              </Select>
            </div>
          
            <DataTable
              columns={columns}
              data={subcategories}
              isLoading={isLoading || isLoadingSubcategories}
              error={error}
              searchColumnId="name"
              searchPlaceholder="Buscar por nome da subcategoria..."
            />
        </CardContent>
      </Card>
    </div>
  );
}

// src/app/admin/subcategories/page.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSubcategoriesByParentIdAction, deleteSubcategoryAction } from './actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import type { Subcategory, LotCategory } from '@/types';
import { PlusCircle, Layers, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';

export default function AdminSubcategoriesPage() {
  const [allParentCategories, setAllParentCategories] = useState<LotCategory[]>([]);
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState<string | undefined>(undefined);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedCategories = await getLotCategories();
      setAllParentCategories(fetchedCategories);
      if (fetchedCategories.length > 0 && !selectedParentCategoryId) {
        const firstCatId = fetchedCategories[0].id;
        setSelectedParentCategoryId(firstCatId);
      }
    } catch (e) {
      console.error("Error fetching parent categories:", e);
      setError("Falha ao buscar categorias principais.");
      toast({ title: "Erro", description: "Falha ao buscar categorias principais.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }, [toast, selectedParentCategoryId]);


  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);


  useEffect(() => {
    async function fetchSubcategories() {
        if (!selectedParentCategoryId) {
            setSubcategories([]);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const fetchedSubcategories = await getSubcategoriesByParentIdAction(selectedParentCategoryId);
            const parentName = allParentCategories.find(c => c.id === selectedParentCategoryId)?.name || '';
            setSubcategories(fetchedSubcategories.map(s => ({...s, parentCategoryName: parentName})));
        } catch (e) {
            console.error(`Error fetching subcategories for ${selectedParentCategoryId}:`, e);
            setError("Falha ao buscar subcategorias.");
            toast({ title: "Erro", description: "Falha ao buscar subcategorias.", variant: "destructive" });
            setSubcategories([]);
        } finally {
            setIsLoading(false);
        }
    }
    if (allParentCategories.length > 0) {
      fetchSubcategories();
    }
  }, [selectedParentCategoryId, toast, allParentCategories]);


  const handleDelete = useCallback(
    async (id: string) => {
      const result = await deleteSubcategoryAction(id);
      if (result.success) {
        toast({ title: "Sucesso", description: result.message });
        if(selectedParentCategoryId) {
            const fetchedSubcategories = await getSubcategoriesByParentIdAction(selectedParentCategoryId);
            const parentName = allParentCategories.find(c => c.id === selectedParentCategoryId)?.name || '';
            setSubcategories(fetchedSubcategories.map(s => ({...s, parentCategoryName: parentName})));
        }
      } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" });
      }
    },
    [selectedParentCategoryId, toast, allParentCategories]
  );
  
  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);

  return (
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
            <div className="mb-4">
              <Select 
                value={selectedParentCategoryId} 
                onValueChange={setSelectedParentCategoryId}
                disabled={allParentCategories.length === 0 || isLoading}
              >
                <SelectTrigger id="parentCategorySelect" className="w-full sm:w-auto sm:min-w-[250px]">
                  <SelectValue placeholder={allParentCategories.length > 0 ? "Selecione uma categoria principal" : "Nenhuma categoria cadastrada"} />
                </SelectTrigger>
                <SelectContent>
                  {allParentCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                   {allParentCategories.length === 0 && <p className="p-2 text-xs text-muted-foreground">Cadastre categorias principais primeiro.</p>}
                </SelectContent>
              </Select>
            </div>
          
            <DataTable
              columns={columns}
              data={subcategories}
              isLoading={isLoading}
              error={error}
              searchColumnId="name"
              searchPlaceholder="Buscar por nome da subcategoria..."
            />
        </CardContent>
      </Card>
    </div>
  );
}

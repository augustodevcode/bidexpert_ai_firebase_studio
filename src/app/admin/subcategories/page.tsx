// src/app/admin/subcategories/page.tsx
/**
 * @fileoverview Página principal para listagem e gerenciamento de Subcategorias.
 * Utiliza o componente DataTable para exibir os dados com funcionalidade
 * completa de CRUD (criar, editar, excluir).
 */
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSubcategoriesByParentIdAction } from './actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import type { Subcategory, LotCategory } from '@/types';
import { Layers, PlusCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminSubcategoriesPage() {
  const [allParentCategories, setAllParentCategories] = useState<LotCategory[]>([]);
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState<string | undefined>(undefined);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const fetchPageData = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      setError(null);
      try {
        const fetchedCategories = await getLotCategories();
        if (isMounted) {
          const categoriesWithSubcats = fetchedCategories.filter(c => c.hasSubcategories);
          setAllParentCategories(categoriesWithSubcats);
          if (categoriesWithSubcats.length > 0 && !selectedParentCategoryId) {
            setSelectedParentCategoryId(categoriesWithSubcats[0].id);
          }
        }
      } catch (e) {
        console.error("Error fetching parent categories:", e);
        if (isMounted) {
          setError("Falha ao buscar categorias principais.");
          toast({ title: "Erro", description: "Falha ao buscar categorias principais.", variant: "destructive" });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    fetchPageData();
    return () => { isMounted = false; };
  }, [toast, selectedParentCategoryId]);

  useEffect(() => {
    let isMounted = true;
    async function fetchSubcategories() {
        if (!selectedParentCategoryId) {
            setSubcategories([]);
            return;
        }
        if (!isMounted) return;
        setIsLoading(true);
        setError(null);
        try {
            const fetchedSubcategories = await getSubcategoriesByParentIdAction(selectedParentCategoryId);
            const parentName = allParentCategories.find(c => c.id === selectedParentCategoryId)?.name || '';
            if (isMounted) {
              setSubcategories(fetchedSubcategories.map(s => ({...s, parentCategoryName: parentName})));
            }
        } catch (e) {
            console.error(`Error fetching subcategories for ${selectedParentCategoryId}:`, e);
            if(isMounted) {
              setError("Falha ao buscar subcategorias.");
              toast({ title: "Erro", description: "Falha ao buscar subcategorias.", variant: "destructive" });
              setSubcategories([]);
            }
        } finally {
            if(isMounted) {
              setIsLoading(false);
            }
        }
    }
    if (allParentCategories.length > 0) {
      fetchSubcategories();
    }
    return () => { isMounted = false; };
  }, [selectedParentCategoryId, toast, allParentCategories]);

  const handleDelete = useCallback((id: string) => {
    setSubcategories(prev => prev.filter(sub => sub.id !== id));
  }, []);
  
  const columns = useMemo(() => createColumns({ onDelete: handleDelete }), [handleDelete]);

  return (
    <div className="space-y-6" data-ai-id="admin-subcategories-page-container">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Layers className="h-6 w-6 mr-2 text-primary" />
              Subcategorias
            </CardTitle>
            <CardDescription>
              Gerencie as subcategorias da plataforma. Adicione, edite ou exclua subcategorias.
            </CardDescription>
          </div>
          <Button asChild data-ai-id="new-subcategory-button">
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

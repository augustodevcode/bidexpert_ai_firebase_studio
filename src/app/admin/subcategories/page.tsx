// src/app/admin/subcategories/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSubcategoriesByParentIdAction, deleteSubcategoryAction } from './actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import type { Subcategory, LotCategory } from '@/types';
import { Layers, PlusCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import ResourceDataTable from '@/components/admin/resource-data-table';
import { createColumns } from './columns';

export default function AdminSubcategoriesPage() {
  const [allParentCategories, setAllParentCategories] = useState<LotCategory[]>([]);
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState<string | undefined>(undefined);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    getLotCategories().then(categories => {
      const categoriesWithSubcats = categories.filter(c => c.hasSubcategories);
      setAllParentCategories(categoriesWithSubcats);
      if (categoriesWithSubcats.length > 0 && !selectedParentCategoryId) {
        setSelectedParentCategoryId(categoriesWithSubcats[0].id);
      }
      setIsLoadingCategories(false);
    });
  }, [selectedParentCategoryId]);

  const fetchSubcategories = useCallback(async () => {
    if (!selectedParentCategoryId) return [];
    return getSubcategoriesByParentIdAction(selectedParentCategoryId);
  }, [selectedParentCategoryId]);
  
  const columns = useMemo(() => createColumns({ handleDelete: deleteSubcategoryAction }), []);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Layers className="h-6 w-6 mr-2 text-primary" />
              Subcategorias
            </CardTitle>
            <CardDescription>
              Gerencie as subcategorias de cada categoria principal.
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
            <label className="text-sm font-medium text-muted-foreground">Filtrar por Categoria Principal</label>
            <Select 
              value={selectedParentCategoryId} 
              onValueChange={setSelectedParentCategoryId}
              disabled={allParentCategories.length === 0 || isLoadingCategories}
            >
              <SelectTrigger id="parentCategorySelect" className="w-full sm:w-auto sm:min-w-[250px] mt-1">
                <SelectValue placeholder={isLoadingCategories ? "Carregando..." : "Selecione uma categoria"} />
              </SelectTrigger>
              <SelectContent>
                {allParentCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
                {allParentCategories.length === 0 && <p className="text-xs text-muted-foreground p-2">Nenhuma categoria com subcategorias encontrada.</p>}
              </SelectContent>
            </Select>
          </div>
          
          {selectedParentCategoryId && (
             <ResourceDataTable<Subcategory>
                key={selectedParentCategoryId} // Force re-render on category change
                columns={columns}
                fetchAction={fetchSubcategories}
                deleteAction={deleteSubcategoryAction}
                searchColumnId="name"
                searchPlaceholder="Buscar por nome da subcategoria..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

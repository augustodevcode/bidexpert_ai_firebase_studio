// src/app/admin/categories/page.tsx
/**
 * @fileoverview Página principal para listagem e gerenciamento de Categorias de Lotes.
 * Utiliza o componente DataTable para exibir os dados com funcionalidade 
 * completa de CRUD (criar, editar, excluir).
 */
'use client';



import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getLotCategories } from './actions';
import type { LotCategory } from '@/types';
import { ListChecks, PlusCircle, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<LotCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedCategories = await getLotCategories();
      setCategories(fetchedCategories);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar categorias.";
      console.error("Error fetching categories:", e);
      setError(errorMessage);
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleDelete = useCallback((id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
  }, []);
  
  const columns = useMemo(() => createColumns({ onDelete: handleDelete }), [handleDelete]);

  const renderSkeleton = () => (
     <div className="space-y-6">
        <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
                <div><Skeleton className="h-8 w-64 mb-2"/><Skeleton className="h-4 w-80"/></div>
                <Skeleton className="h-10 w-36"/>
            </CardHeader>
            <CardContent><Skeleton className="h-96 w-full" /></CardContent>
        </Card>
    </div>
  );

  if (isLoading) {
      return renderSkeleton();
  }


  return (
    <div className="space-y-6" data-ai-id="admin-categories-page-container">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <ListChecks className="h-6 w-6 mr-2 text-primary" />
              Categorias de Lotes
            </CardTitle>
            <CardDescription>
              Gerencie as categorias de lotes da plataforma. Adicione, edite ou exclua categorias.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/categories/analysis" data-ai-id="categories-analysis-link">
                <BarChart3 className="mr-2 h-4 w-4" /> Ver Análise
              </Link>
            </Button>
            <Button asChild data-ai-id="new-category-button">
              <Link href="/admin/categories/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Nova Categoria
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={categories}
            isLoading={isLoading}
            error={error}
            searchColumnId="name"
            searchPlaceholder="Buscar por nome..."
          />
        </CardContent>
      </Card>
    </div>
  );
}

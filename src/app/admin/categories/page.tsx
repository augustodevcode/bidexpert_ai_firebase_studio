
// src/app/admin/categories/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getLotCategories, deleteLotCategory } from './actions';
import type { LotCategory } from '@/types';
import { PlusCircle, ListChecks } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<LotCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;
    
    const fetchCategories = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      setError(null);
      try {
        const fetchedCategories = await getLotCategories();
        if (isMounted) {
          setCategories(fetchedCategories);
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Falha ao buscar categorias.";
        console.error("Error fetching categories:", e);
        if (isMounted) {
          setError(errorMessage);
          toast({ title: "Erro", description: errorMessage, variant: "destructive" });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, [toast, refetchTrigger]);

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await deleteLotCategory(id);
      if (result.success) {
        toast({ title: "Sucesso", description: result.message });
        setRefetchTrigger(c => c + 1);
      } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" });
      }
    },
    [toast]
  );
  
  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);

  return (
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

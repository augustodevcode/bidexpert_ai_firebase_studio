// src/app/admin/categories/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getLotCategories } from './actions';
import type { LotCategory } from '@/types';
import { ListChecks, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<LotCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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
  }, [toast]);
  
  const columns = useMemo(() => createColumns(), []);

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
              Visualize as categorias fixas da plataforma. A criação e edição foram desativadas para manter a consistência dos dados.
            </CardDescription>
          </div>
          {/* O botão de criar foi removido para reforçar que o CRUD está desativado nesta tela. */}
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

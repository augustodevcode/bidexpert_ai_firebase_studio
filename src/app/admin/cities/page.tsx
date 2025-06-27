// src/app/admin/cities/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCities, deleteCity } from './actions';
import type { CityInfo } from '@/types';
import { PlusCircle, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';

export default function AdminCitiesPage() {
  const [cities, setCities] = useState<CityInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedCities = await getCities();
      setCities(fetchedCities);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar cidades.";
      console.error("Error fetching cities:", e);
      setError(errorMessage);
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await deleteCity(id);
      if (result.success) {
        toast({ title: "Sucesso!", description: result.message });
        fetchCities();
      } else {
        toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
      }
    },
    [fetchCities, toast]
  );
  
  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Building2 className="h-6 w-6 mr-2 text-primary" />
              Gerenciar Cidades
            </CardTitle>
            <CardDescription>
              Adicione, edite ou remova cidades da plataforma.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/cities/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Nova Cidade
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
           <DataTable
            columns={columns}
            data={cities}
            isLoading={isLoading}
            error={error}
            searchColumnId="name"
            searchPlaceholder="Buscar por cidade..."
          />
        </CardContent>
      </Card>
    </div>
  );
}

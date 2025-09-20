// src/app/admin/sellers/page.tsx
/**
 * @fileoverview Página principal para listagem e gerenciamento de Comitentes (Vendedores).
 * Utiliza o componente DataTable para exibir os dados de forma interativa,
 * permitindo busca, ordenação e ações como edição e exclusão.
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSellers, deleteSeller } from './actions';
import type { SellerProfileInfo } from '@/types';
import { PlusCircle, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<SellerProfileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedSellers = await getSellers();
      setSellers(fetchedSellers);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar comitentes.";
      console.error("Error fetching sellers:", e);
      setError(errorMessage);
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteSeller(id);
    if (result.success) {
      toast({ title: "Sucesso", description: result.message });
      fetchPageData();
    } else {
      toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
  }, [toast, fetchPageData]);

  const handleDeleteSelected = useCallback(async (selectedItems: SellerProfileInfo[]) => {
    if (selectedItems.length === 0) return;
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const item of selectedItems) {
      const result = await deleteSeller(item.id);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        toast({ title: `Erro ao excluir ${item.name}`, description: result.message, variant: "destructive", duration: 5000 });
      }
    }

    if (successCount > 0) {
      toast({ title: "Exclusão em Massa Concluída", description: `${successCount} comitente(s) excluído(s) com sucesso.` });
    }
    fetchPageData();
  }, [toast, fetchPageData]);
  
  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);

  return (
    <div className="space-y-6" data-ai-id="admin-sellers-page-container">
      <Card className="shadow-lg" data-ai-id="admin-sellers-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Users className="h-6 w-6 mr-2 text-primary" />
              Listagem de Comitentes
            </CardTitle>
            <CardDescription>
              Adicione, edite ou remova comitentes/vendedores da plataforma.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/sellers/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Comitente
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
           <DataTable
            columns={columns}
            data={sellers}
            isLoading={isLoading}
            error={error}
            searchColumnId="name"
            searchPlaceholder="Buscar por nome..."
            onDeleteSelected={handleDeleteSelected}
          />
        </CardContent>
      </Card>
    </div>
  );
}

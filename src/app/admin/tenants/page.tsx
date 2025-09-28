// src/app/admin/tenants/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getTenants } from './actions';
import type { Tenant } from '@prisma/client';
import { Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedTenants = await getTenants();
      setTenants(fetchedTenants);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar tenants.";
      console.error("Error fetching tenants:", e);
      setError(errorMessage);
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const columns = useMemo(() => createColumns(), []);

  return (
    <div className="space-y-6" data-ai-id="admin-tenants-page-container">
      <Card className="shadow-lg">
        <CardHeader>
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Briefcase className="h-6 w-6 mr-2 text-primary" />
              Gerenciar Tenants (Leiloeiros)
            </CardTitle>
            <CardDescription>
              Visualize os tenants (clientes/leiloeiros) da sua plataforma. A criação é feita via API pelo CRM.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
           <DataTable
            columns={columns}
            data={tenants}
            isLoading={isLoading}
            error={error}
            searchColumnId="name"
            searchPlaceholder="Buscar por nome ou subdomínio..."
          />
        </CardContent>
      </Card>
    </div>
  );
}

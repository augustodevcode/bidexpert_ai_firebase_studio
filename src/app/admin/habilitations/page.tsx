// src/app/admin/habilitations/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck } from 'lucide-react';
import { getHabilitationRequests } from './actions';
import type { UserProfileData } from '@/types';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { useToast } from '@/hooks/use-toast';
import { getUserHabilitationStatusInfo } from '@/lib/sample-data-helpers';


export default function HabilitationsPage() {
  const [requests, setRequests] = useState<UserProfileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    const fetchRequests = async () => {
        if (!isMounted) return;
        setIsLoading(true);
        try {
            const data = await getHabilitationRequests();
            if (isMounted) {
                setRequests(data);
            }
        } catch (e: any) {
            console.error("Error fetching habilitation requests:", e);
            if (isMounted) {
                setError("Falha ao carregar solicitações de habilitação.");
                toast({ title: "Erro", description: e.message, variant: "destructive" });
            }
        } finally {
            if (isMounted) {
                setIsLoading(false);
            }
        }
    };
    fetchRequests();
    return () => { isMounted = false; };
  }, [toast]);

  const columns = useMemo(() => createColumns(), []);
  
  const statusOptions = useMemo(() => 
    [...new Set(requests.map(r => r.habilitationStatus))]
      .filter(Boolean)
      .map(status => ({ value: status!, label: getUserHabilitationStatusInfo(status).text })),
  [requests]);

  const facetedFilterColumns = useMemo(() => [
    { id: 'habilitationStatus', title: 'Status', options: statusOptions },
  ], [statusOptions]);

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <UserCheck className="h-7 w-7 mr-3 text-primary" />
            Gerenciamento de Habilitações
          </CardTitle>
          <CardDescription>
            Aprove ou rejeite documentos e gerencie o status de habilitação dos usuários.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <DataTable
            columns={columns}
            data={requests}
            isLoading={isLoading}
            error={error}
            searchColumnId="email"
            searchPlaceholder="Buscar por email do usuário..."
            facetedFilterColumns={facetedFilterColumns}
          />
        </CardContent>
      </Card>
    </div>
  );
}

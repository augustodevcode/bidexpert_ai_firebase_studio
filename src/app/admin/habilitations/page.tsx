// src/app/admin/habilitations/page.tsx
/**
 * @fileoverview Página principal para o gerenciamento de habilitações de usuários.
 * Exibe uma lista de usuários com status de habilitação pendente ou em análise,
 * permitindo que os administradores acessem a tela de revisão de documentos.
 */
'use client';



import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck } from 'lucide-react';
import { getHabilitationRequests } from './actions';
import type { UserProfileData, PlatformSettings } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getUserHabilitationStatusInfo } from '@/lib/ui-helpers';
import { createColumns } from './columns';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { Skeleton } from '@/components/ui/skeleton';
import BidExpertSearchResultsFrame from '@/components/BidExpertSearchResultsFrame';

export default function HabilitationsPage() {
  const [requests, setRequests] = useState<UserProfileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchRequests = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      setError(null);
      try {
        const [data, settings] = await Promise.all([
          getHabilitationRequests(),
          getPlatformSettings(),
        ]);
        if (isMounted) {
          setRequests(data);
          setPlatformSettings(settings as PlatformSettings);
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

  if (isLoading || !platformSettings) {
    return (
      <div className="space-y-6">
          <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                  <div><Skeleton className="h-8 w-64 mb-2"/><Skeleton className="h-4 w-80"/></div>
              </CardHeader>
              <CardContent><Skeleton className="h-96 w-full" /></CardContent>
          </Card>
      </div>
    );
  }

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
           <BidExpertSearchResultsFrame
            items={requests}
            totalItemsCount={requests.length}
            dataTableColumns={columns}
            onSortChange={() => {}}
            platformSettings={platformSettings}
            isLoading={isLoading}
            searchTypeLabel="solicitações"
            searchColumnId="email"
            searchPlaceholder="Buscar por email do usuário..."
            facetedFilterColumns={facetedFilterColumns}
            sortOptions={[{value: 'updatedAt', label: 'Mais Recentes'}]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

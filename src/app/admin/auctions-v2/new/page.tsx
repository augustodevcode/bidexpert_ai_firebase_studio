// src/app/admin/auctions-v2/new/page.tsx
/**
 * @fileoverview Página para criação de um novo Leilão V2.
 * Carrega dependências e renderiza o formulário V2 de criação.
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Gavel, ArrowLeft, Loader2 } from 'lucide-react';

import type { AuctioneerProfileInfo, SellerProfileInfo, StateInfo, CityInfo, JudicialProcess, AuctionFormData } from '@/types';
import { createAuctionV2 } from '@/app/admin/auctions-v2/actions';
import { getAuctioneers } from '@/app/admin/auctioneers/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';
import { getJudicialProcesses } from '@/app/admin/judicial-processes/actions';

// Usando o form V2
import AuctionFormV2 from '@/app/admin/auctions-v2/components/auction-form-v2';

interface PageDependencies {
  auctioneers: AuctioneerProfileInfo[];
  sellers: SellerProfileInfo[];
  states: StateInfo[];
  allCities: CityInfo[];
  judicialProcesses: JudicialProcess[];
}

export default function NewAuctionPageV2() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [dependencies, setDependencies] = useState<PageDependencies | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDependencies = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        auctioneers,
        sellers,
        states,
        cities,
        judicialProcesses,
      ] = await Promise.all([
        getAuctioneers(),
        getSellers(),
        getStates(),
        getCities(),
        getJudicialProcesses(),
      ]);

      setDependencies({
        auctioneers,
        sellers,
        states,
        allCities: cities,
        judicialProcesses,
      });
    } catch (error) {
      console.error('Error loading dependencies:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados necessários.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDependencies();
  }, [loadDependencies]);

  const handleCreateAuction = async (data: Partial<AuctionFormData>) => {
    const result = await createAuctionV2(data as Record<string, unknown>);
    if (result.success && result.auctionId) {
      toast({
        title: 'Sucesso!',
        description: 'Leilão criado com sucesso.',
      });
      router.push(`/admin/auctions-v2/${result.auctionId}`);
    }
    return result;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!dependencies) {
    return (
      <div className="text-center py-12">
        <Gavel className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">
          Não foi possível carregar os dados necessários.
        </p>
        <Button variant="outline" onClick={loadDependencies}>
          <Loader2 className="h-4 w-4 mr-2" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/admin/auctions-v2')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gavel className="h-6 w-6 text-primary" />
            Novo Leilão
          </h1>
          <p className="text-sm text-muted-foreground">
            Preencha os dados para criar um novo leilão
          </p>
        </div>
      </div>

      {/* Form V2 */}
      <AuctionFormV2
        auctioneers={dependencies.auctioneers}
        sellers={dependencies.sellers}
        states={dependencies.states}
        allCities={dependencies.allCities}
        judicialProcesses={dependencies.judicialProcesses}
        onSubmit={handleCreateAuction}
      />
    </div>
  );
}

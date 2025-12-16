// src/app/admin/assets/new/page.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { LotCategory, JudicialProcess, SellerProfileInfo, StateInfo, CityInfo } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { createAsset } from '../actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getJudicialProcesses } from '@/app/admin/judicial-processes/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';
import { AssetFormV2 } from '../asset-form-v2';
import { Loader2 } from 'lucide-react';

export default function NewAssetPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [dependencies, setDependencies] = useState<{
    processes: JudicialProcess[],
    categories: LotCategory[],
    sellers: SellerProfileInfo[],
    allStates: StateInfo[],
    allCities: CityInfo[],
  } | null>(null);

  const fetchPageData = useCallback(async () => {
    try {
      console.log("Fetching data for NewAssetPage...");

      const [
        processesResult,
        categoriesResult,
        sellersResult,
        statesResult,
        citiesResult
      ] = await Promise.allSettled([
        getJudicialProcesses(),
        getLotCategories(),
        getSellers(),
        getStates(),
        getCities(),
      ]);

      const processResult = (result: PromiseSettledResult<any>, name: string) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`Failed to fetch ${name}:`, result.reason);
          toast({
            title: `Erro ao carregar ${name}`,
            description: 'Não foi possível carregar estes dados. O formulário pode estar limitado.',
            variant: 'destructive'
          });
          return [];
        }
      };

      const processes = processResult(processesResult, 'Processos Judiciais');
      const categories = processResult(categoriesResult, 'Categorias');
      const sellers = processResult(sellersResult, 'Comitentes');
      const states = processResult(statesResult, 'Estados');
      const cities = processResult(citiesResult, 'Cidades');

      // Debug logging
      if (processes.length > 0) console.log('Processes loaded:', processes.length);
      if (categories.length > 0) console.log('Categories loaded:', categories.length);
      if (sellers.length > 0) console.log('Sellers loaded:', sellers.length);

      setDependencies({
        processes,
        categories,
        sellers,
        allStates: states,
        allCities: cities
      });
    } catch (e) {
      console.error("Critical failure in fetchPageData:", e);
      toast({ title: 'Erro Crítico', description: 'Falha fatal ao inicializar a página.', variant: 'destructive' });
      // Fallback to empty arrays to allow form rendering even in critical failure
      setDependencies({
        processes: [],
        categories: [],
        sellers: [],
        allStates: [],
        allCities: []
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  if (!dependencies) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <AssetFormV2
        processes={dependencies.processes}
        categories={dependencies.categories}
        sellers={dependencies.sellers}
        allStates={dependencies.allStates}
        allCities={dependencies.allCities}
        onSubmitAction={createAsset}
        onSuccess={() => {
          // Small delay to allow the success toast to be seen
          setTimeout(() => {
            router.push('/admin/assets');
          }, 1500);
        }}
        onCancel={() => router.back()}
      />
    </div>
  );
}


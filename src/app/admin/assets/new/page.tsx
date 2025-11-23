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
      const [processes, categories, sellers, states, cities] = await Promise.all([
        getJudicialProcesses(),
        getLotCategories(),
        getSellers(),
        getStates(),
        getCities(),
      ]);
      
      // Debug logging to find the Decimal object
      console.error('Processes:', JSON.stringify(processes).substring(0, 200));
      console.error('Categories:', JSON.stringify(categories).substring(0, 200));
      console.error('Sellers:', JSON.stringify(sellers).substring(0, 200));
      
      setDependencies({ processes, categories, sellers, allStates: states, allCities: cities });
    } catch (e) {
      console.error("Failed to load data for new asset page:", e);
      toast({ title: 'Erro ao Carregar', description: 'Não foi possível buscar os dados necessários para criar um ativo.', variant: 'destructive'});
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


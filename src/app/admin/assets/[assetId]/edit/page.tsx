// src/app/admin/assets/[assetId]/edit/page.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { Asset, LotCategory, JudicialProcess, SellerProfileInfo, StateInfo, CityInfo } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getAsset, updateAsset } from '../../actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getJudicialProcesses } from '@/app/admin/judicial-processes/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';
import { AssetFormV2 } from '../../asset-form-v2';
import { Loader2 } from 'lucide-react';

export default function EditAssetPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const assetId = params.assetId as string;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [dependencies, setDependencies] = useState<{
    processes: JudicialProcess[],
    categories: LotCategory[],
    sellers: SellerProfileInfo[],
    allStates: StateInfo[],
    allCities: CityInfo[],
  } | null>(null);

  const fetchPageData = useCallback(async () => {
    try {
      const [fetchedAsset, processes, categories, sellers, states, cities] = await Promise.all([
        getAsset(assetId),
        getJudicialProcesses(),
        getLotCategories(),
        getSellers(),
        getStates(),
        getCities(),
      ]);
      
      if (!fetchedAsset) {
          toast({ title: 'Erro', description: 'Ativo não encontrado.', variant: 'destructive' });
          router.push('/admin/assets');
          return;
      }
      
      setAsset(fetchedAsset);
      setDependencies({ processes, categories, sellers, allStates: states, allCities: cities });
    } catch (e) {
      console.error("Failed to load data for edit asset page:", e);
      toast({ title: 'Erro ao Carregar', description: 'Não foi possível buscar os dados do ativo.', variant: 'destructive'});
    }
  }, [assetId, toast, router]);
  
  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  if (!asset || !dependencies) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <AssetFormV2
        initialData={asset}
        processes={dependencies.processes}
        categories={dependencies.categories}
        sellers={dependencies.sellers}
        allStates={dependencies.allStates}
        allCities={dependencies.allCities}
        onSubmitAction={(data) => updateAsset(assetId, data)}
        onSuccess={() => {
            router.push('/admin/assets');
        }}
        onCancel={() => router.back()}
      />
    </div>
  );
}


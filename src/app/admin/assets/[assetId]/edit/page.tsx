// src/app/admin/assets/[assetId]/edit/page.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useParams, notFound } from 'next/navigation';
import type { Asset, AssetFormData, LotCategory, JudicialProcess, SellerProfileInfo, StateInfo, CityInfo } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getAsset, updateAsset, deleteAsset } from '../actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getJudicialProcesses } from '@/app/admin/judicial-processes/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import AssetForm from '../asset-form';
import { Package } from 'lucide-react';

export default function EditAssetPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const assetId = params.assetId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [asset, setAsset] = useState<Asset | null>(null);

  // Form dependencies
  const [dependencies, setDependencies] = useState<{
    processes: JudicialProcess[],
    categories: LotCategory[],
    sellers: SellerProfileInfo[],
    allStates: StateInfo[],
    allCities: CityInfo[],
  } | null>(null);
  
  const formRef = React.useRef<any>(null);

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedAsset, processes, categories, sellers, states, cities] = await Promise.all([
        getAsset(assetId),
        getJudicialProcesses(),
        getLotCategories(),
        getSellers(),
        getStates(),
        getCities(),
      ]);
      if (!fetchedAsset) notFound();
      
      setAsset(fetchedAsset);
      setDependencies({ processes, categories, sellers, allStates: states, allCities: cities });
    } catch (e) {
      console.error("Failed to load data for asset edit page:", e);
      toast({ title: 'Erro ao Carregar', description: 'Não foi possível buscar os dados necessários para editar o ativo.', variant: 'destructive'});
      router.push('/admin/assets');
    } finally {
      setIsLoading(false);
    }
  }, [assetId, toast, router]);
  
  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);
  
  const handleUpdate = async (data: AssetFormData) => {
    setIsSubmitting(true);
    const result = await updateAsset(assetId, data);
    if (result.success) {
      toast({ title: 'Sucesso', description: 'Ativo atualizado com sucesso.' });
      fetchPageData(); // Re-fetch to get latest data
    } else {
      toast({ title: 'Erro', description: result.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
    return result;
  };

  const handleDelete = async () => {
    const result = await deleteAsset(assetId);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      router.push('/admin/assets');
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
  };

  const handleSave = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <FormPageLayout
      formTitle="Editar Ativo"
      formDescription={asset?.title || 'Carregando...'}
      icon={Package}
      isViewMode={false} // Edit page is always in edit mode
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      onSave={handleSave}
      onDelete={handleDelete}
      onCancel={() => router.push('/admin/assets')}
    >
      {dependencies && asset ? (
         <AssetForm
            ref={formRef}
            initialData={asset}
            processes={dependencies.processes}
            categories={dependencies.categories}
            sellers={dependencies.sellers}
            allStates={dependencies.allStates}
            allCities={dependencies.allCities}
            onSubmitAction={handleUpdate}
            onSuccess={() => fetchPageData()}
            onCancel={() => router.push('/admin/assets')}
          />
      ) : null}
    </FormPageLayout>
  );
}

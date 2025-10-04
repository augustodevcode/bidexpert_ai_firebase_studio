// src/app/admin/assets/[assetId]/edit/page.tsx
/**
 * @fileoverview Página para edição de um Ativo específico.
 * Busca os dados iniciais do ativo e as entidades relacionadas (processos,
 * categorias, comitentes) necessárias para popular os seletores do formulário.
 * Passa a ação de atualização para o componente `AssetForm`.
 */
import AssetForm from '../../asset-form';
import { getAsset, updateAsset } from '../../actions';
import { getJudicialProcesses } from '@/app/admin/judicial-processes/actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';
import { notFound } from 'next/navigation';
import type { AssetFormData } from '../../asset-form-schema';

export default async function EditAssetPage({ params }: { params: { assetId: string } }) {
  const assetId = params.assetId;
  const [asset, processes, categories, sellers, states, cities] = await Promise.all([
    getAsset(assetId),
    getJudicialProcesses(),
    getLotCategories(),
    getSellers(),
    getStates(),
    getCities(),
  ]);

  if (!asset) {
    notFound();
  }

  async function handleUpdateAsset(data: Partial<AssetFormData>) {
    'use server';
    return updateAsset(assetId, data);
  }

  return (
    <AssetForm
      initialData={asset}
      processes={processes}
      categories={categories}
      sellers={sellers}
      allStates={states}
      allCities={cities}
      onSubmitAction={handleUpdateAsset}
      formTitle="Editar Ativo"
      formDescription="Modifique os detalhes do ativo existente."
      submitButtonText="Salvar Alterações"
    />
  );
}

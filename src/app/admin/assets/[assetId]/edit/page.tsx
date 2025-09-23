// src/app/admin/assets/[assetId]/edit/page.tsx
/**
 * @fileoverview Página para edição de um Asset (ativo) específico.
 * Busca os dados iniciais do bem e as entidades relacionadas (processos,
 * categorias, comitentes) necessárias para popular os seletores do formulário.
 * Passa a ação de atualização para o componente `AssetForm`.
 */
import AssetForm from '../../asset-form';
import { getAsset, updateAsset } from '../../actions';
import { getJudicialProcesses } from '@/app/admin/judicial-processes/actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { notFound } from 'next/navigation';
import type { AssetFormData } from '../../asset-form-schema';

export default async function EditAssetPage({ params }: { params: { assetId: string } }) {
  const assetId = params.assetId;
  const [asset, processes, categories, sellers] = await Promise.all([
    getAsset(assetId),
    getJudicialProcesses(),
    getLotCategories(),
    getSellers()
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
      onSubmitAction={handleUpdateAsset}
      formTitle="Editar Bem"
      formDescription="Modifique os detalhes do bem existente."
      submitButtonText="Salvar Alterações"
    />
  );
}

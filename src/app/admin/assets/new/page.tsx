// src/app/admin/assets/new/page.tsx
/**
 * @fileoverview Página para criação de um novo Ativo.
 * Este componente busca os dados necessários para os seletores do formulário
 * (processos, categorias, comitentes) e renderiza o `AssetForm` para a
 * entrada de dados, passando a server action `createAsset` para persistir o novo registro.
 */
import AssetForm from '../asset-form';
import { createAsset } from '../actions';
import { getJudicialProcesses } from '@/app/admin/judicial-processes/actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import type { AssetFormData } from '../asset-form-schema';

export default async function NewAssetPage() {
  const [processes, categories, sellers] = await Promise.all([
    getJudicialProcesses(),
    getLotCategories(),
    getSellers()
  ]);

  async function handleCreateAsset(data: AssetFormData) {
    'use server';
    return createAsset(data);
  }

  return (
    <AssetForm
      processes={processes}
      categories={categories}
      sellers={sellers}
      onSubmitAction={handleCreateAsset}
      formTitle="Novo Ativo"
      formDescription="Cadastre um novo ativo para que possa ser posteriormente loteado em um leilão."
      submitButtonText="Criar Ativo"
    />
  );
}

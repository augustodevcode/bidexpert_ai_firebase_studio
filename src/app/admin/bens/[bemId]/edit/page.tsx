// src/app/admin/bens/[bemId]/edit/page.tsx
import BemForm from '../../bem-form';
import { getBem, updateBem } from '../../actions';
import { getJudicialProcesses } from '@/app/admin/judicial-processes/actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { notFound } from 'next/navigation';
import type { BemFormData } from '@/types';

export default async function EditBemPage({ params }: { params: { bemId: string } }) {
  const bemId = params.bemId;
  const [bem, processes, categories, sellers] = await Promise.all([
    getBem(bemId),
    getJudicialProcesses(),
    getLotCategories(),
    getSellers()
  ]);

  if (!bem) {
    notFound();
  }

  async function handleUpdateBem(data: Partial<BemFormData>) {
    'use server';
    return updateBem(bemId, data);
  }

  return (
    <BemForm
      initialData={bem}
      processes={processes}
      categories={categories}
      sellers={sellers}
      onSubmitAction={handleUpdateBem}
      formTitle="Editar Bem"
      formDescription="Modifique os detalhes do bem existente."
      submitButtonText="Salvar Alterações"
    />
  );
}

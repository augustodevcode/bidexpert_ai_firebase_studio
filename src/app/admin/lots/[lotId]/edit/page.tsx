
import LotForm from '../lot-form';
import { getLot, updateLot, type LotFormData } from '../actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { notFound } from 'next/navigation';

export default async function EditLotPage({ params }: { params: { lotId: string } }) {
  const lotId = params.lotId;
  const lot = await getLot(lotId);
  const categories = await getLotCategories();

  if (!lot) {
    notFound();
  }

  async function handleUpdateLot(data: Partial<LotFormData>) {
    'use server';
    return updateLot(lotId, data);
  }

  return (
    <LotForm
      initialData={lot}
      categories={categories}
      onSubmitAction={handleUpdateLot}
      formTitle="Editar Lote"
      formDescription="Modifique os detalhes do lote existente."
      submitButtonText="Salvar Alterações"
    />
  );
}

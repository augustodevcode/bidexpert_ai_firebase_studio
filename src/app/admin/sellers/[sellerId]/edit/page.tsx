

import SellerForm from '../../seller-form';
import { getSeller, updateSeller, type SellerFormData } from '../../actions';
import { notFound } from 'next/navigation';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';

export default async function EditSellerPage({ params }: { params: { sellerId: string } }) {
  const sellerId = params.sellerId;
  const [seller, judicialBranches] = await Promise.all([
    getSeller(sellerId),
    getJudicialBranches()
  ]);

  if (!seller) {
    notFound();
  }

  async function handleUpdateSeller(data: Partial<SellerFormData>) {
    'use server';
    return updateSeller(sellerId, data);
  }

  return (
    <SellerForm
      initialData={seller}
      judicialBranches={judicialBranches}
      onSubmitAction={handleUpdateSeller}
      formTitle="Editar Comitente"
      formDescription="Modifique os detalhes do comitente existente."
      submitButtonText="Salvar Alterações"
    />
  );
}

    

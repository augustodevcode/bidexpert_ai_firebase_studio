// src/app/admin/direct-sales/[offerId]/edit/page.tsx
import DirectSaleForm from '../../direct-sale-form';
import { getDirectSaleOffer, updateDirectSaleOffer, type DirectSaleOfferFormData } from '../../actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { notFound } from 'next/navigation';

export default async function EditDirectSaleOfferPage({ params }: { params: { offerId: string } }) {
  const offerId = params.offerId;
  
  const [offer, categories, sellers] = await Promise.all([
    getDirectSaleOffer(offerId),
    getLotCategories(),
    getSellers()
  ]);

  if (!offer) {
    notFound();
  }

  async function handleUpdateOffer(data: Partial<DirectSaleOfferFormData>) {
    'use server';
    return updateDirectSaleOffer(offerId, data);
  }

  return (
    <DirectSaleForm
      initialData={offer}
      categories={categories}
      sellers={sellers}
      onSubmitAction={handleUpdateOffer}
      formTitle="Editar Oferta de Venda Direta"
      formDescription="Modifique os detalhes da oferta existente."
      submitButtonText="Salvar Alterações"
    />
  );
}

// src/app/admin/direct-sales/new/page.tsx
import DirectSaleForm from '../direct-sale-form';
import { createDirectSaleOffer, type DirectSaleOfferFormData } from '../actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getSellers } from '@/app/admin/sellers/actions';

export default async function NewDirectSaleOfferPage() {
  const categories = await getLotCategories();
  const sellers = await getSellers();

  async function handleCreateOffer(data: DirectSaleOfferFormData) {
    'use server';
    return createDirectSaleOffer(data);
  }

  return (
    <DirectSaleForm
      categories={categories}
      sellers={sellers}
      onSubmitAction={handleCreateOffer}
      formTitle="Nova Oferta de Venda Direta"
      formDescription="Preencha os detalhes para criar uma nova oferta."
      submitButtonText="Criar Oferta"
    />
  );
}

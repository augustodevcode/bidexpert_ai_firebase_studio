// src/app/admin/direct-sales/new/page.tsx
/**
 * @fileoverview Página para criação de uma nova Oferta de Venda Direta.
 * Este componente Server-Side busca os dados necessários para os seletores do formulário
 * (categorias e vendedores) e renderiza o `DirectSaleForm` para a entrada de dados.
 */
import DirectSaleForm from '../direct-sale-form';
import { createDirectSaleOffer, type DirectSaleOfferFormData } from '../actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getSellers } from '@/app/admin/sellers/actions';

export default async function NewDirectSaleOfferPage() {
  const [categories, sellers] = await Promise.all([
    getLotCategories(),
    getSellers()
  ]);

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

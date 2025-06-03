
import AuctionForm from '../auction-form';
import { createAuction, type AuctionFormData } from '../actions';
import { getLotCategories } from '@/app/admin/categories/actions';

export default async function NewAuctionPage() {
  const categories = await getLotCategories();

  async function handleCreateAuction(data: AuctionFormData) {
    'use server';
    return createAuction(data);
  }

  return (
    <AuctionForm
      categories={categories}
      onSubmitAction={handleCreateAuction}
      formTitle="Novo Leilão"
      formDescription="Preencha os detalhes para criar um novo leilão."
      submitButtonText="Criar Leilão"
    />
  );
}

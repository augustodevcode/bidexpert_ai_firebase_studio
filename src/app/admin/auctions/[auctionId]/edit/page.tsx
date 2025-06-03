import AuctionForm from '../auction-form';
import { getAuction, updateAuction, type AuctionFormData } from '../actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { notFound } from 'next/navigation';

export default async function EditAuctionPage({ params }: { params: { auctionId: string } }) {
  const auctionId = params.auctionId;
  const auction = await getAuction(auctionId);
  const categories = await getLotCategories();

  if (!auction) {
    notFound();
  }

  async function handleUpdateAuction(data: Partial<AuctionFormData>) {
    'use server';
    return updateAuction(auctionId, data);
  }

  return (
    <AuctionForm
      initialData={auction}
      categories={categories}
      onSubmitAction={handleUpdateAuction}
      formTitle="Editar Leilão"
      formDescription="Modifique os detalhes do leilão existente."
      submitButtonText="Salvar Alterações"
    />
  );
}

import AuctionForm from '../auction-form';
import { createAuction, type AuctionFormData } from '../actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getAuctioneers } from '@/app/admin/auctioneers/actions'; // Import getAuctioneers
import { getSellers } from '@/app/admin/sellers/actions'; // Import getSellers

export default async function NewAuctionPage() {
  const categories = await getLotCategories();
  const auctioneers = await getAuctioneers(); // Fetch auctioneers
  const sellers = await getSellers(); // Fetch sellers

  async function handleCreateAuction(data: AuctionFormData) {
    'use server';
    return createAuction(data);
  }

  return (
    <AuctionForm
      categories={categories}
      auctioneers={auctioneers} // Pass auctioneers
      sellers={sellers}         // Pass sellers
      onSubmitAction={handleCreateAuction}
      formTitle="Novo Leilão"
      formDescription="Preencha os detalhes para criar um novo leilão."
      submitButtonText="Criar Leilão"
    />
  );
}

    
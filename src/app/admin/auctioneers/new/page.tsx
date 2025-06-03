
import AuctioneerForm from '../auctioneer-form';
import { createAuctioneer, type AuctioneerFormData } from '../actions';

export default async function NewAuctioneerPage() {
  async function handleCreateAuctioneer(data: AuctioneerFormData) {
    'use server';
    return createAuctioneer(data);
  }

  return (
    <AuctioneerForm
      onSubmitAction={handleCreateAuctioneer}
      formTitle="Novo Leiloeiro"
      formDescription="Preencha os detalhes para cadastrar um novo leiloeiro."
      submitButtonText="Criar Leiloeiro"
    />
  );
}

    
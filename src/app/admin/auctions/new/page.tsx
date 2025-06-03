
import AuctionForm from '../auction-form';
import { createAuction, type AuctionFormData } from '../actions';

export default async function NewAuctionPage() {
  async function handleCreateAuction(data: AuctionFormData) {
    'use server';
    return createAuction(data);
  }

  return (
    <AuctionForm
      onSubmitAction={handleCreateAuction}
      formTitle="Novo Leilão"
      formDescription="Preencha os detalhes para criar um novo leilão."
      submitButtonText="Criar Leilão"
    />
  );
}

// src/app/admin/auctioneers/new/page.tsx
import AuctioneerForm from '../auctioneer-form';
import { createAuctioneer, type AuctioneerFormData } from '../actions';
import { getSellers } from '@/app/admin/sellers/actions'; // Re-add for consistency if needed anywhere else
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';

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

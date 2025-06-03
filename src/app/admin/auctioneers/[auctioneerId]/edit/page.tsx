
import AuctioneerForm from '../../auctioneer-form';
import { getAuctioneer, updateAuctioneer, type AuctioneerFormData } from '../../actions';
import { notFound } from 'next/navigation';

export default async function EditAuctioneerPage({ params }: { params: { auctioneerId: string } }) {
  const auctioneerId = params.auctioneerId;
  const auctioneer = await getAuctioneer(auctioneerId);

  if (!auctioneer) {
    notFound();
  }

  async function handleUpdateAuctioneer(data: Partial<AuctioneerFormData>) {
    'use server';
    return updateAuctioneer(auctioneerId, data);
  }

  return (
    <AuctioneerForm
      initialData={auctioneer}
      onSubmitAction={handleUpdateAuctioneer}
      formTitle="Editar Leiloeiro"
      formDescription="Modifique os detalhes do leiloeiro existente."
      submitButtonText="Salvar Alterações"
    />
  );
}

    
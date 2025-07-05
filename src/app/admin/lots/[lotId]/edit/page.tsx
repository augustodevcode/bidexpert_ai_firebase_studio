

import LotForm from '../../lot-form';
import { getLot, updateLot, getBens as getBensForLotting } from '../../actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getAuctions } from '@/app/admin/auctions/actions';
import { notFound } from 'next/navigation';
import type { LotCategory, Auction, Bem, LotFormData } from '@/types';

export default async function EditLotPage({ params }: { params: { lotId: string } }) {
  const lotId = params.lotId;
  const lot = await getLot(lotId);
  
  if (!lot) {
    notFound();
  }
  
  const [categories, auctions, bens] = await Promise.all([
    getLotCategories(),
    getAuctions(),
    lot.bemIds && lot.bemIds.length > 0 ? getBensForLotting({ judicialProcessId: lot.judicialProcessId, sellerId: lot.sellerId}) : Promise.resolve([])
  ]);

  async function handleUpdateLot(data: Partial<LotFormData>) {
    'use server';
    return updateLot(lotId, data);
  }

  return (
    <LotForm
      initialData={lot}
      categories={categories}
      auctions={auctions}
      initialAvailableBens={bens}
      onSubmitAction={handleUpdateLot}
      formTitle="Editar Lote"
      formDescription="Modifique os detalhes do lote existente."
      submitButtonText="Salvar Alterações"
      defaultAuctionId={lot.auctionId}
    />
  );
}

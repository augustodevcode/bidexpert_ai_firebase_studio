// src/app/admin/lots/[lotId]/edit/page.tsx
import LotForm from '../../lot-form';
import { getLot, updateLot, type LotFormData } from '../../actions';
import { getBens as getBensForLotting } from '@/app/admin/bens/actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getAuctions, getAuction } from '@/app/admin/auctions/actions';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';
import { notFound } from 'next/navigation';
import type { LotCategory, Auction, Bem, StateInfo, CityInfo } from '@/types';

export default async function EditLotPage({ params }: { params: { lotId: string } }) {
  const lotId = params.lotId;
  const lot = await getLot(lotId);
  
  if (!lot) {
    notFound();
  }
  
  // Fetch the parent auction to determine the context for available bens
  const auction = await getAuction(lot.auctionId);

  // Determine the filter for bens based on the auction's context
  const filterForBens = auction?.auctionType === 'JUDICIAL' && auction.judicialProcessId
    ? { judicialProcessId: auction.judicialProcessId }
    : (auction?.sellerId ? { sellerId: auction.sellerId } : {});

  // Fetch all necessary data in parallel
  const [categories, auctions, states, allCities, availableBens] = await Promise.all([
    getLotCategories(),
    getAuctions(),
    getStates(),
    getCities(),
    getBensForLotting(filterForBens)
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
      states={states}
      allCities={allCities}
      initialAvailableBens={availableBens}
      onSubmitAction={handleUpdateLot}
      formTitle="Editar Lote"
      formDescription="Modifique os detalhes do lote existente."
      submitButtonText="Salvar Alterações"
      defaultAuctionId={lot.auctionId}
    />
  );
}

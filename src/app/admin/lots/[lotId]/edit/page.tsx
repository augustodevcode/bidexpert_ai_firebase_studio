

import LotForm from '../../lot-form';
import { getLot, updateLot } from '../../actions';
import { getBens as getBensForLotting } from '@/app/admin/bens/actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getAuctions } from '@/app/admin/auctions/actions';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';
import { notFound } from 'next/navigation';
import type { LotCategory, Auction, Bem, LotFormData, StateInfo, CityInfo } from '@/types';

export default async function EditLotPage({ params }: { params: { lotId: string } }) {
  const lotId = params.lotId;
  const lot = await getLot(lotId);
  
  if (!lot) {
    notFound();
  }
  
  const [categories, auctions, states, allCities, bens] = await Promise.all([
    getLotCategories(),
    getAuctions(),
    getStates(),
    getCities(),
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
      states={states}
      allCities={allCities}
      initialAvailableBens={bens}
      onSubmitAction={handleUpdateLot}
      formTitle="Editar Lote"
      formDescription="Modifique os detalhes do lote existente."
      submitButtonText="Salvar Alterações"
      defaultAuctionId={lot.auctionId}
    />
  );
}

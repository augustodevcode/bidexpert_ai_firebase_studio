
import LotForm from '../../lot-form';
import { getLot, updateLot, type LotFormData } from '../../actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getAuctions } from '@/app/admin/auctions/actions';
import { getStates } from '@/app/admin/states/actions'; // Importar getStates
import { getCities } from '@/app/admin/cities/actions';   // Importar getCities
import { notFound } from 'next/navigation';
import type { LotCategory, Auction, StateInfo, CityInfo } from '@/types';

export default async function EditLotPage({ params }: { params: { lotId: string } }) {
  const lotId = params.lotId;
  const lot = await getLot(lotId);
  const categories = await getLotCategories();
  const auctions = await getAuctions();
  const states = await getStates();
  const allCities = await getCities(); // Buscar todas as cidades

  if (!lot) {
    notFound();
  }

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
      onSubmitAction={handleUpdateLot}
      formTitle="Editar Lote"
      formDescription="Modifique os detalhes do lote existente."
      submitButtonText="Salvar Alterações"
      defaultAuctionId={lot.auctionId}
    />
  );
}

    
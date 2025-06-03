
import LotForm from '../../lot-form'; // Corrected path
import { getLot, updateLot, type LotFormData } from '../../actions'; // Corrected path
import { getLotCategories } from '@/app/admin/categories/actions';
import { getAuctions } from '@/app/admin/auctions/actions'; // Importar getAuctions
import { notFound } from 'next/navigation';

export default async function EditLotPage({ params }: { params: { lotId: string } }) {
  const lotId = params.lotId;
  const lot = await getLot(lotId);
  const categories = await getLotCategories();
  const auctions = await getAuctions(); // Buscar leilões

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
      auctions={auctions} // Passar leilões para o formulário
      onSubmitAction={handleUpdateLot}
      formTitle="Editar Lote"
      formDescription="Modifique os detalhes do lote existente."
      submitButtonText="Salvar Alterações"
      defaultAuctionId={lot.auctionId} // Garante que o leilão atual seja o padrão, mas pode ser alterado
    />
  );
}

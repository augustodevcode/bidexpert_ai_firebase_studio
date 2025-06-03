
import LotForm from '../lot-form';
import { createLot, type LotFormData } from '../actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getAuctions } from '@/app/admin/auctions/actions'; // Importar getAuctions
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Wrapper para ler query params, já que a page é Server Component
function NewLotPageContent({ categories, auctions, auctionIdFromQuery }: { categories: any[], auctions: any[], auctionIdFromQuery?: string }) {
  async function handleCreateLot(data: LotFormData) {
    'use server';
    return createLot(data);
  }

  return (
    <LotForm
      onSubmitAction={handleCreateLot}
      categories={categories}
      auctions={auctions} // Passar leilões para o formulário
      formTitle="Novo Lote"
      formDescription="Preencha os detalhes para criar um novo lote."
      submitButtonText="Criar Lote"
      defaultAuctionId={auctionIdFromQuery} // Passar ID do leilão da query
    />
  );
}

export default async function NewLotPage({ searchParams }: { searchParams?: { auctionId?: string } }) {
  const categories = await getLotCategories();
  const auctions = await getAuctions(); // Buscar leilões
  const auctionIdFromQuery = searchParams?.auctionId;

  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <NewLotPageContent categories={categories} auctions={auctions} auctionIdFromQuery={auctionIdFromQuery} />
    </Suspense>
  );
}

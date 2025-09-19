// src/app/admin/auctions/new/page.tsx
import AuctionForm from '../auction-form';
import { createAuction, type AuctionFormData } from '../actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getAuctioneers } from '@/app/admin/auctioneers/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { Gavel } from 'lucide-react';
import { useRef } from 'react';

export default async function NewAuctionPage() {
  const [categories, auctioneers, sellers, states, cities] = await Promise.all([
      getLotCategories(),
      getAuctioneers(),
      getSellers(),
      getStates(),
      getCities(),
  ]);

  return (
    <div data-ai-id="admin-auction-form-card">
      <FormPageLayout
        formTitle="Novo Leilão"
        formDescription="Preencha os detalhes para criar um novo leilão."
        icon={Gavel}
        isViewMode={false} // Formulário de criação está sempre em modo de edição
      >
        <AuctionForm
          categories={categories}
          auctioneers={auctioneers}
          sellers={sellers}
          states={states}
          allCities={cities}
          onSubmitAction={createAuction}
          formTitle="" // Título e descrição já estão no layout
          formDescription=""
          submitButtonText="Criar Leilão"
        />
      </FormPageLayout>
    </div>
  );
}

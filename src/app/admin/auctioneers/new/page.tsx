// src/app/admin/auctioneers/new/page.tsx
import AuctioneerForm from '../auctioneer-form';
import { createAuctioneer, type AuctioneerFormData } from '../actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { Gavel } from 'lucide-react';
import React from 'react';

export default async function NewAuctioneerPage() {
  
  async function handleCreateAuctioneer(data: AuctioneerFormData) {
    'use server';
    return createAuctioneer(data);
  }

  return (
     <div data-ai-id="admin-auctioneer-form-card">
        <FormPageLayout
            formTitle="Novo Leiloeiro"
            formDescription="Preencha os detalhes para cadastrar um novo leiloeiro."
            icon={Gavel}
            isViewMode={false} // Always in edit mode for new page
            onSave={() => {
                // This will be triggered by the form's internal submit button
                // We could also pass a ref to the form and call form.submit()
            }}
        >
             <AuctioneerForm
                onSubmitAction={handleCreateAuctioneer}
            />
        </FormPageLayout>
    </div>
  );
}



import SellerForm from '../seller-form';
import { createSeller, type SellerFormData } from '../actions';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';

export default async function NewSellerPage() {
  const judicialBranches = await getJudicialBranches();

  async function handleCreateSeller(data: SellerFormData) {
    'use server';
    return createSeller(data);
  }

  return (
    <div data-ai-id="admin-seller-form-card">
        <SellerForm
          judicialBranches={judicialBranches}
          onSubmitAction={handleCreateSeller}
          formTitle="Novo Comitente"
          formDescription="Preencha os detalhes para cadastrar um novo comitente/vendedor."
          submitButtonText="Criar Comitente"
        />
    </div>
  );
}

    

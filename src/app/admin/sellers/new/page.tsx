
import SellerForm from '../seller-form';
import { createSeller, type SellerFormData } from '../actions';

export default async function NewSellerPage() {
  async function handleCreateSeller(data: SellerFormData) {
    'use server';
    return createSeller(data);
  }

  return (
    <SellerForm
      onSubmitAction={handleCreateSeller}
      formTitle="Novo Comitente"
      formDescription="Preencha os detalhes para cadastrar um novo comitente/vendedor."
      submitButtonText="Criar Comitente"
    />
  );
}

    
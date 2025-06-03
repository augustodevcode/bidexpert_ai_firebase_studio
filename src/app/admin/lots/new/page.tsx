
import LotForm from '../lot-form';
import { createLot, type LotFormData } from '../actions';
// import { getLotCategories } from '@/app/admin/categories/actions'; // For fetching categories for select

export default async function NewLotPage() {
  // const categories = await getLotCategories(); // Fetch categories if needed for the form

  async function handleCreateLot(data: LotFormData) {
    'use server';
    return createLot(data);
  }

  return (
    <LotForm
      onSubmitAction={handleCreateLot}
      // categories={categories}
      formTitle="Novo Lote"
      formDescription="Preencha os detalhes para criar um novo lote."
      submitButtonText="Criar Lote"
    />
  );
}

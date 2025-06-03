
import CategoryForm from '../category-form';
import { createLotCategory } from '../actions';
import { useAuth } from '@/contexts/auth-context'; // To pass userId for role check

export default function NewCategoryPage() {
  // const { user } = useAuth(); // In a real scenario, get user for role check in action

  async function handleCreateCategory(data: { name: string; description?: string }) {
    'use server';
    // return createLotCategory(data, user?.uid);
    return createLotCategory(data); // Simplified for now, action has placeholder role check
  }

  return (
    <CategoryForm
      onSubmitAction={handleCreateCategory}
      formTitle="Nova Categoria de Lote"
      formDescription="Preencha os detalhes para criar uma nova categoria."
      submitButtonText="Criar Categoria"
    />
  );
}

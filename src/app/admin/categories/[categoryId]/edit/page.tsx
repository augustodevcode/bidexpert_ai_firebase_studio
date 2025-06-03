
import CategoryForm from '../category-form';
import { getLotCategory, updateLotCategory } from '../actions';
import { notFound } from 'next/navigation';
// import { useAuth } from '@/contexts/auth-context'; // To pass userId for role check

export default async function EditCategoryPage({ params }: { params: { categoryId: string } }) {
  const categoryId = params.categoryId;
  const category = await getLotCategory(categoryId);
  // const { user } = useAuth(); // In a real scenario, get user for role check in action

  if (!category) {
    notFound();
  }

  async function handleUpdateCategory(data: { name:string; description?: string }) {
    'use server';
    // return updateLotCategory(categoryId, data, user?.uid);
    return updateLotCategory(categoryId, data); // Simplified for now, action has placeholder role check
  }

  return (
    <CategoryForm
      initialData={category}
      onSubmitAction={handleUpdateCategory}
      formTitle="Editar Categoria de Lote"
      formDescription="Modifique os detalhes da categoria existente."
      submitButtonText="Salvar Alterações"
    />
  );
}

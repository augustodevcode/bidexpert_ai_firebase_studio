// src/app/admin/categories/[categoryId]/edit/page.tsx
import CategoryForm from '../../category-form';
import { getLotCategory, updateLotCategory } from '../../actions';
import { notFound } from 'next/navigation';
import type { CategoryFormValues } from '../../category-form-schema';

export default async function EditCategoryPage({ params }: { params: { categoryId: string } }) {
  const categoryId = params.categoryId;
  const category = await getLotCategory(categoryId);
  // const { user } = useAuth(); // In a real scenario, get user for role check in action

  if (!category) {
    notFound();
  }

  async function handleUpdateCategory(data: CategoryFormValues) {
    'use server';
    // The cast is safe here because the form includes all fields.
    // In a more complex scenario, you might separate form types from DB types more strictly.
    return updateLotCategory(categoryId, data as Partial<Pick<LotCategory, "name" | "description">>);
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

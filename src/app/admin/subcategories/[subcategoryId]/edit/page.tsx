
import SubcategoryForm from '../../subcategory-form';
import { getSubcategoryByIdAction, updateSubcategoryAction, type SubcategoryFormData } from '../../actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { notFound } from 'next/navigation';

export default async function EditSubcategoryPage({ params }: { params: { subcategoryId: string } }) {
  const subcategoryId = params.subcategoryId;
  const subcategory = await getSubcategoryByIdAction(subcategoryId);
  const parentCategories = await getLotCategories();

  if (!subcategory) {
    notFound();
  }

  async function handleUpdateSubcategory(data: Partial<SubcategoryFormData>) {
    'use server';
    return updateSubcategoryAction(subcategoryId, data);
  }

  return (
    <SubcategoryForm
      initialData={subcategory}
      parentCategories={parentCategories}
      onSubmitAction={handleUpdateSubcategory}
      formTitle="Editar Subcategoria"
      formDescription="Modifique os detalhes da subcategoria existente."
      submitButtonText="Salvar Alterações"
    />
  );
}


import SubcategoryForm from '../subcategory-form';
import { createSubcategoryAction, type SubcategoryFormData } from '../actions';
import { getLotCategories } from '@/app/admin/categories/actions'; // Para buscar categorias pais

export default async function NewSubcategoryPage() {
  const parentCategories = await getLotCategories();

  async function handleCreateSubcategory(data: SubcategoryFormData) {
    'use server';
    return createSubcategoryAction(data);
  }

  return (
    <SubcategoryForm
      parentCategories={parentCategories}
      onSubmitAction={handleCreateSubcategory}
      formTitle="Nova Subcategoria"
      formDescription="Crie uma nova subcategoria e associe-a a uma categoria principal."
      submitButtonText="Criar Subcategoria"
    />
  );
}

// src/app/admin/categories/new/page.tsx
/**
 * @fileoverview Página para criação de uma nova Categoria de Lote.
 * Este componente Server-Side renderiza o `CategoryForm` para entrada de dados
 * e passa a server action `createLotCategory` para persistir o novo registro.
 */
import CategoryForm from '../category-form';
import { createLotCategory } from '../actions';

export default function NewCategoryPage() {

  async function handleCreateCategory(data: { name: string; description?: string }) {
    'use server';
    return createLotCategory(data);
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

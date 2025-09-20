// src/app/admin/bens/new/page.tsx
/**
 * @fileoverview Página para criação de um novo Bem (ativo).
 * Este componente busca os dados necessários para os seletores do formulário
 * (processos, categorias, comitentes) e renderiza o `BemForm` para a
 * entrada de dados, passando a server action `createBem` para persistir o novo registro.
 */
import BemForm from '../bem-form';
import { createBem } from '../actions';
import { getJudicialProcesses } from '@/app/admin/judicial-processes/actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import type { BemFormData } from '../bem-form-schema';

export default async function NewBemPage() {
  const [processes, categories, sellers] = await Promise.all([
    getJudicialProcesses(),
    getLotCategories(),
    getSellers()
  ]);

  async function handleCreateBem(data: BemFormData) {
    'use server';
    return createBem(data);
  }

  return (
    <BemForm
      processes={processes}
      categories={categories}
      sellers={sellers}
      onSubmitAction={handleCreateBem}
      formTitle="Novo Bem"
      formDescription="Cadastre um novo bem para que possa ser posteriormente loteado em um leilão."
      submitButtonText="Criar Bem"
    />
  );
}

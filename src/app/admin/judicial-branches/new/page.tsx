// src/app/admin/judicial-branches/new/page.tsx
/**
 * @fileoverview Página para criação de uma nova Vara Judicial.
 * Este componente Server-Side busca os dados necessários para os seletores do formulário
 * (a lista de comarcas) e renderiza o `JudicialBranchForm` para a entrada de dados,
 * passando a server action `createJudicialBranch` para persistir o novo registro.
 */
import JudicialBranchForm from '../judicial-branch-form';
import { createJudicialBranch } from '../actions';
import { getJudicialDistricts } from '@/app/admin/judicial-districts/actions';
import type { JudicialBranchFormData } from '../judicial-branch-form-schema';

export default async function NewJudicialBranchPage() {
  const districts = await getJudicialDistricts();
  
  async function handleCreateBranch(data: JudicialBranchFormData) {
    'use server';
    return createJudicialBranch(data);
  }

  return (
    <JudicialBranchForm
      districts={districts}
      onSubmitAction={handleCreateBranch}
      formTitle="Nova Vara Judicial"
      formDescription="Preencha os detalhes para cadastrar uma nova vara e associe-a a uma comarca."
      submitButtonText="Criar Vara"
    />
  );
}

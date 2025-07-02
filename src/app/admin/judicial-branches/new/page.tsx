// src/app/admin/judicial-branches/new/page.tsx
import JudicialBranchForm from '../judicial-branch-form';
import { createJudicialBranchAction } from '../actions';
import { getJudicialDistricts } from '@/app/admin/judicial-districts/actions';
import type { JudicialBranchFormData } from '../judicial-branch-form-schema';

export default async function NewJudicialBranchPage() {
  const districts = await getJudicialDistricts();
  
  async function handleCreateBranch(data: JudicialBranchFormData) {
    'use server';
    return createJudicialBranchAction(data);
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

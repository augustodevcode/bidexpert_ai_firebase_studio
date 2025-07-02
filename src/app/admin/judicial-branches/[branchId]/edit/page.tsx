// src/app/admin/judicial-branches/[branchId]/edit/page.tsx
import JudicialBranchForm from '../../judicial-branch-form';
import { getJudicialBranchAction, updateJudicialBranchAction } from '../../actions';
import { getJudicialDistricts } from '@/app/admin/judicial-districts/actions';
import { notFound } from 'next/navigation';
import type { JudicialBranchFormData } from '../../judicial-branch-form-schema';

export default async function EditJudicialBranchPage({ params }: { params: { branchId: string } }) {
  const branchId = params.branchId;
  const [branch, districts] = await Promise.all([
    getJudicialBranchAction(branchId),
    getJudicialDistricts()
  ]);

  if (!branch) {
    notFound();
  }

  async function handleUpdateBranch(data: Partial<JudicialBranchFormData>) {
    'use server';
    return updateJudicialBranchAction(branchId, data);
  }

  return (
    <JudicialBranchForm
      initialData={branch}
      districts={districts}
      onSubmitAction={handleUpdateBranch}
      formTitle="Editar Vara Judicial"
      formDescription="Modifique os detalhes da vara existente."
      submitButtonText="Salvar Alterações"
    />
  );
}

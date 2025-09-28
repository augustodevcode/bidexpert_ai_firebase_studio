// src/app/admin/judicial-branches/[branchId]/edit/page.tsx
/**
 * @fileoverview Página de edição para uma Vara Judicial específica.
 * Este componente Server-Side busca os dados iniciais da vara a ser editada
 * e a lista completa de comarcas para popular o seletor no formulário. A ação de
 * atualização (`handleUpdateBranch`) também é definida aqui e passada como prop
 * para o `JudicialBranchForm`.
 */
import JudicialBranchForm from '../../judicial-branch-form';
import { getJudicialBranch, updateJudicialBranch } from '../../actions';
import { getJudicialDistricts } from '@/app/admin/judicial-districts/actions';
import { notFound } from 'next/navigation';
import type { JudicialBranchFormData } from '../../judicial-branch-form-schema';

export default async function EditJudicialBranchPage({ params }: { params: { branchId: string } }) {
  const branchId = params.branchId;
  const [branch, districts] = await Promise.all([
    getJudicialBranch(branchId),
    getJudicialDistricts()
  ]);

  if (!branch) {
    notFound();
  }

  async function handleUpdateBranch(data: Partial<JudicialBranchFormData>) {
    'use server';
    return updateJudicialBranch(branchId, data);
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

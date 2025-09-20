// src/app/admin/judicial-processes/[processId]/edit/page.tsx
/**
 * @fileoverview Página de edição para um Processo Judicial específico.
 * Este componente Server-Side busca os dados iniciais do processo a ser editado,
 * bem como as listas de entidades relacionadas (tribunais, comarcas, varas, comitentes)
 * para popular os seletores do formulário. A ação de atualização (`handleUpdateProcess`)
 * é então passada como prop para o `JudicialProcessForm`.
 */
import JudicialProcessForm from '../../judicial-process-form';
import { getJudicialProcess, updateJudicialProcessAction, type JudicialProcessFormValues } from '../../actions';
import { getCourts } from '@/app/admin/courts/actions';
import { getJudicialDistricts } from '@/app/admin/judicial-districts/actions';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { notFound } from 'next/navigation';

export default async function EditJudicialProcessPage({ params }: { params: { processId: string } }) {
  const processId = params.processId;
  
  const [process, courts, allDistricts, allBranches, sellers] = await Promise.all([
    getJudicialProcess(processId),
    getCourts(),
    getJudicialDistricts(),
    getJudicialBranches(),
    getSellers()
  ]);

  if (!process) {
    notFound();
  }

  async function handleUpdateProcess(data: JudicialProcessFormValues) {
    'use server';
    return updateJudicialProcessAction(processId, data);
  }

  return (
    <JudicialProcessForm
      initialData={process}
      courts={courts}
      allDistricts={allDistricts}
      allBranches={allBranches}
      sellers={sellers}
      onSubmitAction={handleUpdateProcess}
      formTitle="Editar Processo Judicial"
      formDescription="Modifique os detalhes do processo e suas partes."
      submitButtonText="Salvar Alterações"
    />
  );
}

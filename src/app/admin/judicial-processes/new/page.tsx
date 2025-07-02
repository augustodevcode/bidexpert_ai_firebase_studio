// src/app/admin/judicial-processes/new/page.tsx
import JudicialProcessForm from '../judicial-process-form';
import { createJudicialProcessAction, type JudicialProcessFormValues } from '../actions';
import { getCourts } from '@/app/admin/courts/actions';
import { getJudicialDistricts } from '@/app/admin/judicial-districts/actions';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';

export default async function NewJudicialProcessPage() {
  const [courts, allDistricts, allBranches] = await Promise.all([
    getCourts(),
    getJudicialDistricts(),
    getJudicialBranches()
  ]);
  
  async function handleCreateProcess(data: JudicialProcessFormValues) {
    'use server';
    return createJudicialProcessAction(data);
  }

  return (
    <JudicialProcessForm
      courts={courts}
      allDistricts={allDistricts}
      allBranches={allBranches}
      onSubmitAction={handleCreateProcess}
      formTitle="Novo Processo Judicial"
      formDescription="Cadastre um novo processo e suas partes para vincular a lotes de leilão."
      submitButtonText="Criar Processo"
    />
  );
}

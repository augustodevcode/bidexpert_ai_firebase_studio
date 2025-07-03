// src/app/admin/judicial-processes/new/page.tsx
import JudicialProcessForm from '../judicial-process-form';
import { createJudicialProcessAction } from '../actions';
import { getCourts } from '@/app/admin/courts/actions';
import { getJudicialDistricts } from '@/app/admin/judicial-districts/actions';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';

export default async function NewJudicialProcessPage() {
  const [courts, allDistricts, allBranches] = await Promise.all([
    getCourts(),
    getJudicialDistricts(),
    getJudicialBranches()
  ]);
  
  return (
    <JudicialProcessForm
      courts={courts}
      allDistricts={allDistricts}
      allBranches={allBranches}
      onSubmitAction={createJudicialProcessAction}
      formTitle="Novo Processo Judicial"
      formDescription="Cadastre um novo processo e suas partes para vincular a bens e lotes."
      submitButtonText="Criar Processo"
    />
  );
}

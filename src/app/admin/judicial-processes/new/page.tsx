// src/app/admin/judicial-processes/new/page.tsx
/**
 * @fileoverview Página para criação de um novo Processo Judicial.
 * Este componente Server-Side busca todos os dados necessários para popular
 * os seletores do formulário (tribunais, comarcas, varas, comitentes) e
 * renderiza o `JudicialProcessForm`, passando a ação de criação para o componente.
 */
import JudicialProcessForm from '../judicial-process-form';
import { createJudicialProcessAction } from '../actions';
import { getCourts } from '@/app/admin/courts/actions';
import { getJudicialDistricts } from '@/app/admin/judicial-districts/actions';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';
import { getSellers } from '@/app/admin/sellers/actions';

export default async function NewJudicialProcessPage() {
  const [courts, allDistricts, allBranches, sellers] = await Promise.all([
    getCourts(),
    getJudicialDistricts(),
    getJudicialBranches(),
    getSellers()
  ]);
  
  return (
    <JudicialProcessForm
      courts={courts}
      allDistricts={allDistricts}
      allBranches={allBranches}
      sellers={sellers}
      onSubmitAction={createJudicialProcessAction}
      formTitle="Novo Processo Judicial"
      formDescription="Cadastre um novo processo e suas partes para vincular a bens e lotes."
      submitButtonText="Criar Processo"
    />
  );
}

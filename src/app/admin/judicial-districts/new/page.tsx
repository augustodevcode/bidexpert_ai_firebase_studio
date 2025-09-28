// src/app/admin/judicial-districts/new/page.tsx
/**
 * @fileoverview Página para criação de uma nova Comarca Judicial.
 * Este componente Server-Side busca os dados necessários para os seletores do
 * formulário (a lista de estados e tribunais) e renderiza o `JudicialDistrictForm`
 * para a entrada de dados.
 */
import JudicialDistrictForm from '../judicial-district-form';
import { createJudicialDistrict } from '../actions';
import { getStates } from '@/app/admin/states/actions';
import { getCourts } from '@/app/admin/courts/actions';
import type { JudicialDistrictFormData } from '../judicial-district-form-schema';

export default async function NewJudicialDistrictPage() {
  const [states, courts] = await Promise.all([getStates(), getCourts()]);
  
  async function handleCreateDistrict(data: JudicialDistrictFormData) {
    'use server';
    return createJudicialDistrict(data);
  }

  return (
    <JudicialDistrictForm
      states={states}
      courts={courts}
      onSubmitAction={handleCreateDistrict}
      formTitle="Nova Comarca"
      formDescription="Preencha os detalhes para cadastrar uma nova comarca e associe-a a um tribunal e estado."
      submitButtonText="Criar Comarca"
    />
  );
}

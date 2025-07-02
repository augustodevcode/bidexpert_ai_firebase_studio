// src/app/admin/judicial-districts/new/page.tsx
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
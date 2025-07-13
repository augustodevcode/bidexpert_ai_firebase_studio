// src/app/admin/judicial-districts/[districtId]/edit/page.tsx
import JudicialDistrictForm from '../../judicial-district-form';
import { getJudicialDistrict, updateJudicialDistrict, type JudicialDistrictFormData } from '../../actions';
import { getStates } from '@/app/admin/states/actions';
import { getCourts } from '@/app/admin/courts/actions';
import { notFound } from 'next/navigation';

// A correção principal é na assinatura da função para alinhar com o Next.js
export default async function EditJudicialDistrictPage({ params }: { params: { districtId: string } }) {
  const { districtId } = params; // Desestruturar aqui é a forma mais segura

  const [district, states, courts] = await Promise.all([
    getJudicialDistrict(districtId),
    getStates(),
    getCourts()
  ]);

  if (!district) {
    notFound();
  }

  async function handleUpdateDistrict(data: Partial<JudicialDistrictFormData>) {
    'use server';
    return updateJudicialDistrict(districtId, data);
  }

  return (
    <JudicialDistrictForm
      initialData={district}
      states={states}
      courts={courts}
      onSubmitAction={handleUpdateDistrict}
      formTitle="Editar Comarca"
      formDescription="Modifique os detalhes da comarca existente."
      submitButtonText="Salvar Alterações"
    />
  );
}

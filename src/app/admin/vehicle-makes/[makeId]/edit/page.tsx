// src/app/admin/vehicle-makes/[makeId]/edit/page.tsx
import VehicleMakeForm from '../../vehicle-make-form';
import { getVehicleMake, updateVehicleMake } from '../../actions';
import { notFound } from 'next/navigation';
import type { VehicleMakeFormData } from '../../form-schema';

export default async function EditVehicleMakePage({ params }: { params: { makeId: string } }) {
  const makeId = params.makeId;
  const make = await getVehicleMake(makeId);

  if (!make) {
    notFound();
  }

  async function handleUpdate(data: Partial<VehicleMakeFormData>) {
    'use server';
    return updateVehicleMake(makeId, data);
  }

  return (
    <VehicleMakeForm
      initialData={make}
      onSubmitAction={handleUpdate}
      formTitle="Editar Marca de Veículo"
      formDescription="Modifique os detalhes da marca existente."
      submitButtonText="Salvar Alterações"
    />
  );
}

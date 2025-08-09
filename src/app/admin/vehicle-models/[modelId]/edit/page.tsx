// src/app/admin/vehicle-models/[modelId]/edit/page.tsx
import VehicleModelForm from '../../vehicle-model-form';
import { getVehicleModel, updateVehicleModel } from '../../actions';
import { getVehicleMakes } from '@/app/admin/vehicle-makes/actions';
import { notFound } from 'next/navigation';
import type { VehicleModelFormData } from '../../form-schema';

export default async function EditVehicleModelPage({ params }: { params: { modelId: string } }) {
  const modelId = params.modelId;
  const [model, makes] = await Promise.all([
    getVehicleModel(modelId),
    getVehicleMakes()
  ]);

  if (!model) {
    notFound();
  }

  async function handleUpdate(data: Partial<VehicleModelFormData>) {
    'use server';
    return updateVehicleModel(modelId, data);
  }

  return (
    <VehicleModelForm
      initialData={model}
      makes={makes}
      onSubmitAction={handleUpdate}
      formTitle="Editar Modelo de Veículo"
      formDescription="Modifique os detalhes do modelo existente."
      submitButtonText="Salvar Alterações"
    />
  );
}

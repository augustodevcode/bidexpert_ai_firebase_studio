// src/app/admin/vehicle-models/new/page.tsx
import VehicleModelForm from '../vehicle-model-form';
import { createVehicleModel, type VehicleModelFormData } from '../actions';
import { getVehicleMakes } from '../../vehicle-makes/actions';

export default async function NewVehicleModelPage() {
  const makes = await getVehicleMakes();

  async function handleCreate(data: VehicleModelFormData) {
    'use server';
    return createVehicleModel(data);
  }

  return (
    <VehicleModelForm
      makes={makes}
      onSubmitAction={handleCreate}
      formTitle="Novo Modelo de Veículo"
      formDescription="Cadastre um novo modelo e vincule-o a uma marca."
      submitButtonText="Criar Modelo"
    />
  );
}

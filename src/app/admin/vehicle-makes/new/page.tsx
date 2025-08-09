// src/app/admin/vehicle-makes/new/page.tsx
import VehicleMakeForm from '../vehicle-make-form';
import { createVehicleMake, type VehicleMakeFormData } from '../actions';

export default async function NewVehicleMakePage() {
  
  async function handleCreate(data: VehicleMakeFormData) {
    'use server';
    return createVehicleMake(data);
  }

  return (
    <VehicleMakeForm
      onSubmitAction={handleCreate}
      formTitle="Nova Marca de Veículo"
      formDescription="Cadastre uma nova marca de veículo no sistema."
      submitButtonText="Criar Marca"
    />
  );
}

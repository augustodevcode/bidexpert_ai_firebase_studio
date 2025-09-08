// src/app/admin/vehicle-makes/[makeId]/edit/page.tsx
'use client';

import React, { useCallback } from 'react';
import VehicleMakeForm from '../../vehicle-make-form';
import { getVehicleMake, updateVehicleMake, deleteVehicleMake, type VehicleMakeFormData } from '../../actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { Car } from 'lucide-react';

export default function EditVehicleMakePage({ params }: { params: { makeId: string } }) {
  
  const handleUpdate = useCallback(async (id: string, data: VehicleMakeFormData) => {
    return updateVehicleMake(id, data);
  }, []);

  return (
    <FormPageLayout
      pageTitle="Marca de Veículo"
      fetchAction={() => getVehicleMake(params.makeId)}
      deleteAction={deleteVehicleMake}
      entityId={params.makeId}
      entityName="Marca de Veículo"
      routeBase="/admin/vehicle-makes"
      icon={Car}
    >
      {(initialData) => (
        <VehicleMakeForm
          initialData={initialData}
          onSubmitAction={(data) => handleUpdate(params.makeId, data)}
        />
      )}
    </FormPageLayout>
  );
}

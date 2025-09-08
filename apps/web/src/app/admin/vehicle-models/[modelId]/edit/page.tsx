// src/app/admin/vehicle-models/[modelId]/edit/page.tsx
'use client';

import React, { useCallback, useState, useEffect } from 'react';
import VehicleModelForm from '../vehicle-model-form';
import { getVehicleModel, updateVehicleModel, deleteVehicleModel, type VehicleModelFormData } from '../actions';
import { getVehicleMakes } from '@/app/admin/vehicle-makes/actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { Car } from 'lucide-react';
import type { VehicleMake } from '@/types';

export default function EditVehicleModelPage({ params }: { params: { modelId: string } }) {
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  
  useEffect(() => {
    getVehicleMakes().then(setMakes);
  }, []);
  
  const handleUpdate = useCallback(async (id: string, data: VehicleModelFormData) => {
    return updateVehicleModel(id, data);
  }, []);

  return (
    <FormPageLayout
      pageTitle="Modelo de Veículo"
      fetchAction={() => getVehicleModel(params.modelId)}
      deleteAction={deleteVehicleModel}
      entityId={params.modelId}
      entityName="Modelo de Veículo"
      routeBase="/admin/vehicle-models"
      icon={Car}
    >
      {(initialData) => (
        <VehicleModelForm
          initialData={initialData}
          makes={makes}
          onSubmitAction={(data) => handleUpdate(params.modelId, data)}
        />
      )}
    </FormPageLayout>
  );
}

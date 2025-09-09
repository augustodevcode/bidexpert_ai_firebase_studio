// src/app/admin/vehicle-models/[modelId]/edit/page.tsx
'use client';

import React, { useCallback, useState, useEffect } from 'react';
// import { VehicleModelForm } from '../vehicle-model-form'; // COMMENTED OUT
// import { getVehicleModel, updateVehicleModel, deleteVehicleModel, type VehicleModelFormData } from '../actions'; // COMMENTED OUT
import { getVehicleMakes } from '@/app/admin/vehicle-makes/actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { Car } from 'lucide-react';
import type { VehicleMake } from '@/types';

export default function EditVehicleModelPage({ params }: { params: { modelId: string } }) {
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  
  useEffect(() => {
    getVehicleMakes().then(setMakes);
  }, []);
  
  // const handleUpdate = useCallback(async (id: string, data: VehicleModelFormData) => { // COMMENTED OUT
  //   return updateVehicleModel(id, data); // COMMENTED OUT
  // }, []); // COMMENTED OUT

  return (
    <FormPageLayout
      pageTitle="Modelo de Veículo"
      // fetchAction={() => getVehicleModel(params.modelId)} // COMMENTED OUT
      // deleteAction={deleteVehicleModel} // COMMENTED OUT
      entityId={params.modelId}
      pageDescription="Edit Vehicle Model" // Added pageDescription as it's required by FormPageLayout
      icon={Car}
      isEdit={true} // Added isEdit as it's required by FormPageLayout
    >
      {/* {(initialData) => ( // COMMENTED OUT
        <VehicleModelForm
          initialData={initialData}
          makes={makes}
          onSubmitAction={(data) => handleUpdate(params.modelId, data)}
        />
      )} */}
      {/* Placeholder content */}
      <div>
        <p>Vehicle Model Form is temporarily disabled due to build issues.</p>
        <p>Model ID: {params.modelId}</p>
      </div>
    </FormPageLayout>
  );
}
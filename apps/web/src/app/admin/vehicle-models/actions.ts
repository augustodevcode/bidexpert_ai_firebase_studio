'use server';

import { VehicleModel } from '@bidexpert/core';

export async function createVehicleModel(data: any): Promise<VehicleModel | null> {
  console.log('Placeholder: createVehicleModel', data);
  return null;
}

export async function updateVehicleModel(id: string, data: any): Promise<VehicleModel | null> {
  console.log('Placeholder: updateVehicleModel', id, data);
  return null;
}

export async function deleteVehicleModel(id: string): Promise<{ success: boolean; message: string }> {
  console.log('Placeholder: deleteVehicleModel', id);
  return { success: true, message: 'Deleted successfully (placeholder)' };
}

export async function getVehicleModelById(id: string): Promise<VehicleModel | null> {
  console.log('Placeholder: getVehicleModelById', id);
  return null;
}
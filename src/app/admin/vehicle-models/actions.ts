// src/app/admin/vehicle-models/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import type { VehicleModel } from '@/types';
import { VehicleModelService } from '@/services/vehicle-model.service';
import type { VehicleModelFormData } from './form-schema';

const vehicleModelService = new VehicleModelService();

export async function getVehicleModels(): Promise<VehicleModel[]> {
  return vehicleModelService.getVehicleModels();
}

export async function getVehicleModel(id: string): Promise<VehicleModel | null> {
  return vehicleModelService.getVehicleModelById(id);
}

export async function createVehicleModel(data: VehicleModelFormData): Promise<{ success: boolean; message: string; modelId?: string }> {
  const result = await vehicleModelService.createVehicleModel(data);
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/vehicle-models');
  }
  return result;
}

export async function updateVehicleModel(id: string, data: Partial<VehicleModelFormData>): Promise<{ success: boolean; message: string }> {
  const result = await vehicleModelService.updateVehicleModel(id, data);
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/vehicle-models');
    revalidatePath(`/admin/vehicle-models/${id}/edit`);
  }
  return result;
}

export async function deleteVehicleModel(id: string): Promise<{ success: boolean; message: string }> {
  const result = await vehicleModelService.deleteVehicleModel(id);
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/vehicle-models');
  }
  return result;
}

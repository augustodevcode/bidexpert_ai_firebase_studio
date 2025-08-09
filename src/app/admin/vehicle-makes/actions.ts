// src/app/admin/vehicle-makes/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import type { VehicleMake } from '@/types';
import { VehicleMakeService } from '@/services/vehicle-make.service';
import type { VehicleMakeFormData } from './form-schema';

const vehicleMakeService = new VehicleMakeService();

export async function getVehicleMakes(): Promise<VehicleMake[]> {
  return vehicleMakeService.getVehicleMakes();
}

export async function getVehicleMake(id: string): Promise<VehicleMake | null> {
  return vehicleMakeService.getVehicleMakeById(id);
}

export async function createVehicleMake(data: VehicleMakeFormData): Promise<{ success: boolean; message: string; makeId?: string }> {
  const result = await vehicleMakeService.createVehicleMake(data);
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/vehicle-makes');
  }
  return result;
}

export async function updateVehicleMake(id: string, data: Partial<VehicleMakeFormData>): Promise<{ success: boolean; message: string }> {
  const result = await vehicleMakeService.updateVehicleMake(id, data);
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/vehicle-makes');
    revalidatePath(`/admin/vehicle-makes/${id}/edit`);
  }
  return result;
}

export async function deleteVehicleMake(id: string): Promise<{ success: boolean; message: string }> {
  const result = await vehicleMakeService.deleteVehicleMake(id);
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/vehicle-makes');
  }
  return result;
}

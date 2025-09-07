// src/app/admin/vehicle-makes/actions.ts
'use server';

import { VehicleMakeService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const vehicleMakeService = new VehicleMakeService();

const vehicleMakeActions = createCrudActions({
  service: vehicleMakeService,
  entityName: 'VehicleMake',
  entityNamePlural: 'VehicleMakes',
  routeBase: '/admin/vehicle-makes',
});

export const {
  getAll: getVehicleMakes,
  getById: getVehicleMake,
  create: createVehicleMake,
  update: updateVehicleMake,
  delete: deleteVehicleMake,
} = vehicleMakeActions;

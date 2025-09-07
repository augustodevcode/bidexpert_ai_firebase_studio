// src/app/admin/vehicle-models/actions.ts
'use server';

import { VehicleModelService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const vehicleModelService = new VehicleModelService();

const vehicleModelActions = createCrudActions({
  service: vehicleModelService,
  entityName: 'VehicleModel',
  entityNamePlural: 'VehicleModels',
  routeBase: '/admin/vehicle-models',
});

export const {
  getAll: getVehicleModels,
  getById: getVehicleModel,
  create: createVehicleModel,
  update: updateVehicleModel,
  delete: deleteVehicleModel,
} = vehicleModelActions;

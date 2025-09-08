// src/app/admin/vehicle-models/actions.ts
'use server';

import { VehicleModelService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const vehicleModelService = new VehicleModelService();

const { 
  obterTodos: getVehicleModels, 
  obterPorId: getVehicleModel, 
  criar: createVehicleModel, 
  atualizar: updateVehicleModel, 
  excluir: deleteVehicleModel 
} = createCrudActions({
  service: vehicleModelService,
  entityName: 'Modelo de Veículo',
  routeBase: '/admin/vehicle-models',
});

export { getVehicleModels, getVehicleModel, createVehicleModel, updateVehicleModel, deleteVehicleModel };


// src/app/admin/vehicle-makes/actions.ts
'use server';

import { VehicleMakeService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const vehicleMakeService = new VehicleMakeService();

const { 
  obterTodos: getVehicleMakes, 
  obterPorId: getVehicleMake, 
  criar: createVehicleMake, 
  atualizar: updateVehicleMake, 
  excluir: deleteVehicleMake 
} = createCrudActions({
  service: vehicleMakeService,
  entityName: 'Marca de Veículo',
  routeBase: '/admin/vehicle-makes',
});

export { getVehicleMakes, getVehicleMake, createVehicleMake, updateVehicleMake, deleteVehicleMake };

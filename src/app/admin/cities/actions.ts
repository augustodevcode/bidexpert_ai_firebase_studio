// src/app/admin/cities/actions.ts
'use server';

import { CityService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const cityService = new CityService();

const { 
  obterTodos: getCities, 
  obterPorId: getCity, 
  criar: createCity, 
  atualizar: updateCity, 
  excluir: deleteCity 
} = createCrudActions({
  service: cityService,
  entityName: 'Cidade',
  routeBase: '/admin/cities',
});

export { getCities, getCity, createCity, updateCity, deleteCity };

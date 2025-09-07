// src/app/admin/cities/actions.ts
'use server';

import { CityService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const cityService = new CityService();
const cityActions = createCrudActions({
  service: cityService,
  entityName: 'City',
  entityNamePlural: 'Cities',
  routeBase: '/admin/cities',
});

export const {
  getAll: getCities,
  getById: getCity,
  create: createCity,
  update: updateCity,
  delete: deleteCity,
} = cityActions;

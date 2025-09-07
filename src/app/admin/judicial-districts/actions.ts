// src/app/admin/judicial-districts/actions.ts
'use server';

import { JudicialDistrictService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const districtService = new JudicialDistrictService();
const districtActions = createCrudActions({
    service: districtService,
    entityName: 'JudicialDistrict',
    entityNamePlural: 'JudicialDistricts',
    routeBase: '/admin/judicial-districts'
});


export const {
    getAll: getJudicialDistricts,
    getById: getJudicialDistrict,
    create: createJudicialDistrict,
    update: updateJudicialDistrict,
    delete: deleteJudicialDistrict
} = districtActions;

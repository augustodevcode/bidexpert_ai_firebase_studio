// src/app/admin/judicial-districts/actions.ts
'use server';

import { JudicialDistrictService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const districtService = new JudicialDistrictService();

const { 
  obterTodos: getJudicialDistricts, 
  obterPorId: getJudicialDistrict, 
  criar: createJudicialDistrict, 
  atualizar: updateJudicialDistrict, 
  excluir: deleteJudicialDistrict 
} = createCrudActions({
    service: districtService,
    entityName: 'Comarca',
    routeBase: '/admin/judicial-districts'
});


export { getJudicialDistricts, getJudicialDistrict, createJudicialDistrict, updateJudicialDistrict, deleteJudicialDistrict };

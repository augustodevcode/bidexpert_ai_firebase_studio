// src/app/admin/judicial-branches/actions.ts
'use server';

import { JudicialBranchService } from '@bidexpert/core';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const judicialBranchService = new JudicialBranchService();
const judicialBranchActions = createCrudActions({
    service: judicialBranchService,
    entityName: 'JudicialBranch',
    entityNamePlural: 'JudicialBranches',
    routeBase: '/admin/judicial-branches'
});

export const {
    getAll: getJudicialBranches,
    getById: getJudicialBranch,
    create: createJudicialBranch,
    update: updateJudicialBranch,
    delete: deleteJudicialBranch
} = judicialBranchActions;

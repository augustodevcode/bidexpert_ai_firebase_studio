// src/app/admin/judicial-branches/[branchId]/edit/page.tsx
'use client';

import JudicialBranchForm from '../../judicial-branch-form';
import { getJudicialBranch, updateJudicialBranch, deleteJudicialBranch } from '../../actions';
import { getJudicialDistricts } from '@/app/admin/judicial-districts/actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import React, { useState, useEffect, useCallback } from 'react';
import { Building2 } from 'lucide-react';
import type { JudicialDistrict, JudicialBranchFormData } from '@bidexpert/core';

export default function EditJudicialBranchPage({ params }: { params: { branchId: string } }) {
    const [districts, setDistricts] = useState<JudicialDistrict[]>([]);

    useEffect(() => {
        getJudicialDistricts().then(setDistricts);
    }, []);

    const handleUpdate = useCallback(async (id: string, data: JudicialBranchFormData) => {
        return updateJudicialBranch(id, data);
    }, []);

    return (
        <FormPageLayout
            pageTitle="Vara Judicial"
            fetchAction={() => getJudicialBranch(params.branchId)}
            deleteAction={deleteJudicialBranch}
            entityId={params.branchId}
            entityName="Vara Judicial"
            routeBase="/admin/judicial-branches"
            icon={Building2}
        >
            {(initialData) => (
                <JudicialBranchForm
                    initialData={initialData}
                    districts={districts}
                    onSubmitAction={(data) => handleUpdate(params.branchId, data)}
                />
            )}
        </FormPageLayout>
    );
}

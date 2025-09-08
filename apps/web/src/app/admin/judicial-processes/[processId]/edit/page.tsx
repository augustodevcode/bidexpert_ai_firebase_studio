// src/app/admin/judicial-processes/[processId]/edit/page.tsx
'use client';

import JudicialProcessForm from '../../judicial-process-form';
import { getJudicialProcess, updateJudicialProcessAction, deleteJudicialProcess } from '../../actions';
import type { JudicialProcessFormValues } from '@bidexpert/core';
import { getCourts } from '@/app/admin/courts/actions';
import { getJudicialDistricts } from '@/app/admin/judicial-districts/actions';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import React, { useState, useEffect, useCallback } from 'react';
import { Gavel } from 'lucide-react';
import type { JudicialProcess, Court, JudicialDistrict, JudicialBranch, SellerProfileInfo } from '@bidexpert/core';

export default function EditJudicialProcessPage({ params }: { params: { processId: string } }) {
    const [pageData, setPageData] = useState<{
        courts: Court[],
        districts: JudicialDistrict[],
        branches: JudicialBranch[],
        sellers: SellerProfileInfo[]
    } | null>(null);

    useEffect(() => {
        async function loadData() {
            const [courts, districts, branches, sellers] = await Promise.all([
                getCourts(), getJudicialDistricts(), getJudicialBranches(), getSellers()
            ]);
            setPageData({ courts, allDistricts: districts, allBranches: branches, sellers });
        }
        loadData();
    }, []);

    const handleUpdate = useCallback(async (id: string, data: JudicialProcessFormValues) => {
        return updateJudicialProcessAction(id, data);
    }, []);

    if (!pageData) {
        // You can return a loader here
        return <div>Carregando dados do formulário...</div>;
    }
    
    return (
        <FormPageLayout
            pageTitle="Processo Judicial"
            fetchAction={() => getJudicialProcess(params.processId)}
            deleteAction={deleteJudicialProcess}
            entityId={params.processId}
            entityName="Processo Judicial"
            routeBase="/admin/judicial-processes"
            icon={Gavel}
        >
            {(initialData) => (
                <JudicialProcessForm
                    initialData={initialData}
                    courts={pageData.courts}
                    allDistricts={pageData.districts}
                    allBranches={pageData.branches}
                    sellers={pageData.sellers}
                    onSubmitAction={(data) => handleUpdate(params.processId, data)}
                />
            )}
        </FormPageLayout>
    );
}

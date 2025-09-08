// src/app/admin/bens/[bemId]/edit/page.tsx
'use client';

import React, { useCallback } from 'react';
import BemForm from '../../bem-form';
import { getBem, updateBem, deleteBem, type BemFormData } from '../../actions';
import { getJudicialProcesses } from '@/app/admin/judicial-processes/actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import type { Bem, JudicialProcess, LotCategory, SellerProfileInfo } from '@bidexpert/core';
import { Package } from 'lucide-react';

export default function EditBemPage({ params }: { params: { bemId: string } }) {
    const [pageData, setPageData] = React.useState<{
        processes: JudicialProcess[],
        categories: LotCategory[],
        sellers: SellerProfileInfo[]
    } | null>(null);

    React.useEffect(() => {
        async function loadData() {
            const [processes, categories, sellers] = await Promise.all([
                getJudicialProcesses(),
                getLotCategories(),
                getSellers()
            ]);
            setPageData({ processes, categories, sellers });
        }
        loadData();
    }, []);
    
    const handleUpdate = useCallback(async (id: string, data: BemFormData) => {
        return updateBem(id, data);
    }, []);

    return (
        <FormPageLayout
            pageTitle="Bem"
            fetchAction={() => getBem(params.bemId)}
            deleteAction={deleteBem}
            entityId={params.bemId}
            entityName="Bem"
            routeBase="/admin/bens"
            icon={Package}
        >
             {(initialData) => (
                <BemForm
                    initialData={initialData}
                    processes={pageData?.processes || []}
                    categories={pageData?.categories || []}
                    sellers={pageData?.sellers || []}
                    onSubmitAction={(data) => handleUpdate(params.bemId, data)}
                />
            )}
        </FormPageLayout>
    );
}
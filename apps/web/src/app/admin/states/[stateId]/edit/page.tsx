// src/app/admin/states/[stateId]/edit/page.tsx
'use client';

import React, { useCallback } from 'react';
import StateForm from '../../state-form';
import { getState, updateState, deleteState, type StateFormData } from '../../actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { MapPin } from 'lucide-react';
import type { StateInfo } from '@/types';

export default function EditStatePage({ params }: { params: { stateId: string } }) {

    const handleUpdate = useCallback(async (id: string, data: StateFormData) => {
        return updateState(id, data);
    }, []);

    const getDeleteConfirmationMessage = (item: StateInfo | null) => {
        if (!item) return '';
        return `Este estado possui ${item.cityCount || 0} cidade(s) e elas também serão afetadas.`;
    };

    const canDelete = (item: StateInfo | null) => {
        return (item?.cityCount || 0) === 0;
    };


    return (
        <FormPageLayout
            pageTitle="Estado"
            fetchAction={() => getState(params.stateId)}
            deleteAction={deleteState}
            entityId={params.stateId}
            entityName="Estado"
            routeBase="/admin/states"
            icon={MapPin}
            // @ts-ignore
            deleteConfirmationMessage={getDeleteConfirmationMessage}
            // @ts-ignore
            deleteConfirmation={canDelete}
        >
            {(initialData) => (
                <StateForm
                    initialData={initialData}
                    onSubmitAction={(data) => handleUpdate(params.stateId, data)}
                />
            )}
        </FormPageLayout>
    );
}

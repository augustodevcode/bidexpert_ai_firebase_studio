// src/app/admin/judicial-districts/[districtId]/edit/page.tsx
'use client';

import JudicialDistrictForm from '../../judicial-district-form';
import { getJudicialDistrict, updateJudicialDistrict, deleteJudicialDistrict } from '../../actions';
import { getStates } from '@/app/admin/states/actions';
import { getCourts } from '@/app/admin/courts/actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import React, { useState, useEffect, useCallback } from 'react';
import { Map } from 'lucide-react';
import type { Court, StateInfo, JudicialDistrictFormData } from '@bidexpert/core';

export default function EditJudicialDistrictPage({ params }: { params: { districtId: string } }) {
    const [states, setStates] = useState<StateInfo[]>([]);
    const [courts, setCourts] = useState<Court[]>([]);
    
    useEffect(() => {
        Promise.all([getStates(), getCourts()]).then(([statesData, courtsData]) => {
            setStates(statesData);
            setCourts(courtsData);
        });
    }, []);

    const handleUpdate = useCallback(async (id: string, data: JudicialDistrictFormData) => {
        return updateJudicialDistrict(id, data);
    }, []);

    return (
        <FormPageLayout
            pageTitle="Comarca"
            fetchAction={() => getJudicialDistrict(params.districtId)}
            deleteAction={deleteJudicialDistrict}
            entityId={params.districtId}
            entityName="Comarca"
            routeBase="/admin/judicial-districts"
            icon={Map}
        >
            {(initialData) => (
                <JudicialDistrictForm
                    initialData={initialData}
                    states={states}
                    courts={courts}
                    onSubmitAction={(data) => handleUpdate(params.districtId, data)}
                />
            )}
        </FormPageLayout>
    );
}

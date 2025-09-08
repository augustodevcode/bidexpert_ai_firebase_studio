// src/app/admin/courts/[courtId]/edit/page.tsx
'use client';

import React, { useCallback } from 'react';
import CourtForm from '../../court-form';
import { getCourt, updateCourt, deleteCourt, type CourtFormData } from '../../actions';
import { getStates } from '@/app/admin/states/actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { Scale } from 'lucide-react';
import type { Court, StateInfo } from '@bidexpert/core';


export default function EditCourtPage({ params }: { params: { courtId: string } }) {
  const [states, setStates] = React.useState<StateInfo[]>([]);

  React.useEffect(() => {
    getStates().then(setStates);
  }, []);

  const handleUpdate = useCallback(async (id: string, data: CourtFormData) => {
    return updateCourt(id, data);
  }, []);

  return (
    <FormPageLayout
        pageTitle="Tribunal"
        fetchAction={() => getCourt(params.courtId)}
        deleteAction={deleteCourt}
        entityId={params.courtId}
        entityName="Tribunal"
        routeBase="/admin/courts"
        icon={Scale}
    >
        {(initialData) => (
            <CourtForm
                initialData={initialData as Court}
                states={states}
                onSubmitAction={(data) => handleUpdate(params.courtId, data)}
            />
        )}
    </FormPageLayout>
  );
}
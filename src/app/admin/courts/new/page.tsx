// src/app/admin/courts/new/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import CourtForm from '../court-form';
import { createCourt, type CourtFormData } from '../actions';
import { getStates } from '@/app/admin/states/actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { Scale, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { StateInfo } from '@bidexpert/core';

function NewCourtPageContent({ states }: { states: StateInfo[]}) {
    const router = useRouter();
    const { toast } = useToast();

    async function handleCreate(data: CourtFormData) {
        const result = await createCourt(data);
        if (result.success) {
            toast({ title: 'Sucesso!', description: 'Tribunal criado.' });
            router.push('/admin/courts');
        } else {
            toast({ title: 'Erro ao Criar', description: result.message, variant: 'destructive' });
        }
        return result;
    }
    
    return (
         <FormPageLayout
            pageTitle="Novo Tribunal"
            pageDescription="Preencha os detalhes para cadastrar um novo tribunal de justiça."
            icon={Scale}
            isEdit={false}
        >
            {(formRef) => (
                <CourtForm
                    ref={formRef}
                    states={states}
                    onSubmitAction={handleCreate}
                />
            )}
        </FormPageLayout>
    );
}

export default function NewCourtPage() {
    const [states, setStates] = useState<StateInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getStates().then(data => {
            setStates(data);
            setIsLoading(false);
        })
    }, []);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div>
    }

    return <NewCourtPageContent states={states} />;
}

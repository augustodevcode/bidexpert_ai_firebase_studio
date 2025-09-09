// src/app/admin/judicial-districts/new/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import JudicialDistrictForm from '../components/judicial-district-form';
import { createJudicialDistrict, type JudicialDistrictFormData } from '../actions';
import { getStates } from '@/app/admin/states/actions';
import { getCourts } from '@/app/admin/courts/actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { MapPin, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Court, StateInfo } from '@/types';

function NewJudicialDistrictPageContent({ courts, states }: { courts: Court[], states: StateInfo[]}) {
    const router = useRouter();
    const { toast } = useToast();
    
    async function handleCreate(data: JudicialDistrictFormData) {
        const result = await createJudicialDistrict(data);
        if (result.success) {
            toast({ title: 'Sucesso!', description: 'Comarca criada.' });
            router.push('/admin/judicial-districts');
        } else {
            toast({ title: 'Erro ao Criar', description: result.message, variant: 'destructive' });
        }
        return result;
    }
    
    return (
         <FormPageLayout
            pageTitle="Nova Comarca"
            pageDescription="Preencha os detalhes para cadastrar uma nova comarca."
            icon={MapPin}
            isEdit={false}
        >
            {(formRef) => (
                <JudicialDistrictForm
                    ref={formRef}
                    states={states}
                    courts={courts}
                    onSubmitAction={handleCreate}
                />
            )}
        </FormPageLayout>
    );
}

export default function NewJudicialDistrictPage() {
    const [pageData, setPageData] = useState<{courts: Court[], states: StateInfo[]} | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getCourts(),
            getStates()
        ]).then(([courts, states]) => {
            setPageData({ courts, states });
            setIsLoading(false);
        });
    }, []);

    if (isLoading || !pageData) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div>
    }

    return <NewJudicialDistrictPageContent courts={pageData.courts} states={pageData.states} />;
}

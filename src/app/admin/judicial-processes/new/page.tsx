// src/app/admin/judicial-processes/new/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { JudicialProcessForm } from '../judicial-process-form';
import { createJudicialProcessAction, type JudicialProcessFormValues } from '../actions';
import { getCourts } from '@/app/admin/courts/actions';
import { getJudicialDistricts } from '@/app/admin/judicial-districts/actions';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { Gavel, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Court, JudicialDistrict, JudicialBranch, SellerProfileInfo } from '@/types';


function NewJudicialProcessPageContent({ courts, allDistricts, allBranches, sellers }: {
    courts: Court[];
    allDistricts: JudicialDistrict[];
    allBranches: JudicialBranch[];
    sellers: SellerProfileInfo[];
}) {
    const router = useRouter();
    const { toast } = useToast();

    async function handleCreate(data: JudicialProcessFormValues) {
        const result = await createJudicialProcessAction(data);
        if (result.success) {
            toast({ title: 'Sucesso!', description: 'Processo judicial criado.' });
            router.push('/admin/judicial-processes');
        } else {
            toast({ title: 'Erro ao Criar', description: result.message, variant: 'destructive' });
        }
        return result;
    }
    
    return (
         <FormPageLayout
            pageTitle="Novo Processo Judicial"
            pageDescription="Cadastre um novo processo e suas partes para vincular a bens e lotes."
            icon={Gavel}
            isEdit={false}
        >
            {(formRef) => (
                <JudicialProcessForm
                    ref={formRef}
                    courts={courts}
                    allDistricts={allDistricts}
                    allBranches={allBranches}
                    sellers={sellers}
                    onSubmitAction={handleCreate}
                />
            )}
        </FormPageLayout>
    );
}


export default function NewJudicialProcessPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [pageData, setPageData] = useState<{ courts: Court[], allDistricts: JudicialDistrict[], allBranches: JudicialBranch[], sellers: SellerProfileInfo[] } | null>(null);
    
    useEffect(() => {
        async function loadData() {
            const [courts, districts, branches, sellers] = await Promise.all([
                getCourts(),
                getJudicialDistricts(),
                getJudicialBranches(),
                getSellers()
            ]);
            setPageData({ courts, allDistricts: districts, allBranches: branches, sellers });
            setIsLoading(false);
        }
        loadData();
    }, []);

    if (isLoading || !pageData) {
        return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }
    
    return <NewJudicialProcessPageContent {...pageData} />;
}

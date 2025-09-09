// apps/web/src/app/admin/sellers/new/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SellerForm } from '../seller-form';
import { createSeller } from '../actions';
import type { SellerFormData } from '@bidexpert/core';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { JudicialBranch } from '@bidexpert/core';

function NewSellerPageContent({ branches }: { branches: JudicialBranch[] }) {
    const router = useRouter();
    const { toast } = useToast();
    
    const handleCreate = async (data: SellerFormData) => {
        const result = await createSeller(data);
        if (result.success) {
            toast({ title: 'Sucesso!', description: 'Comitente criado com sucesso.' });
            router.push('/admin/sellers');
        } else {
            toast({ title: 'Erro ao Criar', description: result.message, variant: 'destructive' });
        }
        return result;
    };
    
    return (
         <FormPageLayout
            pageTitle="Novo Comitente"
            pageDescription="Preencha os detalhes para cadastrar um novo comitente/vendedor."
            icon={Users}
            isEdit={false}
        >
            {(initialData, formRef, handleSubmit) => (
                <SellerForm
                    ref={formRef}
                    judicialBranches={branches}
                    onSubmitAction={(data) => handleSubmit(async () => handleCreate(data))}
                />
            )}
        </FormPageLayout>
    );
}


export default function NewSellerPage() {
    const [branches, setBranches] = useState<JudicialBranch[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getJudicialBranches().then(data => {
            setBranches(data);
            setIsLoading(false);
        });
    }, []);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div>
    }
    
    return <NewSellerPageContent branches={branches} />;
}

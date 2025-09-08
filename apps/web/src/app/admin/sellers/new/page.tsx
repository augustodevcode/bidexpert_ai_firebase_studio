// apps/web/src/app/admin/sellers/new/page.tsx
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SellerForm from './seller-form';
import { createSeller } from './actions';
import type { SellerFormData } from '@bidexpert/core';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { JudicialBranch } from '@bidexpert/core';

function NewSellerPageContent({ branches }: { branches: JudicialBranch[] }) {
    const router = useRouter();
    const { toast } = useToast();
    const formRef = useRef<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleSave = () => {
        formRef.current?.requestSubmit();
    };

    async function handleCreateSeller(data: SellerFormData) {
        setIsSubmitting(true);
        const result = await createSeller(data);
        if (result.success) {
            toast({ title: 'Sucesso!', description: 'Comitente criado com sucesso.' });
            router.push('/admin/sellers');
        } else {
            toast({ title: 'Erro ao Criar', description: result.message, variant: 'destructive' });
        }
        setIsSubmitting(false);
    }
    
    return (
         <FormPageLayout
            formTitle="Novo Comitente"
            formDescription="Preencha os detalhes para cadastrar um novo comitente/vendedor."
            icon={Users}
            isViewMode={false} // Always in edit mode for new page
            isSubmitting={isSubmitting}
            onSave={handleSave}
            onCancel={() => router.push('/admin/sellers')}
        >
            <SellerForm
                ref={formRef}
                judicialBranches={branches}
                onSubmitAction={handleCreateSeller}
            />
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

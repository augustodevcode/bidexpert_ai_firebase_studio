// src/app/admin/judicial-branches/new/page.tsx
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import JudicialBranchForm from '../judicial-branch-form';
import { createJudicialBranch, type JudicialBranchFormData } from '../actions';
import { getJudicialDistricts } from '@/app/admin/judicial-districts/actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { Building2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { JudicialDistrict } from '@/types';

function NewJudicialBranchPageContent({ districts }: { districts: JudicialDistrict[] }) {
    const router = useRouter();
    const { toast } = useToast();
    const formRef = useRef<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleSave = () => {
        formRef.current?.requestSubmit();
    };

    async function handleCreate(data: JudicialBranchFormData) {
        setIsSubmitting(true);
        const result = await createJudicialBranch(data);
        if (result.success) {
            toast({ title: 'Sucesso!', description: 'Vara judicial criada.' });
            router.push('/admin/judicial-branches');
        } else {
            toast({ title: 'Erro ao Criar', description: result.message, variant: 'destructive' });
        }
        setIsSubmitting(false);
    }
    
    return (
        <FormPageLayout
            formTitle="Nova Vara Judicial"
            formDescription="Preencha os detalhes para cadastrar uma nova vara e associe-a a uma comarca."
            icon={Building2}
            isViewMode={false}
            isSubmitting={isSubmitting}
            onSave={handleSave}
            onCancel={() => router.push('/admin/judicial-branches')}
        >
            <JudicialBranchForm
                ref={formRef}
                districts={districts}
                onSubmitAction={handleCreate}
            />
        </FormPageLayout>
    );
}

export default function NewJudicialBranchPage() {
    const [districts, setDistricts] = useState<JudicialDistrict[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getJudicialDistricts().then(data => {
            setDistricts(data);
            setIsLoading(false);
        });
    }, []);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div>
    }
    
    return <NewJudicialBranchPageContent districts={districts} />;
}

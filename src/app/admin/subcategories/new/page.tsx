// src/app/admin/subcategories/new/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import SubcategoryForm from '../subcategory-form';
import { createSubcategoryAction, type SubcategoryFormData } from '../actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import type { LotCategory } from '@bidexpert/core';
import FormPageLayout from '@/components/admin/form-page-layout';
import { Layers, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

function NewSubcategoryPageContent({ categories }: { categories: LotCategory[] }) {
    const router = useRouter();
    const { toast } = useToast();
    const formRef = useRef<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = () => {
        formRef.current?.requestSubmit();
    };

    async function handleCreateSubcategory(data: SubcategoryFormData) {
        setIsSubmitting(true);
        const result = await createSubcategoryAction(data);
        if (result.success) {
            toast({ title: 'Sucesso!', description: 'Subcategoria criada.' });
            router.push('/admin/subcategories');
        } else {
            toast({ title: 'Erro ao Criar', description: result.message, variant: 'destructive' });
        }
        setIsSubmitting(false);
    }
    
    return (
        <FormPageLayout
            formTitle="Nova Subcategoria"
            formDescription="Crie uma nova subcategoria e associe-a a uma categoria principal."
            icon={Layers}
            isViewMode={false}
            isSubmitting={isSubmitting}
            onSave={handleSave}
            onCancel={() => router.push('/admin/subcategories')}
        >
            <SubcategoryForm
                ref={formRef}
                parentCategories={categories}
                onSubmitAction={handleCreateSubcategory}
            />
        </FormPageLayout>
    );
}


export default function NewSubcategoryPage() {
    const [categories, setCategories] = useState<LotCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getLotCategories().then(data => {
            setCategories(data);
            setIsLoading(false);
        });
    }, []);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }
    
    return <NewSubcategoryPageContent categories={categories} />;
}

// src/app/admin/bens/[bemId]/edit/page.tsx
'use client';

import BemForm from '../../bem-form';
import { getBem, updateBem, deleteBem } from '../../actions';
import { getJudicialProcesses } from '@/app/admin/judicial-processes/actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { notFound, useParams, useRouter } from 'next/navigation';
import type { BemFormData, Bem, JudicialProcess, LotCategory, SellerProfileInfo } from '@/types';
import FormPageLayout from '@/components/admin/form-page-layout';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Package } from 'lucide-react';


export default function EditBemPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const bemId = params.bemId as string;
    
    const [bem, setBem] = useState<Bem | null>(null);
    const [processes, setProcesses] = useState<JudicialProcess[]>([]);
    const [categories, setCategories] = useState<LotCategory[]>([]);
    const [sellers, setSellers] = useState<SellerProfileInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isViewMode, setIsViewMode] = useState(true);
    const formRef = useRef<any>(null);

    const fetchPageData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [fetchedBem, fetchedProcesses, fetchedCategories, fetchedSellers] = await Promise.all([
                getBem(bemId),
                getJudicialProcesses(),
                getLotCategories(),
                getSellers()
            ]);
            if (!fetchedBem) {
                notFound();
                return;
            }
            setBem(fetchedBem);
            setProcesses(fetchedProcesses);
            setCategories(fetchedCategories);
            setSellers(fetchedSellers);
        } catch (error) {
            console.error("Error fetching data for Bem edit page", error);
            toast({ title: 'Erro ao carregar dados', variant: 'destructive'});
        } finally {
            setIsLoading(false);
        }
    }, [bemId, toast]);

    useEffect(() => {
        if (bemId) {
            fetchPageData();
        }
    }, [bemId, fetchPageData]);

    const handleFormSubmit = async (data: BemFormData) => {
        setIsSubmitting(true);
        const result = await updateBem(bemId, data);
        if (result.success) {
            toast({ title: 'Sucesso!', description: 'Bem atualizado.' });
            fetchPageData();
            setIsViewMode(true);
        } else {
            toast({ title: 'Erro ao Salvar', description: result.message, variant: 'destructive' });
        }
        setIsSubmitting(false);
    };

    const handleDelete = async () => {
        const result = await deleteBem(bemId);
        if (result.success) {
            toast({ title: 'Sucesso!', description: 'Bem excluído.' });
            router.push('/admin/bens');
        } else {
            toast({ title: 'Erro ao Excluir', description: result.message, variant: 'destructive' });
        }
    };
    
    const handleSave = () => {
        formRef.current?.requestSubmit();
    };

    return (
        <FormPageLayout
            formTitle={isViewMode ? "Visualizar Bem" : "Editar Bem"}
            formDescription={bem?.title || 'Carregando...'}
            icon={Package}
            isViewMode={isViewMode}
            isLoading={isLoading}
            isSubmitting={isSubmitting}
            onEnterEditMode={() => setIsViewMode(false)}
            onCancel={() => setIsViewMode(true)}
            onSave={handleSave}
            onDelete={handleDelete}
        >
             <BemForm
                ref={formRef}
                initialData={bem}
                processes={processes}
                categories={categories}
                sellers={sellers}
                onSubmitAction={handleFormSubmit}
            />
        </FormPageLayout>
    );
}

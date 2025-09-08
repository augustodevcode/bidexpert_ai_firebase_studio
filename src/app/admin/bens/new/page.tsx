// src/app/admin/bens/new/page.tsx
'use client';

import React, { useRef, useState, useEffect } from 'react';
import BemForm from '../bem-form';
import { createBem } from '../actions';
import type { BemFormData } from '@bidexpert/core';
import { getJudicialProcesses } from '@/app/admin/judicial-processes/actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { Package, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { JudicialProcess, LotCategory, SellerProfileInfo } from '@bidexpert/core';

interface NewBemPageContentProps {
  processes: JudicialProcess[];
  categories: LotCategory[];
  sellers: SellerProfileInfo[];
}

function NewBemPageContent({ processes, categories, sellers }: NewBemPageContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const formRef = useRef<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSave = () => {
    formRef.current?.requestSubmit();
  }

  async function handleCreateBem(data: BemFormData) {
    setIsSubmitting(true);
    const result = await createBem(data);
    if (result.success) {
      toast({ title: 'Sucesso!', description: 'Bem criado.' });
      router.push('/admin/bens');
    } else {
      toast({ title: 'Erro ao Criar', description: result.message, variant: 'destructive' });
      setIsSubmitting(false); // Only stop loading on error, success will navigate away
    }
  }

  return (
     <FormPageLayout
        formTitle="Novo Bem"
        formDescription="Cadastre um novo bem para que possa ser posteriormente loteado."
        icon={Package}
        isViewMode={false} // Always in edit mode for new page
        isSubmitting={isSubmitting}
        onSave={handleSave}
        onCancel={() => router.push('/admin/bens')}
    >
        <BemForm
            ref={formRef}
            processes={processes}
            categories={categories}
            sellers={sellers}
            onSubmitAction={handleCreateBem}
        />
    </FormPageLayout>
  );
}


export default function NewBemPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [pageData, setPageData] = useState<NewBemPageContentProps | null>(null);

    useEffect(() => {
        async function loadData() {
            const [processes, categories, sellers] = await Promise.all([
                getJudicialProcesses(),
                getLotCategories(),
                getSellers()
            ]);
            setPageData({ processes, categories, sellers });
            setIsLoading(false);
        }
        loadData();
    }, []);

    if (isLoading || !pageData) {
        return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }
    
    return <NewBemPageContent {...pageData} />;
}

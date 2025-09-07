// src/app/admin/bens/new/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import BemForm from '../bem-form';
import { createBem } from '../actions';
import { getJudicialProcesses } from '@/app/admin/judicial-processes/actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import type { BemFormData, JudicialProcess, LotCategory, SellerProfileInfo } from '@/types';
import FormPageLayout from '@/components/admin/form-page-layout';
import { Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';


interface NewBemPageContentProps {
  processes: JudicialProcess[];
  categories: LotCategory[];
  sellers: SellerProfileInfo[];
}

function NewBemPageContent({ processes, categories, sellers }: NewBemPageContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const formRef = useRef<any>(null);
  
  const handleSave = () => {
    formRef.current?.requestSubmit();
  }

  async function handleCreateBem(data: BemFormData) {
    const result = await createBem(data);
    if (result.success) {
      toast({ title: 'Sucesso!', description: 'Bem criado.' });
      router.push('/admin/bens');
    } else {
      toast({ title: 'Erro ao Criar', description: result.message, variant: 'destructive' });
    }
  }

  return (
     <FormPageLayout
        formTitle="Novo Bem"
        formDescription="Cadastre um novo bem para que possa ser posteriormente loteado."
        icon={Package}
        isViewMode={false}
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

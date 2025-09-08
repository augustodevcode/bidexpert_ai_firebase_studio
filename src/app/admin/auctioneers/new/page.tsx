// apps/web/src/app/admin/auctioneers/new/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import AuctioneerForm from '../auctioneer-form';
import { createAuctioneer } from '../actions';
import type { AuctioneerFormData } from '@bidexpert/core';
import FormPageLayout from '@/components/admin/form-page-layout';
import { Gavel } from 'lucide-react';

export default function NewAuctioneerPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const handleCreate = async (data: AuctioneerFormData) => {
    const result = await createAuctioneer(data);
    if (result.success) {
      toast({ title: 'Sucesso!', description: 'Leiloeiro criado com sucesso.' });
      router.push('/admin/auctioneers');
    } else {
      toast({ title: 'Erro ao Criar', description: result.message, variant: 'destructive' });
    }
    return result;
  };

  return (
    <FormPageLayout
        pageTitle="Novo Leiloeiro"
        pageDescription="Preencha os detalhes para cadastrar um novo leiloeiro."
        icon={Gavel}
        isEdit={false}
    >
        {(initialData, formRef, handleSubmit) => (
            <AuctioneerForm
                ref={formRef}
                initialData={initialData}
                onSubmitAction={(data) => handleSubmit(async () => handleCreate(data))}
            />
        )}
    </FormPageLayout>
  );
}

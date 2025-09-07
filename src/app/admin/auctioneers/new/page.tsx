// src/app/admin/auctioneers/new/page.tsx
'use client';

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import AuctioneerForm from '../auctioneer-form';
import { createAuctioneer, type AuctioneerFormData } from '../actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { Gavel } from 'lucide-react';

export default function NewAuctioneerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const formRef = useRef<any>(null);
  
  const handleSave = () => {
    formRef.current?.requestSubmit();
  };
  
  async function handleCreateAuctioneer(data: AuctioneerFormData) {
    const result = await createAuctioneer(data);
    if (result.success) {
      toast({ title: 'Sucesso!', description: 'Leiloeiro criado com sucesso.' });
      router.push('/admin/auctioneers');
    } else {
      toast({ title: 'Erro ao Criar', description: result.message, variant: 'destructive' });
    }
  }

  return (
    <FormPageLayout
        formTitle="Novo Leiloeiro"
        formDescription="Preencha os detalhes para cadastrar um novo leiloeiro."
        icon={Gavel}
        isViewMode={false} // Always in edit mode for new page
        onSave={handleSave}
        onCancel={() => router.push('/admin/auctioneers')}
    >
        <AuctioneerForm
            ref={formRef}
            onSubmitAction={handleCreateAuctioneer}
        />
    </FormPageLayout>
  );
}

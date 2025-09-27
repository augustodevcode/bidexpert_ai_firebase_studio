// src/app/admin/auctioneers/new/page.tsx
/**
 * @fileoverview Página para criação de um novo Leiloeiro.
 * Este componente renderiza o `FormPageLayout` e o `AuctioneerForm` para a entrada
 * de dados, e utiliza a server action `createAuctioneer` para persistir
 * o novo registro no banco de dados.
 */
'use client';
import { useRouter } from 'next/navigation';
import AuctioneerForm from '../auctioneer-form';
import { createAuctioneer, type AuctioneerFormData } from '../actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { Landmark } from 'lucide-react';
import * as React from 'react';
import { useToast } from '@/hooks/use-toast';

export default function NewAuctioneerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const formRef = React.useRef<any>(null);

  const handleSave = async () => {
    if (formRef.current) {
        await formRef.current.requestSubmit();
    }
  };

  async function handleCreateAuctioneer(data: AuctioneerFormData) {
    setIsSubmitting(true);
    const result = await createAuctioneer(data);
    if (result.success) {
      toast({ title: 'Sucesso!', description: 'Leiloeiro criado com sucesso.' });
      router.push('/admin/auctioneers');
    } else {
      toast({ title: 'Erro ao Criar', description: result.message, variant: 'destructive'});
    }
    setIsSubmitting(false);
    return result;
  }

  return (
     <div data-ai-id="admin-new-auctioneer-page">
        <FormPageLayout
            formTitle="Novo Leiloeiro"
            formDescription="Preencha os detalhes para cadastrar um novo leiloeiro."
            icon={Landmark}
            isViewMode={false}
            isSubmitting={isSubmitting}
            onSave={handleSave}
            onCancel={() => router.push('/admin/auctioneers')}
        >
            <AuctioneerForm
                ref={formRef}
                onSubmitAction={handleCreateAuctioneer}
            />
        </FormPageLayout>
    </div>
  );
}

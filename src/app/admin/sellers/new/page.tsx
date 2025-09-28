// src/app/admin/sellers/new/page.tsx
/**
 * @fileoverview Página para criação de um novo Comitente (Vendedor).
 * Este componente de cliente gerencia o estado do formulário e de submissão,
 * busca dados de Varas Judiciais (se aplicável), e utiliza a server action
 * `createSeller` para persistir o novo registro no banco de dados.
 */
'use client';
import { useRouter } from 'next/navigation';
import SellerForm from '../seller-form';
import { createSeller, type SellerFormData } from '../actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { Users } from 'lucide-react';
import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';

export default function NewSellerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [judicialBranches, setJudicialBranches] = React.useState<any[]>([]);
  const formRef = React.useRef<any>(null);

  React.useEffect(() => {
    async function fetchBranches() {
        const branches = await getJudicialBranches();
        setJudicialBranches(branches);
    }
    fetchBranches();
  }, []);

  const handleSave = async () => {
    if (formRef.current) {
        await formRef.current.requestSubmit();
    }
  };
  
  async function handleCreateSeller(data: SellerFormData) {
    setIsSubmitting(true);
    const result = await createSeller(data);
    if (result.success) {
      toast({ title: 'Sucesso!', description: 'Comitente criado com sucesso.' });
      router.push('/admin/sellers');
    } else {
      toast({ title: 'Erro ao Criar', description: result.message, variant: 'destructive'});
    }
    setIsSubmitting(false);
    return result;
  }

  return (
     <div data-ai-id="admin-new-seller-page">
        <FormPageLayout
            formTitle="Novo Comitente"
            formDescription="Preencha os detalhes para cadastrar um novo comitente/vendedor."
            icon={Users}
            isViewMode={false}
            isSubmitting={isSubmitting}
            onSave={handleSave}
            onCancel={() => router.push('/admin/sellers')}
        >
            <SellerForm
                ref={formRef}
                judicialBranches={judicialBranches}
                onSubmitAction={handleCreateSeller}
            />
        </FormPageLayout>
    </div>
  );
}

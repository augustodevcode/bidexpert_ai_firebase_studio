// src/app/admin/sellers/new/page.tsx
/**
 * @fileoverview Página para criação de um novo Comitente (Vendedor).
 * Este componente de cliente gerencia o estado do formulário e de submissão,
 * busca dados de Varas Judiciais (se aplicável), e utiliza la server action
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
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';
import type { StateInfo, CityInfo, JudicialBranch } from '@/types';

export default function NewSellerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [judicialBranches, setJudicialBranches] = React.useState<JudicialBranch[]>([]);
  const [allStates, setAllStates] = React.useState<StateInfo[]>([]);
  const [allCities, setAllCities] = React.useState<CityInfo[]>([]);
  const [isLoadingDependencies, setIsLoadingDependencies] = React.useState(true);
  const formRef = React.useRef<any>(null);

  React.useEffect(() => {
    async function fetchDependencies() {
        try {
            const [branchesData, statesData, citiesData] = await Promise.all([
                getJudicialBranches(),
                getStates(),
                getCities(),
            ]);
            setJudicialBranches(branchesData);
            setAllStates(statesData);
            setAllCities(citiesData);
        } catch (error) {
            toast({ title: 'Erro ao carregar dados', description: 'Não foi possível buscar os dados de apoio.', variant: 'destructive'});
        } finally {
            setIsLoadingDependencies(false);
        }
    }
    fetchDependencies();
  }, [toast]);

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
            isLoading={isLoadingDependencies}
            isSubmitting={isSubmitting}
            isValid={formRef.current?.formState.isValid ?? false}
            onSave={handleSave}
            onCancel={() => router.push('/admin/sellers')}
        >
            {!isLoadingDependencies && (
                <SellerForm
                    ref={formRef}
                    judicialBranches={judicialBranches}
                    allStates={allStates}
                    allCities={allCities}
                    onSubmitAction={handleCreateSeller}
                />
            )}
        </FormPageLayout>
    </div>
  );
}

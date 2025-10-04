// src/app/admin/auctioneers/new/page.tsx
/**
 * @fileoverview Página para criação de um novo Leiloeiro.
 * Este componente de cliente gerencia o estado do formulário e de submissão,
 * busca dados necessários (estados, cidades) e utiliza a server action
 * `createAuctioneer` para persistir o novo registro no banco de dados.
 */
'use client';
import { useRouter } from 'next/navigation';
import AuctioneerForm from '../auctioneer-form';
import { createAuctioneer, type AuctioneerFormData } from '../actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { Landmark } from 'lucide-react';
import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';
import type { StateInfo, CityInfo } from '@/types';

export default function NewAuctioneerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [states, setStates] = React.useState<StateInfo[]>([]);
  const [cities, setCities] = React.useState<CityInfo[]>([]);
  const [isLoadingDependencies, setIsLoadingDependencies] = React.useState(true);
  const formRef = React.useRef<any>(null);

  React.useEffect(() => {
    async function loadDependencies() {
        try {
            const [statesData, citiesData] = await Promise.all([getStates(), getCities()]);
            setStates(statesData);
            setCities(citiesData);
        } catch (error) {
            toast({ title: 'Erro ao carregar dados', description: 'Não foi possível buscar estados e cidades.', variant: 'destructive'});
        } finally {
            setIsLoadingDependencies(false);
        }
    }
    loadDependencies();
  }, [toast]);

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
            isLoading={isLoadingDependencies}
            isSubmitting={isSubmitting}
            isValid={formRef.current?.formState.isValid}
            onSave={handleSave}
            onCancel={() => router.push('/admin/auctioneers')}
        >
            {!isLoadingDependencies && (
                <AuctioneerForm
                    ref={formRef}
                    allStates={states}
                    allCities={cities}
                    onSubmitAction={handleCreateAuctioneer}
                />
            )}
        </FormPageLayout>
    </div>
  );
}

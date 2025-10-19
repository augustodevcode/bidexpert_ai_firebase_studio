// src/app/admin/judicial-processes/new/page.tsx
/**
 * @fileoverview Página para criação de um novo Processo Judicial.
 * Este componente busca todos os dados necessários para popular
 * os seletores do formulário (tribunais, comarcas, varas, comitentes) e
 * renderiza o `JudicialProcessForm` para a entrada de dados.
 */
'use client';

import JudicialProcessForm from '../judicial-process-form';
import { createJudicialProcessAction } from '../actions';
import { getCourts } from '@/app/admin/courts/actions';
import { getJudicialDistricts } from '@/app/admin/judicial-districts/actions';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { Loader2 } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Court, JudicialDistrict, JudicialBranch, SellerProfileInfo } from '@/types';


export default function NewJudicialProcessPage() {
  const [dependencies, setDependencies] = useState<{
    courts: Court[],
    allDistricts: JudicialDistrict[],
    allBranches: JudicialBranch[],
    sellers: SellerProfileInfo[],
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const loadDependencies = useCallback(async () => {
    setIsLoading(true);
    try {
        const [courts, allDistricts, allBranches, sellers] = await Promise.all([
          getCourts(),
          getJudicialDistricts(),
          getJudicialBranches(),
          getSellers()
        ]);
        setDependencies({ courts, allDistricts, allBranches, sellers });
    } catch (error) {
        toast({ title: 'Erro ao carregar dados', description: 'Não foi possível carregar os dados de apoio para o formulário.', variant: 'destructive'});
    } finally {
        setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    loadDependencies();
  }, [loadDependencies]);
  
  if (isLoading || !dependencies) {
    return (
        <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <JudicialProcessForm
      courts={dependencies.courts}
      allDistricts={dependencies.allDistricts}
      allBranches={dependencies.allBranches}
      sellers={dependencies.sellers}
      onSubmitAction={createJudicialProcessAction}
      formTitle="Novo Processo Judicial"
      formDescription="Cadastre um novo processo e suas partes para vincular a bens e lotes."
      submitButtonText="Criar Processo"
    />
  );
}

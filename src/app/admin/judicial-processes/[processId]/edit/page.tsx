// src/app/admin/judicial-processes/[processId]/edit/page.tsx
/**
 * @fileoverview Página de edição para um Processo Judicial específico.
 * Este componente Server-Side busca os dados iniciais do processo a ser editado,
 * bem como as listas de entidades relacionadas (tribunais, comarcas, varas, comitentes)
 * para popular os seletores do formulário. A ação de atualização (`handleUpdateProcess`)
 * é então passada como prop para o `JudicialProcessForm`.
 */
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, notFound } from 'next/navigation';
import JudicialProcessForm from '../../judicial-process-form';
import { getJudicialProcess, updateJudicialProcessAction, type JudicialProcessFormValues } from '../../actions';
import { getCourts } from '@/app/admin/courts/actions';
import { getJudicialDistricts } from '@/app/admin/judicial-districts/actions';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { JudicialProcess, Court, JudicialDistrict, JudicialBranch, SellerProfileInfo } from '@/types';


export default function EditJudicialProcessPage() {
  const params = useParams();
  const processId = params.processId as string;
  const { toast } = useToast();
  
  const [dependencies, setDependencies] = useState<{
    process: JudicialProcess | null,
    courts: Court[],
    allDistricts: JudicialDistrict[],
    allBranches: JudicialBranch[],
    sellers: SellerProfileInfo[],
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!processId) return;
    setIsLoading(true);
    try {
        const [process, courts, allDistricts, allBranches, sellers] = await Promise.all([
            getJudicialProcess(processId),
            getCourts(),
            getJudicialDistricts(),
            getJudicialBranches(),
            getSellers()
        ]);

        if (!process) {
            notFound();
            return;
        }
        setDependencies({ process, courts, allDistricts, allBranches, sellers });
    } catch (e) {
        toast({ title: 'Erro ao Carregar Dados', variant: 'destructive'});
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  }, [processId, toast]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);


  async function handleUpdateProcess(data: JudicialProcessFormValues) {
    'use server';
    return updateJudicialProcessAction(processId, data);
  }

  if (isLoading || !dependencies) {
      return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <JudicialProcessForm
      initialData={dependencies.process}
      courts={dependencies.courts}
      allDistricts={dependencies.allDistricts}
      allBranches={dependencies.allBranches}
      sellers={dependencies.sellers}
      onSubmitAction={handleUpdateProcess}
      formTitle="Editar Processo Judicial"
      formDescription="Modifique os detalhes do processo e suas partes."
      submitButtonText="Salvar Alterações"
    />
  );
}

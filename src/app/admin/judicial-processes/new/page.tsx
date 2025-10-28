// src/app/admin/judicial-processes/new/page.tsx
/**
 * @fileoverview Página para criação de um novo Processo Judicial.
 * Este componente Server-Side busca os dados necessários para os seletores
 * (tribunais, comarcas, varas, etc.) e renderiza o `JudicialProcessForm` para
 * a entrada de dados, passando a server action `createJudicialProcessAction`
 * para persistir o novo registro.
 */
import JudicialProcessForm from '../judicial-process-form';
import { createJudicialProcessAction, type JudicialProcessFormValues } from '../actions';
import { getCourts } from '@/app/admin/courts/actions';
import { getJudicialDistricts } from '@/app/admin/judicial-districts/actions';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import React from 'react';
import { Loader2 } from 'lucide-react';

async function NewJudicialProcessPageContent() {
    const [courts, districts, branches, sellers] = await Promise.all([
        getCourts(),
        getJudicialDistricts(),
        getJudicialBranches(),
        getSellers(),
    ]);

    async function handleCreateProcess(data: JudicialProcessFormValues) {
        'use server';
        return createJudicialProcessAction(data);
    }
    
    return (
        <JudicialProcessForm
            courts={courts}
            allDistricts={districts}
            allBranches={branches}
            sellers={sellers}
            onSubmitAction={handleCreateProcess}
            formTitle="Novo Processo Judicial"
            formDescription="Preencha os detalhes para cadastrar um novo processo."
            submitButtonText="Criar Processo"
        />
    )
}

export default function NewJudicialProcessPage() {
    return (
        <React.Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
            <NewJudicialProcessPageContent />
        </React.Suspense>
    );
}

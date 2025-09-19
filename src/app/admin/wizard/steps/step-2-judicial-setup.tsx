// src/components/admin/wizard/steps/step-2-judicial-setup.tsx
'use client';

import { useWizard } from '../wizard-context';
import type { JudicialProcess } from '@/types';
import EntitySelector from '@/components/ui/entity-selector';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

interface Step2JudicialSetupProps {
  processes: JudicialProcess[];
  onRefetchRequest: () => void;
  onAddNewProcess?: () => void;
}

export default function Step2JudicialSetup({ processes, onRefetchRequest, onAddNewProcess }: Step2JudicialSetupProps) {
  const { wizardData, setWizardData } = useWizard();
  const [isFetching, setIsFetching] = useState(false);

  const selectedProcess = wizardData.judicialProcess;
  
  const handleRefetch = async () => {
      setIsFetching(true);
      await onRefetchRequest();
      setIsFetching(false);
  }

  const handleAddNew = () => {
    if (onAddNewProcess) {
      onAddNewProcess();
    }
  }

  return (
    <div className="space-y-6" data-ai-id="wizard-step2-judicial-setup">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h3 className="text-lg font-semibold">Selecione o Processo Judicial</h3>
      </div>
      <EntitySelector
        entityName="Processo"
        value={selectedProcess?.id}
        onChange={(processId) => {
            const process = processId ? processes.find(p => p.id === processId) : undefined;
            setWizardData((prev) => ({ ...prev, judicialProcess: process }));
        }}
        options={processes.map(p => ({ value: p.id, label: p.processNumber }))}
        placeholder="Selecione um processo..."
        searchPlaceholder="Buscar por número..."
        emptyStateMessage="Nenhum processo encontrado."
        createNewUrl="/admin/judicial-processes/new"
        editUrlPrefix="/admin/judicial-processes"
        onRefetch={handleRefetch}
        isFetching={isFetching}
        onAddNew={onAddNewProcess}
      />
      
      {selectedProcess && (
        <div className="p-4 border rounded-lg bg-secondary/50 space-y-2" data-ai-id="wizard-step2-selected-process-details">
            <h4 className="font-semibold text-md">Detalhes do Processo Selecionado</h4>
            <p className="text-sm"><strong className="text-muted-foreground">Nº do Processo:</strong> {selectedProcess.processNumber}</p>
            <p className="text-sm"><strong className="text-muted-foreground">Vara:</strong> {selectedProcess.branchName}</p>
            <p className="text-sm"><strong className="text-muted-foreground">Comarca:</strong> {selectedProcess.districtName}</p>
            <p className="text-sm"><strong className="text-muted-foreground">Partes:</strong> {selectedProcess.parties.map(p => p.name).join(', ')}</p>
        </div>
      )}
    </div>
  );
}

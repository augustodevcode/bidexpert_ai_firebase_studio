// src/components/admin/wizard/WizardFlow.tsx
'use client';

import React, { useMemo } from 'react';
import { useWizard } from './wizard-context';
import { Gavel, Users, Building, FileText, Scale, Package, Boxes, ListChecks, Rocket, DollarSign, Tv, CalendarX, BrainCircuit, CheckSquare } from 'lucide-react';

// Componente de placeholder que será exibido em vez do gráfico ReactFlow
const FlowPlaceholder = () => (
  <div className="flex items-center justify-center h-full bg-muted/30 rounded-md">
    <div className="text-center p-8">
      <h3 className="text-lg font-semibold text-foreground">Visualização do Fluxo Indisponível</h3>
      <p className="text-sm text-muted-foreground mt-2">
        O componente de visualização do fluxo (`reactflow`) foi removido para otimizar o uso de recursos no ambiente de desenvolvimento.
      </p>
    </div>
  </div>
);


export default function WizardFlow() {
  const { wizardData, currentStep } = useWizard();
  
  // A lógica de cálculo de nós e arestas foi removida, pois o ReactFlow não será mais usado.
  // O componente agora simplesmente renderiza o placeholder.

  return (
    <FlowPlaceholder />
  );
}

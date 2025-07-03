// src/components/admin/wizard/WizardFlow.tsx
'use client';

import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls, Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { useWizard } from './wizard-context';
import FlowStepNode from './FlowStepNode';

const nodeTypes = {
  customStep: FlowStepNode,
};

const WizardFlow = () => {
  const { wizardData, currentStep } = useWizard();

  const { nodes, edges } = useMemo(() => {
    const isJudicial = wizardData.auctionType === 'JUDICIAL';
    const baseNodes: Node[] = [];
    const baseEdges: Edge[] = [];
    
    const stepsDefinition = [
      { id: 'type', title: 'Tipo de Leilão' },
      ...(isJudicial ? [{ id: 'judicial', title: 'Dados Judiciais' }] : []),
      { id: 'auction', title: 'Dados do Leilão' },
      { id: 'lotting', title: 'Loteamento' },
      { id: 'review', title: 'Revisão' },
    ];
    
    stepsDefinition.forEach((step, index) => {
        let status: 'done' | 'in_progress' | 'todo' = 'todo';
        let details: { label: string; value?: string | number }[] = [];
        let entityType: 'judicial-processes' | undefined = undefined;
        let entityId: string | undefined = undefined;

        // Determine status and details based on data, then override if it's the current step
        switch(step.id) {
            case 'type':
                if (wizardData.auctionType) {
                    status = 'done';
                    details.push({ label: 'Tipo', value: wizardData.auctionType.replace(/_/g, ' ') });
                }
                break;
            case 'judicial':
                if (wizardData.judicialProcess?.id) {
                    status = 'done';
                    details.push({ label: 'Processo', value: wizardData.judicialProcess.processNumber });
                    entityType = 'judicial-processes';
                    entityId = wizardData.judicialProcess.id;
                }
                break;
            case 'auction':
                if (wizardData.auctionDetails?.title && wizardData.auctionDetails.auctioneer && wizardData.auctionDetails.seller) {
                    status = 'done';
                    if (wizardData.auctionDetails.title) details.push({ label: 'Título', value: wizardData.auctionDetails.title });
                    if (wizardData.auctionDetails.auctioneer) details.push({ label: 'Leiloeiro', value: wizardData.auctionDetails.auctioneer });
                    if (wizardData.auctionDetails.seller) details.push({ label: 'Comitente', value: wizardData.auctionDetails.seller });
                }
                break;
            case 'lotting':
                if (wizardData.createdLots && wizardData.createdLots.length > 0) {
                    status = 'done';
                    details.push({ label: 'Lotes Criados', value: wizardData.createdLots.length });
                }
                break;
             case 'review':
                if (wizardData.createdLots && wizardData.createdLots.length > 0) {
                    details.push({ label: 'Pronto para finalizar' });
                }
                break;
        }
        
        // The current step is always 'in_progress' regardless of data
        if (currentStep === index) {
            status = 'in_progress';
        }

        baseNodes.push({
            id: step.id,
            type: 'customStep',
            position: { x: 50, y: 50 + (index * 180) },
            data: {
                title: step.title,
                status: status,
                details: details.filter(d => d.value !== undefined && d.value !== null),
                entityType: entityType,
                entityId: entityId,
            },
        });
        
        if (index > 0) {
            baseEdges.push({ 
                id: `e-${stepsDefinition[index - 1].id}-${step.id}`, 
                source: stepsDefinition[index - 1].id, 
                target: step.id, 
                type: 'smoothstep',
                animated: currentStep === index,
            });
        }
    });

    return { nodes: baseNodes, edges: baseEdges };

  }, [wizardData, currentStep]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      proOptions={{ hideAttribution: true }}
      className="bg-muted/30"
    >
      <Background />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
};

export default WizardFlow;

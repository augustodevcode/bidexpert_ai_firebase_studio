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

    let yPos = 50;
    const yGap = 220; 
    const mainX = 150;
    const entityX = 450;

    stepsDefinition.forEach((step, index) => {
        let status: 'done' | 'in_progress' | 'todo' = 'todo';
        let details: { label: string; value?: string | number }[] = [];
        let entityType: 'judicial-processes' | undefined = undefined;
        let entityId: string | undefined = undefined;

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
                    
                    if (wizardData.judicialProcess.sellerName) {
                        baseNodes.push({
                            id: 'process-seller',
                            type: 'customStep',
                            position: { x: entityX, y: yPos },
                            data: { title: 'Comitente do Processo', status: 'done', details: [{ label: 'Nome', value: wizardData.judicialProcess.sellerName }] }
                        });
                        baseEdges.push({ id: 'e-judicial-seller', source: 'judicial', target: 'process-seller', type: 'smoothstep' });
                    }
                }
                break;
            case 'auction':
                if (wizardData.auctionDetails?.title) status = 'done';
                if (wizardData.auctionDetails?.title) details.push({ label: 'Título', value: wizardData.auctionDetails.title });

                if (wizardData.auctionDetails?.auctioneer) {
                    baseNodes.push({
                        id: 'auction-auctioneer',
                        type: 'customStep',
                        position: { x: entityX, y: yPos },
                        data: { title: 'Leiloeiro', status: 'done', details: [{ label: 'Nome', value: wizardData.auctionDetails.auctioneer }] }
                    });
                    baseEdges.push({ id: 'e-auction-auctioneer', source: 'auction', target: 'auction-auctioneer', type: 'smoothstep' });
                }
                 if (wizardData.auctionDetails?.seller) {
                    baseNodes.push({
                        id: 'auction-seller',
                        type: 'customStep',
                        position: { x: entityX, y: yPos + 180 }, // Position below auctioneer
                        data: { title: 'Comitente do Leilão', status: 'done', details: [{ label: 'Nome', value: wizardData.auctionDetails.seller }] }
                    });
                     baseEdges.push({ id: 'e-auction-seller', source: 'auction', target: 'auction-seller', type: 'smoothstep' });
                }
                break;
            case 'lotting':
                if (wizardData.createdLots && wizardData.createdLots.length > 0) {
                    status = 'done';
                    details.push({ label: 'Lotes Criados', value: wizardData.createdLots.length });
                }
                
                if (isJudicial) {
                    if (wizardData.judicialProcess?.id) {
                        baseNodes.push({
                            id: 'bens-source',
                            type: 'customStep',
                            position: { x: entityX, y: yPos - yGap / 2 },
                            data: { title: 'Bens do Processo', status: 'done', details: [{ label: 'Status', value: 'Pronto para lotear' }] }
                        });
                        baseEdges.push({ id: 'e-judicial-bens', source: 'judicial', target: 'bens-source', type: 'smoothstep' });
                        baseEdges.push({ id: 'e-bens-lotting', source: 'bens-source', target: 'lotting', type: 'smoothstep', animated: currentStep === index });
                    }
                } else {
                    if (wizardData.auctionDetails?.title) {
                        baseNodes.push({
                           id: 'bens-source-generic',
                           type: 'customStep',
                           position: { x: entityX, y: yPos - yGap / 2 },
                           data: { title: 'Bens Disponíveis', status: 'done', details: [{ label: 'Status', value: 'Pronto para lotear' }] }
                       });
                       baseEdges.push({ id: 'e-auction-bens', source: 'auction', target: 'bens-source-generic', type: 'smoothstep' });
                       baseEdges.push({ id: 'e-bens-lotting-generic', source: 'bens-source-generic', target: 'lotting', type: 'smoothstep', animated: currentStep === index });
                   }
                }
                break;
             case 'review':
                if (wizardData.createdLots && wizardData.createdLots.length > 0) {
                    details.push({ label: 'Pronto para finalizar' });
                }
                break;
        }
        
        if (currentStep === index) {
            status = 'in_progress';
        }

        baseNodes.push({
            id: step.id,
            type: 'customStep',
            position: { x: mainX, y: yPos },
            data: {
                title: step.title,
                status: status,
                details: details.filter(d => d.value !== undefined && d.value !== null && d.value !== ''),
                entityType: entityType,
                entityId: entityId,
            },
        });
        
        if (index > 0) {
            const sourceId = stepsDefinition[index - 1].id;
            let createDirectEdge = true;

            // Don't create direct edges to lotting; they go through a 'bens' node now
            if (step.id === 'lotting') {
              createDirectEdge = false;
            }

            if (createDirectEdge) {
                baseEdges.push({ 
                    id: `e-${sourceId}-${step.id}`, 
                    source: sourceId, 
                    target: step.id, 
                    type: 'smoothstep',
                    animated: currentStep === index,
                });
            }
        }

        yPos += yGap;
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

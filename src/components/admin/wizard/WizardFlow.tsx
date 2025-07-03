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
    
    let lastNodeId = 'type';
    let yPos = 50;
    
    // 1. Tipo de Leilão
    baseNodes.push({
      id: 'type',
      type: 'customStep',
      position: { x: 50, y: yPos },
      data: {
        title: 'Tipo de Leilão',
        status: currentStep > 0 || wizardData.auctionType ? 'done' : (currentStep === 0 ? 'in_progress' : 'todo'),
        details: wizardData.auctionType ? [{ label: wizardData.auctionType.replace(/_/g, ' ') }] : [],
      },
    });

    // 2. Dados Judiciais (Condicional)
    if (isJudicial) {
      yPos += 180;
      baseNodes.push({
        id: 'judicial',
        type: 'customStep',
        position: { x: 50, y: yPos },
        data: {
          title: 'Dados Judiciais',
          status: currentStep > 1 || wizardData.judicialProcess ? 'done' : (currentStep === 1 ? 'in_progress' : 'todo'),
          details: wizardData.judicialProcess ? [{ label: 'Processo', value: wizardData.judicialProcess.processNumber }] : [],
        },
      });
      baseEdges.push({ id: 'e-type-judicial', source: lastNodeId, target: 'judicial', type: 'smoothstep' });
      lastNodeId = 'judicial';
    }

    // 3. Dados do Leilão
    yPos += 180;
    baseNodes.push({
      id: 'auction',
      type: 'customStep',
      position: { x: 50, y: yPos },
      data: {
        title: 'Dados do Leilão',
        status: currentStep > (isJudicial ? 2 : 1) || wizardData.auctionDetails?.title ? 'done' : (currentStep === (isJudicial ? 2 : 1) ? 'in_progress' : 'todo'),
        details: [
          { label: 'Título', value: wizardData.auctionDetails?.title },
          { label: 'Leiloeiro', value: wizardData.auctionDetails?.auctioneer },
          { label: 'Comitente', value: wizardData.auctionDetails?.seller },
        ].filter(d => d.value),
      },
    });
    baseEdges.push({ id: 'e-prev-auction', source: lastNodeId, target: 'auction', type: 'smoothstep' });
    lastNodeId = 'auction';

    // 4. Loteamento
    yPos += 180;
    baseNodes.push({
      id: 'lotting',
      type: 'customStep',
      position: { x: 50, y: yPos },
      data: {
        title: 'Loteamento de Bens',
        status: currentStep > (isJudicial ? 3 : 2) || (wizardData.createdLots && wizardData.createdLots.length > 0) ? 'done' : (currentStep === (isJudicial ? 3 : 2) ? 'in_progress' : 'todo'),
        details: wizardData.createdLots && wizardData.createdLots.length > 0 ? [{ label: 'Lotes Criados', value: wizardData.createdLots.length }] : [],
      },
    });
    baseEdges.push({ id: 'e-auction-lotting', source: lastNodeId, target: 'lotting', type: 'smoothstep' });
    lastNodeId = 'lotting';
    
    // 5. Revisão
    yPos += 180;
    baseNodes.push({
      id: 'review',
      type: 'customStep',
      position: { x: 50, y: yPos },
      data: {
        title: 'Revisão e Publicação',
        status: currentStep === (isJudicial ? 4 : 3) ? 'in_progress' : 'todo',
        details: [{ label: 'Pronto para finalizar.' }],
      },
    });
    baseEdges.push({ id: 'e-lotting-review', source: lastNodeId, target: 'review', type: 'smoothstep' });

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

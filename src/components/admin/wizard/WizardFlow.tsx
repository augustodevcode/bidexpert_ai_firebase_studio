/**
 * @fileoverview Restaura o grafo visual do wizard usando React Flow como representação oficial do processo.
 */
'use client';

import { useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';

import FlowStepNode, { type FlowNodeData } from './FlowStepNode';
import { buildWizardFlowGraph, wizardFlowColors } from './wizard-flow-graph';
import { useWizard } from './wizard-context';

const nodeTypes = {
  customStep: FlowStepNode,
};

export default function WizardFlow() {
  const { wizardData, currentStep } = useWizard();
  const { nodes, edges } = useMemo(() => buildWizardFlowGraph(wizardData, currentStep), [wizardData, currentStep]);

  return (
    <div className="h-full w-full rounded-md overflow-hidden" data-ai-id="wizard-flow-reactflow">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.16 }}
        minZoom={0.2}
        maxZoom={1.3}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
        className="bg-muted/30"
        aria-label="Fluxo visual do cadastro de leilão"
      >
        <MiniMap
          pannable
          zoomable
          maskColor="hsl(var(--background) / 0.65)"
          nodeColor={(node) => {
            const pathType = (node.data as FlowNodeData | undefined)?.pathType ?? 'COMMON';
            return wizardFlowColors[pathType];
          }}
        />
        <Background gap={18} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
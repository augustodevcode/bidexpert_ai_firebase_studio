// src/components/admin/wizard/WizardFlow.tsx
'use client';

import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls, Edge, Node } from 'reactflow';
import 'reactflow/dist/style.css';
import { useWizard } from './wizard-context';
import FlowStepNode, { type FlowNodeData } from './FlowStepNode';
import { Gavel, Users, Building, FileText, Scale, Package, Boxes, ListChecks, Rocket } from 'lucide-react';

const nodeTypes = {
  customStep: FlowStepNode,
};

const pathColors: Record<string, string> = {
  JUDICIAL: '#3b82f6', // blue-500
  EXTRAJUDICIAL: '#22c55e', // green-500
  PARTICULAR: '#f97316', // orange-600
  TOMADA_DE_PRECOS: '#8b5cf6', // violet-500
  COMMON: '#64748b', // slate-500
};

export default function WizardFlow() {
  const { wizardData, currentStep } = useWizard();
  const selectedType = wizardData.auctionType;

  const { nodes, edges } = useMemo(() => {
    const allNodes: Node<FlowNodeData>[] = [];
    const allEdges: Edge[] = [];
    const xGap = 280;
    const yGap = 160;

    // --- Start Node ---
    allNodes.push({
      id: 'start', type: 'customStep', position: { x: 0, y: 350 },
      data: {
        title: 'Início do Cadastro', status: 'done',
        icon: Rocket, pathType: 'COMMON', isActivePath: true, label: 'Ponto de Partida'
      },
    });

    const auctionTypes = ['JUDICIAL', 'EXTRAJUDICIAL', 'PARTICULAR', 'TOMADA_DE_PRECOS'] as const;

    auctionTypes.forEach((type, index) => {
      const yBase = index * yGap;
      const isActivePath = !selectedType || selectedType === type;
      const edgeStyle = {
        stroke: pathColors[type],
        strokeWidth: isActivePath ? 2.5 : 1.5,
      };
      const animatedEdge = isActivePath;

      // --- Node 1: Type Selection ---
      allNodes.push({
        id: `type-${type}`, type: 'customStep', position: { x: xGap, y: yBase },
        data: {
          label: 'Passo 1', title: type.replace(/_/g, ' '), status: selectedType ? 'done' : 'in_progress',
          pathType: type, isActivePath
        }
      });
      allEdges.push({ id: `e-start-${type}`, source: 'start', target: `type-${type}`, type: 'smoothstep', style: edgeStyle, animated: animatedEdge && currentStep >= 0 });

      // --- Build Judicial Path ---
      if (type === 'JUDICIAL') {
        const judicialNodes = [
          { id: 'tribunal', title: 'Tribunal', icon: Scale },
          { id: 'comarca', title: 'Comarca', icon: Building },
          { id: 'vara', title: 'Vara', icon: Gavel },
          { id: 'processo', title: 'Processo Judicial', icon: FileText },
          { id: 'partes', title: 'Partes Envolvidas', icon: Users },
        ];

        let lastNodeId = `type-JUDICIAL`;
        judicialNodes.forEach((node, i) => {
          const nodeId = `judicial-${node.id}`;
          let nodeStatus: 'done' | 'in_progress' | 'todo' = 'todo';
          
          if(wizardData.judicialProcess) {
             nodeStatus = 'done';
          } else if(currentStep === 1) { // Assuming judicial is step 1
             nodeStatus = 'in_progress';
          }

          allNodes.push({
            id: nodeId, type: 'customStep', position: { x: xGap * (2 + i), y: yBase },
            data: { label: 'Dados do Processo', title: node.title, status: nodeStatus, icon: node.icon, pathType: 'JUDICIAL', isActivePath }
          });
          allEdges.push({ id: `e-${lastNodeId}-${nodeId}`, source: lastNodeId, target: nodeId, type: 'smoothstep', style: edgeStyle, animated: animatedEdge && currentStep === 1 });
          lastNodeId = nodeId;
        });
        
        // --- Connect Judicial path to Auction Details ---
        allEdges.push({ id: `e-${lastNodeId}-auction-details`, source: lastNodeId, target: 'auction-details', type: 'smoothstep', style: edgeStyle, animated: animatedEdge && currentStep === 2 });

      } else {
        // --- Connect Non-Judicial paths to Auction Details ---
        allEdges.push({ id: `e-type-${type}-auction-details`, source: `type-${type}`, target: 'auction-details', type: 'smoothstep', style: edgeStyle, animated: animatedEdge && currentStep === 1 && wizardData.auctionType === type });
      }
    });
    
    // --- Common Nodes from Auction Details onwards ---
    let commonYOffset = 1.5 * yGap; // Center the common path
    const commonIsActive = !!selectedType;
    const commonEdgeStyle = { stroke: selectedType ? pathColors[selectedType] : pathColors.COMMON, strokeWidth: commonIsActive ? 2.5 : 1.5 };

    allNodes.push({
      id: 'auction-details', type: 'customStep', position: { x: xGap * 2, y: commonYOffset },
      data: {
        label: 'Passo 2/3', title: 'Dados do Leilão', status: wizardData.auctionDetails?.title ? 'done' : (currentStep >= 1 && currentStep <= 2) ? 'in_progress' : 'todo',
        icon: Gavel, pathType: selectedType || 'COMMON', isActivePath: commonIsActive
      }
    });

    allNodes.push({
      id: 'bens-disponiveis', type: 'customStep', position: { x: xGap * 3, y: commonYOffset },
      data: {
        label: 'Fonte de Itens', title: 'Bens Disponíveis', status: wizardData.auctionDetails?.title ? 'done' : 'todo',
        icon: Package, pathType: selectedType || 'COMMON', isActivePath: commonIsActive
      }
    });
    allEdges.push({ id: `e-auction-bens`, source: 'auction-details', target: 'bens-disponiveis', type: 'smoothstep', style: commonEdgeStyle, animated: commonIsActive && currentStep >= 2 });

    allNodes.push({
      id: 'lotting', type: 'customStep', position: { x: xGap * 4, y: commonYOffset },
      data: {
        label: 'Passo 3/4', title: 'Criação de Lotes', status: wizardData.createdLots && wizardData.createdLots.length > 0 ? 'done' : currentStep === 3 ? 'in_progress' : 'todo',
        icon: Boxes, pathType: selectedType || 'COMMON', isActivePath: commonIsActive
      }
    });
    allEdges.push({ id: `e-bens-lotting`, source: 'bens-disponiveis', target: 'lotting', type: 'smoothstep', style: commonEdgeStyle, animated: commonIsActive && currentStep >= 3 });
    
    allNodes.push({
      id: 'review', type: 'customStep', position: { x: xGap * 5, y: commonYOffset },
      data: {
        label: 'Passo Final', title: 'Revisão e Criação', status: currentStep === 4 ? 'in_progress' : 'todo',
        icon: ListChecks, pathType: selectedType || 'COMMON', isActivePath: commonIsActive
      }
    });
    allEdges.push({ id: `e-lotting-review`, source: 'lotting', target: 'review', type: 'smoothstep', style: commonEdgeStyle, animated: commonIsActive && currentStep >= 4 });


    return { nodes: allNodes, edges: allEdges };
  }, [selectedType, currentStep, wizardData]);

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
}

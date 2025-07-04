
// src/components/admin/wizard/WizardFlow.tsx
'use client';

import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls, Edge, Node } from 'reactflow';
import 'reactflow/dist/style.css';
import { useWizard } from './wizard-context';
import FlowStepNode, { type FlowNodeData } from './FlowStepNode';
import { Gavel, Users, Building, FileText, Scale, Package, Boxes, ListChecks, Rocket, DollarSign, Tv, CalendarX } from 'lucide-react';

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
    let nodeIdCounter = 1;
    const allNodes: Node<FlowNodeData>[] = [];
    const allEdges: Edge[] = [];
    const xGap = 280;
    const yGap = 180;

    // --- Start Node ---
    allNodes.push({
      id: 'start', type: 'customStep', position: { x: 0, y: 350 },
      data: {
        title: 'Início do Cadastro', status: 'done',
        icon: Rocket, pathType: 'COMMON', isActivePath: true, label: `#${nodeIdCounter++} - Ponto de Partida`
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
      const animatedEdge = isActivePath && currentStep > 0;
      
      const typeNodeStatus: 'done' | 'in_progress' | 'todo' = selectedType ? (selectedType === type ? 'done' : 'done') : 'in_progress';

      // --- Node 1: Type Selection ---
      allNodes.push({
        id: `type-${type}`, type: 'customStep', position: { x: xGap, y: yBase },
        data: {
          label: `#${nodeIdCounter++} - Modalidade`, title: type.replace(/_/g, ' '), status: typeNodeStatus,
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
          { id: 'processo', title: 'Processo Judicial', icon: FileText, isEntity: true, entityType: 'process' },
          { id: 'partes', title: 'Partes Envolvidas', icon: Users },
        ];

        let lastNodeId = `type-JUDICIAL`;
        judicialNodes.forEach((node, i) => {
          const nodeId = `judicial-${node.id}`;
          let nodeStatus: 'done' | 'in_progress' | 'todo' = 'todo';
          let entityId;

          if (wizardData.judicialProcess) {
             nodeStatus = 'done';
             if (node.isEntity) entityId = wizardData.judicialProcess.id;
          } else if (currentStep === 1) { 
             nodeStatus = 'in_progress';
          }

          allNodes.push({
            id: nodeId, type: 'customStep', position: { x: xGap * (2 + i), y: yBase },
            data: { 
              label: `#${nodeIdCounter++} - Dados do Processo`, 
              title: node.title, 
              status: nodeStatus, 
              icon: node.icon, 
              pathType: 'JUDICIAL', 
              isActivePath,
              isEntity: node.isEntity,
              entityType: node.entityType,
              entityId
            }
          });
          allEdges.push({ id: `e-${lastNodeId}-${nodeId}`, source: lastNodeId, target: nodeId, type: 'smoothstep', style: edgeStyle, animated: animatedEdge && currentStep === 1 });
          lastNodeId = nodeId;
        });

        const bensProcessoNodeId = 'judicial-bens';
        allNodes.push({
            id: bensProcessoNodeId, type: 'customStep', position: { x: xGap * (2 + judicialNodes.length), y: yBase},
            data: { label: `#${nodeIdCounter++} - Fonte de Itens`, title: 'Bens do Processo', status: wizardData.judicialProcess ? 'done' : 'todo', icon: Package, pathType: 'JUDICIAL', isActivePath }
        });
        allEdges.push({ id: `e-${lastNodeId}-${bensProcessoNodeId}`, source: lastNodeId, target: bensProcessoNodeId, type: 'smoothstep', style: edgeStyle, animated: animatedEdge && currentStep >=1 });

        // Connect Bens do Processo to Lotting
        allEdges.push({ id: `e-${bensProcessoNodeId}-lotting`, source: bensProcessoNodeId, target: 'lotting', type: 'smoothstep', style: edgeStyle, animated: animatedEdge && currentStep >= 3 });

      } else {
        allEdges.push({ id: `e-type-${type}-auction-details`, source: `type-${type}`, target: 'auction-details', type: 'smoothstep', style: edgeStyle, animated: animatedEdge && currentStep === 1 && wizardData.auctionType === type });
      }
    });
    
    // --- Common Path (Auction Details, Lotting, Review, and beyond) ---
    const commonYOffset = 1.5 * yGap;
    const commonIsActive = !!selectedType;
    const commonEdgeStyle = { stroke: selectedType ? pathColors[selectedType] : pathColors.COMMON, strokeWidth: commonIsActive ? 2.5 : 1.5 };
    
    const auctionDetailsX = xGap * 3;
    allNodes.push({
      id: 'auction-details', type: 'customStep', position: { x: auctionDetailsX, y: commonYOffset },
      data: {
        label: `#${nodeIdCounter++} - Passo 2`, title: 'Dados do Leilão', status: wizardData.auctionDetails?.title ? 'done' : (currentStep >= 1 && currentStep <= 2) ? 'in_progress' : 'todo',
        icon: Gavel, pathType: selectedType || 'COMMON', isActivePath: commonIsActive
      }
    });

    allNodes.push({
      id: 'seller-entity', type: 'customStep', position: { x: auctionDetailsX, y: commonYOffset - yGap/2 },
      data: { 
        label: 'Entidade', title: 'Comitente', status: wizardData.auctionDetails?.seller ? 'done' : 'todo', icon: Users, pathType: selectedType || 'COMMON', isActivePath: commonIsActive,
        isEntity: true, entityId: wizardData.auctionDetails?.sellerId, entityType: 'seller'
      }
    });
    allEdges.push({ id: 'e-auction-seller', source: 'auction-details', target: 'seller-entity', type: 'smoothstep', style: commonEdgeStyle });

    allNodes.push({
      id: 'auctioneer-entity', type: 'customStep', position: { x: auctionDetailsX, y: commonYOffset + yGap/2 },
      data: { 
        label: 'Entidade', title: 'Leiloeiro', status: wizardData.auctionDetails?.auctioneer ? 'done' : 'todo', icon: Gavel, pathType: selectedType || 'COMMON', isActivePath: commonIsActive,
        isEntity: true, entityId: wizardData.auctionDetails?.auctioneerId, entityType: 'auctioneer'
      }
    });
    allEdges.push({ id: 'e-auction-auctioneer', source: 'auction-details', target: 'auctioneer-entity', type: 'smoothstep', style: commonEdgeStyle });

    const genericBensNodeId = 'generic-bens';
    allNodes.push({
      id: genericBensNodeId, type: 'customStep', position: { x: auctionDetailsX + xGap, y: commonYOffset + yGap },
      data: {
        label: `#${nodeIdCounter++} - Fonte de Itens`, title: 'Bens Disponíveis', status: wizardData.auctionDetails?.title ? 'done' : 'todo',
        icon: Package, pathType: 'EXTRAJUDICIAL', isActivePath: selectedType !== 'JUDICIAL'
      }
    });
    allEdges.push({ id: `e-auction-generic-bens`, source: 'auction-details', target: genericBensNodeId, type: 'smoothstep', style: { stroke: pathColors.EXTRAJUDICIAL }, animated: commonIsActive && wizardData.auctionType !== 'JUDICIAL' });
    allEdges.push({ id: `e-generic-bens-lotting`, source: genericBensNodeId, target: 'lotting', type: 'smoothstep', style: { stroke: pathColors.EXTRAJUDICIAL }, animated: commonIsActive && wizardData.auctionType !== 'JUDICIAL' && currentStep >= 3 });

    const lottingX = auctionDetailsX + xGap * 2;
    allNodes.push({
      id: 'lotting', type: 'customStep', position: { x: lottingX, y: commonYOffset },
      data: {
        label: `#${nodeIdCounter++} - Passo 3`, title: 'Criação de Lotes', status: wizardData.createdLots && wizardData.createdLots.length > 0 ? 'done' : currentStep === 3 ? 'in_progress' : 'todo',
        icon: Boxes, pathType: selectedType || 'COMMON', isActivePath: commonIsActive
      }
    });
    allEdges.push({ id: `e-auction-details-lotting`, source: 'auction-details', target: 'lotting', type: 'straight', style: { strokeDasharray: 5, stroke: pathColors.COMMON, strokeWidth: 1 } });
    
    const reviewX = lottingX + xGap;
    allNodes.push({
      id: 'review', type: 'customStep', position: { x: reviewX, y: commonYOffset },
      data: {
        label: `#${nodeIdCounter++} - Passo Final`, title: 'Revisão e Publicação', status: currentStep === 4 ? 'in_progress' : 'todo',
        icon: ListChecks, pathType: selectedType || 'COMMON', isActivePath: commonIsActive
      }
    });
    allEdges.push({ id: `e-lotting-review`, source: 'lotting', target: 'review', type: 'smoothstep', style: commonEdgeStyle, animated: commonIsActive && currentStep >= 3 });
    
    // --- Post-Creation Lifecycle Nodes ---
    const postCreationX1 = reviewX + xGap;
    
    const postNodesLine1 = [
        { id: 'leilao-aberto', title: 'Leilão Ativo (Aberto para Lances)', icon: Gavel },
        { id: 'pregao-auditorio', title: 'Pregão no Auditório', icon: Tv },
    ];
    
    const postNodesLine2 = [
        { id: 'pagamento-docs', title: 'Pagamento e Documentos', icon: FileText },
        { id: 'comunicacao-arrematante', title: 'Comunicação c/ Arrematante', icon: Users },
        { id: 'encerramento', title: 'Encerramento', icon: CalendarX },
    ];

    let lastPostNodeId = 'review';
    postNodesLine1.forEach((node, i) => {
        const nodeId = `post-${node.id}`;
        allNodes.push({
            id: nodeId, type: 'customStep', position: {x: postCreationX1 + (xGap * i), y: commonYOffset},
            data: { label: `#${nodeIdCounter++} - Pós-Leilão`, title: node.title, status: 'todo', icon: node.icon, pathType: selectedType || 'COMMON', isActivePath: commonIsActive }
        });
        allEdges.push({ id: `e-${lastPostNodeId}-${nodeId}`, source: lastPostNodeId, target: nodeId, type: 'smoothstep', style: commonEdgeStyle, animated: false });
        lastPostNodeId = nodeId;
    });

    let lastPostNodeIdLine2 = 'post-pregao-auditorio';
    postNodesLine2.forEach((node, i) => {
        const nodeId = `post-${node.id}`;
        allNodes.push({
            id: nodeId, type: 'customStep', position: {x: reviewX + (xGap * i), y: commonYOffset + yGap},
            data: { label: `#${nodeIdCounter++} - Pós-Leilão`, title: node.title, status: 'todo', icon: node.icon, pathType: selectedType || 'COMMON', isActivePath: commonIsActive }
        });
        allEdges.push({ id: `e-${lastPostNodeIdLine2}-${nodeId}`, source: lastPostNodeIdLine2, target: nodeId, type: 'smoothstep', style: commonEdgeStyle, animated: false });
        lastPostNodeIdLine2 = nodeId;
    });

    const financeNodeId = 'fluxo-financeiro';
    allNodes.push({
        id: financeNodeId, type: 'customStep', position: {x: reviewX + (xGap * (postNodesLine2.length - 1)), y: commonYOffset + yGap * 2},
        data: { label: `#${nodeIdCounter++} - Financeiro`, title: 'Fluxo Financeiro', status: 'todo', icon: DollarSign, pathType: selectedType || 'COMMON', isActivePath: commonIsActive }
    });
    allEdges.push({ id: 'e-encerramento-financeiro', source: 'post-encerramento', target: financeNodeId, type: 'smoothstep', style: commonEdgeStyle, animated: false });


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

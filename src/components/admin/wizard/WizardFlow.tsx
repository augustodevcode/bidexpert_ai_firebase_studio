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
    const yGap = 160;

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
      
      const typeNodeStatus: 'done' | 'in_progress' | 'todo' = selectedType ? 'done' : 'in_progress';

      // --- Node 1: Type Selection ---
      allNodes.push({
        id: `type-${type}`, type: 'customStep', position: { x: xGap, y: yBase },
        data: {
          label: `#${nodeIdCounter++} - Modalidade`, title: type.replace(/_/g, ' '), status: typeNodeStatus,
          pathType: type, isActivePath
        }
      });
      allEdges.push({ id: `e-start-${type}`, source: 'start', target: `type-${type}`, type: 'smoothstep', style: edgeStyle, animated: animatedEdge && currentStep >= 0 });
    });

    // --- Judicial Path Specifics ---
    const judicialPathIsActive = !selectedType || selectedType === 'JUDICIAL';
    const judicialInputs = [
      { id: 'tribunal', title: 'Tribunal', icon: Scale },
      { id: 'comarca', title: 'Comarca', icon: Building },
      { id: 'vara', title: 'Vara', icon: Gavel },
    ];
    
    judicialInputs.forEach((node, i) => {
      allNodes.push({
        id: `judicial-input-${node.id}`,
        type: 'customStep',
        position: { x: xGap * 2, y: yGap * i },
        data: {
          label: `#${nodeIdCounter++} - Atributo`, title: node.title, status: wizardData.judicialProcess ? 'done' : 'todo', icon: node.icon,
          pathType: 'JUDICIAL', isActivePath: judicialPathIsActive
        }
      });
      allEdges.push({ id: `e-input-${node.id}-processo`, source: `judicial-input-${node.id}`, target: 'judicial-processo', type: 'smoothstep', style: { stroke: pathColors.JUDICIAL }, animated: judicialPathIsActive && currentStep === 1 });
    });
    
    allNodes.push({
        id: 'judicial-processo',
        type: 'customStep',
        position: { x: xGap * 3, y: yGap },
        data: {
          label: `#${nodeIdCounter++} - Dados do Processo`, title: 'Processo Judicial', icon: FileText,
          status: wizardData.judicialProcess ? 'done' : (currentStep === 1 && selectedType === 'JUDICIAL' ? 'in_progress' : 'todo'),
          pathType: 'JUDICIAL', isActivePath: judicialPathIsActive,
          isEntity: true, entityType: 'process', entityId: wizardData.judicialProcess?.id
        }
    });
    allEdges.push({ id: `e-type-JUDICIAL-processo`, source: `type-JUDICIAL`, target: 'judicial-processo', type: 'smoothstep', style: { stroke: pathColors.JUDICIAL }, animated: judicialPathIsActive && currentStep === 1 });
    

    // --- Entities as Inputs for Auction ---
    const sellerId = wizardData.auctionDetails?.sellerId;
    const auctioneerId = wizardData.auctionDetails?.auctioneerId;

    allNodes.push({
        id: 'entity-comitente', type: 'customStep', position: { x: xGap * 3, y: 3.25 * yGap },
        data: { label: '#10 - Entidade', title: 'Comitente', icon: Users, status: sellerId ? 'done' : 'todo', pathType: 'COMMON', isActivePath: !!selectedType, isEntity: true, entityId: sellerId, entityType: 'seller'}
    });
    allNodes.push({
        id: 'entity-leiloeiro', type: 'customStep', position: { x: xGap * 3, y: 4.25 * yGap },
        data: { label: '#11 - Entidade', title: 'Leiloeiro', icon: Gavel, status: auctioneerId ? 'done' : 'todo', pathType: 'COMMON', isActivePath: !!selectedType, isEntity: true, entityId: auctioneerId, entityType: 'auctioneer' }
    });

    // --- Common Path Nodes ---
    const commonYOffset = 2.5 * yGap;
    const commonIsActive = !!selectedType;
    const commonEdgeStyle = { stroke: selectedType ? pathColors[selectedType] : pathColors.COMMON, strokeWidth: commonIsActive ? 2.5 : 1.5 };
    
    const auctionDetailsNodeId = 'auction-details';
    allNodes.push({
      id: auctionDetailsNodeId, type: 'customStep', position: { x: xGap * 4, y: commonYOffset },
      data: {
        label: `#12 - Passo 2`, title: 'Dados do Leilão', status: wizardData.auctionDetails?.title ? 'done' : (currentStep >= 1 && currentStep <= 2) ? 'in_progress' : 'todo',
        icon: Gavel, pathType: selectedType || 'COMMON', isActivePath: commonIsActive
      }
    });

    // Connect inputs to common path
    allEdges.push({ id: `e-processo-auction`, source: 'judicial-processo', target: auctionDetailsNodeId, type: 'smoothstep', style: { stroke: pathColors.JUDICIAL }, animated: judicialPathIsActive && currentStep >= 2 });
    allEdges.push({ id: `e-type-EXTRAJUDICIAL-auction`, source: 'type-EXTRAJUDICIAL', target: auctionDetailsNodeId, type: 'smoothstep', style: { stroke: pathColors.EXTRAJUDICIAL }, animated: selectedType === 'EXTRAJUDICIAL' && currentStep >= 1 });
    allEdges.push({ id: `e-type-PARTICULAR-auction`, source: 'type-PARTICULAR', target: auctionDetailsNodeId, type: 'smoothstep', style: { stroke: pathColors.PARTICULAR }, animated: selectedType === 'PARTICULAR' && currentStep >= 1 });
    allEdges.push({ id: `e-type-TOMADA_DE_PRECOS-auction`, source: 'type-TOMADA_DE_PRECOS', target: auctionDetailsNodeId, type: 'smoothstep', style: { stroke: pathColors.TOMADA_DE_PRECOS }, animated: selectedType === 'TOMADA_DE_PRECOS' && currentStep >= 1 });
    
    // Connect entity inputs
    allEdges.push({ id: `e-seller-auction`, source: 'entity-comitente', target: auctionDetailsNodeId, type: 'smoothstep', style: { stroke: pathColors.COMMON, strokeWidth: 1.5 }, animated: commonIsActive && currentStep >=2 });
    allEdges.push({ id: `e-auctioneer-auction`, source: 'entity-leiloeiro', target: auctionDetailsNodeId, type: 'smoothstep', style: { stroke: pathColors.COMMON, strokeWidth: 1.5 }, animated: commonIsActive && currentStep >=2 });

    const bensDisponiveisNodeId = 'bens-disponiveis';
    allNodes.push({
      id: bensDisponiveisNodeId, type: 'customStep', position: { x: xGap * 5, y: commonYOffset + yGap },
      data: {
        label: '#13 - Fonte de Itens', title: 'Bens Disponíveis', status: wizardData.auctionDetails?.title ? 'done' : 'todo',
        icon: Package, pathType: selectedType || 'COMMON', isActivePath: commonIsActive
      }
    });
    allEdges.push({ id: `e-auction-bens`, source: auctionDetailsNodeId, target: bensDisponiveisNodeId, type: 'smoothstep', style: commonEdgeStyle, animated: commonIsActive && currentStep >= 2 });

    const lottingNodeId = 'lotting';
    allNodes.push({
      id: lottingNodeId, type: 'customStep', position: { x: xGap * 6, y: commonYOffset },
      data: {
        label: '#14 - Passo 3', title: 'Criação de Lotes', status: wizardData.createdLots && wizardData.createdLots.length > 0 ? 'done' : currentStep === 3 ? 'in_progress' : 'todo',
        icon: Boxes, pathType: selectedType || 'COMMON', isActivePath: commonIsActive
      }
    });
    allEdges.push({ id: `e-bens-lotting`, source: bensDisponiveisNodeId, target: lottingNodeId, type: 'smoothstep', style: commonEdgeStyle, animated: commonIsActive && currentStep >= 3 });
    
    const reviewNodeId = 'review';
    allNodes.push({
      id: reviewNodeId, type: 'customStep', position: { x: xGap * 7, y: commonYOffset },
      data: {
        label: '#15 - Passo Final', title: 'Revisão e Publicação', status: currentStep === 4 ? 'in_progress' : 'todo',
        icon: ListChecks, pathType: selectedType || 'COMMON', isActivePath: commonIsActive
      }
    });
    allEdges.push({ id: `e-lotting-review`, source: lottingNodeId, target: reviewNodeId, type: 'smoothstep', style: commonEdgeStyle, animated: commonIsActive && currentStep >= 3 });
    
    // --- Post-Creation Lifecycle Nodes ---
    const postCreationX1 = reviewNodeId + xGap;
    
    allNodes.push({ id: 'leilao-ativo', type: 'customStep', position: {x: xGap * 8, y: commonYOffset},
      data: { label: '#16 - Pregão', title: 'Leilão Ativo (Aberto para Lances)', status: 'todo', icon: Gavel, pathType: selectedType || 'COMMON', isActivePath: commonIsActive }
    });
    allEdges.push({ id: 'e-review-ativo', source: reviewNodeId, target: 'leilao-ativo', type: 'smoothstep', style: commonEdgeStyle, animated: false });
    
    allNodes.push({ id: 'pregao-auditorio', type: 'customStep', position: {x: xGap * 9, y: commonYOffset},
        data: { label: '#17 - Pregão', title: 'Pregão no Auditório', status: 'todo', icon: Tv, pathType: selectedType || 'COMMON', isActivePath: commonIsActive }
    });
    allEdges.push({ id: 'e-ativo-pregao', source: 'leilao-ativo', target: 'pregao-auditorio', type: 'smoothstep', style: commonEdgeStyle, animated: false });

    // --- Line 2 of Post-Creation ---
    const postYLine2 = commonYOffset + yGap * 1.25;
    allNodes.push({ id: 'comunicacao-arrematante', type: 'customStep', position: { x: xGap * 8, y: postYLine2 },
        data: { label: '#18 - Pós-Leilão', title: 'Comunicação c/ Arrematante', status: 'todo', icon: Users, pathType: selectedType || 'COMMON', isActivePath: commonIsActive }
    });
    allEdges.push({ id: 'e-pregao-comunicacao', source: 'pregao-auditorio', target: 'comunicacao-arrematante', type: 'smoothstep', style: commonEdgeStyle, animated: false });

    allNodes.push({ id: 'pagamento-docs', type: 'customStep', position: { x: xGap * 9, y: postYLine2 },
        data: { label: '#19 - Pós-Leilão', title: 'Pagamento e Documentos', status: 'todo', icon: FileText, pathType: selectedType || 'COMMON', isActivePath: commonIsActive }
    });
    allEdges.push({ id: 'e-comunicacao-pagamento', source: 'comunicacao-arrematante', target: 'pagamento-docs', type: 'smoothstep', style: commonEdgeStyle, animated: false });
    
    allNodes.push({ id: 'encerramento', type: 'customStep', position: { x: xGap * 10, y: postYLine2 },
        data: { label: '#20 - Pós-Leilão', title: 'Encerramento', status: 'todo', icon: CalendarX, pathType: selectedType || 'COMMON', isActivePath: commonIsActive }
    });
    allEdges.push({ id: 'e-pagamento-encerramento', source: 'pagamento-docs', target: 'encerramento', type: 'smoothstep', style: commonEdgeStyle, animated: false });

    allNodes.push({ id: 'fluxo-financeiro', type: 'customStep', position: {x: xGap * 11, y: postYLine2},
        data: { label: '#21 - Financeiro', title: 'Fluxo Financeiro', status: 'todo', icon: DollarSign, pathType: selectedType || 'COMMON', isActivePath: commonIsActive }
    });
    allEdges.push({ id: 'e-encerramento-financeiro', source: 'encerramento', target: 'fluxo-financeiro', type: 'smoothstep', style: commonEdgeStyle, animated: false });

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

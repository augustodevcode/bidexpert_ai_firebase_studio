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
    const xGap = 260; // Reduced for compactness
    const yGap = 110; // Reduced for compactness

    // Define common styles and statuses to avoid repetition and fix bugs
    const commonIsActive = !!selectedType;
    const commonEdgeStyle = { stroke: pathColors.COMMON };
    const judicialPathIsActive = !selectedType || selectedType === 'JUDICIAL';
    const judicialEdgeStyle = { stroke: pathColors.JUDICIAL, strokeWidth: judicialPathIsActive ? 2.5 : 1.5 };
    
    // --- Vertical positions ---
    const judicialPathY = 1.5 * yGap;
    const otherPathsYBase = 4.5 * yGap;
    const convergenceY = (judicialPathY + otherPathsYBase) / 2;

    // --- Start Node ---
    allNodes.push({
      id: 'start', type: 'customStep', position: { x: 0, y: convergenceY },
      data: {
        title: 'Início do Cadastro', status: 'done',
        icon: Rocket, pathType: 'COMMON', isActivePath: true, label: `#${nodeIdCounter++} - Ponto de Partida`
      },
    });

    // --- Type Selection Nodes ---
    const auctionTypes = ['JUDICIAL', 'EXTRAJUDICIAL', 'PARTICULAR', 'TOMADA_DE_PRECOS'] as const;
    auctionTypes.forEach((type, index) => {
      const yPos = (type === 'JUDICIAL') ? judicialPathY : otherPathsYBase + (index - 1) * 1.5 * yGap;
      const isActivePath = !selectedType || selectedType === type;
      allNodes.push({
        id: `type-${type}`, type: 'customStep', position: { x: xGap, y: yPos },
        data: {
          label: `#${nodeIdCounter++} - Modalidade`, title: type.replace(/_/g, ' '), status: selectedType ? 'done' : 'in_progress',
          pathType: type, isActivePath
        }
      });
      allEdges.push({ id: `e-start-${type}`, source: 'start', target: `type-${type}`, type: 'smoothstep', style: { stroke: pathColors[type], strokeWidth: isActivePath ? 2.5 : 1.5 }, animated: isActivePath && currentStep >= 0 });
    });

    // --- JUDICIAL PRE-REQUISITES (Clustered Vertically) ---
    const judicialInputs = [
        { id: 'tribunal', title: 'Tribunal', icon: Scale, position: { x: xGap * 2.5, y: judicialPathY - yGap * 1.2 } },
        { id: 'comarca', title: 'Comarca', icon: Building, position: { x: xGap * 2.5, y: judicialPathY - yGap * 0.6 } },
        { id: 'vara', title: 'Vara', icon: Gavel, position: { x: xGap * 2.5, y: judicialPathY + yGap * 0.6 } },
        { id: 'partes', title: 'Partes Envolvidas', icon: Users, position: { x: xGap * 2.5, y: judicialPathY + yGap * 1.2 } }
    ];
    judicialInputs.forEach(node => {
        allNodes.push({
            id: `judicial-input-${node.id}`, type: 'customStep', position: node.position,
            data: { label: `Input Judicial`, title: node.title, status: wizardData.judicialProcess ? 'done' : 'todo', icon: node.icon, pathType: 'JUDICIAL', isActivePath: judicialPathIsActive }
        });
    });
    
    // --- JUDICIAL PROCESS NODE ---
    const judicialProcessNodeId = 'judicial-processo';
    allNodes.push({
        id: judicialProcessNodeId, type: 'customStep', position: { x: xGap * 4, y: judicialPathY },
        data: {
            label: '#9 - Passo 1 (Judicial)', title: 'Processo Judicial', icon: FileText,
            status: wizardData.judicialProcess ? 'done' : (currentStep === 1 && selectedType === 'JUDICIAL' ? 'in_progress' : 'todo'),
            pathType: 'JUDICIAL', isActivePath: judicialPathIsActive, isEntity: true, entityType: 'process', entityId: wizardData.judicialProcess?.id
        }
    });

    allEdges.push({ id: `e-type-JUDICIAL-processo`, source: 'type-JUDICIAL', target: judicialProcessNodeId, type: 'smoothstep', style: judicialEdgeStyle, animated: judicialPathIsActive && currentStep >= 1 });
    judicialInputs.forEach(node => {
        allEdges.push({ id: `e-input-${node.id}-processo`, source: `judicial-input-${node.id}`, target: judicialProcessNodeId, type: 'smoothstep', style: judicialEdgeStyle });
    });
    
    // --- AUCTION ENTITY PRE-REQUISITES (for non-judicial paths) ---
    const sellerId = wizardData.auctionDetails?.sellerId;
    const auctioneerId = wizardData.auctionDetails?.auctioneerId;
    allNodes.push({ id: 'entity-comitente', type: 'customStep', position: { x: xGap * 2.5, y: otherPathsYBase - yGap * 0.6 }, data: { label: '#10 - Entidade', title: 'Comitente', icon: Users, status: sellerId ? 'done' : 'todo', pathType: 'COMMON', isActivePath: !!selectedType, isEntity: true, entityId: sellerId, entityType: 'seller'} });
    allNodes.push({ id: 'entity-leiloeiro', type: 'customStep', position: { x: xGap * 2.5, y: otherPathsYBase + yGap * 0.6 }, data: { label: '#11 - Entidade', title: 'Leiloeiro', icon: Gavel, status: auctioneerId ? 'done' : 'todo', pathType: 'COMMON', isActivePath: !!selectedType, isEntity: true, entityId: auctioneerId, entityType: 'auctioneer' } });

    // --- AUCTION DETAILS NODE ---
    const auctionDetailsNodeId = 'auction-details';
    allNodes.push({
      id: auctionDetailsNodeId, type: 'customStep', position: { x: xGap * 4, y: otherPathsYBase },
      data: {
        label: `#12 - Passo 2`, title: 'Dados do Leilão',
        status: wizardData.auctionDetails?.title ? 'done' : ((currentStep === 1 && selectedType !== 'JUDICIAL') || currentStep === 2 ? 'in_progress' : 'todo'),
        icon: Gavel, pathType: selectedType || 'COMMON', isActivePath: !!selectedType
      }
    });
    
    // Edges from types and entities to auction details
    ['EXTRAJUDICIAL', 'PARTICULAR', 'TOMADA_DE_PRECOS'].forEach(type => {
        allEdges.push({ id: `e-type-${type}-auction`, source: `type-${type}`, target: 'entity-comitente', type: 'smoothstep', style: { stroke: pathColors[type as keyof typeof pathColors], strokeWidth: selectedType === type ? 2.5 : 1.5 }, animated: selectedType === type });
    });
    allEdges.push({ id: `e-entity-comitente-auction`, source: 'entity-comitente', target: auctionDetailsNodeId, type: 'smoothstep', style: commonEdgeStyle });
    allEdges.push({ id: `e-entity-leiloeiro-auction`, source: 'entity-leiloeiro', target: auctionDetailsNodeId, type: 'smoothstep', style: commonEdgeStyle });

    // --- CONVERGENCE POINT (Bens) ---
    const bensNodeId = 'bens-disponiveis';
    allNodes.push({
        id: bensNodeId, type: 'customStep', position: { x: xGap * 5.5, y: convergenceY },
        data: {
            label: `Fonte de Itens`, title: 'Bens para Loteamento', icon: Package, status: wizardData.createdLots && wizardData.createdLots.length > 0 ? 'done' : 'todo', pathType: selectedType || 'COMMON', isActivePath: !!selectedType
        }
    });

    allEdges.push({ id: 'e-processo-bens', source: judicialProcessNodeId, target: bensNodeId, type: 'smoothstep', style: judicialEdgeStyle, animated: judicialPathIsActive && currentStep >= 2 });
    allEdges.push({ id: 'e-auction-bens', source: auctionDetailsNodeId, target: bensNodeId, type: 'smoothstep', style: commonEdgeStyle, animated: !!selectedType && selectedType !== 'JUDICIAL' && currentStep >= 2 });

    // --- LOTTING NODE ---
    const lottingNodeId = 'lotting';
    allNodes.push({
      id: lottingNodeId, type: 'customStep', position: { x: xGap * 7, y: convergenceY },
      data: {
        label: '#14 - Passo 3', title: 'Criação de Lotes', status: wizardData.createdLots && wizardData.createdLots.length > 0 ? 'done' : currentStep === 3 ? 'in_progress' : 'todo',
        icon: Boxes, pathType: selectedType || 'COMMON', isActivePath: !!selectedType
      }
    });
    allEdges.push({ id: `e-bens-lotting`, source: bensNodeId, target: lottingNodeId, type: 'smoothstep', style: commonEdgeStyle, animated: !!selectedType && currentStep >= 3 });
   
    // --- REVIEW NODE ---
    const reviewNodeId = 'review';
    allNodes.push({
      id: reviewNodeId, type: 'customStep', position: { x: xGap * 8.5, y: convergenceY },
      data: {
        label: '#15 - Passo Final', title: 'Revisão e Publicação', status: currentStep === 4 ? 'in_progress' : 'todo',
        icon: ListChecks, pathType: selectedType || 'COMMON', isActivePath: !!selectedType
      }
    });
    allEdges.push({ id: `e-lotting-review`, source: lottingNodeId, target: reviewNodeId, type: 'smoothstep', style: { stroke: selectedType ? pathColors[selectedType] : pathColors.COMMON }, animated: !!selectedType && currentStep >= 3 });

    // --- Post-Creation Lifecycle Nodes ---
    const postXBase = xGap * 10;
    const postYLine1 = convergenceY - yGap;
    const postYLine2 = convergenceY + yGap;
    
    allNodes.push({ id: 'leilao-ativo', type: 'customStep', position: {x: postXBase, y: postYLine1}, data: { label: '#16 - Pregão', title: 'Leilão Ativo (Lances)', status: 'todo', icon: Gavel, pathType: 'COMMON', isActivePath: commonIsActive }});
    allEdges.push({ id: 'e-review-ativo', source: reviewNodeId, target: 'leilao-ativo', type: 'smoothstep', style: commonEdgeStyle });
    
    allNodes.push({ id: 'pregao-auditorio', type: 'customStep', position: {x: postXBase + xGap, y: postYLine1}, data: { label: '#17 - Pregão', title: 'Pregão no Auditório', status: 'todo', icon: Tv, pathType: 'COMMON', isActivePath: commonIsActive }});
    allEdges.push({ id: 'e-ativo-pregao', source: 'leilao-ativo', target: 'pregao-auditorio', type: 'smoothstep', style: commonEdgeStyle });

    allNodes.push({ id: 'comunicacao-arrematante', type: 'customStep', position: { x: postXBase, y: postYLine2 }, data: { label: '#18 - Pós-Leilão', title: 'Comunicação c/ Arrematante', status: 'todo', icon: Users, pathType: 'COMMON', isActivePath: commonIsActive }});
    allEdges.push({ id: 'e-pregao-comunicacao', source: 'pregao-auditorio', target: 'comunicacao-arrematante', type: 'smoothstep', style: commonEdgeStyle });

    allNodes.push({ id: 'pagamento-docs', type: 'customStep', position: { x: postXBase + xGap, y: postYLine2 }, data: { label: '#19 - Pós-Leilão', title: 'Pagamento e Documentos', status: 'todo', icon: FileText, pathType: 'COMMON', isActivePath: commonIsActive }});
    allEdges.push({ id: 'e-comunicacao-pagamento', source: 'comunicacao-arrematante', target: 'pagamento-docs', type: 'smoothstep', style: commonEdgeStyle });
    
    allNodes.push({ id: 'encerramento', type: 'customStep', position: { x: postXBase + xGap * 2, y: postYLine2 }, data: { label: '#20 - Pós-Leilão', title: 'Encerramento', status: 'todo', icon: CalendarX, pathType: 'COMMON', isActivePath: commonIsActive }});
    allEdges.push({ id: 'e-pagamento-encerramento', source: 'pagamento-docs', target: 'encerramento', type: 'smoothstep', style: commonEdgeStyle });

    allNodes.push({ id: 'fluxo-financeiro', type: 'customStep', position: {x: postXBase + xGap * 3, y: postYLine2}, data: { label: '#21 - Financeiro', title: 'Fluxo Financeiro', status: 'todo', icon: DollarSign, pathType: 'COMMON', isActivePath: commonIsActive }});
    allEdges.push({ id: 'e-encerramento-financeiro', source: 'encerramento', target: 'fluxo-financeiro', type: 'smoothstep', style: commonEdgeStyle });

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


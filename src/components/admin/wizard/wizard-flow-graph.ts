/**
 * @fileoverview Funções puras para montar o grafo visual do wizard sem depender do runtime do React Flow.
 */

import type { Edge, Node } from 'reactflow';
import {
  BrainCircuit,
  Boxes,
  Building,
  CalendarX,
  CheckSquare,
  DollarSign,
  FileText,
  Gavel,
  ListChecks,
  Package,
  Rocket,
  Scale,
  ShoppingCart,
  Tv,
  Users,
  type LucideIcon,
} from 'lucide-react';

import type { FlowNodeData } from './FlowStepNode';
import type { WizardData } from './wizard-context';

export type WizardFlowPathType = NonNullable<WizardData['auctionType']> | 'COMMON';

type StepStatus = FlowNodeData['status'];

type AuctionTypeDefinition = {
  type: NonNullable<WizardData['auctionType']>;
  title: string;
  icon: LucideIcon;
  position: { x: number; y: number };
};

export const wizardFlowColors: Record<WizardFlowPathType, string> = {
  JUDICIAL: '#3b82f6',
  EXTRAJUDICIAL: '#22c55e',
  PARTICULAR: '#f97316',
  TOMADA_DE_PRECOS: '#8b5cf6',
  VENDA_DIRETA: '#e11d48',
  COMMON: '#64748b',
};

const auctionTypeDefinitions: AuctionTypeDefinition[] = [
  { type: 'JUDICIAL', title: 'Leilão Judicial', icon: Scale, position: { x: 260, y: 0 } },
  { type: 'EXTRAJUDICIAL', title: 'Leilão Extrajudicial', icon: Gavel, position: { x: 260, y: 150 } },
  { type: 'PARTICULAR', title: 'Leilão Particular', icon: Users, position: { x: 260, y: 300 } },
  { type: 'TOMADA_DE_PRECOS', title: 'Tomada de Preços', icon: Building, position: { x: 260, y: 450 } },
  { type: 'VENDA_DIRETA', title: 'Venda Direta', icon: ShoppingCart, position: { x: 260, y: 600 } },
];

function getStepStatus(done: boolean, active: boolean): StepStatus {
  if (done) return 'done';
  return active ? 'in_progress' : 'todo';
}

function getEdgeStyle(pathType: WizardFlowPathType, isActivePath: boolean) {
  return {
    stroke: wizardFlowColors[pathType],
    strokeWidth: isActivePath ? 2.4 : 1.4,
    opacity: isActivePath ? 1 : 0.45,
  };
}

export function buildWizardFlowGraph(wizardData: WizardData, currentStep: number) {
  const selectedType = wizardData.auctionType;
  const judicialProcess = wizardData.judicialProcess;
  const auctionDetails = wizardData.auctionDetails;
  const createdLots = wizardData.createdLots ?? [];

  const judicialIsActive = !selectedType || selectedType === 'JUDICIAL';
  const commonIsActive = Boolean(selectedType);
  const auctionStepIndex = selectedType === 'JUDICIAL' ? 2 : 1;
  const lottingStepIndex = selectedType === 'JUDICIAL' ? 3 : 2;
  const reviewStepIndex = selectedType === 'JUDICIAL' ? 4 : 3;

  const processLinked = Boolean(judicialProcess?.id);
  const sellerReady = Boolean(auctionDetails?.sellerId);
  const auctioneerReady = Boolean(auctionDetails?.auctioneerId);
  const auctionReady = Boolean(auctionDetails?.title && sellerReady && auctioneerReady);
  const lotsReady = createdLots.length > 0;

  const nodes: Node<FlowNodeData>[] = [
    {
      id: 'start',
      type: 'customStep',
      position: { x: 0, y: 280 },
      data: {
        label: '#1 - Início',
        title: 'Assistente iniciado',
        status: 'done',
        icon: Rocket,
        pathType: 'COMMON',
        isActivePath: true,
      },
    },
  ];

  const edges: Edge[] = [];

  for (const definition of auctionTypeDefinitions) {
    const isActivePath = !selectedType || selectedType === definition.type;
    const isSelected = selectedType === definition.type;

    nodes.push({
      id: `type-${definition.type}`,
      type: 'customStep',
      position: definition.position,
      data: {
        label: 'Passo 1',
        title: definition.title,
        status: getStepStatus(isSelected, currentStep === 0 || !selectedType),
        icon: definition.icon,
        pathType: definition.type,
        isActivePath,
      },
    });

    edges.push({
      id: `edge-start-${definition.type}`,
      source: 'start',
      target: `type-${definition.type}`,
      type: 'smoothstep',
      animated: isActivePath,
      style: getEdgeStyle(definition.type, isActivePath),
    });
  }

  if (judicialIsActive) {
    const judicialPathType: WizardFlowPathType = 'JUDICIAL';
    const judicialNodes = [
      { id: 'judicial-court', title: 'Tribunal', icon: Scale, position: { x: 620, y: 0 } },
      { id: 'judicial-district', title: 'Comarca', icon: Building, position: { x: 620, y: 150 } },
      { id: 'judicial-branch', title: 'Vara', icon: Gavel, position: { x: 620, y: 300 } },
      { id: 'judicial-parties', title: 'Partes envolvidas', icon: Users, position: { x: 620, y: 450 } },
    ];

    for (const node of judicialNodes) {
      nodes.push({
        id: node.id,
        type: 'customStep',
        position: node.position,
        data: {
          label: 'Base Judicial',
          title: node.title,
          status: getStepStatus(processLinked, currentStep >= 1),
          icon: node.icon,
          pathType: judicialPathType,
          isActivePath: judicialIsActive,
        },
      });

      edges.push({
        id: `edge-type-judicial-${node.id}`,
        source: 'type-JUDICIAL',
        target: node.id,
        type: 'smoothstep',
        animated: judicialIsActive,
        style: getEdgeStyle(judicialPathType, judicialIsActive),
      });
    }

    nodes.push({
      id: 'judicial-process',
      type: 'customStep',
      position: { x: 980, y: 225 },
      data: {
        label: 'Passo 2',
        title: judicialProcess?.processNumber ? `Proc. ${judicialProcess.processNumber}` : 'Processo Judicial',
        status: getStepStatus(processLinked, currentStep >= 1),
        icon: FileText,
        pathType: judicialPathType,
        isActivePath: judicialIsActive,
        isEntity: true,
        entityType: 'process',
        entityId: judicialProcess?.id,
      },
    });

    for (const node of judicialNodes) {
      edges.push({
        id: `edge-${node.id}-process`,
        source: node.id,
        target: 'judicial-process',
        type: 'smoothstep',
        animated: judicialIsActive && currentStep >= 1,
        style: getEdgeStyle(judicialPathType, judicialIsActive),
      });
    }

    const aiNodes = [
      { id: 'ai-docs', title: 'Cadastro de documentos', icon: FileText, position: { x: 1280, y: 0 } },
      { id: 'ai-analysis', title: 'Análise BidExpert.AI', icon: BrainCircuit, position: { x: 1280, y: 150 } },
      { id: 'ai-validation', title: 'Validação de dados', icon: CheckSquare, position: { x: 1280, y: 300 } },
    ];

    for (const node of aiNodes) {
      nodes.push({
        id: node.id,
        type: 'customStep',
        position: node.position,
        data: {
          label: 'Fluxo IA',
          title: node.title,
          status: getStepStatus(false, processLinked),
          icon: node.icon,
          pathType: judicialPathType,
          isActivePath: judicialIsActive,
        },
      });

      edges.push({
        id: `edge-process-${node.id}`,
        source: 'judicial-process',
        target: node.id,
        type: 'smoothstep',
        animated: judicialIsActive && processLinked,
        style: getEdgeStyle(judicialPathType, judicialIsActive),
      });
    }
  }

  const selectedPathType: WizardFlowPathType = selectedType ?? 'COMMON';

  nodes.push(
    {
      id: 'seller',
      type: 'customStep',
      position: { x: 980, y: 600 },
      data: {
        label: 'Entidade',
        title: auctionDetails?.seller?.name ?? 'Comitente',
        status: getStepStatus(sellerReady, currentStep >= auctionStepIndex),
        icon: Users,
        pathType: 'COMMON',
        isActivePath: commonIsActive,
        isEntity: true,
        entityType: 'seller',
        entityId: auctionDetails?.sellerId,
      },
    },
    {
      id: 'auctioneer',
      type: 'customStep',
      position: { x: 980, y: 750 },
      data: {
        label: 'Entidade',
        title: auctionDetails?.auctioneer?.name ?? 'Leiloeiro',
        status: getStepStatus(auctioneerReady, currentStep >= auctionStepIndex),
        icon: Gavel,
        pathType: 'COMMON',
        isActivePath: commonIsActive,
        isEntity: true,
        entityType: 'auctioneer',
        entityId: auctionDetails?.auctioneerId,
      },
    },
    {
      id: 'auction-details',
      type: 'customStep',
      position: { x: 1280, y: 675 },
      data: {
        label: selectedType === 'JUDICIAL' ? 'Passo 3' : 'Passo 2',
        title: auctionDetails?.title ?? 'Dados do Leilão',
        status: getStepStatus(auctionReady, currentStep >= auctionStepIndex),
        icon: Gavel,
        pathType: selectedPathType,
        isActivePath: commonIsActive,
      },
    }
  );

  if (selectedType === 'JUDICIAL') {
    edges.push({
      id: 'edge-process-auction',
      source: 'judicial-process',
      target: 'auction-details',
      type: 'smoothstep',
      animated: judicialIsActive && currentStep >= 2,
      style: getEdgeStyle('JUDICIAL', judicialIsActive),
    });
  } else {
    for (const definition of auctionTypeDefinitions.filter((item) => item.type !== 'JUDICIAL')) {
      const isActivePath = selectedType === definition.type;
      edges.push({
        id: `edge-${definition.type}-auction`,
        source: `type-${definition.type}`,
        target: 'auction-details',
        type: 'smoothstep',
        animated: isActivePath,
        style: getEdgeStyle(definition.type, isActivePath),
      });
    }
  }

  edges.push(
    {
      id: 'edge-seller-auction',
      source: 'seller',
      target: 'auction-details',
      type: 'smoothstep',
      animated: sellerReady,
      style: getEdgeStyle('COMMON', commonIsActive),
    },
    {
      id: 'edge-auctioneer-auction',
      source: 'auctioneer',
      target: 'auction-details',
      type: 'smoothstep',
      animated: auctioneerReady,
      style: getEdgeStyle('COMMON', commonIsActive),
    }
  );

  nodes.push(
    {
      id: 'assets-origin',
      type: 'customStep',
      position: { x: 1620, y: 520 },
      data: {
        label: 'Fonte',
        title: selectedType === 'JUDICIAL' ? 'Bens do Processo' : 'Bens do Comitente',
        status: getStepStatus(selectedType === 'JUDICIAL' ? processLinked : sellerReady, currentStep >= lottingStepIndex),
        icon: Package,
        pathType: selectedPathType,
        isActivePath: commonIsActive || judicialIsActive,
      },
    },
    {
      id: 'lotting',
      type: 'customStep',
      position: { x: 1920, y: 520 },
      data: {
        label: 'Passo 4',
        title: lotsReady ? `${createdLots.length} lote(s) criados` : 'Criação de Lotes',
        status: getStepStatus(lotsReady, currentStep >= lottingStepIndex),
        icon: Boxes,
        pathType: selectedPathType,
        isActivePath: commonIsActive,
      },
    },
    {
      id: 'review',
      type: 'customStep',
      position: { x: 2220, y: 520 },
      data: {
        label: 'Passo Final',
        title: 'Revisão e Publicação',
        status: getStepStatus(currentStep >= reviewStepIndex, currentStep >= reviewStepIndex),
        icon: ListChecks,
        pathType: selectedPathType,
        isActivePath: commonIsActive,
      },
    }
  );

  edges.push(
    {
      id: 'edge-auction-assets',
      source: 'auction-details',
      target: 'assets-origin',
      type: 'smoothstep',
      animated: auctionReady,
      style: getEdgeStyle(selectedPathType, commonIsActive),
    },
    {
      id: 'edge-assets-lotting',
      source: 'assets-origin',
      target: 'lotting',
      type: 'smoothstep',
      animated: currentStep >= lottingStepIndex,
      style: getEdgeStyle(selectedPathType, commonIsActive),
    },
    {
      id: 'edge-lotting-review',
      source: 'lotting',
      target: 'review',
      type: 'smoothstep',
      animated: currentStep >= reviewStepIndex,
      style: getEdgeStyle(selectedPathType, commonIsActive),
    }
  );

  const postFlowNodes = [
    { id: 'auction-active', title: 'Leilão ativo', icon: Gavel, position: { x: 2520, y: 180 } },
    { id: 'auditorium', title: 'Pregão no auditório', icon: Tv, position: { x: 2820, y: 180 } },
    { id: 'winner-contact', title: 'Comunicação com arrematante', icon: Users, position: { x: 2520, y: 520 } },
    { id: 'payments-docs', title: 'Pagamento e documentos', icon: FileText, position: { x: 2820, y: 520 } },
    { id: 'closing', title: 'Encerramento', icon: CalendarX, position: { x: 3120, y: 520 } },
    { id: 'financial-flow', title: 'Fluxo financeiro', icon: DollarSign, position: { x: 3420, y: 520 } },
  ];

  for (const node of postFlowNodes) {
    nodes.push({
      id: node.id,
      type: 'customStep',
      position: node.position,
      data: {
        label: 'Pós-leilão',
        title: node.title,
        status: getStepStatus(false, currentStep >= reviewStepIndex),
        icon: node.icon,
        pathType: selectedPathType,
        isActivePath: commonIsActive,
      },
    });
  }

  const postEdges: Array<[string, string]> = [
    ['review', 'auction-active'],
    ['auction-active', 'auditorium'],
    ['auditorium', 'winner-contact'],
    ['winner-contact', 'payments-docs'],
    ['payments-docs', 'closing'],
    ['closing', 'financial-flow'],
  ];

  for (const [source, target] of postEdges) {
    edges.push({
      id: `edge-${source}-${target}`,
      source,
      target,
      type: 'smoothstep',
      animated: false,
      style: getEdgeStyle(selectedPathType, commonIsActive),
    });
  }

  return { nodes, edges };
}
/**
 * @fileoverview Painel resumido do fluxo do wizard sem dependencias externas.
 */
'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useWizard } from './wizard-context';
import {
  BrainCircuit,
  Boxes,
  Building,
  CalendarX,
  Check,
  CheckSquare,
  Circle,
  CircleDot,
  DollarSign,
  FileText,
  Gavel,
  Package,
  Pencil,
  Rocket,
  Scale,
  ShoppingCart,
  Tv,
  Users,
  type LucideIcon,
} from 'lucide-react';

type PathType = 'JUDICIAL' | 'EXTRAJUDICIAL' | 'PARTICULAR' | 'TOMADA_DE_PRECOS' | 'VENDA_DIRETA' | 'COMMON';
type StepStatus = 'todo' | 'in_progress' | 'done';

type FlowCard = {
  id: string;
  label: string;
  title: string;
  status: StepStatus;
  icon: LucideIcon;
  pathType: PathType;
  isActivePath: boolean;
  detail?: string;
  editLink?: string;
};

type FlowSection = {
  id: string;
  title: string;
  description: string;
  steps: FlowCard[];
};

const pathStyles: Record<PathType, { border: string; badge: string; tone: string }> = {
  JUDICIAL: {
    border: 'border-blue-500/70',
    badge: 'bg-blue-500 text-white',
    tone: 'text-blue-700',
  },
  EXTRAJUDICIAL: {
    border: 'border-emerald-500/70',
    badge: 'bg-emerald-500 text-white',
    tone: 'text-emerald-700',
  },
  PARTICULAR: {
    border: 'border-orange-500/70',
    badge: 'bg-orange-500 text-white',
    tone: 'text-orange-700',
  },
  TOMADA_DE_PRECOS: {
    border: 'border-violet-500/70',
    badge: 'bg-violet-500 text-white',
    tone: 'text-violet-700',
  },
  VENDA_DIRETA: {
    border: 'border-rose-500/70',
    badge: 'bg-rose-500 text-white',
    tone: 'text-rose-700',
  },
  COMMON: {
    border: 'border-slate-400/70',
    badge: 'bg-slate-500 text-white',
    tone: 'text-slate-700',
  },
};

const statusStyles: Record<StepStatus, string> = {
  done: 'bg-emerald-100 text-emerald-800',
  in_progress: 'bg-amber-100 text-amber-800',
  todo: 'bg-muted text-muted-foreground',
};

const statusLabels: Record<StepStatus, string> = {
  done: 'Concluido',
  in_progress: 'Em andamento',
  todo: 'Pendente',
};

const statusIcons: Record<StepStatus, LucideIcon> = {
  done: Check,
  in_progress: CircleDot,
  todo: Circle,
};

const typeLabels: Record<Exclude<PathType, 'COMMON'>, string> = {
  JUDICIAL: 'Judicial',
  EXTRAJUDICIAL: 'Extrajudicial',
  PARTICULAR: 'Particular',
  TOMADA_DE_PRECOS: 'Tomada de Precos',
  VENDA_DIRETA: 'Venda Direta',
};

const typeIcons: Record<Exclude<PathType, 'COMMON'>, LucideIcon> = {
  JUDICIAL: Scale,
  EXTRAJUDICIAL: Gavel,
  PARTICULAR: Users,
  TOMADA_DE_PRECOS: Building,
  VENDA_DIRETA: ShoppingCart,
};

function FlowCardItem({ step }: { step: FlowCard }) {
  const StatusIcon = statusIcons[step.status];
  const StepIcon = step.icon;
  const style = pathStyles[step.pathType];

  return (
    <article
      className={cn(
        'rounded-lg border bg-card p-4 shadow-sm transition-opacity',
        style.border,
        step.isActivePath ? 'opacity-100' : 'opacity-50'
      )}
      data-ai-id={`wizard-flow-card-${step.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide', style.badge)}>
              {step.label}
            </span>
            <span className={cn('rounded-full px-2 py-1 text-[11px] font-medium', statusStyles[step.status])}>
              {statusLabels[step.status]}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <StepIcon className={cn('mt-0.5 h-5 w-5 shrink-0', style.tone)} />
            <div className="min-w-0">
              <h4 className="font-semibold leading-tight text-foreground">{step.title}</h4>
              {step.detail ? (
                <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
              ) : null}
            </div>
          </div>
        </div>
        <StatusIcon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      </div>

      {step.editLink ? (
        <div className="mt-3">
          <Button asChild size="sm" variant="outline">
            <Link href={step.editLink} target="_blank" rel="noreferrer">
              <Pencil className="mr-2 h-4 w-4" /> Editar cadastro
            </Link>
          </Button>
        </div>
      ) : null}
    </article>
  );
}

export default function WizardFlow() {
  const { wizardData, currentStep } = useWizard();

  const sections = useMemo<FlowSection[]>(() => {
    const selectedType = wizardData.auctionType;
    const judicialProcess = wizardData.judicialProcess;
    const auctionDetails = wizardData.auctionDetails;
    const createdLots = wizardData.createdLots ?? [];
    const commonIsActive = Boolean(selectedType);
    const judicialIsActive = !selectedType || selectedType === 'JUDICIAL';
    const auctionStepIndex = selectedType === 'JUDICIAL' ? 2 : 1;
    const lottingStepIndex = selectedType === 'JUDICIAL' ? 3 : 2;
    const reviewStepIndex = selectedType === 'JUDICIAL' ? 4 : 3;
    const auctionReady = Boolean(auctionDetails?.title && auctionDetails?.sellerId && auctionDetails?.auctioneerId);
    const lotsReady = createdLots.length > 0;
    const processLinked = Boolean(judicialProcess?.id);
    const sellerName = auctionDetails?.seller?.name ?? (auctionDetails?.sellerId ? `ID ${auctionDetails.sellerId}` : undefined);
    const auctioneerName = auctionDetails?.auctioneer?.name ?? (auctionDetails?.auctioneerId ? `ID ${auctionDetails.auctioneerId}` : undefined);
    const selectedTypeLabel = selectedType ? typeLabels[selectedType] : 'Ainda nao selecionada';

    const derivedSections: FlowSection[] = [
      {
        id: 'start',
        title: 'Ponto de Partida',
        description: 'Acompanhe o estado atual do assistente antes de publicar o leilao.',
        steps: [
          {
            id: 'wizard-start',
            label: 'Inicio',
            title: 'Assistente iniciado',
            status: 'done',
            icon: Rocket,
            pathType: 'COMMON',
            isActivePath: true,
            detail: `Modalidade atual: ${selectedTypeLabel}.`,
          },
        ],
      },
      {
        id: 'types',
        title: 'Modalidades',
        description: 'Escolha a familia correta do fluxo antes de preencher os dados.',
        steps: (['JUDICIAL', 'EXTRAJUDICIAL', 'PARTICULAR', 'TOMADA_DE_PRECOS', 'VENDA_DIRETA'] as const).map((type) => ({
          id: `type-${type.toLowerCase()}`,
          label: 'Passo 1',
          title: typeLabels[type],
          status: selectedType ? (selectedType === type ? 'done' : 'todo') : currentStep === 0 ? 'in_progress' : 'todo',
          icon: typeIcons[type],
          pathType: type,
          isActivePath: !selectedType || selectedType === type,
          detail: selectedType === type ? 'Modalidade selecionada no wizard.' : 'Disponivel para selecao.',
        })),
      },
    ];

    if (judicialIsActive) {
      derivedSections.push({
        id: 'judicial',
        title: 'Base Judicial',
        description: 'Etapas necessarias para estruturar um leilao judicial antes da publicacao.',
        steps: [
          {
            id: 'judicial-court',
            label: 'Base',
            title: 'Tribunal',
            status: processLinked ? 'done' : selectedType === 'JUDICIAL' && currentStep >= 1 ? 'in_progress' : 'todo',
            icon: Scale,
            pathType: 'JUDICIAL',
            isActivePath: judicialIsActive,
            detail: processLinked ? 'Confirmado pelo processo judicial selecionado.' : 'Selecione ou crie o processo para vincular o tribunal.',
          },
          {
            id: 'judicial-district',
            label: 'Base',
            title: 'Comarca',
            status: processLinked ? 'done' : selectedType === 'JUDICIAL' && currentStep >= 1 ? 'in_progress' : 'todo',
            icon: Building,
            pathType: 'JUDICIAL',
            isActivePath: judicialIsActive,
            detail: processLinked ? 'Comarca preenchida no processo vinculado.' : 'Aguardando processo judicial.',
          },
          {
            id: 'judicial-branch',
            label: 'Base',
            title: 'Vara',
            status: processLinked ? 'done' : selectedType === 'JUDICIAL' && currentStep >= 1 ? 'in_progress' : 'todo',
            icon: Gavel,
            pathType: 'JUDICIAL',
            isActivePath: judicialIsActive,
            detail: processLinked ? 'Vara associada ao processo atual.' : 'Aguardando definicao da vara.',
          },
          {
            id: 'judicial-parties',
            label: 'Base',
            title: 'Partes envolvidas',
            status: processLinked ? 'done' : selectedType === 'JUDICIAL' && currentStep >= 1 ? 'in_progress' : 'todo',
            icon: Users,
            pathType: 'JUDICIAL',
            isActivePath: judicialIsActive,
            detail: processLinked ? 'As partes passam a abastecer o cadastro do lote.' : 'Cadastre o processo para carregar as partes.',
          },
          {
            id: 'judicial-process',
            label: 'Passo 2',
            title: 'Processo judicial',
            status: processLinked ? 'done' : selectedType === 'JUDICIAL' && currentStep >= 1 ? 'in_progress' : 'todo',
            icon: FileText,
            pathType: 'JUDICIAL',
            isActivePath: judicialIsActive,
            detail: processLinked ? `Processo vinculado: ${judicialProcess?.processNumber}.` : 'Cadastre ou selecione um processo para continuar.',
            editLink: processLinked ? `/admin/judicial-processes/${judicialProcess?.id}/edit` : undefined,
          },
        ],
      });

      derivedSections.push({
        id: 'ai',
        title: 'Fluxo BidExpert.AI',
        description: 'Analise orientada apos a vinculacao do processo judicial.',
        steps: [
          {
            id: 'ai-docs',
            label: 'IA',
            title: 'Cadastro de documentos',
            status: processLinked ? 'in_progress' : 'todo',
            icon: FileText,
            pathType: 'JUDICIAL',
            isActivePath: judicialIsActive,
            detail: processLinked ? 'Pronto para enriquecer o cadastro documental.' : 'Disponivel apos selecionar o processo.',
          },
          {
            id: 'ai-analysis',
            label: 'IA',
            title: 'Analise automatizada',
            status: processLinked ? 'todo' : 'todo',
            icon: BrainCircuit,
            pathType: 'JUDICIAL',
            isActivePath: judicialIsActive,
            detail: 'Etapa de apoio para consistencia e enriquecimento.',
          },
          {
            id: 'ai-validation',
            label: 'IA',
            title: 'Validacao dos dados',
            status: processLinked ? 'todo' : 'todo',
            icon: CheckSquare,
            pathType: 'JUDICIAL',
            isActivePath: judicialIsActive,
            detail: 'Conferencia antes de montar ativos e lotes.',
          },
        ],
      });
    }

    derivedSections.push({
      id: 'entities',
      title: 'Entidades do Leilao',
      description: 'Comitente, leiloeiro e metadados principais do evento.',
      steps: [
        {
          id: 'seller',
          label: 'Entidade',
          title: 'Comitente',
          status: auctionDetails?.sellerId ? 'done' : currentStep >= auctionStepIndex ? 'in_progress' : 'todo',
          icon: Users,
          pathType: 'COMMON',
          isActivePath: commonIsActive,
          detail: sellerName ? `Selecionado: ${sellerName}.` : 'Selecione o comitente do leilao.',
          editLink: auctionDetails?.sellerId ? `/admin/sellers/${auctionDetails.sellerId}/edit` : undefined,
        },
        {
          id: 'auctioneer',
          label: 'Entidade',
          title: 'Leiloeiro',
          status: auctionDetails?.auctioneerId ? 'done' : currentStep >= auctionStepIndex ? 'in_progress' : 'todo',
          icon: Gavel,
          pathType: 'COMMON',
          isActivePath: commonIsActive,
          detail: auctioneerName ? `Selecionado: ${auctioneerName}.` : 'Selecione o leiloeiro responsavel.',
          editLink: auctionDetails?.auctioneerId ? `/admin/auctioneers/${auctionDetails.auctioneerId}/edit` : undefined,
        },
        {
          id: 'auction-details',
          label: 'Passo 3',
          title: 'Dados do leilao',
          status: auctionReady ? 'done' : currentStep >= auctionStepIndex ? 'in_progress' : 'todo',
          icon: Gavel,
          pathType: selectedType ?? 'COMMON',
          isActivePath: commonIsActive,
          detail: auctionDetails?.title ? `Titulo preenchido: ${auctionDetails.title}.` : 'Preencha titulo, comitente, leiloeiro e datas.',
        },
      ],
    });

    derivedSections.push({
      id: 'assets',
      title: 'Origem dos Itens e Lotes',
      description: 'Defina a fonte dos ativos e monte os lotes que serao publicados.',
      steps: [
        {
          id: 'process-assets',
          label: 'Fonte',
          title: 'Bens do processo',
          status: processLinked ? 'done' : 'todo',
          icon: Package,
          pathType: 'JUDICIAL',
          isActivePath: judicialIsActive,
          detail: processLinked ? 'Os ativos judiciais podem ser loteados.' : 'Disponivel no fluxo judicial apos selecionar o processo.',
        },
        {
          id: 'seller-assets',
          label: 'Fonte',
          title: 'Bens do comitente',
          status: auctionDetails?.sellerId ? 'done' : 'todo',
          icon: Package,
          pathType: 'COMMON',
          isActivePath: commonIsActive && selectedType !== 'JUDICIAL',
          detail: auctionDetails?.sellerId ? 'Os ativos do comitente ja podem alimentar o loteamento.' : 'Selecione o comitente para usar ativos nao judiciais.',
        },
        {
          id: 'lotting',
          label: 'Passo 4',
          title: 'Criacao de lotes',
          status: lotsReady ? 'done' : currentStep >= lottingStepIndex ? 'in_progress' : 'todo',
          icon: Boxes,
          pathType: selectedType ?? 'COMMON',
          isActivePath: commonIsActive,
          detail: lotsReady ? `${createdLots.length} lote(s) criado(s) no wizard.` : 'Agrupe os ativos e defina a estrutura dos lotes.',
        },
      ],
    });

    derivedSections.push({
      id: 'publication',
      title: 'Revisao e Publicacao',
      description: 'Fechamento do cadastro antes do leilao seguir para execucao.',
      steps: [
        {
          id: 'review',
          label: 'Passo 5',
          title: 'Revisao final',
          status: currentStep >= reviewStepIndex ? 'in_progress' : 'todo',
          icon: CheckSquare,
          pathType: selectedType ?? 'COMMON',
          isActivePath: commonIsActive,
          detail: lotsReady ? 'Revise os dados e publique o evento.' : 'A revisao e liberada apos o loteamento.',
        },
      ],
    });

    derivedSections.push({
      id: 'post-auction',
      title: 'Pos-Leilao',
      description: 'Etapas previstas apos a publicacao do evento.',
      steps: [
        {
          id: 'live-auction',
          label: 'Pregao',
          title: 'Leilao ativo',
          status: 'todo',
          icon: Gavel,
          pathType: 'COMMON',
          isActivePath: commonIsActive,
          detail: 'Execucao do pregrao e recepcao de lances.',
        },
        {
          id: 'auditorium',
          label: 'Pregao',
          title: 'Pregao em auditorio',
          status: 'todo',
          icon: Tv,
          pathType: 'COMMON',
          isActivePath: commonIsActive,
          detail: 'Etapa presencial ou hibrida, quando aplicavel.',
        },
        {
          id: 'winner-contact',
          label: 'Pos-leilao',
          title: 'Comunicacao com arrematante',
          status: 'todo',
          icon: Users,
          pathType: 'COMMON',
          isActivePath: commonIsActive,
          detail: 'Notificacoes e instrucoes para o vencedor.',
        },
        {
          id: 'payment-docs',
          label: 'Pos-leilao',
          title: 'Pagamento e documentos',
          status: 'todo',
          icon: FileText,
          pathType: 'COMMON',
          isActivePath: commonIsActive,
          detail: 'Quitacao, documentos e transferencia.',
        },
        {
          id: 'closing',
          label: 'Pos-leilao',
          title: 'Encerramento',
          status: 'todo',
          icon: CalendarX,
          pathType: 'COMMON',
          isActivePath: commonIsActive,
          detail: 'Fechamento operacional do evento.',
        },
        {
          id: 'financial-flow',
          label: 'Financeiro',
          title: 'Fluxo financeiro',
          status: 'todo',
          icon: DollarSign,
          pathType: 'COMMON',
          isActivePath: commonIsActive,
          detail: 'Consolidacao de repasses, comissoes e baixa financeira.',
        },
      ],
    });

    return derivedSections;
  }, [
    currentStep,
    wizardData.auctionDetails,
    wizardData.auctionType,
    wizardData.createdLots,
    wizardData.judicialProcess,
  ]);

  return (
    <div className="h-full overflow-auto bg-muted/30 p-4 sm:p-6" data-ai-id="wizard-flow-overview">
      <div className="grid gap-4 xl:grid-cols-2">
        {sections.map((section) => (
          <section key={section.id} className="rounded-lg border bg-card p-4 shadow-sm" data-ai-id={`wizard-flow-section-${section.id}`}>
            <header className="mb-4 space-y-1">
              <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
              <p className="text-sm text-muted-foreground">{section.description}</p>
            </header>
            <ol className="grid gap-3">
              {section.steps.map((step) => (
                <li key={step.id}>
                  <FlowCardItem step={step} />
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
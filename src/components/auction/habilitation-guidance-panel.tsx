/**
 * @fileoverview Orientação inline de habilitação e documentação no painel de lances.
 */
'use client';

import Link from 'next/link';
import { AlertCircle, ArrowRight, CheckCircle2, FileCheck2, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { BidEligibilityReason } from '@/lib/bidding-eligibility';
import type { UserHabilitationStatus } from '@/types';

interface HabilitationGuidancePanelProps {
  reason: Extract<BidEligibilityReason, 'DOCUMENTATION_PENDING' | 'AUCTION_HABILITATION_REQUIRED'>;
  title: string;
  description: string;
  userHabilitationStatus?: UserHabilitationStatus | null;
  documentsHref?: string;
  documentsCtaLabel?: string;
  className?: string;
}

interface GuidanceStep {
  key: string;
  title: string;
  description: string;
  status: 'done' | 'current' | 'pending';
}

const statusCopy: Record<UserHabilitationStatus, { label: string; detail: string }> = {
  PENDING_DOCUMENTS: {
    label: 'Documentação pendente',
    detail: 'Envie os documentos obrigatórios para liberar sua análise cadastral.',
  },
  PENDING_ANALYSIS: {
    label: 'Documentação em análise',
    detail: 'Seus arquivos já foram enviados e aguardam validação da equipe.',
  },
  HABILITADO: {
    label: 'Documentação aprovada',
    detail: 'Seu cadastro documental já está apto para seguir para a habilitação do leilão.',
  },
  REJECTED_DOCUMENTS: {
    label: 'Documentação rejeitada',
    detail: 'Algum documento precisa ser corrigido ou reenviado antes da aprovação.',
  },
  BLOCKED: {
    label: 'Cadastro bloqueado',
    detail: 'O cadastro está bloqueado e depende de contato com o suporte.',
  },
};

const stepStyles = {
  done: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  current: 'border-primary/20 bg-primary/5 text-foreground',
  pending: 'border-border bg-muted/40 text-muted-foreground',
} as const;

function buildSteps(reason: HabilitationGuidancePanelProps['reason'], userHabilitationStatus?: UserHabilitationStatus | null): GuidanceStep[] {
  if (reason === 'AUCTION_HABILITATION_REQUIRED') {
    return [
      {
        key: 'documents-approved',
        title: 'Cadastro documental pronto',
        description: 'Sua documentação já foi aprovada e você pode avançar para a etapa específica deste leilão.',
        status: 'done',
      },
      {
        key: 'auction-habilitation',
        title: 'Habilitação do leilão pendente',
        description: 'Falta somente liberar sua participação neste leilão antes do primeiro lance.',
        status: 'current',
      },
      {
        key: 'bid-after-habilitation',
        title: 'Depois disso, lance normalmente',
        description: 'Assim que a habilitação do leilão for concluída, o lance manual e o automático ficam disponíveis.',
        status: 'pending',
      },
    ];
  }

  const currentStatus = userHabilitationStatus ?? 'PENDING_DOCUMENTS';
  const currentCopy = statusCopy[currentStatus];

  return [
    {
      key: 'current-status',
      title: currentCopy.label,
      description: currentCopy.detail,
      status: 'current',
    },
    {
      key: 'documents-upload',
      title: 'Enviar ou revisar documentos',
      description: 'Acesse Meus Documentos para completar uploads, corrigir rejeições ou acompanhar a análise.',
      status: currentStatus === 'PENDING_ANALYSIS' ? 'done' : 'pending',
    },
    {
      key: 'auction-release',
      title: 'Voltar para o lote após a aprovação',
      description: 'Quando o cadastro for aprovado, a próxima etapa será a habilitação específica do leilão.',
      status: 'pending',
    },
  ];
}

export function HabilitationGuidancePanel({
  reason,
  title,
  description,
  userHabilitationStatus,
  documentsHref = '/dashboard/documents',
  documentsCtaLabel = 'Revisar meus documentos',
  className,
}: HabilitationGuidancePanelProps) {
  const steps = buildSteps(reason, userHabilitationStatus);
  const statusLabel = statusCopy[userHabilitationStatus ?? 'PENDING_DOCUMENTS']?.label ?? 'Documentação pendente';

  return (
    <div className={cn('space-y-3 rounded-lg border p-4 bg-card', className)} data-ai-id="bidding-panel-habilitation-guidance">
      <Alert className={cn('border', reason === 'AUCTION_HABILITATION_REQUIRED' ? 'border-primary/20 bg-primary/5' : 'border-amber-200 bg-amber-50')}>
        {reason === 'AUCTION_HABILITATION_REQUIRED' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </Alert>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">Status cadastral: {reason === 'AUCTION_HABILITATION_REQUIRED' ? 'Documentação aprovada' : statusLabel}</Badge>
        <Badge variant="outline">Próximo passo: {reason === 'AUCTION_HABILITATION_REQUIRED' ? 'Habilitar este leilão' : 'Regularizar documentos'}</Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {steps.map((step) => (
          <div key={step.key} className={cn('rounded-lg border p-3', stepStyles[step.status])}>
            <p className="text-sm font-medium">{step.title}</p>
            <p className="mt-1 text-xs opacity-90">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={documentsHref} data-ai-id={reason === 'AUCTION_HABILITATION_REQUIRED' ? 'bidding-panel-documents-review-link' : 'bidding-panel-documents-link'}>
            <FileCheck2 className="mr-2 h-4 w-4" />
            {documentsCtaLabel}
          </Link>
        </Button>
        <div className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          O motivo do bloqueio fica visível aqui até a próxima etapa ser concluída.
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
}

export default HabilitationGuidancePanel;
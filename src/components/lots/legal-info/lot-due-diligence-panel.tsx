/**
 * @fileoverview Painel consolidado de due diligence do lote.
 */
'use client';

import * as React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, ExternalLink, FileCheck, ShieldCheck } from 'lucide-react';
import type { Auction, Lot } from '@/types';
import {
  buildLotDueDiligenceSummary,
  type DueDiligenceChecklistStatus,
} from '@/lib/lots/due-diligence';
import { LotLegalInfoCard } from './lot-legal-info-card';

interface LotDueDiligencePanelProps {
  lot: Partial<Pick<Lot,
    | 'propertyMatricula'
    | 'propertyRegistrationNumber'
    | 'occupancyStatus'
    | 'actionType'
    | 'actionDescription'
    | 'actionCnjCode'
    | 'lotRisks'
    | 'judicialProcessNumber'
    | 'courtDistrict'
    | 'courtName'
    | 'publicProcessUrl'
    | 'propertyLiens'
    | 'knownDebts'
    | 'additionalDocumentsInfo'
  >>;
  auction?: Partial<Pick<Auction, 'documentsUrl' | 'auctionType'>> | null;
  className?: string;
}

const checklistStyles: Record<DueDiligenceChecklistStatus, string> = {
  available: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  attention: 'border-amber-200 bg-amber-50 text-amber-950',
  missing: 'border-slate-200 bg-slate-50 text-slate-800',
};

const checklistLabels: Record<DueDiligenceChecklistStatus, string> = {
  available: 'Disponível',
  attention: 'Atenção',
  missing: 'Ausente',
};

const alertStyles = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  info: 'border-primary/20 bg-primary/10 text-primary-foreground',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
  critical: 'border-destructive/30 bg-destructive/10 text-destructive',
} as const;

export function LotDueDiligencePanel({ lot, auction, className }: LotDueDiligencePanelProps) {
  const summary = React.useMemo(() => buildLotDueDiligenceSummary({ lot, auction }), [lot, auction]);

  return (
    <div className={cn('space-y-4', className)} data-ai-id="lot-due-diligence-panel">
      <Alert className={cn('border', alertStyles[summary.alert.tone])} data-ai-id="lot-due-diligence-alert">
        {summary.alert.tone === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
        <AlertTitle>{summary.alert.title}</AlertTitle>
        <AlertDescription>{summary.alert.description}</AlertDescription>
      </Alert>

      <div className="space-y-2" data-ai-id="lot-due-diligence-checklist">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Checklist de due diligence</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {summary.checklist.map((item) => (
            <div key={item.key} className={cn('rounded-lg border p-3', checklistStyles[item.status])}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="mt-1 text-xs opacity-90">{item.detail}</p>
                </div>
                <Badge variant="outline" className="shrink-0 border-current bg-transparent">
                  {checklistLabels[item.status]}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {summary.links.length > 0 && (
        <div className="space-y-2" data-ai-id="lot-due-diligence-links">
          <Separator />
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Documentos e links oficiais</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.links.map((link) => (
              <a
                key={link.key}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
              >
                {link.label}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </div>
      )}

      <LotLegalInfoCard
        propertyMatricula={lot.propertyMatricula}
        propertyRegistrationNumber={lot.propertyRegistrationNumber}
        occupationStatus={lot.occupancyStatus as any}
        actionType={lot.actionType as any}
        actionDescription={lot.actionDescription}
        actionCnjCode={lot.actionCnjCode}
        propertyLiens={lot.propertyLiens}
        knownDebts={lot.knownDebts}
        additionalDocumentsInfo={lot.additionalDocumentsInfo}
        risks={summary.sortedRisks}
      />

      <p className="text-xs text-muted-foreground">
        Esta triagem resume apenas os sinais públicos disponíveis. A decisão final deve considerar edital, certidões e assessoria especializada quando o lote exigir análise jurídica reforçada.
      </p>
    </div>
  );
}

export default LotDueDiligencePanel;
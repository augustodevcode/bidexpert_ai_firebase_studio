/**
 * @fileoverview Resumo enxuto de auditoria para superfícies administrativas de leilão.
 */

import React from 'react';
import Link from 'next/link';
import { History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AuctionAuditSummaryProps {
  createdByUserId?: string | bigint | null;
  updatedAt?: string | Date | null;
  submittedAt?: string | Date | null;
  validatedAt?: string | Date | null;
  validatedBy?: string | bigint | null;
  historyHref?: string;
}

const formatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

function normalizeIdentifier(value?: string | bigint | null): string {
  if (value === null || value === undefined || value === '') {
    return 'Não informado';
  }

  return value.toString();
}

function formatDateTime(value?: string | Date | null): string {
  if (!value) {
    return 'Não informado';
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Não informado';
  }

  return formatter.format(parsed);
}

export function AuctionAuditSummary({
  createdByUserId,
  updatedAt,
  submittedAt,
  validatedAt,
  validatedBy,
  historyHref,
}: AuctionAuditSummaryProps) {
  const hasAuditData = Boolean(createdByUserId || updatedAt || submittedAt || validatedAt || validatedBy || historyHref);

  if (!hasAuditData) {
    return null;
  }

  const items = [
    { id: 'created-by', label: 'Criado por', value: normalizeIdentifier(createdByUserId) },
    { id: 'updated-at', label: 'Atualizado em', value: formatDateTime(updatedAt) },
    { id: 'submitted-at', label: 'Enviado para validação', value: formatDateTime(submittedAt) },
    { id: 'validated-by', label: 'Validado por', value: normalizeIdentifier(validatedBy) },
    { id: 'validated-at', label: 'Validado em', value: formatDateTime(validatedAt) },
  ];

  return (
    <Card data-ai-id="auction-audit-summary">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle>Auditoria mínima</CardTitle>
          <CardDescription>Rastro essencial de criação, atualização e validação do leilão atual.</CardDescription>
        </div>
        {historyHref ? (
          <Button asChild variant="outline" size="sm">
            <Link href={historyHref} data-ai-id="auction-audit-summary-history-link">
              <History className="mr-2 h-4 w-4" />
              Abrir histórico completo
            </Link>
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {items.map((item) => (
            <div key={item.id} className="rounded-md border p-3" data-ai-id={`auction-audit-item-${item.id}`}>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-sm font-semibold break-all">{item.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
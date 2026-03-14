/**
 * @fileoverview Painel lateral de detalhes de EmailLog no Admin Plus.
 */
'use client';

import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { EmailLogRow } from './types';

interface EmailLogDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: EmailLogRow | null;
}

const statusVariant: Record<EmailLogRow['status'], 'default' | 'secondary' | 'destructive'> = {
  SENT: 'default',
  PENDING: 'secondary',
  FAILED: 'destructive',
};

export function EmailLogDetailsSheet({ open, onOpenChange, log }: EmailLogDetailsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[640px] overflow-y-auto" data-ai-id="email-log-details-sheet">
        <SheetHeader>
          <SheetTitle>Detalhes do log de e-mail</SheetTitle>
        </SheetHeader>

        {log ? (
          <div className="mt-6 space-y-6 text-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="font-medium text-muted-foreground">Destinatário</p>
                <p>{log.recipient}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Status</p>
                <Badge variant={statusVariant[log.status]}>{log.status}</Badge>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Provedor</p>
                <p>{log.provider}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Enviado em</p>
                <p>{log.sentAt ? new Date(log.sentAt).toLocaleString('pt-BR') : 'Ainda não enviado'}</p>
              </div>
            </div>

            <div>
              <p className="font-medium text-muted-foreground">Assunto</p>
              <p>{log.subject}</p>
            </div>

            <div>
              <p className="font-medium text-muted-foreground">Conteúdo</p>
              <pre className="mt-2 whitespace-pre-wrap rounded-md border bg-muted p-4 text-xs">{log.content}</pre>
            </div>

            {log.errorMessage ? (
              <div>
                <p className="font-medium text-muted-foreground">Erro reportado</p>
                <pre className="mt-2 whitespace-pre-wrap rounded-md border border-destructive/30 bg-destructive/5 p-4 text-xs">{log.errorMessage}</pre>
              </div>
            ) : null}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
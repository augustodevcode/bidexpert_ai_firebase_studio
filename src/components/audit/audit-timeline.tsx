// src/components/audit/audit-timeline.tsx
// Componente para exibir timeline de auditoria
// Mostra visualmente quem fez o quê e quando

'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
  user: {
    fullName: string | null;
    email: string;
    avatarUrl: string | null;
  };
  changes?: any;
  metadata?: any;
}

interface AuditTimelineProps {
  entityType: string;
  entityId: string;
}

export function AuditTimeline({ entityType, entityId }: AuditTimelineProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const response = await fetch(
          `/api/audit?entityType=${entityType}&entityId=${entityId}`
        );
        const data = await response.json();
        
        if (data.success) {
          setLogs(data.logs);
        } else {
          setError(data.error);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, [entityType, entityId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Alterações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Carregando histórico...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Alterações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive py-8">
            Erro ao carregar histórico: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Alterações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Nenhuma alteração registrada ainda.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Alterações</CardTitle>
        <p className="text-sm text-muted-foreground">
          {logs.length} {logs.length === 1 ? 'registro' : 'registros'}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.map((log, idx) => (
            <div key={log.id} className="flex gap-4">
              {/* Avatar e linha */}
              <div className="flex flex-col items-center">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={log.user.avatarUrl || undefined} />
                  <AvatarFallback>
                    {log.user.fullName?.[0] || log.user.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {idx < logs.length - 1 && (
                  <div className="flex-1 w-px bg-border mt-2" />
                )}
              </div>

              {/* Conteúdo */}
              <div className="flex-1 pb-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">
                    {log.user.fullName || log.user.email}
                  </span>
                  <Badge variant={getActionVariant(log.action)}>
                    {translateAction(log.action)}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-2">
                  {formatDistanceToNow(new Date(log.timestamp), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>

                {/* Mudanças */}
                {log.changes && (
                  <div className="bg-muted rounded-md p-3 text-sm mt-2">
                    <ChangeDiff changes={log.changes} />
                  </div>
                )}

                {/* Metadata */}
                {log.metadata?.reason && (
                  <div className="text-sm text-muted-foreground italic mt-2">
                    Razão: {log.metadata.reason}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ChangeDiff({ changes }: { changes: any }) {
  if (!changes.before || !changes.after) return null;

  return (
    <div className="space-y-1">
      {Object.keys(changes.before).map((key) => (
        <div key={key} className="grid grid-cols-3 gap-2 text-xs">
          <span className="font-medium">{key}:</span>
          <span className="text-destructive line-through">
            {formatValue(changes.before[key])}
          </span>
          <span className="text-green-600">
            {formatValue(changes.after[key])}
          </span>
        </div>
      ))}
    </div>
  );
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return '(vazio)';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function translateAction(action: string): string {
  const translations: Record<string, string> = {
    CREATE: 'Criou',
    UPDATE: 'Editou',
    DELETE: 'Deletou',
    PUBLISH: 'Publicou',
    UNPUBLISH: 'Despublicou',
    APPROVE: 'Aprovou',
    REJECT: 'Rejeitou',
  };
  return translations[action] || action;
}

function getActionVariant(action: string): 'default' | 'destructive' | 'outline' | 'secondary' {
  if (action === 'CREATE') return 'default';
  if (action === 'DELETE') return 'destructive';
  if (action === 'UPDATE') return 'secondary';
  return 'outline';
}

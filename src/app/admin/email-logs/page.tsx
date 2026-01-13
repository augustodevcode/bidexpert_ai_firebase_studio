// src/app/admin/email-logs/page.tsx
/**
 * @fileoverview Página de administração para visualizar logs de envio de e-mail.
 * Permite ao analista de TI verificar se os e-mails foram enviados corretamente.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, CheckCircle, Clock, XCircle, RefreshCw, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getEmailLogs, getEmailStats } from './actions';
import type { EmailLog } from '@prisma/client';

interface EmailLogWithMessage extends EmailLog {
  contactMessage?: {
    id: bigint;
    name: string;
    email: string;
    subject: string | null;
    createdAt: Date;
  } | null;
}

export default function AdminEmailLogsPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<EmailLogWithMessage[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [logsData, statsData] = await Promise.all([
        getEmailLogs(),
        getEmailStats(),
      ]);
      setLogs(logsData);
      setStats(statsData);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'BOUNCED':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      SENT: 'default',
      FAILED: 'destructive',
      PENDING: 'secondary',
      BOUNCED: 'outline',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status}
      </Badge>
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-ai-id="email-logs-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Logs de E-mail</h1>
          <p className="text-muted-foreground">
            Monitore o envio de e-mails do sistema
          </p>
        </div>
        <Button
          onClick={loadData}
          disabled={isRefreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enviados</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Falhas</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendente</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Envios</CardTitle>
          <CardDescription>
            Lista completa dos e-mails enviados pelo sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Destinatário</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead>Provedor</TableHead>
                <TableHead>Mensagem Relacionada</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead>Data de Envio</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id.toString()}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      {getStatusBadge(log.status)}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {log.recipient}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {log.subject}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.provider}</Badge>
                  </TableCell>
                  <TableCell>
                    {log.contactMessage ? (
                      <div className="text-sm">
                        <div className="font-medium">{log.contactMessage.name}</div>
                        <div className="text-muted-foreground">{log.contactMessage.email}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(log.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.sentAt ? formatDate(log.sentAt) : '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // TODO: Implementar modal para visualizar detalhes do e-mail
                        toast({
                          title: 'Funcionalidade em desenvolvimento',
                          description: 'Visualização detalhada será implementada em breve.',
                        });
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {logs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum log de e-mail encontrado.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
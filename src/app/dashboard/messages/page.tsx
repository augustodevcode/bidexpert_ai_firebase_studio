// src/app/dashboard/messages/page.tsx
/**
 * @fileoverview Página de mensagens de contato do usuário.
 * Permite ao usuário visualizar mensagens que enviou anteriormente
 * através do formulário de contato, incluindo status de envio de e-mail.
 */
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, CheckCircle, Clock, MessageSquare, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getUserContactMessages } from './actions';
import type { ContactMessage } from '@prisma/client';

interface ContactMessageWithLogs extends ContactMessage {
  emailLogs: {
    id: bigint;
    status: string;
    sentAt: Date | null;
    provider: string;
  }[];
}

export default function UserMessagesPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessageWithLogs[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadMessages = async () => {
    try {
      setIsRefreshing(true);
      const data = await getUserContactMessages();
      setMessages(data);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar mensagens',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const getEmailStatusIcon = (logs: ContactMessageWithLogs['emailLogs']) => {
    if (logs.length === 0) return <Clock className="h-4 w-4 text-gray-500" />;
    
    const latestLog = logs[0]; // Já ordenado por createdAt desc
    switch (latestLog.status) {
      case 'SENT':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'BOUNCED':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEmailStatusBadge = (logs: ContactMessageWithLogs['emailLogs']) => {
    if (logs.length === 0) {
      return <Badge variant="outline">Não enviado</Badge>;
    }

    const latestLog = logs[0];
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      SENT: 'default',
      FAILED: 'destructive',
      PENDING: 'secondary',
      BOUNCED: 'outline',
    };

    return (
      <Badge variant={variants[latestLog.status] || 'outline'}>
        {latestLog.status}
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
    <div className="space-y-6" data-ai-id="user-messages-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Minhas Mensagens</h1>
          <p className="text-muted-foreground">
            Histórico das mensagens enviadas através do formulário de contato
          </p>
        </div>
        <Button
          onClick={loadMessages}
          disabled={isRefreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Histórico de Contato
          </CardTitle>
          <CardDescription>
            Todas as mensagens que você enviou para nossa equipe de suporte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assunto</TableHead>
                <TableHead>Status do E-mail</TableHead>
                <TableHead>Provedor</TableHead>
                <TableHead>Data de Envio</TableHead>
                <TableHead>Última Atualização</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((message) => (
                <TableRow key={message.id.toString()}>
                  <TableCell className="font-medium">
                    {message.subject || 'Sem assunto'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getEmailStatusIcon(message.emailLogs)}
                      {getEmailStatusBadge(message.emailLogs)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {message.emailLogs.length > 0 ? (
                      <Badge variant="outline">{message.emailLogs[0].provider}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {message.emailLogs.length > 0 && message.emailLogs[0].sentAt
                      ? formatDate(message.emailLogs[0].sentAt)
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(message.updatedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {messages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Você ainda não enviou nenhuma mensagem de contato.</p>
              <p className="text-sm mt-2">
                Use o formulário "Fale Conosco" para entrar em contato conosco.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
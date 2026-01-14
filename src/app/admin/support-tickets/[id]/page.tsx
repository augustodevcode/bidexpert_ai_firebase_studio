'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, ArrowLeft, Monitor, Globe, User, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

interface TicketMessage {
    id: string;
    message: string;
    createdAt: string;
    user: { fullName: string };
    isInternal: boolean;
}

interface TicketDetail {
  id: string;
  publicId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  userAgent?: string;
  browserInfo?: string;
  screenSize?: string;
  pageUrl?: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    cellPhone?: string;
  };
  attachments: Attachment[];
  messages: TicketMessage[];
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchTicket(params.id as string);
    }
  }, [params.id]);

  const fetchTicket = async (id: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${id}`);
      if (response.ok) {
        const data = await response.json();
        setTicket(data.ticket);
        setStatus(data.ticket.status);
        setPriority(data.ticket.priority);
      } else {
        toast({ title: 'Erro', description: 'Não foi possível carregar o ticket.', variant: 'destructive' });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!ticket) return;
    try {
        const res = await fetch(`/api/support/tickets/${ticket.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, priority })
        });
        if (res.ok) {
            toast({ title: 'Sucesso', description: 'Ticket atualizado.' });
            fetchTicket(ticket.id);
        }
    } catch (e) {
        toast({ title: 'Erro', description: 'Erro ao atualizar.', variant: 'destructive' });
    }
  };

  if (isLoading) return <div className="p-8">Carregando...</div>;
  if (!ticket) return <div className="p-8">Ticket não encontrado.</div>;

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
      </Button>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Coluna Principal */}
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader>
               <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="outline" className="mb-2">#{ticket.publicId}</Badge>
                    <CardTitle className="text-2xl">{ticket.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        Aberto em {new Date(ticket.createdAt).toLocaleString('pt-BR')}
                    </div>
                  </div>
               </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <div className="bg-muted/30 p-4 rounded-md whitespace-pre-wrap">
                  {ticket.description}
                </div>
              </div>

               {ticket.attachments && ticket.attachments.length > 0 && (
                <div>
                   <h3 className="font-semibold mb-2 flex items-center gap-2">
                     <FileText className="w-4 h-4" /> Anexos ({ticket.attachments.length})
                   </h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {ticket.attachments.map(att => (
                        <div key={att.id} className="flex items-center justify-between p-3 border rounded-md group hover:bg-muted/50 transition-colors">
                           <div className="flex items-center gap-2 overflow-hidden">
                              {att.mimeType?.startsWith('image/') ? (
                                <div className="h-10 w-10 relative bg-gray-100 rounded overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => window.open(att.fileUrl, '_blank')}>
                                    <img src={att.fileUrl} alt={att.fileName} className="h-full w-full object-cover" />
                                </div>
                              ) : (
                                <FileText className="h-8 w-8 text-blue-500 flex-shrink-0" />
                              )}
                              <div className="truncate min-w-0">
                                 <p className="text-sm font-medium truncate" title={att.fileName}>{att.fileName}</p>
                                 <p className="text-xs text-muted-foreground">{(att.fileSize / 1024).toFixed(1)} KB</p>
                              </div>
                           </div>
                           <Button variant="ghost" size="icon" asChild>
                              <a href={att.fileUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4" />
                              </a>
                           </Button>
                        </div>
                      ))}
                   </div>
                </div>
               )}
            </CardContent>
          </Card>

           {/* Histórico / Mensagens (Simplificado) */}
           {ticket.messages.length > 0 && (
             <Card>
                <CardHeader><CardTitle>Histórico de Conversa</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                   {ticket.messages.map(msg => (
                      <div key={msg.id} className={`p-4 rounded-lg ${msg.isInternal ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                         <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>{msg.user?.fullName}</span>
                            <span>{new Date(msg.createdAt).toLocaleString()}</span>
                         </div>
                         <p className="text-sm">{msg.message}</p>
                      </div>
                   ))}
                </CardContent>
             </Card>
           )}
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-80 space-y-6">
           {/* Actions */}
           <Card>
              <CardHeader><CardTitle>Gerenciamento</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={status} onValueChange={setStatus}>
                       <SelectTrigger>
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                          <SelectItem value="ABERTO">Aberto</SelectItem>
                          <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                          <SelectItem value="AGUARDANDO_USUARIO">Aguardando User</SelectItem>
                          <SelectItem value="RESOLVIDO">Resolvido</SelectItem>
                          <SelectItem value="FECHADO">Fechado</SelectItem>
                          <SelectItem value="CANCELADO">Cancelado</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium">Prioridade</label>
                    <Select value={priority} onValueChange={setPriority}>
                       <SelectTrigger>
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                          <SelectItem value="BAIXA">Baixa</SelectItem>
                          <SelectItem value="MEDIA">Média</SelectItem>
                          <SelectItem value="ALTA">Alta</SelectItem>
                          <SelectItem value="CRITICA">Crítica</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <Button className="w-full" onClick={handleUpdate}>Atualizar Ticket</Button>
              </CardContent>
           </Card>

           {/* User Info */}
           <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-4 h-4" /> Solicitante</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                 <p><span className="font-semibold">Nome:</span> {ticket.user.fullName}</p>
                 <p><span className="font-semibold">Email:</span> {ticket.user.email}</p>
                 {ticket.user.cellPhone && <p><span className="font-semibold">Tel:</span> {ticket.user.cellPhone}</p>}
              </CardContent>
           </Card>

           {/* Tech Info */}
           {(ticket.browserInfo || ticket.pageUrl) && (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-md">
                        <Monitor className="w-4 h-4" /> Dados Técnicos
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-3">
                   {ticket.pageUrl && (
                      <div className="break-all">
                         <span className="font-semibold block mb-1">URL da Página:</span>
                         <a href={ticket.pageUrl} target="_blank" className="text-blue-600 hover:underline">{ticket.pageUrl}</a>
                      </div>
                   )}
                   {ticket.browserInfo && (
                      <div>
                         <span className="font-semibold block mb-1">Navegador:</span>
                         <p className="text-gray-600">{ticket.browserInfo}</p>
                      </div>
                   )}
                   {ticket.screenSize && (
                      <div>
                         <span className="font-semibold block mb-1">Resolução:</span>
                         <p className="text-gray-600">{ticket.screenSize}</p>
                      </div>
                   )}
                   {ticket.userAgent && (
                      <div>
                         <span className="font-semibold block mb-1">User Agent:</span>
                         <p className="text-gray-500 font-mono text-[10px] bg-gray-100 p-1 rounded">{ticket.userAgent}</p>
                      </div>
                   )}
                </CardContent>
             </Card>
           )}
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Paperclip, AlertCircle, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

interface SupportChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'chat' | 'ticket' | 'faq';
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function SupportChatModal({ isOpen, onClose, mode }: SupportChatModalProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ticketData, setTicketData] = useState({
    title: '',
    description: '',
    category: 'OUTRO',
    priority: 'MEDIA',
  });
  const [ticketCreated, setTicketCreated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === 'chat' && messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: 'Olá! Sou o assistente virtual da BidExpert. Como posso ajudá-lo hoje?',
          timestamp: new Date(),
        },
      ]);
    }
  }, [mode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          userId: user?.id,
          context: {
            url: window.location.href,
            userAgent: navigator.userAgent,
            screenSize: `${window.innerWidth}x${window.innerHeight}`,
          },
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Desculpe, não consegui processar sua mensagem.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!ticketData.title || !ticketData.description) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ticketData,
          userId: user?.id,
          userSnapshot: {
            email: user?.email,
            fullName: user?.fullName,
          },
          userAgent: navigator.userAgent,
          browserInfo: navigator.userAgent,
          screenSize: `${window.innerWidth}x${window.innerHeight}`,
          pageUrl: window.location.href,
        }),
      });

      if (response.ok) {
        setTicketCreated(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderChatMode = () => (
    <div className="flex flex-col h-[500px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-lg p-3',
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
              )}
            >
              <p className="text-sm">{msg.content}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {msg.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Digite sua mensagem..."
            disabled={isLoading}
          />
          <Button onClick={handleSendMessage} disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderTicketMode = () => (
    <div className="p-4 space-y-4">
      {ticketCreated ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <CheckCircle className="h-16 w-16 text-green-600" />
          <h3 className="text-xl font-semibold">Ticket Criado com Sucesso!</h3>
          <p className="text-gray-600 dark:text-gray-400 text-center">
            Nossa equipe entrará em contato em breve.
          </p>
        </div>
      ) : (
        <>
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={ticketData.title}
              onChange={(e) => setTicketData({ ...ticketData, title: e.target.value })}
              placeholder="Descreva brevemente o problema"
            />
          </div>

          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={ticketData.category}
              onValueChange={(value) => setTicketData({ ...ticketData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TECNICO">Técnico</SelectItem>
                <SelectItem value="FUNCIONAL">Funcional</SelectItem>
                <SelectItem value="DUVIDA">Dúvida</SelectItem>
                <SelectItem value="SUGESTAO">Sugestão</SelectItem>
                <SelectItem value="BUG">Bug</SelectItem>
                <SelectItem value="OUTRO">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="priority">Prioridade</Label>
            <Select
              value={ticketData.priority}
              onValueChange={(value) => setTicketData({ ...ticketData, priority: value })}
            >
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

          <div>
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              value={ticketData.description}
              onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })}
              placeholder="Descreva detalhadamente o problema ou solicitação"
              rows={6}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTicket} disabled={isLoading}>
              {isLoading ? 'Criando...' : 'Criar Ticket'}
            </Button>
          </div>
        </>
      )}
    </div>
  );

  const renderFaqMode = () => (
    <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
      <h3 className="font-semibold text-lg">Perguntas Frequentes</h3>
      
      <div className="space-y-3">
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Como dar um lance?</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Para dar um lance, navegue até o lote desejado, clique em "Fazer Lance" e insira o valor. 
            Certifique-se de estar habilitado no leilão antes de dar lances.
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Como me habilitar em um leilão?</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Acesse a página do leilão e clique em "Habilitar-se". Você precisará enviar os documentos 
            necessários para análise da equipe.
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Quais formas de pagamento são aceitas?</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Aceitamos PIX, transferência bancária, boleto e cartão de crédito/débito. 
            As condições podem variar de acordo com o leilão.
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Como acompanhar meus lances?</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Acesse seu Dashboard de Arrematante para ver todos os seus lances ativos, 
            lotes arrematados e histórico de participações.
          </p>
        </div>
      </div>

      <div className="pt-4 border-t">
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          Não encontrou o que procurava?{' '}
          <button
            onClick={() => onClose()}
            className="text-blue-600 hover:underline"
          >
            Abra um ticket de suporte
          </button>
        </p>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'chat' && 'Chat com Assistente AI'}
            {mode === 'ticket' && 'Abrir Ticket de Suporte'}
            {mode === 'faq' && 'Perguntas Frequentes'}
          </DialogTitle>
        </DialogHeader>

        {mode === 'chat' && renderChatMode()}
        {mode === 'ticket' && renderTicketMode()}
        {mode === 'faq' && renderFaqMode()}
      </DialogContent>
    </Dialog>
  );
}

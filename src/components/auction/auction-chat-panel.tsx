'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  time: string;
  isOwn?: boolean;
}

const sampleMessages: ChatMessage[] = [
  { id: '1', user: 'Leiloeiro', text: 'Bem-vindos ao leilão! Lote atual: #101.', time: new Date(Date.now() - 5 * 60 * 1000).toISOString(), isOwn: true },
  { id: '2', user: 'User_A', text: 'Qual o estado de conservação?', time: new Date(Date.now() - 4 * 60 * 1000).toISOString() },
  { id: '3', user: 'Leiloeiro', text: 'Bom estado, conforme descrição.', time: new Date(Date.now() - 3 * 60 * 1000).toISOString(), isOwn: true },
];

interface FormattedMessage extends Omit<ChatMessage, 'time'> {
    formattedTime: string;
}

export default function AuctionChatPanel() {
  const [messages, setMessages] = useState<FormattedMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setMessages(sampleMessages.map(msg => ({
        ...msg,
        formattedTime: new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })));
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;
    const newMsg: FormattedMessage = {
      id: String(messages.length + 1),
      user: 'Você',
      text: newMessage,
      formattedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
    };
    setMessages([...messages, newMsg]);
    setNewMessage('');
  };

  return (
    <Card className="flex-1 flex flex-col min-h-0 shadow-md">
      <CardHeader className="p-3 border-b">
        <CardTitle className="text-md font-semibold flex items-center">
          <MessageSquare className="h-4 w-4 mr-2 text-primary" /> Chat do Leilão
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-grow p-2 space-y-2">
          {!isClient ? (
             <div className="space-y-3 p-1">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-10 w-3/4 ml-auto" />
                <Skeleton className="h-10 w-3/4" />
             </div>
          ) : (
            messages.map((msg) => (
                <div
                key={msg.id}
                className={`flex flex-col text-xs p-1.5 rounded-md max-w-[85%] ${
                    msg.isOwn ? 'bg-primary/10 self-end items-end' : 'bg-secondary/50 self-start items-start'
                }`}
                >
                <span className={`font-semibold ${msg.isOwn ? 'text-primary' : 'text-muted-foreground'}`}>{msg.user}</span>
                <p className="text-foreground whitespace-pre-wrap">{msg.text}</p>
                <span className="text-muted-foreground/70 text-[0.6rem] mt-0.5">{msg.formattedTime}</span>
                </div>
            ))
          )}
        </ScrollArea>
        <form onSubmit={handleSendMessage} className="p-2 border-t flex gap-2 items-center">
          <Input
            type="text"
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="h-9 text-xs flex-grow"
          />
          <Button type="submit" size="icon" className="h-9 w-9 flex-shrink-0">
            <Send className="h-4 w-4" />
            <span className="sr-only">Enviar</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

'use client';

import React, { useState } from 'react';
import { MessageCircle, HelpCircle, Bug, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import SupportChatModal from './support-chat-modal';

export default function FloatingSupportButtons() {
  const [isOpen, setIsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMode, setChatMode] = useState<'chat' | 'ticket' | 'faq'>('chat');

  const handleOpenChat = (mode: 'chat' | 'ticket' | 'faq') => {
    setChatMode(mode);
    setIsChatOpen(true);
    setIsOpen(false);
  };

  return (
    <>
      {/* Botão Principal */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Botões Expandidos */}
        <div
          className={cn(
            'flex flex-col gap-3 transition-all duration-300',
            isOpen
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-4 pointer-events-none'
          )}
        >
          {/* FAQ */}
          <Button
            onClick={() => handleOpenChat('faq')}
            className="h-12 px-4 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <HelpCircle className="h-5 w-5" />
            <span className="font-medium">FAQ</span>
          </Button>

          {/* Chat com IA */}
          <Button
            onClick={() => handleOpenChat('chat')}
            className="h-12 px-4 rounded-full shadow-lg bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="font-medium">Chat AI</span>
          </Button>

          {/* Abrir Ticket */}
          <Button
            onClick={() => handleOpenChat('ticket')}
            className="h-12 px-4 rounded-full shadow-lg bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
          >
            <Bug className="h-5 w-5" />
            <span className="font-medium">Reportar Issue</span>
          </Button>
        </div>

        {/* Botão Toggle */}
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'h-14 w-14 rounded-full shadow-xl transition-all duration-300',
            isOpen
              ? 'bg-red-600 hover:bg-red-700 rotate-90'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
          )}
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <MessageCircle className="h-6 w-6 text-white" />
          )}
        </Button>
      </div>

      {/* Modal de Chat/Ticket */}
      {isChatOpen && (
        <SupportChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          mode={chatMode}
        />
      )}
    </>
  );
}

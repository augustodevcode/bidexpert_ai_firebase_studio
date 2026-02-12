/**
 * @fileoverview Menu lateral flutuante (ações rápidas).
 * Resolve sobreposição de botões (FAB) ao centralizar ações em um único drawer.
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bug, HelpCircle, Menu, MessageCircle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import SupportChatModal from './support-chat-modal';
import { useFloatingActions } from '@/components/floating-actions/floating-actions-provider';

export default function FloatingSupportButtons() {
  const { pageActions } = useFloatingActions();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMode, setChatMode] = useState<'chat' | 'ticket' | 'faq'>('chat');

  const handleOpenChat = (mode: 'chat' | 'ticket' | 'faq') => {
    setChatMode(mode);
    setIsChatOpen(true);
    setIsSheetOpen(false);
  };

  const supportActions = [
    {
      id: 'support-faq',
      label: 'FAQ',
      icon: HelpCircle,
      onSelect: () => handleOpenChat('faq'),
      dataAiId: 'floating-action-faq',
    },
    {
      id: 'support-chat',
      label: 'Chat AI',
      icon: MessageCircle,
      onSelect: () => handleOpenChat('chat'),
      dataAiId: 'floating-action-chat-ai',
    },
    {
      id: 'support-ticket',
      label: 'Reportar Issue',
      icon: Bug,
      onSelect: () => handleOpenChat('ticket'),
      dataAiId: 'floating-action-report-issue',
    },
  ];

  const hasPageActions = pageActions.length > 0;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              className="h-14 w-14 rounded-full shadow-xl"
              aria-label="Abrir menu lateral"
              data-ai-id="floating-actions-trigger"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="p-0" data-ai-id="floating-actions-sheet">
            <div className="p-6">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>Ações rápidas</SheetDescription>
              </SheetHeader>
            </div>

            {hasPageActions && (
              <div className="px-4 pb-4" data-ai-id="floating-actions-page-actions">
                <div className="flex flex-col gap-2">
                  {pageActions.map((action) => {
                    const Icon = action.icon ?? Pencil;

                    if (action.href) {
                      return (
                        <Button
                          key={action.id}
                          asChild
                          variant="secondary"
                          className="w-full justify-start"
                          onClick={() => setIsSheetOpen(false)}
                          data-ai-id={action.dataAiId}
                        >
                          <Link href={action.href}>
                            <Icon className="mr-2 h-4 w-4" />
                            {action.label}
                          </Link>
                        </Button>
                      );
                    }

                    return (
                      <Button
                        key={action.id}
                        type="button"
                        variant="secondary"
                        className="w-full justify-start"
                        onClick={() => {
                          action.onSelect?.();
                          setIsSheetOpen(false);
                        }}
                        data-ai-id={action.dataAiId}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {action.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {hasPageActions && <Separator />}

            <div className="px-4 py-4" data-ai-id="floating-actions-support-actions">
              <div className="flex flex-col gap-2">
                {supportActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.id}
                      type="button"
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => action.onSelect?.()}
                      data-ai-id={action.dataAiId}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {action.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

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

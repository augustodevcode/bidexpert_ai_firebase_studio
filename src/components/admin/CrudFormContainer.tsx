// src/components/admin/CrudFormContainer.tsx
/**
 * @fileoverview Componente de contêiner para formulários CRUD.
 * Este componente reutilizável renderiza um formulário (`children`) dentro
 * de um Dialog (modal) ou de um Sheet (painel lateral), com base na prop `mode`.
 * Ele simplifica a lógica de exibição de formulários de criação/edição nas
 * páginas de listagem do painel de administração.
 */
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';


interface CrudFormContainerProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'modal' | 'sheet';
  title: string;
  description: string;
  children: React.ReactNode;
}

export default function CrudFormContainer({
  isOpen,
  onClose,
  mode = 'modal',
  title,
  description,
  children,
}: CrudFormContainerProps) {
  const isMobile = useIsMobile();
  const effectiveMode = isMobile ? 'sheet' : mode;


  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const headerContent = (
      <>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </>
  );

  if (effectiveMode === 'sheet') {
    return (
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetContent className="sm:max-w-xl w-[90vw] overflow-y-auto p-0 flex flex-col">
            <SheetHeader className="p-6">
               {headerContent}
            </SheetHeader>
            <div className="flex-grow overflow-y-auto px-6">
                {children}
            </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
         <DialogHeader>
            {headerContent}
         </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-6 pl-2">
            {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

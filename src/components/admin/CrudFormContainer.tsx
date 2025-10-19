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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const formContent = (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div className="py-4">
        {children}
      </div>
    </>
  );

  if (mode === 'sheet') {
    return (
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {formContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        {formContent}
      </DialogContent>
    </Dialog>
  );
}

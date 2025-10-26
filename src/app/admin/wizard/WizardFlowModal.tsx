// src/components/admin/wizard/WizardFlowModal.tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Workflow } from 'lucide-react';

interface WizardFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WizardFlowModal({ isOpen, onClose }: WizardFlowModalProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-full h-auto flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2"><Workflow className="h-5 w-5"/> Fluxo de Criação de Leilão</DialogTitle>
          <DialogDescription>
            A visualização gráfica do fluxo foi removida para economizar recursos.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 text-center text-muted-foreground">
          <p>O componente `reactflow` foi desativado para otimizar o projeto.</p>
        </div>
        <DialogFooter className="p-4 border-t sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" /> Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

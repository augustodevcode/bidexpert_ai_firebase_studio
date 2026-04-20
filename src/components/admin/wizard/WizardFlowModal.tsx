// src/components/admin/wizard/WizardFlowModal.tsx
'use client';

import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const WizardFlow = dynamic(() => import('./WizardFlow'), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-full min-h-[20rem] items-center justify-center rounded-md bg-muted/30 px-4 text-center text-sm text-muted-foreground"
      data-ai-id="wizard-flow-loading"
    >
      Preparando o mapa visual do fluxo...
    </div>
  ),
});

interface WizardFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WizardFlowModal({ isOpen, onClose }: WizardFlowModalProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-full h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Fluxo de Criação de Leilão</DialogTitle>
          <DialogDescription>
            Role para acompanhar todas as etapas e abrir cadastros vinculados quando disponiveis.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow w-full h-full">
          {/* O provider é herdado do pai, não precisa ser repetido aqui */}
          <WizardFlow />
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

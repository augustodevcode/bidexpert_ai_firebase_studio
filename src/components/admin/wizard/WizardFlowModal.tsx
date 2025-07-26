// src/components/admin/wizard/WizardFlowModal.tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import WizardFlow from './WizardFlow';
import { WizardProvider } from './wizard-context'; // Import provider

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
            Use o mouse para navegar e dar zoom.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow w-full h-full">
          {/* Wrap the flow in its own provider for the modal context */}
          <WizardProvider>
            <WizardFlow />
          </WizardProvider>
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

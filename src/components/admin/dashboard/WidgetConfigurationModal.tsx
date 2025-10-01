// src/components/admin/dashboard/WidgetConfigurationModal.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WidgetConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WidgetConfigurationModal({
  isOpen,
  onClose,
}: WidgetConfigurationModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  // No futuro, este estado virá das preferências do usuário
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]);

  const handleSave = () => {
    setIsLoading(true);
    // TODO: Implementar a lógica para salvar as preferências do usuário
    console.log('Salvando preferências de widget:', selectedWidgets);
    setTimeout(() => {
      toast({
        title: 'Preferências Salvas!',
        description: 'Seu dashboard foi atualizado.',
      });
      setIsLoading(false);
      onClose();
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configurar Widgets do Dashboard
          </DialogTitle>
          <DialogDescription>
            Selecione quais informações você deseja ver na sua tela inicial.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-center text-muted-foreground">
            (A lista de widgets disponíveis aparecerá aqui)
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            <X className="mr-2 h-4 w-4" /> Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Preferências
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

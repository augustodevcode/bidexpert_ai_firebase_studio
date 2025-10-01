// src/components/admin/dashboard/WidgetConfigurationModal.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings, X, Loader2, DollarSign, Gavel, Package, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useWidgetPreferences, availableWidgets } from '@/contexts/widget-preferences-context';

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
  const { selectedWidgets, setSelectedWidgets } = useWidgetPreferences();
  
  // Local state to manage changes within the modal without affecting the global state until save
  const [localSelectedWidgets, setLocalSelectedWidgets] = useState<string[]>(selectedWidgets);

  useEffect(() => {
    // When the modal opens, sync local state with global context
    if (isOpen) {
      setLocalSelectedWidgets(selectedWidgets);
    }
  }, [isOpen, selectedWidgets]);


  const handleSave = () => {
    setIsLoading(true);
    // Update the global state via the context hook
    setSelectedWidgets(localSelectedWidgets);
    
    // Simulate saving to a backend
    setTimeout(() => {
      toast({
        title: 'Preferências Salvas!',
        description: 'Seu dashboard foi atualizado.',
      });
      setIsLoading(false);
      onClose();
    }, 500);
  };
  
  const handleWidgetToggle = (widgetId: string) => {
    setLocalSelectedWidgets(prev => 
      prev.includes(widgetId) 
        ? prev.filter(id => id !== widgetId) 
        : [...prev, widgetId]
    );
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
        <div className="py-4 space-y-3">
            {availableWidgets.map((widget) => (
                <div key={widget.id} className="flex items-center space-x-3 rounded-md border p-3 bg-secondary/40">
                    <Checkbox
                        id={`widget-${widget.id}`}
                        checked={localSelectedWidgets.includes(widget.id)}
                        onCheckedChange={() => handleWidgetToggle(widget.id)}
                    />
                    <Label htmlFor={`widget-${widget.id}`} className="flex items-center gap-2 cursor-pointer">
                        <widget.icon className="h-5 w-5 text-primary" />
                        <div className="flex flex-col">
                            <span className="font-semibold">{widget.label}</span>
                            <span className="text-xs text-muted-foreground">{widget.description}</span>
                        </div>
                    </Label>
                </div>
            ))}
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

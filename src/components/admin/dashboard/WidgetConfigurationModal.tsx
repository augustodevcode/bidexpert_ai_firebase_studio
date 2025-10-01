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
import { Settings, X, Loader2, DollarSign, Gavel, Package, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface WidgetConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const availableWidgets = [
  { id: 'totalRevenue', label: 'Faturamento Total', description: 'Soma de todos os lotes vendidos.', icon: DollarSign },
  { id: 'activeAuctions', label: 'Leilões Ativos', description: 'Leilões abertos para lances.', icon: Gavel },
  { id: 'lotsSoldCount', label: 'Lotes Vendidos', description: 'Total de lotes arrematados.', icon: Package },
  { id: 'newUsers', label: 'Novos Usuários (30d)', description: 'Novos registros no último mês.', icon: Users },
];

export default function WidgetConfigurationModal({
  isOpen,
  onClose,
}: WidgetConfigurationModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  // No futuro, este estado virá das preferências do usuário. Por enquanto, todos vêm marcados.
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>(availableWidgets.map(w => w.id));

  const handleSave = () => {
    setIsLoading(true);
    // TODO: Implementar a lógica para salvar as preferências do usuário (Item 37.4)
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
  
  const handleWidgetToggle = (widgetId: string) => {
    setSelectedWidgets(prev => 
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
                        checked={selectedWidgets.includes(widget.id)}
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


'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UpdateTitleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newTitle: string) => Promise<void>;
  currentTitle: string;
  entityTypeLabel: string;
}

export default function UpdateTitleModal({
  isOpen,
  onClose,
  onSubmit,
  currentTitle,
  entityTypeLabel,
}: UpdateTitleModalProps) {
  const [newTitle, setNewTitle] = useState(currentTitle);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setNewTitle(currentTitle);
      setIsLoading(false);
    }
  }, [isOpen, currentTitle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || newTitle.trim().length < 5) {
      toast({ title: "Erro", description: "O título deve ter pelo menos 5 caracteres.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    await onSubmit(newTitle);
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Alterar Título do {entityTypeLabel}</DialogTitle>
            <DialogDescription>
              Modifique o título abaixo e clique em salvar.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="new-title">Novo Título</Label>
            <Input
              id="new-title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Digite o novo título"
              disabled={isLoading}
              className="mt-1"
            />
             <p className="text-xs text-muted-foreground mt-2">Título atual: "{currentTitle}"</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || newTitle.trim() === currentTitle}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Título
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

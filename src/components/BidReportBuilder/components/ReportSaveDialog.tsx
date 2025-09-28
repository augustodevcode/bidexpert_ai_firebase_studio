// src/components/BidReportBuilder/components/ReportSaveDialog.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface ReportSaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: { name: string, description?: string }) => Promise<boolean>;
  initialName?: string;
  initialDescription?: string;
}

export default function ReportSaveDialog({
  isOpen,
  onClose,
  onSave,
  initialName,
  initialDescription,
}: ReportSaveDialogProps) {
  const [name, setName] = useState(initialName || '');
  const [description, setDescription] = useState(initialDescription || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialName || '');
      setDescription(initialDescription || '');
    }
  }, [isOpen, initialName, initialDescription]);

  const handleSaveClick = async () => {
    if (!name.trim()) {
      alert("O nome do relatório é obrigatório.");
      return;
    }
    setIsLoading(true);
    const success = await onSave({ name, description });
    setIsLoading(false);
    if (success) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialName ? 'Salvar Alterações no Relatório' : 'Salvar Novo Relatório'}</DialogTitle>
          <DialogDescription>
            Dê um nome e uma descrição para o seu relatório para poder carregá-lo mais tarde.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="report-name" className="text-right">
              Nome*
            </Label>
            <Input
              id="report-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="report-description" className="text-right">
              Descrição
            </Label>
            <Textarea
              id="report-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button onClick={handleSaveClick} disabled={isLoading || !name.trim()}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

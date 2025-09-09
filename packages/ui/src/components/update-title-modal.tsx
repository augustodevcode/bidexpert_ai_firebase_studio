"use client"

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

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

  const handleSubmit = async () => {
    await onSubmit(newTitle);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar Título d{entityTypeLabel}</DialogTitle>
          <DialogDescription>
            Insira o novo título para {entityTypeLabel.toLowerCase()}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="newTitle" className="text-right">
              Novo Título
            </Label>
            <Input
              id="newTitle"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
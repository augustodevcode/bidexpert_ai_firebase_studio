// src/components/admin/media/edit-media-dialog.tsx
/**
 * @fileoverview Componente de diálogo modal para editar os metadados de um item de mídia.
 * Permite que um administrador atualize o título, texto alternativo (alt text),
 * legenda e descrição de um arquivo existente na biblioteca, melhorando o SEO
 * e a acessibilidade.
 */
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import type { MediaItem } from '@/types';

interface EditMediaDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  mediaItem: MediaItem | null;
  onUpdate: (id: string, metadata: Partial<Pick<MediaItem, 'title' | 'altText' | 'caption' | 'description'>>) => Promise<void>;
}

export default function EditMediaDialog({ isOpen, onOpenChange, mediaItem, onUpdate }: EditMediaDialogProps) {
  const [title, setTitle] = useState('');
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (mediaItem) {
      setTitle(mediaItem.title || '');
      setAltText(mediaItem.altText || '');
      setCaption(mediaItem.caption || '');
      setDescription(mediaItem.description || '');
    }
  }, [mediaItem]);

  const handleSave = async () => {
    if (!mediaItem) return;
    setIsSaving(true);
    await onUpdate(mediaItem.id, { title, altText, caption, description });
    setIsSaving(false);
  };

  if (!mediaItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Metadados da Mídia</DialogTitle>
          <DialogDescription>
            {mediaItem.fileName}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isSaving} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="altText">Texto Alternativo (Alt Text)</Label>
            <Input id="altText" value={altText} onChange={(e) => setAltText(e.target.value)} disabled={isSaving} />
          </div>
           <div className="space-y-2">
            <Label htmlFor="caption">Legenda</Label>
            <Input id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} disabled={isSaving} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isSaving} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


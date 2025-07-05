// src/components/admin/bens/bem-details-modal.tsx
'use client';

import type { Bem } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, FileText, Tag, DollarSign, X, Edit } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface BemDetailsModalProps {
  bem: Bem | null;
  isOpen: boolean;
  onClose: () => void;
}

const InfoRow = ({ label, value, isBadge = false }: { label: string; value?: string | number | null, isBadge?: boolean }) => {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between items-start text-sm py-1.5 border-b border-dashed">
      <p className="font-medium text-muted-foreground">{label}:</p>
      {isBadge ? (
         <Badge variant="secondary">{String(value)}</Badge>
      ) : (
        <p className="text-right text-foreground max-w-[60%] truncate" title={String(value)}>{value}</p>
      )}
    </div>
  );
};

export default function BemDetailsModal({ bem, isOpen, onClose }: BemDetailsModalProps) {
  if (!isOpen || !bem) {
    return null;
  }

  const editUrl = `/admin/bens/${bem.id}/edit`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Detalhes do Bem
          </DialogTitle>
          <DialogDescription>
            Visualizando informações detalhadas do bem vinculado.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden">
                <Image src={bem.imageUrl || "https://placehold.co/600x400.png"} alt={bem.title} fill className="object-contain" data-ai-hint={bem.dataAiHint || "imagem bem"} />
            </div>

            <h3 className="font-semibold text-lg">{bem.title}</h3>
            {bem.description && <p className="text-sm text-muted-foreground">{bem.description}</p>}
            
            <Separator />
            
            <div className="space-y-2">
                <InfoRow label="ID Público" value={bem.publicId} />
                <InfoRow label="Status" value={bem.status} isBadge />
                <InfoRow label="Valor de Avaliação" value={bem.evaluationValue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                <InfoRow label="Categoria" value={bem.categoryName} />
                <InfoRow label="Subcategoria" value={bem.subcategoryName} />
                <InfoRow label="Processo Judicial" value={bem.judicialProcessNumber} />
                <InfoRow label="Vendedor" value={bem.sellerName} />
                <InfoRow label="Localização" value={`${bem.locationCity || ''}${bem.locationCity && bem.locationState ? ' - ' : ''}${bem.locationState || ''}`} />
            </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" /> Fechar
          </Button>
          <Button asChild>
            <Link href={editUrl} target="_blank">
                <Edit className="mr-2 h-4 w-4" /> Editar Bem
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

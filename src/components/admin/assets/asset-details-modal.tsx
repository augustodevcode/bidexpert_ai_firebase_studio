// src/components/admin/assets/asset-details-modal.tsx
'use client';

import type { Asset } from '@/types';
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

interface AssetDetailsModalProps {
  asset: Asset | null;
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
        <p className="text-right text-foreground max-w-[60%] truncate" title={String(value)}>{String(value)}</p>
      )}
    </div>
  );
};

export default function AssetDetailsModal({ asset, isOpen, onClose }: AssetDetailsModalProps) {
  if (!isOpen || !asset) {
    return null;
  }

  const editUrl = `/admin/assets/${asset.id}/edit`;

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
                <Image src={asset.imageUrl || "https://placehold.co/600x400.png"} alt={asset.title} fill className="object-contain" data-ai-hint={asset.dataAiHint || "imagem bem"} />
            </div>

            <h3 className="font-semibold text-lg">{asset.title}</h3>
            {asset.description && <p className="text-sm text-muted-foreground">{asset.description}</p>}
            
            <Separator />
            
            <div className="space-y-2">
                <InfoRow label="ID Público" value={asset.publicId} />
                <InfoRow label="Status" value={asset.status} isBadge />
                <InfoRow label="Valor de Avaliação" value={asset.evaluationValue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                <InfoRow label="Categoria" value={asset.categoryName} />
                <InfoRow label="Subcategoria" value={asset.subcategoryName} />
                <InfoRow label="Processo Judicial" value={asset.judicialProcessNumber} />
                <InfoRow label="Vendedor" value={asset.sellerName} />
                <InfoRow label="Localização" value={`${asset.locationCity || ''}${asset.locationCity && asset.locationState ? ' - ' : ''}${asset.locationState || ''}`} />
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

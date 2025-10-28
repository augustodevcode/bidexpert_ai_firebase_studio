// src/components/admin/lots/relist-lot-modal.tsx
/**
 * @fileoverview Componente de modal para a funcionalidade de relistagem de lotes.
 * Este modal permite que o usuário selecione um novo leilão de destino e aplique
 * um desconto opcional ao criar uma nova versão de um lote que não foi vendido.
 * Ele interage com a `relistLotAction` para executar a lógica no servidor.
 */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Repeat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Lot, Auction } from '@/types';
import EntitySelector from '@/components/ui/entity-selector';
import { relistLotAction } from './relist-lot-action';

interface RelistLotModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalLot: Lot;
  auctions: Auction[];
  onRelistSuccess: (newLotId: string) => void;
}

export default function RelistLotModal({ isOpen, onClose, originalLot, auctions, onRelistSuccess }: RelistLotModalProps) {
  const { toast } = useToast();
  const [newAuctionId, setNewAuctionId] = useState<string | null>(null);
  const [discount, setDiscount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmRelist = async () => {
    if (!newAuctionId) {
      toast({ title: 'Erro de Validação', description: 'Por favor, selecione um leilão de destino.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    const result = await relistLotAction(originalLot.id, newAuctionId, parseFloat(discount) || 0);
    setIsSubmitting(false);

    if (result.success && result.newLotId) {
      onRelistSuccess(result.newLotId);
    } else {
      toast({ title: 'Falha ao Relistar', description: result.message, variant: 'destructive' });
    }
  };
  
  // Filtrar leilões que ainda não aconteceram ou estão abertos, e que são diferentes do leilão original.
  const availableAuctions = auctions.filter(a => a.id !== originalLot.auctionId && (a.status === 'EM_BREVE' || a.status === 'RASCUNHO' || a.status === 'ABERTO_PARA_LANCES'));


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Repeat /> Relistar Lote "{originalLot.title}"</DialogTitle>
          <DialogDescription>
            Crie um novo lote com base neste item para um novo leilão.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-auction">Leilão de Destino</Label>
             <EntitySelector
                entityName="Leilão"
                value={newAuctionId}
                onChange={setNewAuctionId}
                options={availableAuctions.map(a => ({ value: a.id, label: `${a.title} (ID: ...${a.id.slice(-6)})` }))}
                placeholder="Selecione o leilão"
                searchPlaceholder="Buscar leilão..."
                emptyStateMessage="Nenhum leilão futuro encontrado."
                createNewUrl="/admin/auctions/new"
             />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discount">Percentual de Desconto (Opcional)</Label>
            <Input
              id="discount"
              type="number"
              placeholder="Ex: 50 para 50% de desconto"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">O desconto será aplicado sobre o valor de avaliação ou lance inicial do lote original.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
          <Button onClick={handleConfirmRelist} disabled={isSubmitting || !newAuctionId}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Repeat className="mr-2 h-4 w-4" />}
            Confirmar e Relistar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

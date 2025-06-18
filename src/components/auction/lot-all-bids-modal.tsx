
// src/components/auction/lot-all-bids-modal.tsx
'use client';

import type { BidInfo } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Gavel, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LotAllBidsModalProps {
  lotBids: BidInfo[];
  lotTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function LotAllBidsModal({ lotBids, lotTitle, isOpen, onClose }: LotAllBidsModalProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-lg font-semibold flex items-center">
            <Gavel className="h-5 w-5 mr-2 text-primary" /> Histórico Completo de Lances
          </DialogTitle>
          <DialogDescription>
            Lote: {lotTitle}
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 max-h-[60vh]">
          {lotBids.length > 0 ? (
            <ScrollArea className="h-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Licitante</TableHead>
                    <TableHead className="text-right">Valor (R$)</TableHead>
                    <TableHead>Data e Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lotBids.map((bid) => (
                    <TableRow key={bid.id}>
                      <TableCell className="font-medium">{bid.bidderDisplay}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {bid.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {bid.timestamp ? format(new Date(bid.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }) : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum lance registrado para este lote ainda.
            </p>
          )}
        </div>

        <DialogFooter className="p-4 border-t sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" /> Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


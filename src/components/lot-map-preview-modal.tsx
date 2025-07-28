
// src/components/lot-map-preview-modal.tsx
'use client';

import type { Lot, PlatformSettings } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, X } from 'lucide-react';
import LotMapDisplay from '@/components/auction/lot-map-display'; // Importado diretamente

interface LotMapPreviewModalProps {
  lot: Lot | null;
  platformSettings: PlatformSettings;
  isOpen: boolean;
  onClose: () => void;
}

export default function LotMapPreviewModal({ lot, platformSettings, isOpen, onClose }: LotMapPreviewModalProps) {
  if (!isOpen || !lot) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-lg font-semibold flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-primary" /> Localização do Lote: {lot.title}
          </DialogTitle>
          <DialogDescription>
            {lot.mapAddress || (lot.latitude && lot.longitude ? `Coordenadas: ${lot.latitude}, ${lot.longitude}` : 'Detalhes da localização.')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 h-[60vh] overflow-y-auto">
          {/* O LotMapDisplay já é importado dinamicamente internamente, não precisamos fazer isso de novo aqui. */}
          <LotMapDisplay lot={lot} platformSettings={platformSettings} />
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
